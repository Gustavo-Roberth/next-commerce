import type { ReportSchedule as ReportScheduleModel } from '@/generated/prisma/client';
import { prisma } from '../lib/prisma.js';
import type { CreateReportScheduleInput, ReportTipo } from '../schemas/report.schemas.js';

export interface VendaDiarioRow {
  data: Date | string;
  loja_id: string;
  pedidos_count: number;
  itens_count: number;
  receita_bruta_cents: number;
  desconto_cents: number;
  frete_cents: number;
  receita_liquida_cents: number;
  ticket_medio_cents: number;
}

export interface ProdutoTopRow {
  produto_id: string;
  variacao_id: string;
  nome: string | null;
  sku: string | null;
  quantidade_total: number;
  receita_total_cents: number;
}

export interface EstoqueBaixoRow {
  loja_id: string;
  deposito_id: string;
  variacao_id: string;
  sku: string | null;
  nome: string | null;
  quantidade_fisica: number;
  quantidade_reservada: number;
  disponivel: number;
  minima: number;
}

export interface ConciliacaoRow {
  data: Date | string;
  loja_id: string;
  gateway: string;
  metodo: string;
  esperado_count: number;
  confirmado_count: number;
  divergente_count: number;
  valor_esperado_cents: number;
  valor_confirmado_cents: number;
}

export type RelatorioRow = VendaDiarioRow | ProdutoTopRow | EstoqueBaixoRow | ConciliacaoRow;

interface PeriodoFiltro {
  data_inicio?: string;
  data_fim?: string;
}

function condicoesData(params: unknown[], filtro?: PeriodoFiltro): string {
  let sql = '';
  if (filtro?.data_inicio) {
    params.push(filtro.data_inicio);
    sql += ` AND "data" >= $${params.length}`;
  }
  if (filtro?.data_fim) {
    params.push(filtro.data_fim);
    sql += ` AND "data" <= $${params.length}`;
  }
  return sql;
}

export async function getVendasDiario(
  lojaId: string,
  filtro: PeriodoFiltro,
  limit: number
): Promise<VendaDiarioRow[]> {
  const params: unknown[] = [lojaId];
  const where = `"loja_id" = $1${condicoesData(params, filtro)}`;
  return prisma.$queryRawUnsafe<VendaDiarioRow[]>(
    `SELECT * FROM "mv_vendas_diario" WHERE ${where} ORDER BY "data" DESC LIMIT ${Number(limit)}`,
    ...params
  );
}

export async function getProdutosTop(
  lojaId: string,
  filtro: PeriodoFiltro,
  limit: number
): Promise<ProdutoTopRow[]> {
  const params: unknown[] = [lojaId];
  const where = `"loja_id" = $1${condicoesData(params, filtro)}`;
  return prisma.$queryRawUnsafe<ProdutoTopRow[]>(
    `SELECT "produto_id", "variacao_id", "nome", "sku",
       SUM("quantidade_total")::int AS "quantidade_total",
       COALESCE(SUM("receita_total_cents"), 0)::bigint AS "receita_total_cents"
     FROM "mv_produtos_top"
     WHERE ${where}
     GROUP BY "produto_id", "variacao_id", "nome", "sku"
     ORDER BY "quantidade_total" DESC
     LIMIT ${Number(limit)}`,
    ...params
  );
}

export async function getEstoqueBaixo(
  lojaId: string,
  depositoId: string | undefined,
  limit: number
): Promise<EstoqueBaixoRow[]> {
  const params: unknown[] = [lojaId];
  let where = `"loja_id" = $1`;
  if (depositoId) {
    params.push(depositoId);
    where += ` AND "deposito_id" = $${params.length}`;
  }
  return prisma.$queryRawUnsafe<EstoqueBaixoRow[]>(
    `SELECT * FROM "mv_relatorio_estoque_baixo" WHERE ${where} ORDER BY "disponivel" ASC LIMIT ${Number(limit)}`,
    ...params
  );
}

export async function getConciliacao(
  lojaId: string,
  filtro: PeriodoFiltro,
  limit: number
): Promise<ConciliacaoRow[]> {
  const params: unknown[] = [lojaId];
  const where = `"loja_id" = $1${condicoesData(params, filtro)}`;
  return prisma.$queryRawUnsafe<ConciliacaoRow[]>(
    `SELECT * FROM "mv_conciliacao_financeira" WHERE ${where} ORDER BY "data" DESC LIMIT ${Number(limit)}`,
    ...params
  );
}

export async function refreshRelatorios(): Promise<void> {
  await prisma.$queryRawUnsafe(`SELECT "refresh_relatorios"()`);
}

export async function criarAgendamento(
  lojaId: string,
  usuarioId: string | undefined,
  input: CreateReportScheduleInput
): Promise<ReportScheduleModel> {
  return prisma.reportSchedule.create({
    data: {
      loja_id: lojaId,
      tipo: input.tipo,
      formato: input.formato,
      email_destino: input.email_destino,
      frequencia: input.frequencia,
      hora: input.hora,
      dia_semana: input.dia_semana ?? null,
      dia_mes: input.dia_mes ?? null,
      criado_por: usuarioId ?? null,
    },
  });
}

export async function listarAgendamentos(lojaId: string): Promise<ReportScheduleModel[]> {
  return prisma.reportSchedule.findMany({
    where: { loja_id: lojaId },
    orderBy: { created_at: 'desc' },
  });
}

export async function buscarAgendamento(
  id: string,
  lojaId: string
): Promise<ReportScheduleModel | null> {
  return prisma.reportSchedule.findFirst({ where: { id, loja_id: lojaId } });
}

export async function removerAgendamento(id: string, lojaId: string): Promise<void> {
  await prisma.reportSchedule.deleteMany({ where: { id, loja_id: lojaId } });
}

export async function atualizarProximoEnvio(id: string, proximo: Date | null): Promise<void> {
  await prisma.reportSchedule.update({
    where: { id },
    data: { proximo_envio_em: proximo },
  });
}

export async function registrarEnvio(
  id: string,
  ultimoEnvioEm: Date,
  proximoEnvioEm: Date | null
): Promise<void> {
  await prisma.reportSchedule.update({
    where: { id },
    data: { ultimo_envio_em: ultimoEnvioEm, proximo_envio_em: proximoEnvioEm },
  });
}

export async function buscarAgendamentosVencidos(): Promise<ReportScheduleModel[]> {
  return prisma.reportSchedule.findMany({
    where: { ativo: true, proximo_envio_em: { lte: new Date() } },
  });
}

export function isReportTipoValido(tipo: string): tipo is ReportTipo {
  return ['vendas-diario', 'produtos-top', 'estoque-baixo', 'conciliacao'].includes(tipo);
}
