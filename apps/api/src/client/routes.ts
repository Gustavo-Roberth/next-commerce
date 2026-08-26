import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware } from '../auth/middleware.js';
import { prisma } from '../lib/prisma.js';

export async function clientRoutes(app: FastifyInstance): Promise<void> {
  // ---------------------------------------------------------------------------
  // Endereços
  // ---------------------------------------------------------------------------
  app.get(
    '/client/enderecos',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: 'Não autenticado' });

      const enderecos = await prisma.endereco.findMany({
        where: { usuario_id: userId, deleted_at: null },
        orderBy: [{ principal: 'desc' }, { created_at: 'desc' }],
      });

      return reply.send({ data: enderecos });
    }
  );

  app.post(
    '/client/enderecos',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: 'Não autenticado' });

      const body = request.body as Record<string, unknown>;
      const tipo = (body.tipo as string) || 'ENTREGA';
      const cep = body.cep as string;
      const logradouro = body.logradouro as string;
      const numero = body.numero as string;
      const bairro = body.bairro as string;
      const cidade = body.cidade as string;
      const uf = body.uf as string;

      if (!cep || !logradouro || !numero || !bairro || !cidade || !uf) {
        return reply.code(400).send({ error: 'Campos obrigatórios ausentes' });
      }

      const principal = Boolean(body.principal);

      const count = await prisma.endereco.count({ where: { usuario_id: userId, deleted_at: null } });

      const endereco = await prisma.endereco.create({
        data: {
          usuario_id: userId,
          tipo: tipo as never,
          cep,
          logradouro,
          numero,
          complemento: (body.complemento as string) || null,
          bairro,
          cidade,
          uf,
          pais: (body.pais as string) || 'BRA',
          principal: count === 0 ? true : principal,
          apelido: (body.apelido as string) || null,
        },
      });

      if (principal && count > 0) {
        await prisma.endereco.updateMany({
          where: { usuario_id: userId, id: { not: endereco.id }, deleted_at: null },
          data: { principal: false },
        });
      }

      return reply.code(201).send(endereco);
    }
  );

  app.put(
    '/client/enderecos/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: 'Não autenticado' });

      const { id } = request.params as { id: string };
      const body = request.body as Record<string, unknown>;

      const existente = await prisma.endereco.findFirst({
        where: { id, usuario_id: userId, deleted_at: null },
      });
      if (!existente) return reply.code(404).send({ error: 'Endereço não encontrado' });

      const principal = body.principal === undefined ? existente.principal : Boolean(body.principal);

      const atualizado = await prisma.endereco.update({
        where: { id },
        data: {
          tipo: (body.tipo as never) ?? existente.tipo,
          cep: (body.cep as string) ?? existente.cep,
          logradouro: (body.logradouro as string) ?? existente.logradouro,
          numero: (body.numero as string) ?? existente.numero,
          complemento: body.complemento !== undefined ? ((body.complemento as string) || null) : existente.complemento,
          bairro: (body.bairro as string) ?? existente.bairro,
          cidade: (body.cidade as string) ?? existente.cidade,
          uf: (body.uf as string) ?? existente.uf,
          pais: (body.pais as string) ?? existente.pais,
          principal,
          apelido: body.apelido !== undefined ? ((body.apelido as string) || null) : existente.apelido,
        },
      });

      if (principal) {
        await prisma.endereco.updateMany({
          where: { usuario_id: userId, id: { not: id }, deleted_at: null },
          data: { principal: false },
        });
      }

      return reply.send(atualizado);
    }
  );

  app.delete(
    '/client/enderecos/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: 'Não autenticado' });

      const { id } = request.params as { id: string };
      const existente = await prisma.endereco.findFirst({
        where: { id, usuario_id: userId, deleted_at: null },
      });
      if (!existente) return reply.code(404).send({ error: 'Endereço não encontrado' });

      await prisma.endereco.update({ where: { id }, data: { deleted_at: new Date() } });
      return reply.send({ message: 'Endereço removido' });
    }
  );

  // ---------------------------------------------------------------------------
  // Favoritos
  // ---------------------------------------------------------------------------
  app.get(
    '/client/favoritos',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: 'Não autenticado' });

      const favoritos = await prisma.favorito.findMany({
        where: { cliente_id: userId },
        include: { produto: true, variacao: true },
        orderBy: { created_at: 'desc' },
      });

      return reply.send({ data: favoritos });
    }
  );

  app.post(
    '/client/favoritos',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: 'Não autenticado' });

      const body = request.body as Record<string, unknown>;
      const produtoId = body.produto_id as string;
      const variacaoId = (body.variacao_id as string) || null;

      if (!produtoId) return reply.code(400).send({ error: 'produto_id obrigatório' });

      const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
      if (!produto) return reply.code(404).send({ error: 'Produto não encontrado' });

      const existente = await prisma.favorito.findFirst({
        where: { cliente_id: userId, produto_id: produtoId, variacao_id: variacaoId },
      });
      if (existente) return reply.code(200).send(existente);

      const favorito = await prisma.favorito.create({
        data: {
          cliente_id: userId,
          produto_id: produtoId,
          variacao_id: variacaoId,
          loja_id: produto.loja_id,
        },
        include: { produto: true, variacao: true },
      });

      return reply.code(201).send(favorito);
    }
  );

  app.delete(
    '/client/favoritos/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: 'Não autenticado' });

      const { id } = request.params as { id: string };
      const existente = await prisma.favorito.findFirst({ where: { id, cliente_id: userId } });
      if (!existente) return reply.code(404).send({ error: 'Favorito não encontrado' });

      await prisma.favorito.delete({ where: { id } });
      return reply.send({ message: 'Favorito removido' });
    }
  );

  // ---------------------------------------------------------------------------
  // Perfil
  // ---------------------------------------------------------------------------
  app.put(
    '/client/perfil',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: 'Não autenticado' });

      const body = request.body as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      if (body.nome_completo !== undefined) data.nome_completo = body.nome_completo;
      if (body.telefone !== undefined) data.telefone = body.telefone || null;
      if (body.cpf_cnpj !== undefined) data.cpf_cnpj = body.cpf_cnpj || null;
      if (body.avatar_url !== undefined) data.avatar_url = body.avatar_url || null;

      const usuario = await prisma.usuario.update({
        where: { id: userId },
        data,
      });

      return reply.send({
        id: usuario.id,
        email: usuario.email,
        nome_completo: usuario.nome_completo,
        telefone: usuario.telefone,
        cpf_cnpj: usuario.cpf_cnpj,
        avatar_url: usuario.avatar_url,
      });
    }
  );
}
