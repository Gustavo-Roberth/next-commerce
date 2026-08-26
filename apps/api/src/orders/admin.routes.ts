import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware, requireRole } from '../auth/middleware.js';
import { prisma } from '../lib/prisma.js';
import {
  type AdminPedidoListQuery,
  type PedidoParams,
  type UpdatePedidoStatusInput,
  adminPedidoListQuerySchema,
  pedidoParamsSchema,
  updatePedidoStatusSchema,
} from '../schemas/orders.schemas.js';

const paramsSchema = pedidoParamsSchema;
const listQuerySchema = adminPedidoListQuerySchema;
const updateStatusBodySchema = updatePedidoStatusSchema;

function serializePedido(pedido: any) {
  return {
    ...pedido,
    subtotal_cents: pedido.subtotal_cents ? Number(pedido.subtotal_cents) : 0,
    desconto_cents: pedido.desconto_cents ? Number(pedido.desconto_cents) : 0,
    frete_cents: pedido.frete_cents ? Number(pedido.frete_cents) : 0,
    total_cents: pedido.total_cents ? Number(pedido.total_cents) : 0,
    itens: (pedido.itens || []).map((item: any) => ({
      ...item,
      preco_unitario_cents: item.preco_unitario_cents ? Number(item.preco_unitario_cents) : 0,
      total_cents: item.total_cents ? Number(item.total_cents) : 0,
    })),
    pagamentos: pedido.pagamentos
      ? pedido.pagamentos.map((p: any) => ({
          ...p,
          valor_cents: p.valor_cents ? Number(p.valor_cents) : 0,
          juros_cents: p.juros_cents ? Number(p.juros_cents) : 0,
        }))
      : null,
  };
}

