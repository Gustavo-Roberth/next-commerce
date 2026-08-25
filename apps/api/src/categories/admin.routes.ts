import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireRole } from '../auth/middleware.js';
import {
  type AdminCategoriaListQuery,
  type CategoriaInput,
  type CategoriaParams,
  type UpdateCategoriaInput,
  adminCategoriaListQuerySchema,
  categoriaParamsSchema,
  categoriaSchema,
  updateCategoriaSchema,
} from '../schemas/category.schemas.js';

const createBodySchema = categoriaSchema;
const updateBodySchema = updateCategoriaSchema;
const paramsSchema = categoriaParamsSchema;
const listQuerySchema = adminCategoriaListQuerySchema;

function serializeCategoria(categoria: Record<string, unknown>): Record<string, unknown> {
  return {
    ...categoria,
  };
}

export async function adminCategoryRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/admin/categorias',
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
                    nome: { type: 'string' },
                    slug: { type: 'string' },
                    descricao: { type: 'string', nullable: true },
                    imagem_url: { type: 'string', nullable: true },
                    pai_id: { type: 'string', format: 'uuid', nullable: true },
                    ordem_exibicao: { type: 'number' },
                    ativa: { type: 'boolean' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                    _count: {
                      type: 'object',
                      properties: {
                        produtos: { type: 'number' },
                        filhos: { type: 'number' },
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
      const query = request.query as AdminCategoriaListQuery;
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const cursor = query.cursor;
      const limit = query.limit ?? 20;
      const ativa = query.ativa ?? true;
      const pai_id = query.pai_id;
      const search = query.search;

      const where: Record<string, unknown> = { loja_id: lojaId, ativa };

      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (pai_id) where.pai_id = pai_id;
      if (cursor) where.id = { gt: cursor };

      const [categorias, total] = await Promise.all([
        prisma.categoria.findMany({
          where,
          take: limit + 1,
          orderBy: [{ ordem_exibicao: 'asc' }, { nome: 'asc' }],
          include: {
            _count: { select: { produtos: true, filhos: true } },
          },
        }),
        prisma.categoria.count({ where }),
      ]);

      const hasMore = categorias.length > limit;
      const items = hasMore ? categorias.slice(0, -1) : categorias;
      const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]?.id : null;

      return reply.send({ data: items.map(serializeCategoria), nextCursor, total });
    }
  );

  app.get(
    '/admin/categorias/:id',
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
              nome: { type: 'string' },
              slug: { type: 'string' },
              descricao: { type: 'string', nullable: true },
              imagem_url: { type: 'string', nullable: true },
              pai_id: { type: 'string', format: 'uuid', nullable: true },
              ordem_exibicao: { type: 'number' },
              ativa: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              pai: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  nome: { type: 'string' },
                  slug: { type: 'string' },
                },
              },
              filhos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    nome: { type: 'string' },
                    slug: { type: 'string' },
                  },
                },
              },
              _count: {
                type: 'object',
                properties: {
                  produtos: { type: 'number' },
                },
              },
            },
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as CategoriaParams;
      const id = params.id;
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const categoria = await prisma.categoria.findFirst({
        where: { id, loja_id: lojaId },
        include: {
          pai: { select: { id: true, nome: true, slug: true } },
          filhos: { select: { id: true, nome: true, slug: true }, where: { ativa: true } },
          _count: { select: { produtos: true } },
        },
      });

      if (!categoria) {
        return reply.code(404).send({ error: 'Categoria não encontrada' });
      }

      return reply.send(categoria);
    }
  );

  app.post(
    '/admin/categorias',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR')],
      schema: {
        body: createBodySchema,
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              loja_id: { type: 'string', format: 'uuid' },
              nome: { type: 'string' },
              slug: { type: 'string' },
              descricao: { type: 'string', nullable: true },
              imagem_url: { type: 'string', nullable: true },
              pai_id: { type: 'string', format: 'uuid', nullable: true },
              ordem_exibicao: { type: 'number' },
              ativa: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          409: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as CategoriaInput;
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const { nome, slug, descricao, imagem_url, pai_id, ordem_exibicao } = body;

      const existingSlug = await prisma.categoria.findFirst({
        where: { loja_id: lojaId, slug },
      });

      if (existingSlug) {
        return reply.code(409).send({ error: 'Slug já existe nesta loja' });
      }

      if (pai_id) {
        const pai = await prisma.categoria.findUnique({ where: { id: pai_id } });
        if (!pai || pai.loja_id !== lojaId) {
          return reply.code(400).send({ error: 'Categoria pai inválida' });
        }
      }

      const categoria = await prisma.categoria.create({
        data: {
          loja_id: lojaId,
          nome,
          slug,
          descricao: descricao ?? null,
          imagem_url: imagem_url ?? null,
          pai_id: pai_id ?? null,
          ordem_exibicao: ordem_exibicao ?? 0,
          ativa: true,
        },
      });

      return reply.code(201).send(serializeCategoria(categoria));
    }
  );

  app.put(
    '/admin/categorias/:id',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR')],
      schema: {
        params: paramsSchema,
        body: updateBodySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              loja_id: { type: 'string', format: 'uuid' },
              nome: { type: 'string' },
              slug: { type: 'string' },
              descricao: { type: 'string', nullable: true },
              imagem_url: { type: 'string', nullable: true },
              pai_id: { type: 'string', format: 'uuid', nullable: true },
              ordem_exibicao: { type: 'number' },
              ativa: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
          409: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as CategoriaParams;
      const id = params.id;
      const body = request.body as UpdateCategoriaInput;
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const existing = await prisma.categoria.findFirst({ where: { id, loja_id: lojaId } });
      if (!existing) {
        return reply.code(404).send({ error: 'Categoria não encontrada' });
      }

      const data: Record<string, unknown> = {};

      if (body.nome !== undefined) data.nome = body.nome;
      if (body.slug !== undefined) data.slug = body.slug;
      if (body.descricao !== undefined) data.descricao = body.descricao ?? null;
      if (body.imagem_url !== undefined) data.imagem_url = body.imagem_url ?? null;
      if (body.pai_id !== undefined) data.pai_id = body.pai_id ?? null;
      if (body.ordem_exibicao !== undefined) data.ordem_exibicao = body.ordem_exibicao;
      if (body.ativa !== undefined) data.ativa = body.ativa;

      if (data.slug && data.slug !== existing.slug) {
        const existingSlug = await prisma.categoria.findFirst({
          where: { loja_id: lojaId, slug: data.slug as string },
        });
        if (existingSlug) {
          return reply.code(409).send({ error: 'Slug já existe nesta loja' });
        }
      }

      if (data.pai_id) {
        const paiId = data.pai_id as string;
        if (paiId === id) {
          return reply.code(400).send({ error: 'Categoria não pode ser pai de si mesma' });
        }
        const pai = await prisma.categoria.findUnique({ where: { id: paiId } });
        if (!pai || pai.loja_id !== lojaId) {
          return reply.code(400).send({ error: 'Categoria pai inválida' });
        }
        const isDescendant = await prisma.categoria.findFirst({
          where: { id: { in: [id] }, filhos: { some: { id: paiId } } },
        });
        if (isDescendant) {
          return reply.code(400).send({ error: 'Não pode criar referência circular' });
        }
      }

      const categoria = await prisma.categoria.update({
        where: { id },
        data,
      });

      return reply.send(serializeCategoria(categoria));
    }
  );

  app.delete(
    '/admin/categorias/:id',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR')],
      schema: {
        params: paramsSchema,
        response: {
          200: { type: 'object', properties: { message: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
          409: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as CategoriaParams;
      const id = params.id;
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const categoria = await prisma.categoria.findFirst({
        where: { id, loja_id: lojaId },
        include: { _count: { select: { produtos: true, filhos: true } } },
      });

      if (!categoria) {
        return reply.code(404).send({ error: 'Categoria não encontrada' });
      }

      if (categoria._count.produtos > 0) {
        return reply.code(409).send({ error: 'Categoria possui produtos associados' });
      }

      if (categoria._count.filhos > 0) {
        return reply.code(409).send({ error: 'Categoria possui subcategorias' });
      }

      await prisma.categoria.delete({ where: { id } });

      return reply.send({ message: 'Categoria removida com sucesso' });
    }
  );
}

export { serializeCategoria };