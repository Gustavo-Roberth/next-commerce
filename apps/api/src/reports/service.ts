import PDFDocument from 'pdfkit';
import { emailProvider } from '../providers/email.provider.js';
import { REPORT_TITULOS } from '../schemas/report.schemas.js';
import type {
  CreateReportScheduleInput,
  ReportFormato,
  ReportTipo,
} from '../schemas/report.schemas.js';
import {
  type ConciliacaoRow,
  type EstoqueBaixoRow,
  type ProdutoTopRow,
  type RelatorioRow,
  type VendaDiarioRow,
  buscarAgendamento,
  buscarAgendamentosVencidos,
  criarAgendamento,
  getConciliacao,
  getEstoqueBaixo,
  getProdutosTop,
  getVendasDiario,
  listarAgendamentos,
  registrarEnvio,
  removerAgendamento,
} from './repository.js';

interface ColunaRelatorio {
  chave: string;
  rotulo: string;
  formato?: 'cents' | 'date' | 'numero';
}

const COLUNAS: Record<ReportTipo, ColunaRelatorio[]> = {
  'vendas-diario': [
    { chave: 'data', rotulo: 'Data', formato: 'date' },
    { chave: 'pedidos_count', rotulo: 'Pedidos', formato: 'numero' },
    { chave: 'itens_count', rotulo: 'Itens', formato: 'numero' },
    { chave: 'receita_bruta_cents', rotulo: 'Receita Bruta', formato: 'cents' },
    { chave: 'desconto_cents', rotulo: 'Desconto', formato: 'cents' },
    { chave: 'frete_cents', rotulo: 'Frete', formato: 'cents' },
    { chave: 'receita_liquida_cents', rotulo: 'Receita Líquida', formato: 'cents' },
    { chave: 'ticket_medio_cents', rotulo: 'Ticket Médio', formato: 'cents' },
  ],
  'produtos-top': [
    { chave: 'nome', rotulo: 'Produto' },
    { chave: 'sku', rotulo: 'SKU' },
    { chave: 'quantidade_total', rotulo: 'Qtd. Vendida', formato: 'numero' },
    { chave: 'receita_total_cents', rotulo: 'Receita', formato: 'cents' },
  ],
  'estoque-baixo': [
    { chave: 'sku', rotulo: 'SKU' },
    { chave: 'nome', rotulo: 'Produto' },
    { chave: 'quantidade_fisica', rotulo: 'Físico', formato: 'numero' },
    { chave: 'quantidade_reservada', rotulo: 'Reservado', formato: 'numero' },
    { chave: 'disponivel', rotulo: 'Disponível', formato: 'numero' },
    { chave: 'minima', rotulo: 'Mínimo', formato: 'numero' },
  ],
  conciliacao: [
    { chave: 'data', rotulo: 'Data', formato: 'date' },
    { chave: 'gateway', rotulo: 'Gateway' },
    { chave: 'metodo', rotulo: 'Método' },
    { chave: 'esperado_count', rotulo: 'Esperados', formato: 'numero' },
    { chave: 'confirmado_count', rotulo: 'Confirmados', formato: 'numero' },
    { chave: 'divergente_count', rotulo: 'Divergentes', formato: 'numero' },
    { chave: 'valor_esperado_cents', rotulo: 'Valor Esperado', formato: 'cents' },
    { chave: 'valor_confirmado_cents', rotulo: 'Valor Confirmado', formato: 'cents' },
  ],
};

export interface RelatorioConsulta {
  tipo: ReportTipo;
  titulo: string;
  colunas: ColunaRelatorio[];
  linhas: Record<string, unknown>[];
}

export interface PeriodoRelatorio {
  data_inicio?: string;
  data_fim?: string;
  deposito_id?: string;
  limit: number;
}

function normalizarLinha(row: RelatorioRow): Record<string, unknown> {
  const saida: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(row)) {
    saida[chave] = valor instanceof Date ? valor.toISOString() : valor;
  }
  return saida;
}

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatarCelula(coluna: ColunaRelatorio, valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  switch (coluna.formato) {
    case 'cents':
      return MOEDA.format(Number(valor) / 100);
    case 'date':
      return new Date(valor as string | Date).toLocaleDateString('pt-BR');
    case 'numero':
      return new Intl.NumberFormat('pt-BR').format(Number(valor));
    default:
      return String(valor);
  }
}

export async function obterRelatorio(
  tipo: ReportTipo,
  lojaId: string,
  periodo: PeriodoRelatorio
): Promise<RelatorioConsulta> {
  let linhas: RelatorioRow[] = [];
  if (tipo === 'vendas-diario') {
    linhas = await getVendasDiario(lojaId, periodo, periodo.limit);
  } else if (tipo === 'produtos-top') {
    linhas = await getProdutosTop(lojaId, periodo, periodo.limit);
  } else if (tipo === 'estoque-baixo') {
    linhas = await getEstoqueBaixo(lojaId, periodo.deposito_id, periodo.limit);
  } else {
    linhas = await getConciliacao(lojaId, periodo, periodo.limit);
  }
  return {
    tipo,
    titulo: REPORT_TITULOS[tipo],
    colunas: COLUNAS[tipo],
    linhas: linhas.map(normalizarLinha),
  };
}

