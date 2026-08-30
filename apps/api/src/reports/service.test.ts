import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryRawUnsafe = vi.fn();
const reportScheduleCreate = vi.fn();
const reportScheduleFindMany = vi.fn();
const reportScheduleFindFirst = vi.fn();
const reportScheduleDeleteMany = vi.fn();
const reportScheduleUpdate = vi.fn();
const enviarEmail = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    $queryRawUnsafe: (...args: unknown[]) => queryRawUnsafe(...args),
    reportSchedule: {
      create: (...args: unknown[]) => reportScheduleCreate(...args),
      findMany: (...args: unknown[]) => reportScheduleFindMany(...args),
      findFirst: (...args: unknown[]) => reportScheduleFindFirst(...args),
      deleteMany: (...args: unknown[]) => reportScheduleDeleteMany(...args),
      update: (...args: unknown[]) => reportScheduleUpdate(...args),
    },
  },
}));

vi.mock('../providers/email.provider.js', () => ({
  emailProvider: { enviar: (...args: unknown[]) => enviarEmail(...args) },
}));

import {
  calcularProximoEnvio,
  enviarAgendamento,
  gerarCsv,
  gerarPdf,
  obterRelatorio,
  processarAgendamentosVencidos,
} from './service.js';

describe('obterRelatorio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna vendas diário normalizado', async () => {
    queryRawUnsafe.mockResolvedValue([
      {
        data: new Date('2026-01-01T00:00:00.000Z'),
        loja_id: 'loja-1',
        pedidos_count: 2,
        itens_count: 5,
        receita_bruta_cents: 10000,
        desconto_cents: 0,
        frete_cents: 500,
        receita_liquida_cents: 10500,
        ticket_medio_cents: 5250,
      },
    ]);

    const relatorio = await obterRelatorio('vendas-diario', 'loja-1', { limit: 100 });

    expect(relatorio.titulo).toBe('Vendas Diário');
    expect(relatorio.linhas).toHaveLength(1);
    expect(relatorio.linhas[0]?.data).toBe('2026-01-01T00:00:00.000Z');
    expect(relatorio.colunas.some((c) => c.chave === 'receita_liquida_cents')).toBe(true);
  });

  it('retorna estoque baixo sem filtro de datas', async () => {
    queryRawUnsafe.mockResolvedValue([
      {
        loja_id: 'loja-1',
        deposito_id: 'd1',
        variacao_id: 'v1',
        sku: 'SKU1',
        nome: 'Produto',
        quantidade_fisica: 1,
        quantidade_reservada: 0,
        disponivel: 1,
        minima: 5,
      },
    ]);

    const relatorio = await obterRelatorio('estoque-baixo', 'loja-1', { limit: 100 });
    expect(relatorio.linhas[0]?.sku).toBe('SKU1');
    expect(relatorio.colunas.some((c) => c.chave === 'disponivel')).toBe(true);
  });
});

describe('gerarCsv', () => {
  it('gera cabeçalho e linhas formatadas em BRL', async () => {
    queryRawUnsafe.mockResolvedValue([
      {
        data: new Date('2026-01-01T00:00:00.000Z'),
        loja_id: 'loja-1',
        pedidos_count: 1,
        itens_count: 1,
        receita_bruta_cents: 10000,
        desconto_cents: 0,
        frete_cents: 0,
        receita_liquida_cents: 10000,
        ticket_medio_cents: 10000,
      },
    ]);
    const relatorio = await obterRelatorio('vendas-diario', 'loja-1', { limit: 100 });
    const csv = gerarCsv(relatorio);
    const linhas = csv.split('\n');
    expect(linhas[0]).toContain('Receita Líquida');
    expect(linhas[1]).toContain('R$');
    expect(linhas[1]).toContain('100,00');
  });
});

