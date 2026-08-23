import { z } from 'zod';
import {
  CategoryStatus,
  EnderecoTipo,
  FreteTipo,
  ProductStatus,
  ProdutoAtributoTipo,
} from '../types/enums';

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

export const produtoVariacaoSchema = z.object({
  produto_id: z.string().uuid(),
  sku: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Z0-9-_]+$/),
  nome: z.string().min(1).max(255),
  codigo_barras: z
    .string()
    .regex(/^\d{8,14}$/)
    .optional(),
  preco_cents: z.number().int().min(0).optional(),
  custo_cents: z.number().int().min(0).optional(),
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
  ordem_exibicao: z.number().int().min(0).optional(),
});

export const updateProdutoVariacaoSchema = produtoVariacaoSchema.partial();

export const produtoAtributoSchema = z.object({
  loja_id: z.string().uuid(),
  nome: z.string().min(1).max(100),
  tipo: z.nativeEnum(ProdutoAtributoTipo),
  valores: z.array(z.string().min(1).max(50)).min(1),
});

export const updateProdutoAtributoSchema = produtoAtributoSchema.partial();

export const produtoVariacaoAtributoSchema = z.object({
  variacao_id: z.string().uuid(),
  atributo_id: z.string().uuid(),
  valor: z.string().min(1).max(50),
});

export const produtoImagemSchema = z.object({
  produto_id: z.string().uuid(),
  variacao_id: z.string().uuid().optional(),
  url: z.string().url(),
  alt_text: z.string().max(255).optional(),
  principal: z.boolean().optional(),
  ordem: z.number().int().min(0).optional(),
});

export const categoriaSchema = z.object({
  loja_id: z.string().uuid(),
  nome: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  descricao: z.string().max(500).optional(),
  imagem_url: z.string().url().optional(),
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

export const enderecoSchema = z.object({
  usuario_id: z.string().uuid(),
  tipo: z.nativeEnum(EnderecoTipo),
  cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
  logradouro: z.string().min(1).max(255),
  numero: z.string().min(1).max(20),
  complemento: z.string().max(100).optional(),
  bairro: z.string().min(1).max(100),
  cidade: z.string().min(1).max(100),
  uf: z
    .string()
    .length(2, 'UF deve ter 2 caracteres')
    .transform((v) => v.toUpperCase()),
  pais: z
    .string()
    .length(3)
    .default('BRA')
    .transform((v) => v.toUpperCase()),
  principal: z.boolean().optional(),
  apelido: z.string().max(50).optional(),
});

export const updateEnderecoSchema = enderecoSchema.partial();

export const enderecoParamsSchema = z.object({
  id: z.string().uuid(),
});

export const freteConfigSchema = z.object({
  loja_id: z.string().uuid(),
  nome: z.string().min(1).max(100),
  tipo: z.nativeEnum(FreteTipo),
  configuracao: z.record(z.unknown()),
  prioridade: z.number().int().min(1),
});

export const updateFreteConfigSchema = freteConfigSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export const freteConfigParamsSchema = z.object({
  id: z.string().uuid(),
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

export type CreateProdutoInput = z.infer<typeof createProdutoSchema>;
export type UpdateProdutoInput = z.infer<typeof updateProdutoSchema>;
export type ProdutoParams = z.infer<typeof produtoParamsSchema>;
export type ProdutoListQuery = z.infer<typeof produtoListQuerySchema>;
export type ProdutoVariacaoInput = z.infer<typeof produtoVariacaoSchema>;
export type UpdateProdutoVariacaoInput = z.infer<typeof updateProdutoVariacaoSchema>;
export type ProdutoAtributoInput = z.infer<typeof produtoAtributoSchema>;
export type UpdateProdutoAtributoInput = z.infer<typeof updateProdutoAtributoSchema>;
export type ProdutoVariacaoAtributoInput = z.infer<typeof produtoVariacaoAtributoSchema>;
export type ProdutoImagemInput = z.infer<typeof produtoImagemSchema>;
export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
export type CategoriaParams = z.infer<typeof categoriaParamsSchema>;
export type EnderecoInput = z.infer<typeof enderecoSchema>;
export type UpdateEnderecoInput = z.infer<typeof updateEnderecoSchema>;
export type EnderecoParams = z.infer<typeof enderecoParamsSchema>;
export type FreteConfigInput = z.infer<typeof freteConfigSchema>;
export type UpdateFreteConfigInput = z.infer<typeof updateFreteConfigSchema>;
export type FreteConfigParams = z.infer<typeof freteConfigParamsSchema>;
export type CalcularFreteInput = z.infer<typeof calcularFreteSchema>;
export type FreteOpcao = z.infer<typeof freteOpcaoSchema>;
export type CalcularFreteResponse = z.infer<typeof calcularFreteResponseSchema>;
