import { ProductStatus } from '@/generated/prisma/client';
import { z } from 'zod';

export const createProdutoSchema = z.object({
  loja_id: z.string().uuid(),
  categoria_id: z.string().uuid(),
  nome: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífen'),
  descricao_curta: z.string().max(500).optional(),
  descricao_completa: z.string().optional(),
  sku: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[A-Z0-9-_]+$/,
      'SKU deve conter apenas letras maiúsculas, números, hífen e underscore'
    ),
  codigo_barras: z
    .string()
    .regex(/^\d{8,14}$/, 'Código de barras inválido')
    .optional(),
  ncm: z
    .string()
    .regex(/^\d{8}$/, 'NCM deve ter 8 dígitos')
    .optional(),
  cest: z
    .string()
    .regex(/^\d{7}$/, 'CEST deve ter 7 dígitos')
    .optional(),
  origem_mercadoria: z.number().int().min(0).max(7).optional(),
  peso_bruto_kg: z.number().positive().max(9999.999).optional(),
  peso_liquido_kg: z.number().positive().max(9999.999).optional(),
  dimensoes_cm: z
    .object({
      altura: z.number().positive(),
      largura: z.number().positive(),
      comprimento: z.number().positive(),
    })
    .optional(),
  ativo: z.boolean().optional(),
  destaque: z.boolean().optional(),
  permite_avaliacao: z.boolean().optional(),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});

export const updateProdutoSchema = createProdutoSchema.partial().extend({
  status: z.nativeEnum(ProductStatus).optional(),
});

export const produtoParamsSchema = z.object({
  id: z.string().uuid(),
});

export const produtoListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoria_id: z.string().uuid().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  destaque: z.coerce.boolean().optional(),
  preco_min: z.coerce.number().int().min(0).optional(),
  preco_max: z.coerce.number().int().min(0).optional(),
  atributos: z.record(z.string()).optional(),
  apenas_disponiveis: z.coerce.boolean().optional(),
  sort: z.string().optional(),
});

export const adminProdutoListQuerySchema = produtoListQuerySchema;

export type CreateProdutoInput = z.infer<typeof createProdutoSchema>;
export type UpdateProdutoInput = z.infer<typeof updateProdutoSchema>;
export type ProdutoParams = z.infer<typeof produtoParamsSchema>;
export type ProdutoListQuery = z.infer<typeof produtoListQuerySchema>;
export type AdminProdutoListQuery = z.infer<typeof adminProdutoListQuerySchema>;
