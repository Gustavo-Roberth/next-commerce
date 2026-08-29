import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NfeProvider } from '../providers/nfe.provider.js';

const pedidoFindFirst = vi.fn();
const notaFiscalUpsert = vi.fn();
const pedidoEventoCreate = vi.fn();
const uploadFile = vi.fn();
const createSignedUrl = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    pedido: { findFirst: (...args: unknown[]) => pedidoFindFirst(...args) },
    notaFiscal: { upsert: (...args: unknown[]) => notaFiscalUpsert(...args) },
    pedidoEvento: { create: (...args: unknown[]) => pedidoEventoCreate(...args) },
  },
}));

vi.mock('../providers/storage.provider.js', () => ({
  STORAGE_BUCKETS: { NFE_XML: 'nfe-xml', NFE_PDF: 'nfe-pdf' },
  uploadFile: (...args: unknown[]) => uploadFile(...args),
  createSignedUrl: (...args: unknown[]) => createSignedUrl(...args),
}));

import { emitirNotaFiscalPedido, mapearNotaFiscalResposta } from './service.js';

const lojaId = 'loja-1';
const pedidoId = 'pedido-1';

function pedidoFake() {
  return {
    id: pedidoId,
    loja_id: lojaId,
    frete_cents: 1000,
    desconto_cents: 0,
    loja: { nome: 'Loja Teste' },
    cliente: {
      nome_completo: 'Cliente Exemplo',
      cpf_cnpj: '12345678901',
      email: 'cliente@exemplo.com',
    },
    endereco_entrega: {
      logradouro: 'Rua A',
      numero: '10',
      complemento: null,
      bairro: 'Centro',
      cidade: 'Cidade',
      uf: 'SP',
      cep: '01001000',
    },
    itens: [
      {
        sku: 'SKU1',
        nome_produto: 'Produto 1',
        quantidade: 2,
        preco_unitario_cents: 500,
        produto: { ncm: '12345678' },
      },
    ],
  };
}

describe('emitirNotaFiscalPedido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pedidoFindFirst.mockResolvedValue(pedidoFake());
    uploadFile.mockImplementation(async (args: { path: string }) =>
      Promise.resolve({ path: args.path })
    );
  });

  it('emite com sucesso e persiste EMITIDA', async () => {
    const provider: NfeProvider = {
      emitir: async () => ({
        chave_acesso: 'chave123',
        numero: '1',
        serie: '1',
        xml: '<xml/>',
        pdf: 'cGRmYmFzZTY0',
        protocolo: 'proto',
      }),
    };

    await emitirNotaFiscalPedido(pedidoId, lojaId, 'usuario-1', provider);

    expect(uploadFile).toHaveBeenCalledTimes(2);
    expect(notaFiscalUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pedido_id: pedidoId },
        create: expect.objectContaining({
          pedido_id: pedidoId,
          chave_acesso: 'chave123',
          status: 'EMITIDA',
          xml_url: `${lojaId}/${pedidoId}.xml`,
          pdf_url: `${lojaId}/${pedidoId}.pdf`,
        }),
        update: expect.objectContaining({ status: 'EMITIDA', chave_acesso: 'chave123' }),
      })
    );
    expect(pedidoEventoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tipo: 'NFE_EMITIDA' }) })
    );
  });

  it('registra ERRO quando o provedor falha', async () => {
    const provider: NfeProvider = {
      emitir: async () => {
        throw new Error('Provedor indisponível');
      },
    };

    await expect(emitirNotaFiscalPedido(pedidoId, lojaId, 'usuario-1', provider)).rejects.toThrow(
      'Provedor indisponível'
    );

    expect(notaFiscalUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: 'ERRO', erro_mensagem: 'Provedor indisponível' }),
        update: expect.objectContaining({ status: 'ERRO' }),
      })
    );
    expect(pedidoEventoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tipo: 'NFE_ERRO' }) })
    );
  });

  it('lança erro se o pedido não existir', async () => {
    pedidoFindFirst.mockResolvedValue(null);
    const provider: NfeProvider = {
      emitir: async () => ({
        chave_acesso: 'x',
        numero: '1',
        serie: '1',
        xml: '<xml/>',
        pdf: 'pdf',
        protocolo: 'p',
      }),
    };

    await expect(emitirNotaFiscalPedido(pedidoId, lojaId, 'usuario-1', provider)).rejects.toThrow(
      'Pedido não encontrado'
    );
  });
});

describe('mapearNotaFiscalResposta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSignedUrl.mockResolvedValue('https://assinada/xml');
  });

  it('resolve urls assinadas e serializa datas', async () => {
    const resultado = await mapearNotaFiscalResposta({
      id: 'nf-1',
      pedido_id: pedidoId,
      numero: '1',
      serie: '1',
      chave_acesso: 'chave',
      xml_url: 'nfe-xml/loja/p.xml',
      pdf_url: 'nfe-pdf/loja/p.pdf',
      status: 'EMITIDA',
      erro_mensagem: null,
      emitida_em: new Date('2026-01-01T10:00:00.000Z'),
      autorizada_em: null,
      cancelada_em: null,
      created_at: new Date('2026-01-01T10:00:00.000Z'),
      updated_at: new Date('2026-01-01T10:00:00.000Z'),
    });

    expect(resultado.xml_url).toBe('https://assinada/xml');
    expect(resultado.pdf_url).toBe('https://assinada/xml');
    expect(resultado.status).toBe('EMITIDA');
    expect(resultado.emitida_em).toBe('2026-01-01T10:00:00.000Z');
  });

  it('retorna null para urls quando não há path', async () => {
    const resultado = await mapearNotaFiscalResposta({
      id: 'nf-2',
      pedido_id: pedidoId,
      numero: null,
      serie: null,
      chave_acesso: null,
      xml_url: null,
      pdf_url: null,
      status: 'ERRO',
      erro_mensagem: 'falhou',
      emitida_em: null,
      autorizada_em: null,
      cancelada_em: null,
      created_at: new Date('2026-01-01T10:00:00.000Z'),
      updated_at: new Date('2026-01-01T10:00:00.000Z'),
    });

    expect(resultado.xml_url).toBeNull();
    expect(resultado.pdf_url).toBeNull();
    expect(resultado.erro_mensagem).toBe('falhou');
  });
});
