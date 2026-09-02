import { beforeEach, describe, expect, it, vi } from 'vitest';

const cupomFindFirst = vi.fn();
const pedidoCount = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    cupom: { findFirst: (...args: unknown[]) => cupomFindFirst(...args) },
    pedido: { count: (...args: unknown[]) => pedidoCount(...args) },
  },
}));

import { validarCupom } from './service.js';

function cupomBase(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    codigo: 'promo10',
    nome: 'Promo 10',
    tipo: 'PERCENTUAL',
    valor: 10,
    valor_minimo_pedido_cents: 0,
    uso_maximo_total: null,
    uso_maximo_por_cliente: null,
    valido_de: new Date('2020-01-01').toISOString(),
    valido_ate: new Date('2030-01-01').toISOString(),
    categorias_aplicaveis: [],
    produtos_aplicaveis: [],
    primeira_compra_only: false,
    ativo: true,
    status: 'ATIVO',
    uso_atual: 0,
    ...overrides,
  };
}

describe('cupomService.validarCupom', () => {
  beforeEach(() => vi.clearAllMocks());

  it('aceita cupom percentual válido e calcula desconto', async () => {
    cupomFindFirst.mockResolvedValue(cupomBase());
    pedidoCount.mockResolvedValue(0);

    const r = await validarCupom('loja-1', {
      codigo: 'PROMO10',
      cliente_id: 'cli-1',
      subtotal_cents: 10000,
      categorias: [],
      produtos: [],
    });

    expect(r.valido).toBe(true);
    expect(r.desconto_cents).toBe(1000);
    expect(r.tipo).toBe('PERCENTUAL');
  });

  it('rejeita cupom inexistente', async () => {
    cupomFindFirst.mockResolvedValue(null);
    const r = await validarCupom('loja-1', { codigo: 'NOPE', subtotal_cents: 1000 });
    expect(r.valido).toBe(false);
    expect(r.mensagem).toMatch(/inválido|inativo/i);
  });

  it('normaliza código para minúsculas na busca', async () => {
    cupomFindFirst.mockResolvedValue(cupomBase());
    pedidoCount.mockResolvedValue(0);
    await validarCupom('loja-1', { codigo: 'Promo10', subtotal_cents: 1000 });
    expect(cupomFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ codigo: 'promo10' }) })
    );
  });

  it('rejeita cupom fora da vigência', async () => {
    cupomFindFirst.mockResolvedValue(
      cupomBase({ valido_ate: new Date('2020-01-01').toISOString() })
    );
    const r = await validarCupom('loja-1', { codigo: 'PROMO10', subtotal_cents: 1000 });
    expect(r.valido).toBe(false);
    expect(r.mensagem).toMatch(/validade/i);
  });

  it('rejeita abaixo do valor mínimo', async () => {
    cupomFindFirst.mockResolvedValue(cupomBase({ valor_minimo_pedido_cents: 5000 }));
    const r = await validarCupom('loja-1', { codigo: 'PROMO10', subtotal_cents: 1000 });
    expect(r.valido).toBe(false);
    expect(r.mensagem).toMatch(/mínimo/i);
  });

  it('rejeita quando atingido o uso máximo total', async () => {
    cupomFindFirst.mockResolvedValue(cupomBase({ uso_maximo_total: 5, uso_atual: 5 }));
    const r = await validarCupom('loja-1', { codigo: 'PROMO10', subtotal_cents: 10000 });
    expect(r.valido).toBe(false);
    expect(r.mensagem).toMatch(/esgotado/i);
  });
});
