import { z } from 'zod';

export const carrinhoItemSchema = z.object({
  carrinho_id: z.string().uuid(),
  produto_id: z.string().uuid(),
  variacao_id: z.string().uuid(),
  quantidade: z.number().int().min(1),
});

export const updateCarrinhoItemSchema = z.object({
  quantidade: z.number().int().min(1),
});

export const addItemToCartSchema = z.object({
  variacao_id: z.string().uuid(),
  quantidade: z.number().int().min(1).default(1),
});

export const carrinhoParamsSchema = z.object({
  id: z.string().uuid(),
});

export const carrinhoItemParamsSchema = z.object({
  carrinho_id: z.string().uuid(),
  item_id: z.string().uuid(),
});

export type CarrinhoItemInput = z.infer<typeof carrinhoItemSchema>;
export type UpdateCarrinhoItemInput = z.infer<typeof updateCarrinhoItemSchema>;
export type AddItemToCartInput = z.infer<typeof addItemToCartSchema>;
export type CarrinhoParams = z.infer<typeof carrinhoParamsSchema>;
export type CarrinhoItemParams = z.infer<typeof carrinhoItemParamsSchema>;
