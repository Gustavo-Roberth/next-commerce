import { PaymentMethod } from '@/generated/prisma/client';
import { z } from 'zod';

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
  status: z.string(),
  payment_url: z.string().url().optional(),
  pix_qr_code: z.string().optional(),
  pix_qr_code_base64: z.string().optional(),
  expires_at: z.string().datetime().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
