import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware, requireRole } from '../auth/middleware.js';
import { prisma } from '../lib/prisma.js';
import {
  type CreateProdutoInput,
  type ProdutoListQuery,
  type ProdutoParams,
  type UpdateProdutoInput,
  createProdutoSchema,
  produtoListQuerySchema,
  produtoParamsSchema,
  updateProdutoSchema,
} from '../schemas/product.schemas.js';

const createBodySchema = createProdutoSchema;
const updateBodySchema = updateProdutoSchema;
const paramsSchema = produtoParamsSchema;
const listQuerySchema = produtoListQuerySchema;

function serializeProduto(produto: Record<string, unknown>): Record<string, unknown> {
  return {
    ...produto,
    peso_bruto_kg: produto.peso_bruto_kg ? Number(produto.peso_bruto_kg) : null,
    peso_liquido_kg: produto.peso_liquido_kg ? Number(produto.peso_liquido_kg) : null,
    preco_cents: produto.preco_cents ? Number(produto.preco_cents) : null,
    custo_cents: produto.custo_cents ? Number(produto.custo_cents) : null,
  };
}

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/produtos',
    {
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
                    categoria_id: { type: 'string', format: 'uuid' },
                    nome: { type: 'string' },
                    slug: { type: 'string' },
                    descricao_curta: { type: 'string', nullable: true },
                    descricao_completa: { type: 'string', nullable: true },
                    sku: { type: 'string' },
                    codigo_barras: { type: 'string', nullable: true },
                    ncm: { type: 'string', nullable: true },
                    cest: { type: 'string', nullable: true },
                    origem_mercadoria: { type: 'number', nullable: true },
                    peso_bruto_kg: { type: 'number', nullable: true },
                    peso_liquido_kg: { type: 'number', nullable: true },
                    dimensoes_cm: { type: 'object', nullable: true },
                    ativo: { type: 'boolean' },
                    destaque: { type: 'boolean' },
                    permite_avaliacao: { type: 'boolean' },
                    meta_title: { type: 'string', nullable: true },
                    meta_description: { type: 'string', nullable: true },
                    publicado_em: { type: 'string', format: 'date-time', nullable: true },
                    status: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                    categoria: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        nome: { type: 'string' },
                        slug: { type: 'string' },
                      },
                    },
                    _count: {
                      type: 'object',
                      properties: {
                        variacoes: { type: 'number' },
                        imagens: { type: 'number' },
                      },
                    },
                  },
                },
              },
              nextCursor: { type: 'string', format: 'uuid', nullable: true },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as ProdutoListQuery;
      const cursor = query.cursor;
      const limit = query.limit ?? 20;
      const search = query.search;
      const categoria_id = query.categoria_id;
      const status = query.status;
      const destaque = query.destaque;
      const _preco_min = query.preco_min;
      const _preco_max = query.preco_max;
      const _apenas_disponiveis = query.apenas_disponiveis;
      const sort = query.sort;

      const where: Record<string, unknown> = { status: { not: 'ARQUIVADO' } };

      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { descricao_curta: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoria_id) where.categoria_id = categoria_id;
      if (status) where.status = status;
      if (destaque !== undefined) where.destaque = destaque;
      if (cursor) where.id = { gt: cursor };

      const orderBy: Record<string, string>[] = sort
        ? [{ [sort]: 'asc' }]
        : [{ created_at: 'desc' }];

      const [produtos, total] = await Promise.all([
        prisma.produto.findMany({
          where,
          take: limit + 1,
          orderBy,
          include: {
            categoria: { select: { id: true, nome: true, slug: true } },
            _count: { select: { variacoes: true, imagens: true } },
          },
        }),
        prisma.produto.count({ where }),
      ]);

      const hasMore = produtos.length > limit;
      const items = hasMore ? produtos.slice(0, -1) : produtos;
      const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]?.id : null;

      return reply.send({ data: items.map(serializeProduto), nextCursor, total });
    }
  );

  app.get(
    '/produtos/destaques',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            loja_id: { type: 'string', format: 'uuid' },
            limit: { type: 'number', minimum: 1, maximum: 20, default: 10 },
          },
        },
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
                    nome: { type: 'string' },
                    slug: { type: 'string' },
                    descricao_curta: { type: 'string', nullable: true },
                    sku: { type: 'string' },
                    preco_cents: { type: 'number', nullable: true },
                    imagens: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          url: { type: 'string' },
                          alt_text: { type: 'string', nullable: true },
                          principal: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { loja_id?: string; limit?: number };
      const loja_id = query.loja_id;
      const limit = query.limit ?? 10;

      if (!loja_id) {
        return reply.code(400).send({ error: 'loja_id é obrigatório' });
      }

      const produtos = await prisma.produto.findMany({
        where: { loja_id, status: 'ATIVO', destaque: true, ativo: true },
        take: limit,
        orderBy: { created_at: 'asc' },
        include: {
          imagens: { where: { principal: true }, take: 1 },
          variacoes: { where: { ativo: true }, take: 1, select: { preco_cents: true } },
        },
      });

      const data = produtos.map((p) => ({
        id: p.id,
        nome: p.nome,
        slug: p.slug,
        descricao_curta: p.descricao_curta,
        sku: p.sku,
        preco_cents: p.variacoes[0]?.preco_cents ? Number(p.variacoes[0].preco_cents) : null,
        imagens: p.imagens.map((img) => ({
          url: img.url,
          alt_text: img.alt_text,
          principal: img.principal,
        })),
      }));

      return reply.send({ data });
    }
  );

  app.get(
    '/produtos/:id',
    {
      schema: {
        params: paramsSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              loja_id: { type: 'string', format: 'uuid' },
              categoria_id: { type: 'string', format: 'uuid' },
              nome: { type: 'string' },
              slug: { type: 'string' },
              descricao_curta: { type: 'string', nullable: true },
              descricao_completa: { type: 'string', nullable: true },
              sku: { type: 'string' },
              codigo_barras: { type: 'string', nullable: true },
              ncm: { type: 'string', nullable: true },
              cest: { type: 'string', nullable: true },
              origem_mercadoria: { type: 'number', nullable: true },
              peso_bruto_kg: { type: 'number', nullable: true },
              peso_liquido_kg: { type: 'number', nullable: true },
              dimensoes_cm: { type: 'object', nullable: true },
              ativo: { type: 'boolean' },
              destaque: { type: 'boolean' },
              permite_avaliacao: { type: 'boolean' },
              meta_title: { type: 'string', nullable: true },
              meta_description: { type: 'string', nullable: true },
              publicado_em: { type: 'string', format: 'date-time', nullable: true },
              status: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              categoria: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  nome: { type: 'string' },
                  slug: { type: 'string' },
                },
              },
              variacoes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    sku: { type: 'string' },
                    nome: { type: 'string' },
                    codigo_barras: { type: 'string', nullable: true },
                    preco_cents: { type: 'number', nullable: true },
                    custo_cents: { type: 'number', nullable: true },
                    peso_bruto_kg: { type: 'number', nullable: true },
                    peso_liquido_kg: { type: 'number', nullable: true },
                    dimensoes_cm: { type: 'object', nullable: true },
                    ativo: { type: 'boolean' },
                    ordem_exibicao: { type: 'number' },
                    atributos: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          atributo_id: { type: 'string', format: 'uuid' },
                          nome: { type: 'string' },
                          valor: { type: 'string' },
                        },
                      },
                    },
                    imagens: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          url: { type: 'string' },
                          alt_text: { type: 'string', nullable: true },
                          principal: { type: 'boolean' },
                          ordem: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
              imagens: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    url: { type: 'string' },
                    alt_text: { type: 'string', nullable: true },
                    principal: { type: 'boolean' },
                    ordem: { type: 'number' },
                  },
                },
              },
              _count: {
                type: 'object',
                properties: {
                  avaliacoes: { type: 'number' },
                  favoritos: { type: 'number' },
                },
              },
            },
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: ProdutoParams }>, reply: FastifyReply) => {
      const params = request.params;
      const id = params.id;

      const produto = await prisma.produto.findUnique({
        where: { id },
        include: {
          categoria: { select: { id: true, nome: true, slug: true } },
          variacoes: {
            where: { ativo: true },
            orderBy: { ordem_exibicao: 'asc' },
            include: {
              atributos: {
                include: { atributo: { select: { id: true, nome: true } } },
              },
              imagens: { orderBy: { ordem: 'asc' } },
            },
          },
          imagens: { orderBy: { ordem: 'asc' } },
          _count: { select: { avaliacoes: true, favoritos: true } },
        },
      });

      if (!produto) {
        return reply.code(404).send({ error: 'Produto não encontrado' });
      }

      const serialized = serializeProduto(produto);

      const variacoes = produto.variacoes.map((v) => ({
        ...v,
        preco_cents: v.preco_cents ? Number(v.preco_cents) : null,
        custo_cents: v.custo_cents ? Number(v.custo_cents) : null,
        peso_bruto_kg: v.peso_bruto_kg ? Number(v.peso_bruto_kg) : null,
        peso_liquido_kg: v.peso_liquido_kg ? Number(v.peso_liquido_kg) : null,
        atributos: v.atributos.map((a) => ({
          atributo_id: a.atributo.id,
          nome: a.atributo.nome,
          valor: a.valor,
        })),
        imagens: v.imagens.map((img) => ({
          url: img.url,
          alt_text: img.alt_text,
          principal: img.principal,
          ordem: img.ordem,
        })),
      }));

      return reply.send({
        ...serialized,
        variacoes,
        imagens: produto.imagens.map((img) => ({
          url: img.url,
          alt_text: img.alt_text,
          principal: img.principal,
          ordem: img.ordem,
        })),
      });
    }
  );

  app.post(
    '/produtos',
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
              categoria_id: { type: 'string', format: 'uuid' },
              nome: { type: 'string' },
              slug: { type: 'string' },
              descricao_curta: { type: 'string', nullable: true },
              descricao_completa: { type: 'string', nullable: true },
              sku: { type: 'string' },
              codigo_barras: { type: 'string', nullable: true },
              ncm: { type: 'string', nullable: true },
              cest: { type: 'string', nullable: true },
              origem_mercadoria: { type: 'number', nullable: true },
              peso_bruto_kg: { type: 'number', nullable: true },
              peso_liquido_kg: { type: 'number', nullable: true },
              dimensoes_cm: { type: 'object', nullable: true },
              ativo: { type: 'boolean' },
              destaque: { type: 'boolean' },
              permite_avaliacao: { type: 'boolean' },
              meta_title: { type: 'string', nullable: true },
              meta_description: { type: 'string', nullable: true },
              publicado_em: { type: 'string', format: 'date-time', nullable: true },
              status: { type: 'string' },
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
      const body = request.body as CreateProdutoInput;

      const existingSku = await prisma.produto.findFirst({
        where: { loja_id: body.loja_id, sku: body.sku },
      });

      if (existingSku) {
        return reply.code(409).send({ error: 'SKU já existe nesta loja' });
      }

      if (body.codigo_barras) {
        const existingBarras = await prisma.produto.findFirst({
          where: { loja_id: body.loja_id, codigo_barras: body.codigo_barras },
        });
        if (existingBarras) {
          return reply.code(409).send({ error: 'Código de barras já existe nesta loja' });
        }
      }

      const existingSlug = await prisma.produto.findFirst({
        where: { loja_id: body.loja_id, slug: body.slug },
      });

      if (existingSlug) {
        return reply.code(409).send({ error: 'Slug já existe nesta loja' });
      }

      const categoria = await prisma.categoria.findUnique({
        where: { id: body.categoria_id },
      });

      if (!categoria || categoria.loja_id !== body.loja_id) {
        return reply.code(400).send({ error: 'Categoria inválida' });
      }

      const createData: Record<string, unknown> = {
        loja_id: body.loja_id,
        categoria_id: body.categoria_id,
        nome: body.nome,
        slug: body.slug,
        sku: body.sku,
      };

      if (body.descricao_curta !== undefined)
        createData.descricao_curta = body.descricao_curta ?? null;
      if (body.descricao_completa !== undefined)
        createData.descricao_completa = body.descricao_completa ?? null;
      if (body.codigo_barras !== undefined) createData.codigo_barras = body.codigo_barras ?? null;
      if (body.ncm !== undefined) createData.ncm = body.ncm ?? null;
      if (body.cest !== undefined) createData.cest = body.cest ?? null;
      if (body.origem_mercadoria !== undefined)
        createData.origem_mercadoria = body.origem_mercadoria;
      if (body.peso_bruto_kg !== undefined) createData.peso_bruto_kg = body.peso_bruto_kg;
      if (body.peso_liquido_kg !== undefined) createData.peso_liquido_kg = body.peso_liquido_kg;
      if (body.dimensoes_cm !== undefined) createData.dimensoes_cm = body.dimensoes_cm ?? null;
      if (body.ativo !== undefined) createData.ativo = body.ativo;
      if (body.destaque !== undefined) createData.destaque = body.destaque;
      if (body.permite_avaliacao !== undefined)
        createData.permite_avaliacao = body.permite_avaliacao;
      if (body.meta_title !== undefined) createData.meta_title = body.meta_title ?? null;
      if (body.meta_description !== undefined)
        createData.meta_description = body.meta_description ?? null;

      const produto = await prisma.produto.create({
        data: createData as any,
      });

      return reply.code(201).send(serializeProduto(produto));
    }
  );

  app.put(
    '/produtos/:id',
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
              categoria_id: { type: 'string', format: 'uuid' },
              nome: { type: 'string' },
              slug: { type: 'string' },
              descricao_curta: { type: 'string', nullable: true },
              descricao_completa: { type: 'string', nullable: true },
              sku: { type: 'string' },
              codigo_barras: { type: 'string', nullable: true },
              ncm: { type: 'string', nullable: true },
              cest: { type: 'string', nullable: true },
              origem_mercadoria: { type: 'number', nullable: true },
              peso_bruto_kg: { type: 'number', nullable: true },
              peso_liquido_kg: { type: 'number', nullable: true },
              dimensoes_cm: { type: 'object', nullable: true },
              ativo: { type: 'boolean' },
              destaque: { type: 'boolean' },
              permite_avaliacao: { type: 'boolean' },
              meta_title: { type: 'string', nullable: true },
              meta_description: { type: 'string', nullable: true },
              publicado_em: { type: 'string', format: 'date-time', nullable: true },
              status: { type: 'string' },
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
      const params = request.params as ProdutoParams;
      const id = params.id;
      const body = request.body as UpdateProdutoInput;

      const existing = await prisma.produto.findUnique({ where: { id } });
      if (!existing) {
        return reply.code(404).send({ error: 'Produto não encontrado' });
      }

      if (body.sku && body.sku !== existing.sku) {
        const existingSku = await prisma.produto.findFirst({
          where: { loja_id: existing.loja_id, sku: body.sku },
        });
        if (existingSku) {
          return reply.code(409).send({ error: 'SKU já existe nesta loja' });
        }
      }

      if (body.codigo_barras && body.codigo_barras !== existing.codigo_barras) {
        const existingBarras = await prisma.produto.findFirst({
          where: { loja_id: existing.loja_id, codigo_barras: body.codigo_barras },
        });
        if (existingBarras) {
          return reply.code(409).send({ error: 'Código de barras já existe nesta loja' });
        }
      }

      if (body.slug && body.slug !== existing.slug) {
        const existingSlug = await prisma.produto.findFirst({
          where: { loja_id: existing.loja_id, slug: body.slug },
        });
        if (existingSlug) {
          return reply.code(409).send({ error: 'Slug já existe nesta loja' });
        }
      }

      if (body.categoria_id) {
        const categoria = await prisma.categoria.findUnique({
          where: { id: body.categoria_id },
        });
        if (!categoria || categoria.loja_id !== existing.loja_id) {
          return reply.code(400).send({ error: 'Categoria inválida' });
        }
      }

      const updateData: Record<string, unknown> = {};

      if (body.nome !== undefined) updateData.nome = body.nome;
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.descricao_curta !== undefined)
        updateData.descricao_curta = body.descricao_curta ?? null;
      if (body.descricao_completa !== undefined)
        updateData.descricao_completa = body.descricao_completa ?? null;
      if (body.sku !== undefined) updateData.sku = body.sku;
      if (body.codigo_barras !== undefined) updateData.codigo_barras = body.codigo_barras ?? null;
      if (body.ncm !== undefined) updateData.ncm = body.ncm ?? null;
      if (body.cest !== undefined) updateData.cest = body.cest ?? null;
      if (body.origem_mercadoria !== undefined)
        updateData.origem_mercadoria = body.origem_mercadoria;
      if (body.peso_bruto_kg !== undefined) updateData.peso_bruto_kg = body.peso_bruto_kg;
      if (body.peso_liquido_kg !== undefined) updateData.peso_liquido_kg = body.peso_liquido_kg;
      if (body.dimensoes_cm !== undefined) updateData.dimensoes_cm = body.dimensoes_cm ?? null;
      if (body.ativo !== undefined) updateData.ativo = body.ativo;
      if (body.destaque !== undefined) updateData.destaque = body.destaque;
      if (body.permite_avaliacao !== undefined)
        updateData.permite_avaliacao = body.permite_avaliacao;
      if (body.meta_title !== undefined) updateData.meta_title = body.meta_title ?? null;
      if (body.meta_description !== undefined)
        updateData.meta_description = body.meta_description ?? null;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.categoria_id !== undefined) updateData.categoria_id = body.categoria_id;

      const produto = await prisma.produto.update({
        where: { id },
        data: updateData,
      });

      return reply.send(serializeProduto(produto));
    }
  );

  app.delete(
    '/produtos/:id',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR')],
      schema: {
        params: paramsSchema,
        response: {
          200: { type: 'object', properties: { message: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as ProdutoParams;
      const id = params.id;

      const produto = await prisma.produto.findUnique({ where: { id } });
      if (!produto) {
        return reply.code(404).send({ error: 'Produto não encontrado' });
      }

      await prisma.produto.update({
        where: { id },
        data: { status: 'ARQUIVADO', ativo: false },
      });

      return reply.send({ message: 'Produto arquivado com sucesso' });
    }
  );
}

export { serializeProduto };
