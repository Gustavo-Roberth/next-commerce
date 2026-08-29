import { EstoqueMovimentoTipo } from '@/generated/prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inventariar, registrarMovimento, reservar, transferir } from './service.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {},
}));

function criarTx(estoquesIniciais: Array<Record<string, unknown>> = []) {
  const estoques = new Map<string, Record<string, unknown>>();
  for (const e of estoquesIniciais) {
    estoques.set(`${e.variacao_id}:${e.deposito_id}`, { ...e });
  }
  const movimentos: Array<Record<string, unknown>> = [];

  const findUnique = vi.fn(
    async ({
      where,
    }: {
      where: {
        variacao_id_deposito_id?: { variacao_id: string; deposito_id: string };
        id?: string;
      };
    }) => {
      if (where.variacao_id_deposito_id) {
        return (
          estoques.get(
            `${where.variacao_id_deposito_id.variacao_id}:${where.variacao_id_deposito_id.deposito_id}`
          ) ?? null
        );
      }
      return null;
    }
  );

  const findUniqueById = vi.fn(async ({ where }: { where: { id: string } }) => {
    for (const e of estoques.values()) if (e.id === where.id) return e;
    return null;
  });

  const createEstoque = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
    const id = `est-${estoques.size + 1}`;
    const rec = {
      id,
      quantidade_fisica: 0,
      quantidade_reservada: 0,
      quantidade_minima: 0,
      custo_medio_cents: 0,
      ...data,
    };
    estoques.set(`${data.variacao_id}:${data.deposito_id}`, rec);
    return rec;
  });

  const updateEstoque = vi.fn(
    async ({
      where,
      data,
    }: {
      where: {
        id?: string;
        variacao_id_deposito_id?: { variacao_id: string; deposito_id: string };
      };
      data: Record<string, unknown>;
    }) => {
      let rec: Record<string, unknown> | undefined;
      if (where.id) rec = await findUniqueById({ where });
      else if (where.variacao_id_deposito_id)
        rec = estoques.get(
          `${where.variacao_id_deposito_id.variacao_id}:${where.variacao_id_deposito_id.deposito_id}`
        );
      if (!rec) throw new Error('Estoque não encontrado');
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === 'object' && 'increment' in (v as Record<string, unknown>)) {
          rec[k] = (rec[k] as number) + (v as { increment: number }).increment;
        } else if (v && typeof v === 'object' && 'decrement' in (v as Record<string, unknown>)) {
          const d = (v as { decrement: number }).decrement;
          rec[k] = Math.max(0, (rec[k] as number) - d);
        } else {
          rec[k] = v as unknown;
        }
      }
      return rec;
    }
  );

  const createMovimento = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
    const rec = { id: `mov-${movimentos.length + 1}`, ...data };
    movimentos.push(rec);
    return rec;
  });

  const tx = {
    estoque: { findUnique, create: createEstoque, update: updateEstoque },
    estoqueMovimento: { create: createMovimento },
  };
  return { tx, estoques, movimentos, findUnique, updateEstoque, createMovimento };
}

const LOJA = 'loja-1';

describe('Stock Service', () => {
  let ctx: ReturnType<typeof criarTx>;
  beforeEach(() => {
    ctx = criarTx([
      {
        id: 'e1',
        loja_id: LOJA,
        variacao_id: 'v1',
        deposito_id: 'd1',
        quantidade_fisica: 10,
        quantidade_reservada: 2,
        quantidade_minima: 0,
        custo_medio_cents: 500,
      },
      {
        id: 'e2',
        loja_id: LOJA,
        variacao_id: 'v1',
        deposito_id: 'd2',
        quantidade_fisica: 0,
        quantidade_reservada: 0,
        quantidade_minima: 0,
        custo_medio_cents: 0,
      },
    ]);
  });

  it('registra entrada de compra e recalcula custo médio', async () => {
    await registrarMovimento(ctx.tx, LOJA, {
      variacao_id: 'v1',
      deposito_id: 'd1',
      tipo: EstoqueMovimentoTipo.ENTRADA_COMPRA,
      quantidade: 10,
      custo_unitario_cents: 1000,
      referencia_tipo: 'NOTA_COMPRA',
    });
    const estoque = ctx.estoques.get('v1:d1');
    expect(estoque?.quantidade_fisica).toBe(20);
    expect(estoque?.custo_medio_cents).toBe(750);
    expect(ctx.movimentos).toHaveLength(1);
  });

  it('lança erro ao reservar estoque insuficiente', async () => {
    await expect(
      registrarMovimento(ctx.tx, LOJA, {
        variacao_id: 'v1',
        deposito_id: 'd1',
        tipo: EstoqueMovimentoTipo.RESERVA,
        quantidade: 100,
        referencia_tipo: 'PEDIDO',
      })
    ).rejects.toThrow('Estoque insuficiente para reserva');
  });

  it('reserva com sucesso quando há disponível', async () => {
    await reservar(ctx.tx, LOJA, { variacao_id: 'v1', deposito_id: 'd1', quantidade: 5 });
    const estoque = ctx.estoques.get('v1:d1');
    expect(estoque?.quantidade_reservada).toBe(7);
    expect(ctx.movimentos.at(-1)?.tipo).toBe('RESERVA');
  });

  it('transfere entre depósitos criando dois movimentos', async () => {
    await transferir(ctx.tx, LOJA, 'user-1', {
      variacao_id: 'v1',
      deposito_origem_id: 'd1',
      deposito_destino_id: 'd2',
      quantidade: 4,
    });
    expect(ctx.estoques.get('v1:d1')?.quantidade_fisica).toBe(6);
    expect(ctx.estoques.get('v1:d2')?.quantidade_fisica).toBe(4);
    expect(ctx.movimentos).toHaveLength(2);
    expect(ctx.movimentos.map((m) => m.tipo)).toContain('TRANSFERENCIA_SAIDA');
    expect(ctx.movimentos.map((m) => m.tipo)).toContain('TRANSFERENCIA_ENTRADA');
  });

  it('inventário ajusta quantidade física e gera ajuste', async () => {
    await inventariar(ctx.tx, LOJA, 'user-1', {
      deposito_id: 'd1',
      itens: [{ variacao_id: 'v1', quantidade_contada: 3 }],
      observacao: 'contagem',
    });
    expect(ctx.estoques.get('v1:d1')?.quantidade_fisica).toBe(3);
    expect(ctx.movimentos.at(-1)?.tipo).toBe('SAIDA_AJUSTE');
  });
});
