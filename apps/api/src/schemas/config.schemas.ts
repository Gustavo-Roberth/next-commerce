import { z } from 'zod';

const FreteTipoValores = [
  'CORREIOS',
  'TRANSPORTADORA',
  'TABELA_PRECO',
  'GRATIS_VALOR',
  'GRATIS_REGIAO',
] as const;
const GatewayValores = ['MERCADO_PAGO', 'STRIPE', 'PIX_GATEWAY', 'BOLETO_GATEWAY'] as const;
const CupomTipoValores = ['PERCENTUAL', 'VALOR_FIXO', 'FRETE_GRATIS'] as const;
const IntegracaoTipoValores = ['CORREIOS', 'MERCADO_LIVRE', 'MELHOR_ENVIO', 'CUSTOM'] as const;

export const freteTipoSchema = z.enum(FreteTipoValores);
export const gatewaySchema = z.enum(GatewayValores);
export const cupomTipoSchema = z.enum(CupomTipoValores);
export const integracaoTipoSchema = z.enum(IntegracaoTipoValores);

export const idParamSchema = z.object({ id: z.string().min(1) });

// ---- Loja (dados gerais) ----
export const lojaTemaSchema = z.object({
  primary: z.string().optional(),
  secondary: z.string().optional(),
  background: z.string().optional(),
  text: z.string().optional(),
});

export const lojaSeoSchema = z.object({
  meta_title_template: z.string().optional(),
  meta_description_template: z.string().optional(),
  og_image: z.string().optional(),
  cep_origem: z.string().optional(),
});

export const atualizarLojaSchema = z.object({
  nome: z.string().min(1).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug inválido')
    .optional(),
  dominio_customizado: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  cores_tema: lojaTemaSchema.optional(),
  configuracoes_seo: lojaSeoSchema.optional(),
});
export type AtualizarLojaInput = z.infer<typeof atualizarLojaSchema>;

// ---- Frete ----
export const criarFreteSchema = z.object({
  nome: z.string().min(1),
  tipo: freteTipoSchema,
  configuracao: z.record(z.string(), z.unknown()),
  prioridade: z.number().int().nonnegative(),
  ativo: z.boolean().default(true),
});
export const atualizarFreteSchema = criarFreteSchema.partial();
export type CriarFreteInput = z.infer<typeof criarFreteSchema>;
export type AtualizarFreteInput = z.infer<typeof atualizarFreteSchema>;

export const calcularFreteSchema = z.object({
  cep_destino: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
  subtotal_cents: z.number().int().nonnegative(),
  peso_kg: z.number().nonnegative().optional(),
});
export type CalcularFreteInput = z.infer<typeof calcularFreteSchema>;

// ---- Pagamentos ----
export const criarPagamentoSchema = z.object({
  gateway: gatewaySchema,
  credenciais: z.record(z.string(), z.unknown()),
  parcelamento_max: z.number().int().min(1).max(12).default(12),
  juros_parcela: z.record(z.string(), z.number()).optional(),
  ativo: z.boolean().default(true),
  modo_teste: z.boolean().default(false),
});
export const atualizarPagamentoSchema = criarPagamentoSchema.partial();
export type CriarPagamentoInput = z.infer<typeof criarPagamentoSchema>;
export type AtualizarPagamentoInput = z.infer<typeof atualizarPagamentoSchema>;

// ---- Cupons ----
export const criarCupomSchema = z.object({
  codigo: z.string().min(1),
  nome: z.string().min(1),
  tipo: cupomTipoSchema,
  valor: z.number().int().nonnegative(),
  valor_minimo_pedido_cents: z.number().int().nonnegative().optional(),
  uso_maximo_total: z.number().int().positive().optional(),
  uso_maximo_por_cliente: z.number().int().positive().optional(),
  valido_de: z.string().datetime().or(z.string().date()),
  valido_ate: z.string().datetime().or(z.string().date()),
  categorias_aplicaveis: z.array(z.string()).optional(),
  produtos_aplicaveis: z.array(z.string()).optional(),
  primeira_compra_only: z.boolean().default(false),
  ativo: z.boolean().default(true),
});
export const atualizarCupomSchema = criarCupomSchema.partial();
export type CriarCupomInput = z.infer<typeof criarCupomSchema>;
export type AtualizarCupomInput = z.infer<typeof atualizarCupomSchema>;

export const validarCupomSchema = z.object({
  codigo: z.string().min(1),
  subtotal_cents: z.number().int().nonnegative(),
  cliente_id: z.string().optional(),
  categorias: z.array(z.string()).optional(),
  produtos: z.array(z.string()).optional(),
});
export type ValidarCupomInput = z.infer<typeof validarCupomSchema>;

// ---- E-mails (templates MJML) ----
export const criarEmailTemplateSchema = z.object({
  codigo: z.string().min(1),
  nome: z.string().min(1),
  assunto: z.string().min(1),
  corpo_mjml: z.string().min(1),
  variaveis: z.array(z.string()).optional(),
  ativo: z.boolean().default(true),
});
export const atualizarEmailTemplateSchema = criarEmailTemplateSchema.partial();
export type CriarEmailTemplateInput = z.infer<typeof criarEmailTemplateSchema>;
export type AtualizarEmailTemplateInput = z.infer<typeof atualizarEmailTemplateSchema>;

// ---- Integrações ----
export const criarIntegracaoSchema = z.object({
  tipo: integracaoTipoSchema,
  nome: z.string().min(1),
  credenciais: z.record(z.string(), z.unknown()),
  ativo: z.boolean().default(true),
});
export const atualizarIntegracaoSchema = criarIntegracaoSchema.partial();
export type CriarIntegracaoInput = z.infer<typeof criarIntegracaoSchema>;
export type AtualizarIntegracaoInput = z.infer<typeof atualizarIntegracaoSchema>;
