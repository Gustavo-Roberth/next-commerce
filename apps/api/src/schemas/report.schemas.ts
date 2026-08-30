import { z } from 'zod';

export const reportTipoSchema = z.enum([
  'vendas-diario',
  'produtos-top',
  'estoque-baixo',
  'conciliacao',
]);

export const reportFormatoSchema = z.enum(['CSV', 'PDF']);

export const reportFrequenciaSchema = z.enum(['DIARIO', 'SEMANAL', 'MENSAL']);

export type ReportTipo = z.infer<typeof reportTipoSchema>;
export type ReportFormato = z.infer<typeof reportFormatoSchema>;
export type ReportFrequencia = z.infer<typeof reportFrequenciaSchema>;

export const reportParamsSchema = z.object({
  tipo: reportTipoSchema,
});

export const reportListQuerySchema = z.object({
  data_inicio: z.string().datetime().optional().or(z.string().date().optional()),
  data_fim: z.string().datetime().optional().or(z.string().date().optional()),
  deposito_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export type ReportListQuery = z.infer<typeof reportListQuerySchema>;

export const reportExportQuerySchema = z.object({
  formato: reportFormatoSchema.default('CSV'),
  data_inicio: z.string().datetime().optional().or(z.string().date().optional()),
  data_fim: z.string().datetime().optional().or(z.string().date().optional()),
});

export type ReportExportQuery = z.infer<typeof reportExportQuerySchema>;

export const createReportScheduleSchema = z.object({
  tipo: reportTipoSchema,
  formato: reportFormatoSchema,
  email_destino: z.string().email(),
  frequencia: reportFrequenciaSchema,
  hora: z.number().int().min(0).max(23).default(6),
  dia_semana: z.number().int().min(0).max(6).optional(),
  dia_mes: z.number().int().min(1).max(28).optional(),
});

export type CreateReportScheduleInput = z.infer<typeof createReportScheduleSchema>;

export const reportScheduleParamsSchema = z.object({
  id: z.string().uuid(),
});

export type ReportScheduleParams = z.infer<typeof reportScheduleParamsSchema>;

export const REPORT_TITULOS: Record<ReportTipo, string> = {
  'vendas-diario': 'Vendas Diário',
  'produtos-top': 'Produtos Mais Vendidos',
  'estoque-baixo': 'Estoque Baixo',
  conciliacao: 'Conciliação Financeira',
};
