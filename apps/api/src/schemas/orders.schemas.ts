import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

export const pedidoParamsSchema = z.object({
  id: z.string().uuid(),
});

export const pedidoListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  cliente_id: z.string().uuid().optional(),
});

export const adminPedidoListQuerySchema = pedidoListQuerySchema;

export const updatePedidoStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  observacoes_internas: z.string().max(2000).optional(),
});

export type PedidoParams = z.infer<typeof pedidoParamsSchema>;
export type PedidoListQuery = z.infer<typeof pedidoListQuerySchema>;
export type AdminPedidoListQuery = z.infer<typeof adminPedidoListQuerySchema>;
export type UpdatePedidoStatusInput = z.infer<typeof updatePedidoStatusSchema>;