export async function adminOrderRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/admin/pedidos',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR', 'OPERADOR')],
      schema: {
        querystring: listQuerySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    loja_id: { type: 'string', format: 'uuid' },
                    cliente_id: { type: 'string', format: 'uuid' },
                    numero_sequencial: { type: 'number' },
                    status: { type: 'string' },
                    subtotal_cents: { type: 'number' },
                    desconto_cents: { type: 'number' },
                    frete_cents: { type: 'number' },
                    total_cents: { type: 'number' },
                    cupom_id: { type: 'string', format: 'uuid', nullable: true },
                    endereco_entrega_id: { type: 'string', format: 'uuid' },
                    endereco_cobranca_id: { type: 'string', format: 'uuid' },
                    observacoes_cliente: { type: 'string', nullable: true },
                    observacoes_internas: { type: 'string', nullable: true },
                    pago_em: { type: 'string', format: 'date-time', nullable: true },
                    enviado_em: { type: 'string', format: 'date-time', nullable: true },
                    entregue_em: { type: 'string', format: 'date-time', nullable: true },
                    cancelado_em: { type: 'string', format: 'date-time', nullable: true },
                    cancelamento_motivo: { type: 'string', nullable: true },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                    _count: {
                      type: 'object',
                      properties: {
                        itens: { type: 'number' },
                      },
                    },
                  },
                },
              },
              nextCursor: { type: 'string', format: 'uuid', nullable: true },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as AdminPedidoListQuery;
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }
      const cursor = query.cursor;
      const limit = query.limit ?? 20;
      const status = query.status;
      const data_inicio = query.data_inicio;
      const data_fim = query.data_fim;
      const cliente_id = query.cliente_id;

      const where: Record<string, unknown> = { loja_id: lojaId };

      if (status) where.status = status;
      if (cliente_id) where.cliente_id = cliente_id;
      if (data_inicio)
        where.created_at = {
          ...(where.created_at as Record<string, unknown>),
          gte: new Date(data_inicio),
        };
      if (data_fim)
        where.created_at = {
          ...(where.created_at as Record<string, unknown>),
          lte: new Date(data_fim),
        };
      if (cursor) where.id = { gt: cursor };

      const [pedidos, total] = await Promise.all([
        prisma.pedido.findMany({
          where,
          take: limit + 1,
          orderBy: { created_at: 'desc' },
          include: {
            _count: { select: { itens: true } },
          },
        }),
        prisma.pedido.count({ where }),
      ]);

      const hasMore = pedidos.length > limit;
      const items = hasMore ? pedidos.slice(0, -1) : pedidos;
      const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]?.id : null;

      return reply.send({ data: items.map(serializePedido), nextCursor, total });
    }
  );

  app.get(
    '/admin/pedidos/:id',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR', 'OPERADOR')],
      schema: {
        params: paramsSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              loja_id: { type: 'string', format: 'uuid' },
              cliente_id: { type: 'string', format: 'uuid' },
              numero_sequencial: { type: 'number' },
              status: { type: 'string' },
              subtotal_cents: { type: 'number' },
              desconto_cents: { type: 'number' },
              frete_cents: { type: 'number' },
              total_cents: { type: 'number' },
              cupom_id: { type: 'string', format: 'uuid', nullable: true },
              endereco_entrega_id: { type: 'string', format: 'uuid' },
              endereco_cobranca_id: { type: 'string', format: 'uuid' },
              observacoes_cliente: { type: 'string', nullable: true },
              observacoes_internas: { type: 'string', nullable: true },
              pago_em: { type: 'string', format: 'date-time', nullable: true },
              enviado_em: { type: 'string', format: 'date-time', nullable: true },
              entregue_em: { type: 'string', format: 'date-time', nullable: true },
              cancelado_em: { type: 'string', format: 'date-time', nullable: true },
              cancelamento_motivo: { type: 'string', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              itens: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    pedido_id: { type: 'string', format: 'uuid' },
                    produto_id: { type: 'string', format: 'uuid' },
                    variacao_id: { type: 'string', format: 'uuid' },
                    nome_produto: { type: 'string' },
                    sku: { type: 'string' },
                    quantidade: { type: 'number' },
                    preco_unitario_cents: { type: 'number' },
                    total_cents: { type: 'number' },
                  },
                },
              },
              endereco_entrega: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  cep: { type: 'string' },
                  logradouro: { type: 'string' },
                  numero: { type: 'string' },
                  complemento: { type: 'string', nullable: true },
                  bairro: { type: 'string' },
                  cidade: { type: 'string' },
                  uf: { type: 'string' },
                },
              },
              endereco_cobranca: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  cep: { type: 'string' },
                  logradouro: { type: 'string' },
                  numero: { type: 'string' },
                  complemento: { type: 'string', nullable: true },
                  bairro: { type: 'string' },
                  cidade: { type: 'string' },
                  uf: { type: 'string' },
                },
              },
              cupom: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  codigo: { type: 'string' },
                  nome: { type: 'string' },
                  tipo: { type: 'string' },
                  valor: { type: 'number' },
                },
              },
              pagamento: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  gateway: { type: 'string' },
                  metodo: { type: 'string' },
                  status: { type: 'string' },
                  valor_cents: { type: 'number' },
                  parcelas: { type: 'number' },
                  juros_cents: { type: 'number' },
                  gateway_transaction_id: { type: 'string', nullable: true },
                  aprovado_em: { type: 'string', format: 'date-time', nullable: true },
                  estornado_em: { type: 'string', format: 'date-time', nullable: true },
                },
              },
              eventos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    tipo: { type: 'string' },
                    descricao: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as PedidoParams;
      const { id } = params;
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const pedido = await prisma.pedido.findFirst({
        where: { id, loja_id: lojaId },
        include: {
          itens: true,
          endereco_entrega: true,
          endereco_cobranca: true,
          cupom: true,
          pagamentos: true,
          eventos: { orderBy: { created_at: 'asc' } },
        },
      });

      if (!pedido) {
        return reply.code(404).send({ error: 'Pedido não encontrado' });
      }

      return reply.send(serializePedido(pedido));
    }
  );

  app.put(
    '/admin/pedidos/:id/status',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR', 'OPERADOR')],
      schema: {
        params: paramsSchema,
        body: updateStatusBodySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              status: { type: 'string' },
              observacoes_internas: { type: 'string', nullable: true },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as PedidoParams;
      const { id } = params;
      const body = request.body as UpdatePedidoStatusInput;
      const { status, observacoes_internas } = body;
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const pedido = await prisma.pedido.findFirst({ where: { id, loja_id: lojaId } });
      if (!pedido) {
        return reply.code(404).send({ error: 'Pedido não encontrado' });
      }

      const validTransitions: Record<string, string[]> = {
        CRIADO: ['PAGAMENTO_PENDENTE', 'CANCELADO'],
        PAGAMENTO_PENDENTE: ['PAGO', 'CANCELADO'],
        PAGO: ['SEPARANDO', 'CANCELADO'],
        SEPARANDO: ['ENVIADO', 'CANCELADO'],
        ENVIADO: ['ENTREGUE', 'CANCELADO'],
        ENTREGUE: [],
        CANCELADO: [],
      };

      const allowed = validTransitions[pedido.status] || [];
      if (!allowed.includes(status)) {
        return reply.code(400).send({
          error: `Transição inválida: ${pedido.status} → ${status}. Permitidas: ${allowed.join(', ') || 'nenhuma'}`,
        });
      }

      const updateData: Record<string, unknown> = { status };

      if (observacoes_internas) {
        updateData.observacoes_internas = observacoes_internas;
      }

      if (status === 'PAGO' && !pedido.pago_em) {
        updateData.pago_em = new Date();
      } else if (status === 'ENVIADO' && !pedido.enviado_em) {
        updateData.enviado_em = new Date();
      } else if (status === 'ENTREGUE' && !pedido.entregue_em) {
        updateData.entregue_em = new Date();
      } else if (status === 'CANCELADO' && !pedido.cancelado_em) {
        updateData.cancelado_em = new Date();
      }

      const updated = await prisma.pedido.update({
        where: { id },
        data: updateData,
      });

      await prisma.pedidoEvento.create({
        data: {
          pedido_id: id,
          tipo: 'STATUS_ALTERADO',
          descricao: `Status alterado de ${pedido.status} para ${status}`,
          usuario_id: request.user?.sub ?? null,
          metadata: { status_anterior: pedido.status, status_novo: status },
        },
      });

      if (status === 'CANCELADO') {
        for (const item of await prisma.itemPedido.findMany({ where: { pedido_id: id } })) {
          await prisma.estoque.updateMany({
            where: { variacao_id: item.variacao_id, loja_id: pedido.loja_id },
            data: { quantidade_reservada: { decrement: item.quantidade } },
          });
        }
      }

      return reply.send({
        id: updated.id,
        status: updated.status,
        observacoes_internas: updated.observacoes_internas,
        updated_at: updated.updated_at,
      });
    }
  );
}