describe('gerarPdf', () => {
  it('retorna um buffer não vazio', async () => {
    queryRawUnsafe.mockResolvedValue([
      {
        data: new Date('2026-01-01T00:00:00.000Z'),
        loja_id: 'loja-1',
        pedidos_count: 1,
        itens_count: 1,
        receita_bruta_cents: 10000,
        desconto_cents: 0,
        frete_cents: 0,
        receita_liquida_cents: 10000,
        ticket_medio_cents: 10000,
      },
    ]);
    const relatorio = await obterRelatorio('vendas-diario', 'loja-1', { limit: 100 });
    const pdf = await gerarPdf(relatorio);
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(100);
  });
});

describe('calcularProximoEnvio', () => {
  it('DIARIO agenda para o próximo dia quando horário já passou', () => {
    const base = new Date('2026-01-01T10:00:00');
    const proximo = calcularProximoEnvio({ frequencia: 'DIARIO', hora: 6, from: base });
    expect(proximo?.getDate()).toBe(2);
    expect(proximo?.getHours()).toBe(6);
  });

  it('SEMANAL agenda para o dia da semana alvo', () => {
    const base = new Date('2026-01-01T10:00:00'); // quinta (4)
    const proximo = calcularProximoEnvio({
      frequencia: 'SEMANAL',
      hora: 8,
      dia_semana: 1,
      from: base,
    });
    expect(proximo?.getDay()).toBe(1); // segunda
  });

  it('MENSAL agenda para o dia do mês alvo', () => {
    const base = new Date('2026-01-15T10:00:00');
    const proximo = calcularProximoEnvio({
      frequencia: 'MENSAL',
      hora: 7,
      dia_mes: 10,
      from: base,
    });
    expect(proximo?.getDate()).toBe(10);
    expect(proximo?.getMonth()).toBe(1); // fevereiro
  });
});

describe('enviarAgendamento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRawUnsafe.mockResolvedValue([
      {
        data: new Date('2026-01-01T00:00:00.000Z'),
        loja_id: 'loja-1',
        pedidos_count: 1,
        itens_count: 1,
        receita_bruta_cents: 10000,
        desconto_cents: 0,
        frete_cents: 0,
        receita_liquida_cents: 10000,
        ticket_medio_cents: 10000,
      },
    ]);
  });

  it('gera CSV e envia por e-mail, registrando o envio', async () => {
    await enviarAgendamento({
      id: 'sched-1',
      loja_id: 'loja-1',
      tipo: 'vendas-diario',
      formato: 'CSV',
      email_destino: 'gestor@exemplo.com',
      frequencia: 'DIARIO',
      hora: 6,
    });

    expect(enviarEmail).toHaveBeenCalledTimes(1);
    const chamada = enviarEmail.mock.calls[0]?.[0] as {
      to: string;
      attachments: { filename: string }[];
    };
    expect(chamada.to).toBe('gestor@exemplo.com');
    expect(chamada.attachments[0]?.filename).toContain('.csv');
    expect(reportScheduleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sched-1' },
        data: expect.objectContaining({ ultimo_envio_em: expect.any(Date) }),
      })
    );
  });

  it('gera PDF quando formato é PDF', async () => {
    await enviarAgendamento({
      id: 'sched-2',
      loja_id: 'loja-1',
      tipo: 'produtos-top',
      formato: 'PDF',
      email_destino: 'gestor@exemplo.com',
      frequencia: 'MENSAL',
      hora: 7,
      dia_mes: 10,
    });
    const chamada = enviarEmail.mock.calls[0]?.[0] as {
      attachments: { filename: string; contentType: string }[];
    };
    expect(chamada.attachments[0]?.filename).toContain('.pdf');
    expect(chamada.attachments[0]?.contentType).toBe('application/pdf');
  });
});

describe('processarAgendamentosVencidos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRawUnsafe.mockResolvedValue([]);
  });

  it('envia apenas agendamentos vencidos e ativos', async () => {
    reportScheduleFindMany.mockResolvedValue([
      {
        id: 'sched-1',
        loja_id: 'loja-1',
        tipo: 'vendas-diario',
        formato: 'CSV',
        email_destino: 'a@exemplo.com',
        frequencia: 'DIARIO',
        hora: 6,
      },
    ]);
    const enviados = await processarAgendamentosVencidos();
    expect(enviados).toBe(1);
    expect(enviarEmail).toHaveBeenCalledTimes(1);
  });
});
