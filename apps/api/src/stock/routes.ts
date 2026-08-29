import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware, requireRole } from '../auth/middleware.js';
import { prisma } from '../lib/prisma.js';
import {
  type CreateDepositoInput,
  type CreateEstoqueInput,
  type CreateEstoqueMovimentoInput,
  type DepositoParams,
  type EstoqueListQuery,
  type EstoqueMovimentoListQuery,
  type EstoqueParams,
  type InventarioInput,
  type LiberaReservaInput,
  type ReservaEstoqueInput,
  type TransferenciaEstoqueInput,
  type UpdateDepositoInput,
  type UpdateEstoqueInput,
  createDepositoSchema,
  createEstoqueMovimentoSchema,
  createEstoqueSchema,
  depositoParamsSchema,
  estoqueListQuerySchema,
  estoqueMovimentoListQuerySchema,
  estoqueParamsSchema,
  inventarioSchema,
  liberaReservaSchema,
  reservaEstoqueSchema,
  transferenciaEstoqueSchema,
  updateDepositoSchema,
  updateEstoqueSchema,
} from '../schemas/stock.schemas.js';
import {
  inventariar,
  liberarReserva,
  registrarMovimento,
  reservar,
  transferir,
} from './service.js';

const STOCK_ROLES = ['ADMIN', 'GESTOR', 'OPERADOR', 'ESTOQUISTA'] as const;

const ok = { type: 'object', additionalProperties: true } as const;
const errorSchema = { type: 'object', properties: { error: { type: 'string' } } } as const;

function disponivel(estoque: { quantidade_fisica: number; quantidade_reservada: number }): number {
  return estoque.quantidade_fisica - estoque.quantidade_reservada;
}

