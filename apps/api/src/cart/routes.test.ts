import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { serializeCart, getOrCreateCart, getCartWithItems } from './routes.js';
import type { PrismaClient, Carrinho, ItemCarrinho, ProdutoVariacao, Produto } from '@prisma/client';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    carrinho: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    itemCarrinho: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    produtoVariacao: {
      findUnique: vi.fn(),
    },
    estoque: {
      findFirst: vi.fn(),
    },
    loja: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma.js';

describe('Cart Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('serializeCart', () => {
    it('should serialize cart with items correctly', () => {
      const mockCart = {
        id: 'cart-1',
        cliente_id: 'user-1',
        sessao_id: null,
        loja_id: 'loja-1',
        expira_em: new Date('2024-12-31'),
        atualizado_em: new Date('2024-01-15'),
        itens: [
          {
            id: 'item-1',
            carrinho_id: 'cart-1',
            produto_id: 'prod-1',
            variacao_id: 'var-1',
            quantidade: 2,
            preco_unitario_cents: 10000,
            adicionado_em: new Date('2024-01-01'),
            produto: {
              id: 'prod-1',
              nome: 'Produto Teste',
              slug: 'produto-teste',
              sku: 'SKU-001',
              ativo: true,
              status: 'ATIVO',
              imagens: [{ url: 'img.jpg', alt_text: 'Test', principal: true }],
            },
            variacao: {
              id: 'var-1',
              sku: 'VAR-001',
              nome: 'Cor Vermelha',
              preco_cents: 10000,
              ativo: true,
              imagens: [{ url: 'img.jpg', alt_text: 'Test', principal: true }],
            },
          },
        ],
      };

      const result = serializeCart(mockCart);

      expect(result.id).toBe('cart-1');
      expect(result.subtotal_cents).toBe(20000);
      expect(result.itens).toHaveLength(1);
      expect(result.itens[0].preco_unitario_cents).toBe(10000);
      expect(result.itens[0].total_cents).toBe(20000);
      expect(result.itens[0].produto.nome).toBe('Produto Teste');
      expect(result.itens[0].variacao.nome).toBe('Cor Vermelha');
    });

    it('should handle empty cart', () => {
      const mockCart = {
        id: 'cart-1',
        itens: [],
        subtotal_cents: 0,
      };

      const result = serializeCart(mockCart);
      expect(result.subtotal_cents).toBe(0);
      expect(result.itens).toHaveLength(0);
    });
  });

  describe('getOrCreateCart', () => {
    const mockUserId = 'user-1';
    const mockLojaId = 'loja-1';
    const mockSessionId = 'session-1';

    it('should return existing cart for authenticated user', async () => {
      const existingCart = {
        id: 'cart-1',
        cliente_id: mockUserId,
        loja_id: mockLojaId,
        expira_em: new Date(Date.now() + 86400000),
        atualizado_em: new Date(),
      };

      vi.mocked(prisma.carrinho.findFirst).mockResolvedValue(existingCart);

      const result = await getOrCreateCart(mockUserId, null, mockLojaId);

      expect(result).toEqual(existingCart);
      expect(prisma.carrinho.findFirst).toHaveBeenCalledWith({
        where: { cliente_id: mockUserId, expira_em: { gt: expect.any(Date) } },
      });
    });

    it('should return existing cart for anonymous session', async () => {
      const existingCart = {
        id: 'cart-1',
        sessao_id: 'session-1',
        loja_id: mockLojaId,
        expira_em: new Date(Date.now() + 86400000),
        atualizado_em: new Date(),
      };

      vi.mocked(prisma.carrinho.findFirst).mockResolvedValue(existingCart);

      const result = await getOrCreateCart(null, 'session-1', mockLojaId);

      expect(result).toEqual(existingCart);
      expect(prisma.carrinho.findFirst).toHaveBeenCalledWith({
        where: { sessao_id: 'session-1', expira_em: { gt: expect.any(Date) } },
      });
    });

    it('should create new cart if none exists', async () => {
      vi.mocked(prisma.carrinho.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.carrinho.create).mockResolvedValue({
        id: 'cart-new',
        cliente_id: mockUserId,
        loja_id: mockLojaId,
        expira_em: expect.any(Date),
        atualizado_em: expect.any(Date),
      });

      const result = await getOrCreateCart(mockUserId, null, mockLojaId);

      expect(result.id).toBe('cart-new');
      expect(prisma.carrinho.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cliente_id: mockUserId,
          loja_id: mockLojaId,
        }),
      });
    });

    it('should update expiration if cart is expired', async () => {
      const expiredCart = {
        id: 'cart-1',
        cliente_id: mockUserId,
        loja_id: mockLojaId,
        expira_em: new Date(Date.now() - 86400000), // expired
        atualizado_em: new Date(),
      };

      vi.mocked(prisma.carrinho.findFirst).mockResolvedValue(expiredCart);
      vi.mocked(prisma.carrinho.update).mockResolvedValue({
        ...expiredCart,
        expira_em: expect.any(Date),
      });

      const result = await getOrCreateCart(mockUserId, null, mockLojaId);

      expect(prisma.carrinho.update).toHaveBeenCalled();
      expect(result.expira_em).toBeInstanceOf(Date);
    });
  });

  describe('getCartWithItems', () => {
    it('should return cart with items and relations', async () => {
      const mockCart = {
        id: 'cart-1',
        cliente_id: 'user-1',
        itens: [
          {
            id: 'item-1',
            variacao: {
              id: 'var-1',
              preco_cents: 10000,
              ativo: true,
              imagens: [{ url: 'img.jpg', principal: true }],
            },
            produto: { id: 'prod-1', nome: 'Test', slug: 'test', sku: 'SKU-1', ativo: true, status: 'ATIVO' },
          },
        ],
      };

      vi.mocked(prisma.carrinho.findUnique).mockResolvedValue(mockCart);

      const result = await getCartWithItems('cart-1');

      expect(result).toEqual(mockCart);
      expect(prisma.carrinho.findUnique).toHaveBeenCalledWith({
        where: { id: 'cart-1' },
        include: expect.objectContaining({
          itens: expect.objectContaining({
            include: expect.objectContaining({
              produto: expect.any(Object),
              variacao: expect.any(Object),
            }),
          }),
        }),
      });
    });
  });
});