export function gerarCsv(relatorio: RelatorioConsulta): string {
  const escapar = (valor: string) => `"${valor.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
  const cabecalho = relatorio.colunas.map((c) => escapar(c.rotulo)).join(',');
  const corpo = relatorio.linhas
    .map((linha) =>
      relatorio.colunas.map((c) => escapar(formatarCelula(c, linha[c.chave]))).join(',')
    )
    .join('\n');
  return `${cabecalho}\n${corpo}`;
}

export function gerarPdf(relatorio: RelatorioConsulta): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const colunas = relatorio.colunas;
    const larguraPagina = doc.page.width - 60;
    const larguraColuna = larguraPagina / colunas.length;
    let y = 30;

    doc.fontSize(16).text(relatorio.titulo, 30, y);
    y += 22;
    doc
      .fontSize(9)
      .fillColor('#555555')
      .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 30, y);
    y += 16;
    doc
      .fillColor('#000000')
      .moveTo(30, y)
      .lineTo(30 + larguraPagina, y)
      .stroke();
    y += 10;

    const desenharLinha = (valores: string[], negrito: boolean) => {
      doc.font(negrito ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
      if (y > doc.page.height - 40) {
        doc.addPage();
        y = 30;
      }
      colunas.forEach((_, i) => {
        doc.text(valores[i] ?? '', 30 + i * larguraColuna, y, {
          width: larguraColuna - 4,
          ellipsis: true,
          height: 10,
        });
      });
      y += 14;
    };

    desenharLinha(
      colunas.map((c) => c.rotulo),
      true
    );
    for (const linha of relatorio.linhas) {
      desenharLinha(
        colunas.map((c) => formatarCelula(c, linha[c.chave])),
        false
      );
    }

    if (relatorio.linhas.length === 0) {
      doc.fontSize(10).text('Nenhum dado encontrado para o período.', 30, y);
    }

    doc.end();
  });
}

export function criarAgendamentoService(
  lojaId: string,
  usuarioId: string | undefined,
  input: CreateReportScheduleInput
) {
  return criarAgendamento(lojaId, usuarioId, input);
}

export function listarAgendamentosService(lojaId: string) {
  return listarAgendamentos(lojaId);
}

export function buscarAgendamentoService(id: string, lojaId: string) {
  return buscarAgendamento(id, lojaId);
}

export function removerAgendamentoService(id: string, lojaId: string) {
  return removerAgendamento(id, lojaId);
}

export function calcularProximoEnvio(params: {
  frequencia: string;
  hora: number;
  dia_semana?: number | null;
  dia_mes?: number | null;
  from?: Date;
}): Date | null {
  const base = params.from ?? new Date();
  if (params.frequencia === 'DIARIO') {
    const cand = new Date(base);
    cand.setHours(params.hora, 0, 0, 0);
    if (cand <= base) cand.setDate(cand.getDate() + 1);
    return cand;
  }
  if (params.frequencia === 'SEMANAL') {
    const target = params.dia_semana ?? 1;
    const cand = new Date(base);
    cand.setHours(params.hora, 0, 0, 0);
    let diff = (target - cand.getDay() + 7) % 7;
    if (diff === 0 && cand <= base) diff = 7;
    cand.setDate(cand.getDate() + diff);
    return cand;
  }
  if (params.frequencia === 'MENSAL') {
    const target = Math.min(params.dia_mes ?? 1, 28);
    const cand = new Date(base.getFullYear(), base.getMonth(), target, params.hora, 0, 0, 0);
    if (cand <= base) cand.setMonth(cand.getMonth() + 1);
    return cand;
  }
  return null;
}

function periodoAgendamento(tipo: ReportTipo): PeriodoRelatorio {
  if (tipo === 'estoque-baixo') {
    return { limit: 500 };
  }
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 30);
  return {
    data_inicio: inicio.toISOString().slice(0, 10),
    data_fim: fim.toISOString().slice(0, 10),
    limit: 500,
  };
}

export async function enviarAgendamento(schedule: {
  id: string;
  loja_id: string;
  tipo: string;
  formato: string;
  email_destino: string;
  frequencia: string;
  hora: number;
  dia_semana?: number | null;
  dia_mes?: number | null;
}): Promise<void> {
  const tipo = schedule.tipo as ReportTipo;
  const formato = schedule.formato as ReportFormato;
  const relatorio = await obterRelatorio(tipo, schedule.loja_id, periodoAgendamento(tipo));
  const dataStr = new Date().toISOString().slice(0, 10);
  const extensao = formato === 'PDF' ? 'pdf' : 'csv';

  let conteudo: Buffer;
  let contentType: string;
  if (formato === 'PDF') {
    conteudo = await gerarPdf(relatorio);
    contentType = 'application/pdf';
  } else {
    conteudo = Buffer.from(gerarCsv(relatorio), 'utf-8');
    contentType = 'text/csv; charset=utf-8';
  }

  await emailProvider.enviar({
    to: schedule.email_destino,
    subject: `Relatório: ${relatorio.titulo}`,
    html: `<p>Segue em anexo o relatório <strong>${relatorio.titulo}</strong> gerado automaticamente.</p>`,
    attachments: [
      {
        filename: `${tipo}-${dataStr}.${extensao}`,
        content: conteudo,
        contentType,
      },
    ],
  });

  const proximo = calcularProximoEnvio(schedule);
  await registrarEnvio(schedule.id, new Date(), proximo);
}

export async function processarAgendamentosVencidos(): Promise<number> {
  const vencidos = await buscarAgendamentosVencidos();
  let enviados = 0;
  for (const schedule of vencidos) {
    try {
      await enviarAgendamento(schedule);
      enviados += 1;
    } catch (erro) {
      console.error(`Falha ao enviar agendamento ${schedule.id}:`, erro);
    }
  }
  return enviados;
}

export type { VendaDiarioRow, ProdutoTopRow, EstoqueBaixoRow, ConciliacaoRow };
