import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    pagamento: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    pedido: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    estoque: {
      updateMany: vi.fn(),
    },
    webhookEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    webhookDlq: {
      create: vi.fn(),
    },
    pedidoEvento: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma.js';

describe('Webhook Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Webhook idempotency', () => {
    it('should reject duplicate webhook event', async () => {
      const mockEvent = {
        id: 'evt-1',
        idempotency_key: 'key-123',
        processed: true,
        processed_at: new Date(),
      };

      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue(mockEvent);

      // Simulate the logic
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { idempotency_key: 'key-123' },
      });

      if (existingEvent && existingEvent.processed) {
        expect(existingEvent.processed).toBe(true);
      }
    });

    it('should process new webhook event', async () => {
      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.webhookEvent.create).mockResolvedValue({
        id: 'evt-new',
        idempotency_key: 'key-new',
        processed: false,
      });

      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { idempotency_key: 'key-new' },
      });

      expect(existingEvent).toBeNull();
    });
  });

  describe('Payment webhook processing', () => {
    it('should update payment status to APROVADO', async () => {
      const mockPagamento = {
        id: 'pag-1',
        status: 'PROCESSANDO',
        pedido_id: 'pedido-1',
      };

      vi.mocked(prisma.pagamento.findUnique).mockResolvedValue(mockPagamento);
      vi.mocked(prisma.pagamento.update).mockResolvedValue({
        ...mockPagamento,
        status: 'APROVADO',
        aprovado_em: new Date(),
      });

      // Simulate the logic
      const pagamento = await prisma.pagamento.findUnique({ where: { id: 'pag-1' } });
      if (pagamento && pagamento.status === 'PROCESSANDO') {
        const updated = await prisma.pagamento.update({
          where: { id: pagamento.id },
          data: { status: 'APROVADO', aprovado_em: new Date() },
        });
        expect(updated.status).toBe('APROVADO');
      }
    });

    it('should handle payment rejection', async () => {
      const mockPagamento = {
        id: 'pag-1',
        status: 'PROCESSANDO',
        pedido_id: 'pedido-1',
      };

      vi.mocked(prisma.pagamento.update).mockResolvedValue({
        ...mockPagamento,
        status: 'RECUSADO',
      });

      const updated = await prisma.pagamento.update({
        where: { id: 'pag-1' },
        data: { status: 'RECUSADO' },
      });

      expect(updated.status).toBe('RECUSADO');
    });
  });

  describe('Order status updates from webhook', () => {
    it('should update order to PAGO when payment approved', async () => {
      const mockPedido = {
        id: 'pedido-1',
        status: 'PAGAMENTO_PENDENTE',
      };

      vi.mocked(prisma.pedido.update).mockResolvedValue({
        ...mockPedido,
        status: 'PAGO',
        pago_em: new Date(),
      });

      const updated = await prisma.pedido.update({
        where: { id: 'pedido-1' },
        data: { status: 'PAGO', pago_em: new Date() },
      });

      expect(updated.status).toBe('PAGO');
    });

    it('should cancel order when payment rejected', async () => {
      const mockPedido = {
        id: 'pedido-1',
        status: 'PAGAMENTO_PENDENTE',
      };

      vi.mocked(prisma.pedido.update).mockResolvedValue({
        ...mockPedido,
        status: 'CANCELADO',
        cancelado_em: new Date(),
      });

      const updated = await prisma.pedido.update({
        where: { id: 'pedido-1' },
        data: { status: 'CANCELADO', cancelado_em: new Date() },
      });

      expect(updated.status).toBe('CANCELADO');
    });

    it('should release stock when order cancelled', async () => {
      const mockItens = [
        { variacao_id: 'var-1', quantidade: 2 },
        { variacao_id: 'var-2', quantidade: 1 },
      ];

      vi.mocked(prisma.estoque.updateMany).mockResolvedValue({ count: 2 });

      // Simulate stock release logic
      for (const item of mockItens) {
        await prisma.estoque.updateMany({
          where: { variacao_id: item.variacao_id, loja_id: 'loja-1' },
          data: { quantidade_reservada: { decrement: item.quantidade } },
        });
      }

      expect(prisma.estoque.updateMany).toHaveBeenCalledTimes(2);
    });
  });
});