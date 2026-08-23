import { z } from 'zod';

export enum CategoryStatus {
  ATIVA = 'ATIVA',
  INATIVA = 'INATIVA',
}

export const categoriaSchema = z.object({
  loja_id: z.string().uuid(),
  nome: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  descricao: z.string().max(500).optional().nullable(),
  imagem_url: z.string().url().optional().nullable(),
  pai_id: z.string().uuid().nullable().optional(),
  ordem_exibicao: z.number().int().min(0).optional(),
});

export const updateCategoriaSchema = categoriaSchema.partial().extend({
  ativa: z.boolean().optional(),
  status: z.nativeEnum(CategoryStatus).optional(),
});

export const categoriaParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
export type CategoriaParams = z.infer<typeof categoriaParamsSchema>;
