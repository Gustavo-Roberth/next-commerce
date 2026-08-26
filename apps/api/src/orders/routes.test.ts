import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { serializePedido } from './routes.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    pedido: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    itemPedido: {
      findMany: vi.fn(),
    },
    estoque: {
      updateMany: vi.fn(),
    },
    pagamento: {
      update: vi.fn(),
    },
    pedidoEvento: {
      create: vi.fn(),
    },
  },
}));

describe('Order Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('serializePedido', () => {
    it('should serialize order with items and payments', () => {
      const mockPedido = {
        id: 'pedido-1',
        loja_id: 'loja-1',
        cliente_id: 'user-1',
        numero_sequencial: 1,
        status: 'PAGO',
        subtotal_cents: 10000,
        desconto_cents: 1000,
        frete_cents: 2000,
        total_cents: 11000,
        cupom_id: null,
        endereco_entrega_id: 'end-1',
        endereco_cobranca_id: 'end-1',
        observacoes_cliente: null,
        observacoes_internas: null,
        pago_em: new Date('2024-01-15'),
        enviado_em: null,
        entregue_em: null,
        cancelado_em: null,
        cancelamento_motivo: null,
        created_at: new Date('2024-01-10'),
        updated_at: new Date('2024-01-15'),
        itens: [
          {
            id: 'item-1',
            pedido_id: 'pedido-1',
            produto_id: 'prod-1',
            variacao_id: 'var-1',
            nome_produto: 'Produto Teste',
            sku: 'SKU-001',
            quantidade: 2,
            preco_unitario_cents: 5000,
            total_cents: 10000,
          },
        ],
        endereco_entrega: {
          id: 'end-1',
          cep: '01000-000',
          logradouro: 'Rua Teste',
          numero: '123',
          complemento: 'Apto 1',
          bairro: 'Centro',
          cidade: 'São Paulo',
          uf: 'SP',
        },
        endereco_cobranca: {
          id: 'end-1',
          cep: '01000-000',
          logradouro: 'Rua Teste',
          numero: '123',
          complemento: 'Apto 1',
          bairro: 'Centro',
          cidade: 'São Paulo',
          uf: 'SP',
        },
        cupom: null,
        pagamentos: [
          {
            id: 'pag-1',
            gateway: 'MERCADO_PAGO',
            metodo: 'PIX',
            status: 'APROVADO',
            valor_cents: 11000,
            parcelas: 1,
            juros_cents: 0,
            gateway_transaction_id: 'mp-123',
            aprovado_em: new Date('2024-01-15'),
            estornado_em: null,
          },
        ],
        eventos: [
          {
            id: 'evt-1',
            tipo: 'STATUS_ALTERADO',
            descricao: 'Status alterado de CRIADO para PAGO',
            created_at: new Date('2024-01-15'),
          },
        ],
      };

      const result = serializePedido(mockPedido);

      expect(result.id).toBe('pedido-1');
      expect(result.numero_sequencial).toBe(1);
      expect(result.status).toBe('PAGO');
      expect(result.subtotal_cents).toBe(10000);
      expect(result.desconto_cents).toBe(1000);
      expect(result.frete_cents).toBe(2000);
      expect(result.total_cents).toBe(11000);
      expect(result.itens).toHaveLength(1);
      expect(result.itens[0].preco_unitario_cents).toBe(5000);
      expect(result.itens[0].total_cents).toBe(10000);
      expect(result.pagamentos).toHaveLength(1);
      expect(result.pagamentos[0].status).toBe('APROVADO');
      expect(result.eventos).toHaveLength(1);
    });

    it('should handle null payments', () => {
      const mockPedido = {
        id: 'pedido-1',
        pagamentos: null,
        itens: [],
        endereco_entrega: null,
        endereco_cobranca: null,
        cupom: null,
        eventos: [],
      };

      const result = serializePedido(mockPedido);
      expect(result.pagamentos).toBeNull();
    });

    it('should convert Decimal to number', () => {
      const mockPedido = {
        id: 'pedido-1',
        subtotal_cents: 10000,
        desconto_cents: 0,
        frete_cents: 2000,
        total_cents: 12000,
        itens: [
          {
            preco_unitario_cents: 5000,
            total_cents: 10000,
          },
        ],
        pagamentos: [
          {
            valor_cents: 12000,
            juros_cents: 0,
          },
        ],
      };

      const result = serializePedido(mockPedido);
      expect(typeof result.subtotal_cents).toBe('number');
      expect(typeof result.itens[0].preco_unitario_cents).toBe('number');
      expect(typeof result.pagamentos[0].valor_cents).toBe('number');
    });
  });
});
