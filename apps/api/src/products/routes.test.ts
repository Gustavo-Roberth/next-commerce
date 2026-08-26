import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { serializeProduto } from './routes.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    produto: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    categoria: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Product Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('serializeProduto', () => {
    it('should serialize product with variations and images', () => {
      const mockProduto = {
        id: 'prod-1',
        loja_id: 'loja-1',
        categoria_id: 'cat-1',
        nome: 'Produto Teste',
        slug: 'produto-teste',
        descricao_curta: 'Descrição curta',
        descricao_completa: 'Descrição completa',
        sku: 'SKU-001',
        codigo_barras: '7891234567890',
        ncm: '61091000',
        cest: null,
        origem_mercadoria: 0,
        peso_bruto_kg: 1.5,
        peso_liquido_kg: 1.2,
        dimensoes_cm: { altura: 10, largura: 20, comprimento: 30 },
        ativo: true,
        destaque: true,
        permite_avaliacao: true,
        meta_title: 'Meta Title',
        meta_description: 'Meta Description',
        publicado_em: new Date('2024-01-01'),
        status: 'ATIVO',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-15'),
        categoria: { id: 'cat-1', nome: 'Categoria Teste', slug: 'categoria-teste' },
        variacoes: [
          {
            id: 'var-1',
            sku: 'VAR-001',
            nome: 'Vermelho / P',
            codigo_barras: null,
            preco_cents: 9990,
            custo_cents: 3000,
            peso_bruto_kg: 0.3,
            peso_liquido_kg: 0.25,
            dimensoes_cm: { altura: 5, largura: 10, comprimento: 15 },
            ativo: true,
            ordem_exibicao: 1,
            atributos: [
              { atributo_id: 'attr-1', nome: 'Cor', valor: 'Vermelho' },
              { atributo_id: 'attr-2', nome: 'Tamanho', valor: 'P' },
            ],
            imagens: [{ url: 'img1.jpg', alt_text: 'Imagem 1', principal: true, ordem: 1 }],
          },
        ],
        imagens: [{ url: 'img-main.jpg', alt_text: 'Principal', principal: true, ordem: 1 }],
        _count: { variacoes: 1, imagens: 1 },
      };

      const result = serializeProduto(mockProduto);

      expect(result.id).toBe('prod-1');
      expect(result.nome).toBe('Produto Teste');
      expect(result.slug).toBe('produto-teste');
      expect(result.preco_cents).toBeNull();
      expect(result.custo_cents).toBeNull();
      expect(result.peso_bruto_kg).toBe(1.5);
      expect(result.peso_liquido_kg).toBe(1.2);
      expect(result.categoria?.nome).toBe('Categoria Teste');
      expect(result.variacoes).toHaveLength(1);
      expect(result.variacoes[0].nome).toBe('Vermelho / P');
      expect(result.variacoes[0].preco_cents).toBe(9990);
      expect(result.variacoes[0].atributos).toHaveLength(2);
      expect(result.variacoes[0].atributos[0].nome).toBe('Cor');
      expect(result.variacoes[0].atributos[0].valor).toBe('Vermelho');
      expect(result.imagens).toHaveLength(1);
      expect(result.imagens[0].principal).toBe(true);
    });

    it('should handle null numeric values', () => {
      const mockProduto = {
        id: 'prod-1',
        peso_bruto_kg: null,
        peso_liquido_kg: null,
        preco_cents: null,
        custo_cents: null,
        variacoes: [],
        imagens: [],
      };

      const result = serializeProduto(mockProduto);
      expect(result.peso_bruto_kg).toBeNull();
      expect(result.peso_liquido_kg).toBeNull();
    });

    it('should convert Decimal to number', () => {
      const mockProduto = {
        id: 'prod-1',
        peso_bruto_kg: 1.5,
        peso_liquido_kg: 1.2,
        variacoes: [
          {
            preco_cents: 9990,
            custo_cents: 3000,
            peso_bruto_kg: 0.3,
            peso_liquido_kg: 0.25,
          },
        ],
        imagens: [],
      };

      const result = serializeProduto(mockProduto);
      expect(typeof result.peso_bruto_kg).toBe('number');
      expect(typeof result.variacoes[0].preco_cents).toBe('number');
    });
  });
});
