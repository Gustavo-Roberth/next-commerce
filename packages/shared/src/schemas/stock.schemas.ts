import { z } from 'zod';
import { EstoqueMovimentoTipo, EstoqueReferenciaTipo } from '../types/enums';

export const createEstoqueSchema = z.object({
  loja_id: z.string().uuid(),
  variacao_id: z.string().uuid(),
  deposito_id: z.string().uuid(),
  quantidade_fisica: z.number().int().min(0),
  quantidade_minima: z.number().int().min(0),
  quantidade_maxima: z.number().int().min(1).optional(),
  custo_medio_cents: z.number().int().min(0).default(0),
});

export const updateEstoqueSchema = createEstoqueSchema.partial();

export const estoqueParamsSchema = z.object({
  id: z.string().uuid(),
});

export const estoqueListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  loja_id: z.string().uuid().optional(),
  variacao_id: z.string().uuid().optional(),
  deposito_id: z.string().uuid().optional(),
  apenas_baixo: z.coerce.boolean().optional(),
});

export const createDepositoSchema = z.object({
  loja_id: z.string().uuid(),
  nome: z.string().min(1).max(100),
  codigo: z.string().min(1).max(20).toUpperCase(),
  endereco_completo: z.string().min(1).max(500),
  padrao: z.boolean().optional(),
});

export const updateDepositoSchema = createDepositoSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export const depositoParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createEstoqueMovimentoSchema = z.object({
  loja_id: z.string().uuid(),
  variacao_id: z.string().uuid(),
  deposito_id: z.string().uuid(),
  tipo: z.nativeEnum(EstoqueMovimentoTipo),
  quantidade: z.number().int().min(1),
  custo_unitario_cents: z.number().int().min(0).optional(),
  referencia_tipo: z.nativeEnum(EstoqueReferenciaTipo),
  referencia_id: z.string().uuid().optional(),
  usuario_id: z.string().uuid().optional(),
  observacao: z.string().max(500).optional(),
});

export const estoqueMovimentoParamsSchema = z.object({
  id: z.string().uuid(),
});

export const estoqueMovimentoListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  loja_id: z.string().uuid().optional(),
  variacao_id: z.string().uuid().optional(),
  deposito_id: z.string().uuid().optional(),
  tipo: z.nativeEnum(EstoqueMovimentoTipo).optional(),
  referencia_tipo: z.nativeEnum(EstoqueReferenciaTipo).optional(),
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const reservaEstoqueSchema = z.object({
  variacao_id: z.string().uuid(),
  deposito_id: z.string().uuid(),
  quantidade: z.number().int().min(1),
});

export const liberaReservaSchema = z.object({
  variacao_id: z.string().uuid(),
  deposito_id: z.string().uuid(),
  quantidade: z.number().int().min(1),
});

export const transferenciaEstoqueSchema = z.object({
  loja_id: z.string().uuid(),
  variacao_id: z.string().uuid(),
  deposito_origem_id: z.string().uuid(),
  deposito_destino_id: z.string().uuid(),
  quantidade: z.number().int().min(1),
  usuario_id: z.string().uuid().optional(),
  observacao: z.string().max(500).optional(),
});

export const inventarioSchema = z.object({
  loja_id: z.string().uuid(),
  deposito_id: z.string().uuid(),
  itens: z
    .array(
      z.object({
        variacao_id: z.string().uuid(),
        quantidade_contada: z.number().int().min(0),
      })
    )
    .min(1),
  usuario_id: z.string().uuid(),
  observacao: z.string().max(500).optional(),
});

export type CreateEstoqueInput = z.infer<typeof createEstoqueSchema>;
export type UpdateEstoqueInput = z.infer<typeof updateEstoqueSchema>;
export type EstoqueParams = z.infer<typeof estoqueParamsSchema>;
export type EstoqueListQuery = z.infer<typeof estoqueListQuerySchema>;
export type CreateDepositoInput = z.infer<typeof createDepositoSchema>;
export type UpdateDepositoInput = z.infer<typeof updateDepositoSchema>;
export type DepositoParams = z.infer<typeof depositoParamsSchema>;
export type CreateEstoqueMovimentoInput = z.infer<typeof createEstoqueMovimentoSchema>;
export type EstoqueMovimentoParams = z.infer<typeof estoqueMovimentoParamsSchema>;
export type EstoqueMovimentoListQuery = z.infer<typeof estoqueMovimentoListQuerySchema>;
export type ReservaEstoqueInput = z.infer<typeof reservaEstoqueSchema>;
export type LiberaReservaInput = z.infer<typeof liberaReservaSchema>;
export type TransferenciaEstoqueInput = z.infer<typeof transferenciaEstoqueSchema>;
export type InventarioInput = z.infer<typeof inventarioSchema>;