export async function stockRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/admin/depositos',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        body: createDepositoSchema,
        response: { 201: ok, 400: errorSchema, 409: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as CreateDepositoInput;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const existente = await prisma.deposito.findFirst({
        where: { loja_id: lojaId, codigo: body.codigo },
      });
      if (existente) {
        return reply.code(409).send({ error: 'Código de depósito já existe nesta loja' });
      }

      const deposito = await prisma.$transaction(async (tx) => {
        if (body.padrao) {
          await tx.deposito.updateMany({
            where: { loja_id: lojaId, padrao: true },
            data: { padrao: false },
          });
        }
        return tx.deposito.create({
          data: {
            loja_id: lojaId,
            nome: body.nome,
            codigo: body.codigo,
            endereco_completo: body.endereco_completo,
            padrao: body.padrao ?? false,
          },
        });
      });

      return reply.code(201).send(deposito);
    }
  );

  app.get(
    '/admin/depositos',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: { response: { 200: ok } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });
      const depositos = await prisma.deposito.findMany({
        where: { loja_id: lojaId },
        orderBy: [{ padrao: 'desc' }, { nome: 'asc' }],
      });
      return reply.send(depositos);
    }
  );

  app.get(
    '/admin/depositos/:id',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        params: depositoParamsSchema,
        response: { 200: ok, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as DepositoParams;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });
      const deposito = await prisma.deposito.findFirst({
        where: { id: params.id, loja_id: lojaId },
      });
      if (!deposito) return reply.code(404).send({ error: 'Depósito não encontrado' });
      return reply.send(deposito);
    }
  );

  app.put(
    '/admin/depositos/:id',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        params: depositoParamsSchema,
        body: updateDepositoSchema,
        response: { 200: ok, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as DepositoParams;
      const body = request.body as UpdateDepositoInput;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const existente = await prisma.deposito.findFirst({
        where: { id: params.id, loja_id: lojaId },
      });
      if (!existente) return reply.code(404).send({ error: 'Depósito não encontrado' });

      const deposito = await prisma.$transaction(async (tx) => {
        if (body.padrao) {
          await tx.deposito.updateMany({
            where: { loja_id: lojaId, padrao: true, NOT: { id: params.id } },
            data: { padrao: false },
          });
        }
        return tx.deposito.update({
          where: { id: params.id },
          data: {
            nome: body.nome ?? existente.nome,
            codigo: body.codigo ?? existente.codigo,
            endereco_completo: body.endereco_completo ?? existente.endereco_completo,
            padrao: body.padrao ?? existente.padrao,
            ativo: body.ativo ?? existente.ativo,
          },
        });
      });

      return reply.send(deposito);
    }
  );

  app.delete(
    '/admin/depositos/:id',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR')],
      schema: {
        params: depositoParamsSchema,
        response: { 200: ok, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as DepositoParams;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });
      const deposito = await prisma.deposito.findFirst({
        where: { id: params.id, loja_id: lojaId },
      });
      if (!deposito) return reply.code(404).send({ error: 'Depósito não encontrado' });
      await prisma.deposito.update({ where: { id: params.id }, data: { ativo: false } });
      return reply.send({ message: 'Depósito desativado com sucesso' });
    }
  );

  app.post(
    '/admin/estoque',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        body: createEstoqueSchema,
        response: { 201: ok, 400: errorSchema, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as CreateEstoqueInput;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const [variacao, deposito] = await Promise.all([
        prisma.produtoVariacao.findUnique({ where: { id: body.variacao_id } }),
        prisma.deposito.findFirst({ where: { id: body.deposito_id, loja_id: lojaId } }),
      ]);
      if (!variacao) return reply.code(404).send({ error: 'Variação não encontrada' });
      if (!deposito) return reply.code(404).send({ error: 'Depósito não encontrado' });

      const estoque = await prisma.estoque.upsert({
        where: {
          variacao_id_deposito_id: { variacao_id: body.variacao_id, deposito_id: body.deposito_id },
        },
        create: {
          loja_id: lojaId,
          variacao_id: body.variacao_id,
          deposito_id: body.deposito_id,
          quantidade_fisica: body.quantidade_fisica,
          quantidade_reservada: 0,
          quantidade_minima: body.quantidade_minima,
          quantidade_maxima: body.quantidade_maxima ?? null,
          custo_medio_cents: body.custo_medio_cents,
        },
        update: {
          quantidade_fisica: body.quantidade_fisica,
          quantidade_minima: body.quantidade_minima,
          quantidade_maxima: body.quantidade_maxima ?? null,
          custo_medio_cents: body.custo_medio_cents,
        },
      });

      return reply.code(201).send(estoque);
    }
  );

  app.get(
    '/admin/estoque',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        querystring: estoqueListQuerySchema,
        response: { 200: ok },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as EstoqueListQuery;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const where: Record<string, unknown> = { loja_id: lojaId };
      if (query.variacao_id) where.variacao_id = query.variacao_id;
      if (query.deposito_id) where.deposito_id = query.deposito_id;
      if (query.cursor) where.id = { gt: query.cursor };

      if (query.apenas_baixo || query.apenas_zerado) {
        const estoques = await prisma.estoque.findMany({
          where,
          include: { variacao: { select: { sku: true, nome: true } } },
        });
        const filtrados = estoques.filter((e) => {
          const disp = e.quantidade_fisica - e.quantidade_reservada;
          if (query.apenas_zerado) return disp <= 0;
          return disp <= e.quantidade_minima;
        });
        const limit = query.limit;
        const page = filtrados.slice(0, limit).map((e) => ({
          ...e,
          disponivel: e.quantidade_fisica - e.quantidade_reservada,
        }));
        return reply.send({ data: page, nextCursor: null, total: filtrados.length });
      }

      const limit = query.limit;
      const [estoques, total] = await Promise.all([
        prisma.estoque.findMany({
          where,
          take: limit + 1,
          orderBy: { created_at: 'desc' },
          include: { variacao: { select: { sku: true, nome: true } } },
        }),
        prisma.estoque.count({ where }),
      ]);
      const hasMore = estoques.length > limit;
      const items = hasMore ? estoques.slice(0, -1) : estoques;
      const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]?.id : null;
      const data = items.map((e) => ({
        ...e,
        disponivel: e.quantidade_fisica - e.quantidade_reservada,
      }));
      return reply.send({ data, nextCursor, total });
    }
  );

  app.get(
    '/admin/estoque/dashboard',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: { response: { 200: ok } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const estoques = await prisma.estoque.findMany({
        where: { loja_id: lojaId },
        select: {
          quantidade_fisica: true,
          quantidade_reservada: true,
          quantidade_minima: true,
        },
      });

      let baixo = 0;
      let zerado = 0;
      let totalFisico = 0;
      for (const e of estoques) {
        const disp = e.quantidade_fisica - e.quantidade_reservada;
        totalFisico += e.quantidade_fisica;
        if (disp <= 0) zerado += 1;
        else if (disp <= e.quantidade_minima) baixo += 1;
      }

      return reply.send({
        total_itens: estoques.length,
        quantidade_baixa: baixo,
        quantidade_zerada: zerado,
        total_fisico: totalFisico,
      });
    }
  );

  app.get(
    '/admin/estoque/:id',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        params: estoqueParamsSchema,
        response: { 200: ok, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as EstoqueParams;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });
      const estoque = await prisma.estoque.findFirst({
        where: { id: params.id, loja_id: lojaId },
        include: { variacao: { select: { sku: true, nome: true } } },
      });
      if (!estoque) return reply.code(404).send({ error: 'Estoque não encontrado' });
      return reply.send({
        ...estoque,
        disponivel: disponivel(estoque),
      });
    }
  );

  app.put(
    '/admin/estoque/:id',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        params: estoqueParamsSchema,
        body: updateEstoqueSchema,
        response: { 200: ok, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as EstoqueParams;
      const body = request.body as UpdateEstoqueInput;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });
      const existente = await prisma.estoque.findFirst({
        where: { id: params.id, loja_id: lojaId },
      });
      if (!existente) return reply.code(404).send({ error: 'Estoque não encontrado' });

      const estoque = await prisma.estoque.update({
        where: { id: params.id },
        data: {
          quantidade_minima: body.quantidade_minima ?? existente.quantidade_minima,
          quantidade_maxima:
            body.quantidade_maxima === undefined
              ? existente.quantidade_maxima
              : body.quantidade_maxima,
          custo_medio_cents: body.custo_medio_cents ?? existente.custo_medio_cents,
        },
      });
      return reply.send({ ...estoque, disponivel: disponivel(estoque) });
    }
  );

  app.post(
    '/admin/estoque/movimentos',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        body: createEstoqueMovimentoSchema,
        response: { 201: ok, 400: errorSchema, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as CreateEstoqueMovimentoInput;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      if (body.tipo.toString().startsWith('TRANSFERENCIA')) {
        return reply
          .code(400)
          .send({ error: 'Use o endpoint de transferência para movimentações de transferência' });
      }

      const variacao = await prisma.produtoVariacao.findUnique({
        where: { id: body.variacao_id },
      });
      const deposito = await prisma.deposito.findFirst({
        where: { id: body.deposito_id, loja_id: lojaId },
      });
      if (!variacao) return reply.code(404).send({ error: 'Variação não encontrada' });
      if (!deposito) return reply.code(404).send({ error: 'Depósito não encontrado' });

      try {
        const payload = {
          variacao_id: body.variacao_id,
          deposito_id: body.deposito_id,
          tipo: body.tipo,
          quantidade: body.quantidade,
          referencia_tipo: body.referencia_tipo,
          ...(body.custo_unitario_cents !== undefined
            ? { custo_unitario_cents: body.custo_unitario_cents }
            : {}),
          ...(body.referencia_id ? { referencia_id: body.referencia_id } : {}),
          ...(body.observacao ? { observacao: body.observacao } : {}),
          ...(request.user?.sub ? { usuario_id: request.user.sub } : {}),
        };
        const movimento = await prisma.$transaction((tx) =>
          registrarMovimento(tx, lojaId, payload)
        );
        return reply.code(201).send(movimento);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    }
  );

  app.get(
    '/admin/estoque/movimentos',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        querystring: estoqueMovimentoListQuerySchema,
        response: { 200: ok },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as EstoqueMovimentoListQuery;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const where: Record<string, unknown> = { loja_id: lojaId };
      if (query.variacao_id) where.variacao_id = query.variacao_id;
      if (query.deposito_id) where.deposito_id = query.deposito_id;
      if (query.tipo) where.tipo = query.tipo;
      if (query.referencia_tipo) where.referencia_tipo = query.referencia_tipo;
      if (query.data_inicio)
        where.created_at = { ...(where.created_at as object), gte: new Date(query.data_inicio) };
      if (query.data_fim)
        where.created_at = { ...(where.created_at as object), lte: new Date(query.data_fim) };
      if (query.cursor) where.id = { gt: query.cursor };

      const limit = query.limit;
      const [movimentos, total] = await Promise.all([
        prisma.estoqueMovimento.findMany({
          where,
          take: limit + 1,
          orderBy: { created_at: 'desc' },
        }),
        prisma.estoqueMovimento.count({ where }),
      ]);
      const hasMore = movimentos.length > limit;
      const items = hasMore ? movimentos.slice(0, -1) : movimentos;
      const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]?.id : null;
      return reply.send({ data: items, nextCursor, total });
    }
  );

  app.post(
    '/admin/estoque/reserva',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        body: reservaEstoqueSchema,
        response: { 200: ok, 400: errorSchema, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as ReservaEstoqueInput;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const deposito = await prisma.deposito.findFirst({
        where: { id: body.deposito_id, loja_id: lojaId },
      });
      if (!deposito) return reply.code(404).send({ error: 'Depósito não encontrado' });

      try {
        const payload = {
          variacao_id: body.variacao_id,
          deposito_id: body.deposito_id,
          quantidade: body.quantidade,
          ...(body.pedido_id ? { pedido_id: body.pedido_id } : {}),
          ...(request.user?.sub ? { usuario_id: request.user.sub } : {}),
        };
        const movimento = await prisma.$transaction((tx) => reservar(tx, lojaId, payload));
        return reply.send(movimento);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    }
  );

  app.post(
    '/admin/estoque/liberar',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        body: liberaReservaSchema,
        response: { 200: ok, 400: errorSchema, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as LiberaReservaInput;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const deposito = await prisma.deposito.findFirst({
        where: { id: body.deposito_id, loja_id: lojaId },
      });
      if (!deposito) return reply.code(404).send({ error: 'Depósito não encontrado' });

      try {
        const payload = {
          variacao_id: body.variacao_id,
          deposito_id: body.deposito_id,
          quantidade: body.quantidade,
          ...(body.pedido_id ? { pedido_id: body.pedido_id } : {}),
          ...(request.user?.sub ? { usuario_id: request.user.sub } : {}),
        };
        const movimento = await prisma.$transaction((tx) => liberarReserva(tx, lojaId, payload));
        return reply.send(movimento);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    }
  );

  app.post(
    '/admin/estoque/transferencia',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        body: transferenciaEstoqueSchema,
        response: { 200: ok, 400: errorSchema, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as TransferenciaEstoqueInput;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const [origem, destino] = await Promise.all([
        prisma.deposito.findFirst({ where: { id: body.deposito_origem_id, loja_id: lojaId } }),
        prisma.deposito.findFirst({ where: { id: body.deposito_destino_id, loja_id: lojaId } }),
      ]);
      if (!origem) return reply.code(404).send({ error: 'Depósito de origem não encontrado' });
      if (!destino) return reply.code(404).send({ error: 'Depósito de destino não encontrado' });

      try {
        const payload = {
          variacao_id: body.variacao_id,
          deposito_origem_id: body.deposito_origem_id,
          deposito_destino_id: body.deposito_destino_id,
          quantidade: body.quantidade,
          ...(body.observacao ? { observacao: body.observacao } : {}),
        };
        await prisma.$transaction((tx) => transferir(tx, lojaId, request.user?.sub, payload));
        return reply.send({ message: 'Transferência realizada com sucesso' });
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    }
  );

  app.post(
    '/admin/estoque/inventario',
    {
      preHandler: [authMiddleware, requireRole(...STOCK_ROLES)],
      schema: {
        body: inventarioSchema,
        response: { 200: ok, 400: errorSchema, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as InventarioInput;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const deposito = await prisma.deposito.findFirst({
        where: { id: body.deposito_id, loja_id: lojaId },
      });
      if (!deposito) return reply.code(404).send({ error: 'Depósito não encontrado' });

      try {
        const payload = {
          deposito_id: body.deposito_id,
          itens: body.itens,
          ...(body.observacao ? { observacao: body.observacao } : {}),
        };
        await prisma.$transaction((tx) => inventariar(tx, lojaId, request.user?.sub, payload));
        return reply.send({ message: 'Inventário aplicado com sucesso' });
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    }
  );
}
