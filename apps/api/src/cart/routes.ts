import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware } from '../auth/middleware.js';
import { prisma } from '../lib/prisma.js';
import {
  type AddItemToCartInput,
  type CarrinhoItemParams,
  type UpdateCarrinhoItemInput,
  addItemToCartSchema,
  carrinhoItemParamsSchema,
  updateCarrinhoItemSchema,
} from '../schemas/cart.schemas.js';

const addItemBodySchema = addItemToCartSchema;
const updateItemBodySchema = updateCarrinhoItemSchema;
const itemParamsSchema = carrinhoItemParamsSchema;

async function getOrCreateCart(
  userId: string | null,
  sessionId: string | null,
  lojaId: string
): Promise<{ id: string; cliente_id: string | null; sessao_id: string | null; expira_em: Date }> {
  const whereClause = userId
    ? { cliente_id: userId, expira_em: { gt: new Date() } }
    : { sessao_id: sessionId, expira_em: { gt: new Date() } };

  const existingCart = await prisma.carrinho.findFirst({
    where: whereClause,
  });

  if (existingCart) {
    if (new Date(existingCart.expira_em) < new Date()) {
      await prisma.carrinho.update({
        where: { id: existingCart.id },
        data: { expira_em: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      });
    }
    return existingCart;
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const cart = await prisma.carrinho.create({
    data: {
      cliente_id: userId,
      sessao_id: sessionId,
      loja_id: lojaId,
      expira_em: expiresAt,
      atualizado_em: new Date(),
    },
  });
  return cart;
}

async function getCartWithItems(cartId: string) {
  return prisma.carrinho.findUnique({
    where: { id: cartId },
    include: {
      itens: {
        include: {
          produto: {
            select: {
              id: true,
              nome: true,
              slug: true,
              sku: true,
              ativo: true,
              status: true,
              imagens: { where: { principal: true }, take: 1 },
            },
          },
          variacao: {
            select: {
              id: true,
              sku: true,
              nome: true,
              preco_cents: true,
              ativo: true,
              imagens: { where: { principal: true }, take: 1 },
            },
          },
        },
      },
    },
  });
}

type CartWithItems = NonNullable<Awaited<ReturnType<typeof getCartWithItems>>>;

function serializeCart(cart: CartWithItems) {
  const subtotal_cents = cart.itens.reduce((acc, item) => {
    const preco = item.variacao?.preco_cents || 0;
    const qtd = item.quantidade;
    return acc + preco * qtd;
  }, 0);

  return {
    ...cart,
    subtotal_cents,
    itens: cart.itens.map((item) => ({
      ...item,
      preco_unitario_cents: item.variacao?.preco_cents || 0,
      total_cents: (item.variacao?.preco_cents || 0) * item.quantidade,
      produto: item.produto,
      variacao: item.variacao,
    })),
  };
}

export async function cartRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/carrinho',
    {
      preHandler: [authMiddleware],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              cliente_id: { type: 'string', format: 'uuid', nullable: true },
              sessao_id: { type: 'string', nullable: true },
              loja_id: { type: 'string', format: 'uuid' },
              expira_em: { type: 'string', format: 'date-time' },
              atualizado_em: { type: 'string', format: 'date-time' },
              subtotal_cents: { type: 'number' },
              itens: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    carrinho_id: { type: 'string', format: 'uuid' },
                    produto_id: { type: 'string', format: 'uuid' },
                    variacao_id: { type: 'string', format: 'uuid' },
                    quantidade: { type: 'number' },
                    preco_unitario_cents: { type: 'number' },
                    total_cents: { type: 'number' },
                    adicionado_em: { type: 'string', format: 'date-time' },
                    produto: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        nome: { type: 'string' },
                        slug: { type: 'string' },
                        sku: { type: 'string' },
                        ativo: { type: 'boolean' },
                        status: { type: 'string' },
                        imagens: { type: 'array' },
                      },
                    },
                    variacao: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        sku: { type: 'string' },
                        nome: { type: 'string' },
                        preco_cents: { type: 'number', nullable: true },
                        ativo: { type: 'boolean' },
                        imagens: { type: 'array' },
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
      const userId = request.user?.sub || null;
      const sessionId = (request.headers['x-session-id'] as string) || null;
      const lojaId =
        request.user?.loja_id ||
        (await prisma.loja.findFirst({ where: { ativa: true }, select: { id: true } }))?.id ||
        '';

      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const cart = await getOrCreateCart(userId, sessionId, lojaId);
      const cartWithItems = await getCartWithItems(cart.id);

      if (!cartWithItems) {
        return reply.code(404).send({ error: 'Carrinho não encontrado' });
      }

      return reply.send(serializeCart(cartWithItems));
    }
  );

  app.post(
    '/carrinho/itens',
    {
      preHandler: [authMiddleware],
      schema: {
        body: addItemBodySchema,
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              carrinho_id: { type: 'string', format: 'uuid' },
              produto_id: { type: 'string', format: 'uuid' },
              variacao_id: { type: 'string', format: 'uuid' },
              quantidade: { type: 'number' },
              preco_unitario_cents: { type: 'number' },
              total_cents: { type: 'number' },
              adicionado_em: { type: 'string', format: 'date-time' },
            },
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
          409: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as AddItemToCartInput;
      const userId = request.user?.sub || null;
      const sessionId = (request.headers['x-session-id'] as string) || null;
      const lojaId =
        request.user?.loja_id ||
        (await prisma.loja.findFirst({ where: { ativa: true }, select: { id: true } }))?.id ||
        '';

      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const { variacao_id, quantidade } = body;

      const variacao = await prisma.produtoVariacao.findUnique({
        where: { id: variacao_id },
        include: { produto: { select: { id: true, loja_id: true, ativo: true, status: true } } },
      });

      if (
        !variacao ||
        !variacao.ativo ||
        !variacao.produto.ativo ||
        variacao.produto.status !== 'ATIVO' ||
        variacao.produto.loja_id !== lojaId
      ) {
        return reply.code(404).send({ error: 'Variação não encontrada ou indisponível' });
      }

      const estoque = await prisma.estoque.findFirst({
        where: { variacao_id, loja_id: lojaId, quantidade_fisica: { gt: 0 } },
      });

      if (!estoque || estoque.quantidade_fisica < quantidade) {
        return reply.code(409).send({ error: 'Estoque insuficiente' });
      }

      const cart = await getOrCreateCart(userId, sessionId, lojaId);

      const existingItem = await prisma.itemCarrinho.findFirst({
        where: { carrinho_id: cart.id, variacao_id },
      });

      let item: typeof existingItem;
      if (existingItem) {
        const novaQuantidade = existingItem.quantidade + quantidade;
        if (estoque.quantidade_fisica < novaQuantidade) {
          return reply.code(409).send({ error: 'Estoque insuficiente para a quantidade total' });
        }
        item = await prisma.itemCarrinho.update({
          where: { id: existingItem.id },
          data: { quantidade: novaQuantidade, preco_unitario_cents: variacao.preco_cents || 0 },
        });
      } else {
        item = await prisma.itemCarrinho.create({
          data: {
            carrinho_id: cart.id,
            produto_id: variacao.produto_id,
            variacao_id,
            quantidade,
            preco_unitario_cents: variacao.preco_cents || 0,
            adicionado_em: new Date(),
          },
        });
      }

      await prisma.carrinho.update({
        where: { id: cart.id },
        data: { atualizado_em: new Date() },
      });

      return reply.code(201).send({
        ...item,
        preco_unitario_cents: item.preco_unitario_cents ? Number(item.preco_unitario_cents) : 0,
        total_cents: Number(item.preco_unitario_cents || 0) * item.quantidade,
      });
    }
  );

  app.put(
    '/carrinho/itens/:item_id',
    {
      preHandler: [authMiddleware],
      schema: {
        params: itemParamsSchema,
        body: updateItemBodySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              carrinho_id: { type: 'string', format: 'uuid' },
              produto_id: { type: 'string', format: 'uuid' },
              variacao_id: { type: 'string', format: 'uuid' },
              quantidade: { type: 'number' },
              preco_unitario_cents: { type: 'number' },
              total_cents: { type: 'number' },
              adicionado_em: { type: 'string', format: 'date-time' },
            },
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
          409: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as CarrinhoItemParams;
      const { item_id } = params;
      const body = request.body as UpdateCarrinhoItemInput;
      const { quantidade } = body;

      const userId = request.user?.sub || null;
      const sessionId = (request.headers['x-session-id'] as string) || null;
      const lojaId =
        request.user?.loja_id ||
        (await prisma.loja.findFirst({ where: { ativa: true }, select: { id: true } }))?.id ||
        '';

      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const item = await prisma.itemCarrinho.findFirst({
        where: {
          id: item_id,
          carrinho: {
            OR: userId ? [{ cliente_id: userId }] : [{ sessao_id: sessionId }],
            loja_id: lojaId,
          },
        },
        include: { variacao: { include: { estoques: { where: { loja_id: lojaId } } } } },
      });

      if (!item) {
        return reply.code(404).send({ error: 'Item não encontrado no carrinho' });
      }

      const estoqueDisponivel = item.variacao.estoques.reduce(
        (acc, e) => acc + e.quantidade_fisica,
        0
      );
      if (estoqueDisponivel < quantidade) {
        return reply.code(409).send({ error: 'Estoque insuficiente' });
      }

      const updatedItem = await prisma.itemCarrinho.update({
        where: { id: item_id },
        data: { quantidade },
      });

      await prisma.carrinho.update({
        where: { id: item.carrinho_id },
        data: { atualizado_em: new Date() },
      });

      return reply.send({
        ...updatedItem,
        preco_unitario_cents: updatedItem.preco_unitario_cents
          ? Number(updatedItem.preco_unitario_cents)
          : 0,
        total_cents: Number(updatedItem.preco_unitario_cents || 0) * updatedItem.quantidade,
      });
    }
  );

  app.delete(
    '/carrinho/itens/:item_id',
    {
      preHandler: [authMiddleware],
      schema: {
        params: itemParamsSchema,
        response: {
          200: { type: 'object', properties: { message: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as CarrinhoItemParams;
      const { item_id } = params;

      const userId = request.user?.sub || null;
      const sessionId = (request.headers['x-session-id'] as string) || null;
      const lojaId =
        request.user?.loja_id ||
        (await prisma.loja.findFirst({ where: { ativa: true }, select: { id: true } }))?.id ||
        '';

      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const item = await prisma.itemCarrinho.findFirst({
        where: {
          id: item_id,
          carrinho: {
            OR: userId ? [{ cliente_id: userId }] : [{ sessao_id: sessionId }],
            loja_id: lojaId,
          },
        },
      });

      if (!item) {
        return reply.code(404).send({ error: 'Item não encontrado no carrinho' });
      }

      await prisma.itemCarrinho.delete({ where: { id: item_id } });

      await prisma.carrinho.update({
        where: { id: item.carrinho_id },
        data: { atualizado_em: new Date() },
      });

      return reply.send({ message: 'Item removido do carrinho' });
    }
  );

  app.delete(
    '/carrinho',
    {
      preHandler: [authMiddleware],
      schema: {
        response: {
          200: { type: 'object', properties: { message: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.sub || null;
      const sessionId = (request.headers['x-session-id'] as string) || null;
      const lojaId =
        request.user?.loja_id ||
        (await prisma.loja.findFirst({ where: { ativa: true }, select: { id: true } }))?.id ||
        '';

      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const cart = await prisma.carrinho.findFirst({
        where: userId
          ? { cliente_id: userId, loja_id: lojaId }
          : { sessao_id: sessionId, loja_id: lojaId },
      });

      if (cart) {
        await prisma.itemCarrinho.deleteMany({ where: { carrinho_id: cart.id } });
        await prisma.carrinho.delete({ where: { id: cart.id } });
      }

      return reply.send({ message: 'Carrinho limpo com sucesso' });
    }
  );
}

export { serializeCart, getOrCreateCart, getCartWithItems };
