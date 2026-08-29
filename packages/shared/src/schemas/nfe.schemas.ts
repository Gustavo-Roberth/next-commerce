import { z } from 'zod';

export const notaFiscalStatusSchema = z.enum(['PENDENTE', 'EMITIDA', 'ERRO', 'CANCELADA']);

export const notaFiscalSchema = z.object({
  id: z.string().uuid(),
  pedido_id: z.string().uuid(),
  numero: z.string().nullable(),
  serie: z.string().nullable(),
  chave_acesso: z.string().nullable(),
  xml_url: z.string().nullable(),
  pdf_url: z.string().nullable(),
  status: notaFiscalStatusSchema,
  erro_mensagem: z.string().nullable(),
  emitida_em: z.coerce.date().nullable(),
  autorizada_em: z.coerce.date().nullable(),
  cancelada_em: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type NotaFiscal = z.infer<typeof notaFiscalSchema>;
export type NotaFiscalStatus = z.infer<typeof notaFiscalStatusSchema>;
