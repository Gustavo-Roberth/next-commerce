import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const upsert = vi.fn();
const findMany = vi.fn();
const findFirst = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    configuracaoPagamento: {
      upsert: (...args: unknown[]) => upsert(...args),
      findMany: (...args: unknown[]) => findMany(...args),
      findFirst: (...args: unknown[]) => findFirst(...args),
    },
  },
}));

import { criptografar, descriptografar } from '../lib/crypto.js';
import { buscarCredenciaisPagamento, criarPagamento, listarPagamentos } from './pagamentos.js';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
});

describe('pagamentos (credenciais criptografadas)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('criptografa credenciais ao criar e permite descriptografar', async () => {
    let capturado: { credenciais_criptografadas: string; credenciais?: unknown } | null = null;
    upsert.mockImplementation(
      async (args: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
        capturado = args.create as typeof capturado;
        return args.create;
      }
    );

    await criarPagamento('loja-1', {
      metodo: 'PIX',
      nome: 'Pix',
      credenciais: { chave: 'minha-chave-pix' },
      ativo: true,
      instrucoes: '',
    });

    expect(capturado).not.toBeNull();
    expect(
      (capturado as { credenciais_criptografadas: string }).credenciais_criptografadas
    ).toBeDefined();
    expect(
      (capturado as { credenciais_criptografadas: string }).credenciais_criptografadas
    ).not.toContain('minha-chave-pix');
    expect(capturado?.credenciais).toBeUndefined();

    const dec = descriptografar<{ chave: string }>(
      'loja-1',
      (capturado as { credenciais_criptografadas: string }).credenciais_criptografadas
    );
    expect(dec.chave).toBe('minha-chave-pix');
  });

  it('não expõe credenciais na listagem (select sem campo cripto)', async () => {
    findMany.mockResolvedValue([{ id: 'p1', metodo: 'PIX', nome: 'Pix', ativo: true }]);
    const lista = await listarPagamentos('loja-1');
    expect(lista[0]).not.toHaveProperty('credenciais_criptografadas');
  });

  it('retorna credenciais descriptografadas apenas em getCredenciais', async () => {
    findFirst.mockResolvedValue({
      id: 'p1',
      credenciais_criptografadas: criptografar('loja-1', { token: 'abc' }),
    });
    const cred = await buscarCredenciaisPagamento('loja-1', 'p1');
    expect(cred?.credenciais).toEqual({ token: 'abc' });
  });
});
