import { z } from 'zod';
import { OrderStatus, PaymentGateway, PaymentMethod, PaymentStatus } from '../types/enums';

export const createPagamentoSchema = z.object({
  pedido_id: z.string().uuid(),
  gateway: z.nativeEnum(PaymentGateway),
  metodo: z.nativeEnum(PaymentMethod),
  valor_cents: z.number().int().min(1),
  parcelas: z.number().int().min(1).max(12).default(1),
  juros_cents: z.number().int().min(0).default(0),
  idempotency_key: z.string().uuid(),
});

export const updatePagamentoStatusSchema = z.object({
  status: z.nativeEnum(PaymentStatus),
  gateway_transaction_id: z.string().optional(),
  gateway_response: z.record(z.unknown()).optional(),
});

export const pagamentoParamsSchema = z.object({
  id: z.string().uuid(),
});

export const pagamentoListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(PaymentStatus).optional(),
  gateway: z.string().optional(),
  metodo: z.nativeEnum(PaymentMethod).optional(),
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const checkoutSchema = z.object({
  endereco_entrega_id: z.string().uuid(),
  endereco_cobranca_id: z.string().uuid().optional(),
  cupom_codigo: z.string().max(50).optional(),
  frete_selecionado: z.object({
    nome: z.string(),
    tipo: z.string(),
    prazo_dias: z.number().int().min(0),
    valor_cents: z.number().int().min(0),
    transportadora: z.string().optional(),
  }),
  pagamento: z.object({
    gateway: z.string(),
    metodo: z.nativeEnum(PaymentMethod),
    parcelas: z.number().int().min(1).max(12).optional(),
  }),
});

export const checkoutResponseSchema = z.object({
  pedido_id: z.string().uuid(),
  pagamento_id: z.string().uuid(),
  status: z.nativeEnum(OrderStatus),
  payment_url: z.string().url().optional(),
  pix_qr_code: z.string().optional(),
  pix_qr_code_base64: z.string().optional(),
  expires_at: z.string().datetime().optional(),
});

export const mercadoPagoWebhookSchema = z.object({
  id: z.string(),
  status: z.string(),
  external_reference: z.string(),
  payment_method_id: z.string(),
  payment_type_id: z.string(),
  transaction_amount: z.number(),
  date_approved: z.string().datetime().optional(),
  date_created: z.string().datetime(),
  date_last_updated: z.string().datetime(),
});

export const pixQrCodeSchema = z.object({
  qr_code: z.string(),
  qr_code_base64: z.string(),
  expires_at: z.string().datetime(),
  copia_e_cola: z.string(),
});

export type CreatePagamentoInput = z.infer<typeof createPagamentoSchema>;
export type UpdatePagamentoStatusInput = z.infer<typeof updatePagamentoStatusSchema>;
export type PagamentoParams = z.infer<typeof pagamentoParamsSchema>;
export type PagamentoListQuery = z.infer<typeof pagamentoListQuerySchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
export type MercadoPagoWebhookPayload = z.infer<typeof mercadoPagoWebhookSchema>;
export type PixQrCode = z.infer<typeof pixQrCodeSchema>;
