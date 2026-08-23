import { z } from 'zod';

export const applyCupomSchema = z.object({
  codigo: z.string().min(1).max(50).toUpperCase(),
});

export const applyCupomResponseSchema = z.object({
  valido: z.boolean(),
  desconto_cents: z.number().int().min(0),
  mensagem: z.string().optional(),
  cupom: z
    .object({
      id: z.string().uuid(),
      codigo: z.string(),
      nome: z.string(),
      tipo: z.string(),
      valor: z.number().int(),
    })
    .optional(),
});

export const calcularFreteSchema = z.object({
  cep_destino: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
  itens: z
    .array(
      z.object({
        variacao_id: z.string().uuid(),
        quantidade: z.number().int().min(1),
      })
    )
    .min(1),
});

export const freteOpcaoSchema = z.object({
  nome: z.string(),
  tipo: z.string(),
  prazo_dias: z.number().int().min(0),
  valor_cents: z.number().int().min(0),
  transportadora: z.string().optional(),
});

export const calcularFreteResponseSchema = z.object({
  opcoes: z.array(freteOpcaoSchema),
  cep_origem: z.string(),
  cep_destino: z.string(),
});

export type ApplyCupomInput = z.infer<typeof applyCupomSchema>;
export type ApplyCupomResponse = z.infer<typeof applyCupomResponseSchema>;
export type CalcularFreteInput = z.infer<typeof calcularFreteSchema>;
export type FreteOpcao = z.infer<typeof freteOpcaoSchema>;
export type CalcularFreteResponse = z.infer<typeof calcularFreteResponseSchema>;
