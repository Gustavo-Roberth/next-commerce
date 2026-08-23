import { z } from 'zod';
import { AvaliacaoStatus, CupomStatus, CupomType, OrderStatus } from '../types/enums';

export const createPedidoSchema = z.object({
  loja_id: z.string().uuid(),
  cliente_id: z.string().uuid(),
  endereco_entrega_id: z.string().uuid(),
  endereco_cobranca_id: z.string().uuid(),
  cupom_id: z.string().uuid().optional(),
  observacoes_cliente: z.string().max(2000).optional(),
  itens: z
    .array(
      z.object({
        produto_id: z.string().uuid(),
        variacao_id: z.string().uuid(),
        quantidade: z.number().int().min(1),
      })
    )
    .min(1, 'Pedido deve ter pelo menos 1 item'),
});

export const updatePedidoStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  observacoes_internas: z.string().max(2000).optional(),
});

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

export const itemPedidoSchema = z.object({
  pedido_id: z.string().uuid(),
  produto_id: z.string().uuid(),
  variacao_id: z.string().uuid(),
  nome_produto: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  quantidade: z.number().int().min(1),
  preco_unitario_cents: z.number().int().min(0),
});

export const cupomSchema = z.object({
  loja_id: z.string().uuid(),
  codigo: z.string().min(1).max(50).toUpperCase(),
  nome: z.string().min(1).max(100),
  tipo: z.nativeEnum(CupomType),
  valor: z.number().int().min(0),
  valor_minimo_pedido_cents: z.number().int().min(0).optional(),
  uso_maximo_total: z.number().int().min(1).optional(),
  uso_maximo_por_cliente: z.number().int().min(1).optional(),
  valido_de: z.date(),
  valido_ate: z.date(),
  categorias_aplicaveis: z.array(z.string().uuid()).optional(),
  produtos_aplicaveis: z.array(z.string().uuid()).optional(),
  primeira_compra_only: z.boolean().optional(),
});

export const updateCupomSchema = cupomSchema.partial().extend({
  status: z.nativeEnum(CupomStatus).optional(),
  ativo: z.boolean().optional(),
});

export const cupomParamsSchema = z.object({
  id: z.string().uuid(),
});

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
      tipo: z.nativeEnum(CupomType),
      valor: z.number().int(),
    })
    .optional(),
});

export const carrinhoItemSchema = z.object({
  carrinho_id: z.string().uuid(),
  produto_id: z.string().uuid(),
  variacao_id: z.string().uuid(),
  quantidade: z.number().int().min(1),
});

export const updateCarrinhoItemSchema = z.object({
  quantidade: z.number().int().min(1),
});

export const carrinhoParamsSchema = z.object({
  id: z.string().uuid(),
});

export const avaliacaoSchema = z.object({
  loja_id: z.string().uuid(),
  produto_id: z.string().uuid(),
  cliente_id: z.string().uuid(),
  pedido_id: z.string().uuid(),
  nota: z.number().int().min(1).max(5),
  titulo: z.string().max(100).optional(),
  comentario: z.string().max(2000).optional(),
  imagens_urls: z.array(z.string().url()).max(5).optional(),
});

export const updateAvaliacaoSchema = avaliacaoSchema.partial().extend({
  aprovada: z.boolean().optional(),
  status: z.nativeEnum(AvaliacaoStatus).optional(),
});

export const avaliacaoParamsSchema = z.object({
  id: z.string().uuid(),
});

export const favoritoSchema = z.object({
  cliente_id: z.string().uuid(),
  produto_id: z.string().uuid(),
  variacao_id: z.string().uuid().optional(),
});

export const favoritoParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreatePedidoInput = z.infer<typeof createPedidoSchema>;
export type UpdatePedidoStatusInput = z.infer<typeof updatePedidoStatusSchema>;
export type PedidoParams = z.infer<typeof pedidoParamsSchema>;
export type PedidoListQuery = z.infer<typeof pedidoListQuerySchema>;
export type ItemPedidoInput = z.infer<typeof itemPedidoSchema>;
export type CupomInput = z.infer<typeof cupomSchema>;
export type UpdateCupomInput = z.infer<typeof updateCupomSchema>;
export type CupomParams = z.infer<typeof cupomParamsSchema>;
export type ApplyCupomInput = z.infer<typeof applyCupomSchema>;
export type ApplyCupomResponse = z.infer<typeof applyCupomResponseSchema>;
export type CarrinhoItemInput = z.infer<typeof carrinhoItemSchema>;
export type UpdateCarrinhoItemInput = z.infer<typeof updateCarrinhoItemSchema>;
export type CarrinhoParams = z.infer<typeof carrinhoParamsSchema>;
export type AvaliacaoInput = z.infer<typeof avaliacaoSchema>;
export type UpdateAvaliacaoInput = z.infer<typeof updateAvaliacaoSchema>;
export type AvaliacaoParams = z.infer<typeof avaliacaoParamsSchema>;
export type FavoritoInput = z.infer<typeof favoritoSchema>;
export type FavoritoParams = z.infer<typeof favoritoParamsSchema>;
