import { z } from 'zod';
import { PaymentGateway } from '../types/enums';

export const configuracaoPagamentoSchema = z.object({
  loja_id: z.string().uuid(),
  gateway: z.nativeEnum(PaymentGateway),
  credenciais_criptografadas: z.string().min(1),
  parcelamento_max: z.number().int().min(1).max(12),
  juros_parcela: z.record(z.number().min(0).max(100)),
  modo_teste: z.boolean().optional(),
});

export const updateConfiguracaoPagamentoSchema = configuracaoPagamentoSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export const configuracaoPagamentoParamsSchema = z.object({
  id: z.string().uuid(),
});

export const configuracaoPagamentoListQuerySchema = z.object({
  loja_id: z.string().uuid().optional(),
  gateway: z.nativeEnum(PaymentGateway).optional(),
  ativo: z.coerce.boolean().optional(),
});

export const webhookEventSchema = z.object({
  event_type: z.string(),
  payload: z.record(z.unknown()),
  idempotency_key: z.string().uuid(),
  scope: z.enum(['payment', 'order', 'webhook']),
});

export const webhookEventParamsSchema = z.object({
  id: z.string().uuid(),
});

export const webhookEventListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  event_type: z.string().optional(),
  scope: z.enum(['payment', 'order', 'webhook']).optional(),
  processed: z.coerce.boolean().optional(),
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const auditLogSchema = z.object({
  usuario_id: z.string().uuid().nullable().optional(),
  loja_id: z.string().uuid().nullable().optional(),
  acao: z.string().min(1).max(100),
  entidade: z.string().min(1).max(100),
  entidade_id: z.string().uuid().nullable().optional(),
  antes: z.record(z.unknown()).nullable().optional(),
  depois: z.record(z.unknown()).nullable().optional(),
  ip: z.string().ip().nullable().optional(),
  user_agent: z.string().nullable().optional(),
});

export const auditLogListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  usuario_id: z.string().uuid().optional(),
  loja_id: z.string().uuid().optional(),
  acao: z.string().optional(),
  entidade: z.string().optional(),
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type ConfiguracaoPagamentoInput = z.infer<typeof configuracaoPagamentoSchema>;
export type UpdateConfiguracaoPagamentoInput = z.infer<typeof updateConfiguracaoPagamentoSchema>;
export type ConfiguracaoPagamentoParams = z.infer<typeof configuracaoPagamentoParamsSchema>;
export type ConfiguracaoPagamentoListQuery = z.infer<typeof configuracaoPagamentoListQuerySchema>;
export type WebhookEventInput = z.infer<typeof webhookEventSchema>;
export type WebhookEventParams = z.infer<typeof webhookEventParamsSchema>;
export type WebhookEventListQuery = z.infer<typeof webhookEventListQuerySchema>;
export type AuditLogInput = z.infer<typeof auditLogSchema>;
export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;
