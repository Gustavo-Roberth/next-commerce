import { beforeEach, describe, expect, it, vi } from 'vitest';

const findMany = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  prisma: { configuracaoFrete: { findMany: (...args: unknown[]) => findMany(...args) } },
}));

import { calcularFrete } from './service.js';

describe('freteService.calcularFrete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prioriza frete grátis por valor e ordena por prioridade', async () => {
    findMany.mockResolvedValue([
      {
        id: 'f1',
        nome: 'Grátis acima de R$100',
        tipo: 'GRATIS_VALOR',
        configuracao: { valor_minimo_cents: 10000 },
        prioridade: 1,
        ativo: true,
      },
      {
        id: 'f2',
        nome: 'Correios',
        tipo: 'CORREIOS',
        configuracao: { valor_cents: 2000, prazo_dias: 5 },
        prioridade: 2,
        ativo: true,
      },
    ]);

    const opcoes = await calcularFrete('loja-1', {
      cep_destino: '01000000',
      subtotal_cents: 15000,
      itens_kg: 1,
    });

    expect(opcoes).toHaveLength(2);
    expect(opcoes[0].id).toBe('f1');
    expect(opcoes[0].valor_cents).toBe(0);
    expect(opcoes[1].id).toBe('f2');
    expect(opcoes[1].valor_cents).toBe(2000);
  });

  it('oculta frete grátis por valor quando subtotal insuficiente', async () => {
    findMany.mockResolvedValue([
      {
        id: 'f1',
        nome: 'Grátis acima de R$100',
        tipo: 'GRATIS_VALOR',
        configuracao: { valor_minimo_cents: 10000 },
        prioridade: 1,
        ativo: true,
      },
    ]);

    const opcoes = await calcularFrete('loja-1', {
      cep_destino: '01000000',
      subtotal_cents: 5000,
      itens_kg: 1,
    });

    expect(opcoes).toHaveLength(0);
  });

  it('usa tabela de preço por faixa de peso', async () => {
    findMany.mockResolvedValue([
      {
        id: 'f1',
        nome: 'Transportadora',
        tipo: 'TABELA_PRECO',
        configuracao: {
          faixas: [
            { ate_kg: 5, valor_cents: 1000, prazo_dias: 3 },
            { ate_kg: 10, valor_cents: 1800, prazo_dias: 4 },
          ],
        },
        prioridade: 1,
        ativo: true,
      },
    ]);

    const opcoes = await calcularFrete('loja-1', {
      cep_destino: '01000000',
      subtotal_cents: 5000,
      peso_kg: 7,
    });

    expect(opcoes).toHaveLength(1);
    expect(opcoes[0].valor_cents).toBe(1800);
    expect(opcoes[0].prazo_dias).toBe(4);
  });

  it('aplica frete grátis por região (faixa de CEP)', async () => {
    findMany.mockResolvedValue([
      {
        id: 'f1',
        nome: 'Grátis Capital',
        tipo: 'GRATIS_REGIAO',
        configuracao: { regioes: [{ cep_inicio: '01000000', cep_fim: '05999999' }] },
        prioridade: 1,
        ativo: true,
      },
    ]);

    const opcoes = await calcularFrete('loja-1', {
      cep_destino: '01310100',
      subtotal_cents: 5000,
      itens_kg: 1,
    });

    expect(opcoes).toHaveLength(1);
    expect(opcoes[0].valor_cents).toBe(0);
  });

  it('ignora configurações inativas', async () => {
    findMany.mockResolvedValue([
      {
        id: 'f1',
        nome: 'Correios',
        tipo: 'CORREIOS',
        configuracao: { valor_cents: 2000, prazo_dias: 5 },
        prioridade: 1,
        ativo: false,
      },
    ]);

    const opcoes = await calcularFrete('loja-1', {
      cep_destino: '01000000',
      subtotal_cents: 1000,
      itens_kg: 1,
    });

    expect(opcoes).toHaveLength(0);
  });
});
