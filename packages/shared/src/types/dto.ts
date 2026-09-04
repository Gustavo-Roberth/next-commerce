import type {
  CupomType,
  EnderecoTipo,
  EstoqueMovimentoTipo,
  EstoqueReferenciaTipo,
  FreteTipo,
  IdempotencyKeyScope,
  OrderStatus,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  PerfilCodigo,
  ProductStatus,
  ProdutoAtributoTipo,
  RastreamentoStatus,
  Transportadora,
  WebhookEventType,
} from './enums.js';

import type { RastreamentoEvento } from './entities.js';

export interface CreateUsuarioDTO {
  email: string;
  nome_completo: string;
  telefone?: string;
  cpf_cnpj?: string;
  senha: string;
}

export interface UpdateUsuarioDTO {
  nome_completo?: string;
  telefone?: string;
  cpf_cnpj?: string;
  avatar_url?: string;
  ativo?: boolean;
}

export interface CreatePerfilDTO {
  codigo: PerfilCodigo;
  nome: string;
  descricao?: string;
  permissoes: Record<string, boolean>;
}

export interface UpdatePerfilDTO {
  nome?: string;
  descricao?: string;
  permissoes?: Record<string, boolean>;
}

export interface CreateUsuarioPerfilDTO {
  usuario_id: string;
  perfil_id: string;
  loja_id: string;
  ativo?: boolean;
}

export interface CreateLojaDTO {
  nome: string;
  slug: string;
  dominio_customizado?: string;
  logo_url?: string;
  cores_tema?: Record<string, string>;
  configuracoes_seo?: Record<string, string>;
  plano_id?: string;
  trial_ate?: Date;
}

export interface UpdateLojaDTO {
  nome?: string;
  slug?: string;
  dominio_customizado?: string;
  logo_url?: string;
  cores_tema?: Record<string, string>;
  configuracoes_seo?: Record<string, string>;
  ativa?: boolean;
  plano_id?: string;
  trial_ate?: Date;
}

export interface CreateCategoriaDTO {
  loja_id: string;
  nome: string;
  slug: string;
  descricao?: string;
  imagem_url?: string;
  pai_id?: string;
  ordem_exibicao?: number;
}

export interface UpdateCategoriaDTO {
  nome?: string;
  slug?: string;
  descricao?: string;
  imagem_url?: string;
  pai_id?: string | null;
  ordem_exibicao?: number;
  ativa?: boolean;
}

export interface CreateEnderecoDTO {
  usuario_id: string;
  tipo: EnderecoTipo;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  pais?: string;
  principal?: boolean;
  apelido?: string;
}

export interface UpdateEnderecoDTO {
  tipo?: EnderecoTipo;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string | null;
  bairro?: string;
  cidade?: string;
  uf?: string;
  pais?: string;
  principal?: boolean;
  apelido?: string | null;
}

export interface CreateProdutoDTO {
  loja_id: string;
  categoria_id: string;
  nome: string;
  slug: string;
  descricao_curta?: string;
  descricao_completa?: string;
  sku: string;
  codigo_barras?: string;
  ncm?: string;
  cest?: string;
  origem_mercadoria?: number;
  peso_bruto_kg?: number;
  peso_liquido_kg?: number;
  dimensoes_cm?: Record<string, number>;
  ativo?: boolean;
  destaque?: boolean;
  permite_avaliacao?: boolean;
  meta_title?: string;
  meta_description?: string;
}

export interface UpdateProdutoDTO {
  categoria_id?: string;
  nome?: string;
  slug?: string;
  descricao_curta?: string | null;
  descricao_completa?: string | null;
  sku?: string;
  codigo_barras?: string | null;
  ncm?: string | null;
  cest?: string | null;
  origem_mercadoria?: number;
  peso_bruto_kg?: number | null;
  peso_liquido_kg?: number | null;
  dimensoes_cm?: Record<string, number> | null;
  ativo?: boolean;
  destaque?: boolean;
  permite_avaliacao?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
  status?: ProductStatus;
}

export interface CreateProdutoVariacaoDTO {
  produto_id: string;
  sku: string;
  nome: string;
  codigo_barras?: string;
  preco_cents?: number;
  custo_cents?: number;
  peso_bruto_kg?: number;
  peso_liquido_kg?: number;
  dimensoes_cm?: Record<string, number>;
  ativo?: boolean;
  ordem_exibicao?: number;
}

export interface UpdateProdutoVariacaoDTO {
  sku?: string;
  nome?: string;
  codigo_barras?: string | null;
  preco_cents?: number | null;
  custo_cents?: number | null;
  peso_bruto_kg?: number | null;
  peso_liquido_kg?: number | null;
  dimensoes_cm?: Record<string, number> | null;
  ativo?: boolean;
  ordem_exibicao?: number;
}

export interface CreateProdutoAtributoDTO {
  loja_id: string;
  nome: string;
  tipo: ProdutoAtributoTipo;
  valores: string[];
}

export interface UpdateProdutoAtributoDTO {
  nome?: string;
  tipo?: ProdutoAtributoTipo;
  valores?: string[];
}

export interface CreateProdutoVariacaoAtributoDTO {
  variacao_id: string;
  atributo_id: string;
  valor: string;
}

export interface CreateProdutoImagemDTO {
  produto_id: string;
  variacao_id?: string;
  url: string;
  alt_text?: string;
  principal?: boolean;
  ordem?: number;
}

export interface CreatePedidoDTO {
  loja_id: string;
  cliente_id: string;
  endereco_entrega_id: string;
  endereco_cobranca_id: string;
  cupom_id?: string;
  observacoes_cliente?: string;
  itens: CreateItemPedidoDTO[];
}

export interface CreateItemPedidoDTO {
  produto_id: string;
  variacao_id: string;
  quantidade: number;
}

export interface UpdatePedidoStatusDTO {
  status: OrderStatus;
  observacoes_internas?: string;
}

export interface CreatePagamentoDTO {
  pedido_id: string;
  gateway: PaymentGateway;
  metodo: PaymentMethod;
  valor_cents: number;
  parcelas?: number;
  juros_cents?: number;
  idempotency_key: string;
}

export interface UpdatePagamentoStatusDTO {
  status: PaymentStatus;
  gateway_transaction_id?: string;
  gateway_response?: Record<string, unknown>;
}

export interface CreateCupomDTO {
  loja_id: string;
  codigo: string;
  nome: string;
  tipo: CupomType;
  valor: number;
  valor_minimo_pedido_cents?: number;
  uso_maximo_total?: number;
  uso_maximo_por_cliente?: number;
  valido_de: Date;
  valido_ate: Date;
  categorias_aplicaveis?: string[];
  produtos_aplicaveis?: string[];
  primeira_compra_only?: boolean;
}

export interface UpdateCupomDTO {
  nome?: string;
  tipo?: CupomType;
  valor?: number;
  valor_minimo_pedido_cents?: number | null;
  uso_maximo_total?: number | null;
  uso_maximo_por_cliente?: number | null;
  valido_de?: Date;
  valido_ate?: Date;
  categorias_aplicaveis?: string[] | null;
  produtos_aplicaveis?: string[] | null;
  primeira_compra_only?: boolean;
  ativo?: boolean;
}

export interface CreateEstoqueDTO {
  loja_id: string;
  variacao_id: string;
  deposito_id: string;
  quantidade_fisica: number;
  quantidade_minima: number;
  quantidade_maxima?: number;
  custo_medio_cents?: number;
}

export interface UpdateEstoqueDTO {
  quantidade_fisica?: number;
  quantidade_minima?: number;
  quantidade_maxima?: number | null;
  custo_medio_cents?: number;
}

export interface CreateDepositoDTO {
  loja_id: string;
  nome: string;
  codigo: string;
  endereco_completo: string;
  padrao?: boolean;
}

export interface UpdateDepositoDTO {
  nome?: string;
  codigo?: string;
  endereco_completo?: string;
  padrao?: boolean;
  ativo?: boolean;
}

export interface CreateEstoqueMovimentoDTO {
  loja_id: string;
  variacao_id: string;
  deposito_id: string;
  tipo: EstoqueMovimentoTipo;
  quantidade: number;
  custo_unitario_cents?: number;
  referencia_tipo: EstoqueReferenciaTipo;
  referencia_id?: string;
  usuario_id?: string;
  observacao?: string;
}

export interface CreateAvaliacaoDTO {
  loja_id: string;
  produto_id: string;
  cliente_id: string;
  pedido_id: string;
  nota: number;
  titulo?: string;
  comentario?: string;
  imagens_urls?: string[];
}

export interface UpdateAvaliacaoDTO {
  nota?: number;
  titulo?: string | null;
  comentario?: string | null;
  imagens_urls?: string[];
  aprovada?: boolean;
}

export interface CreateFavoritoDTO {
  cliente_id: string;
  produto_id: string;
  variacao_id?: string;
}

export interface CreateCarrinhoDTO {
  cliente_id?: string;
  sessao_id?: string;
}

export interface CreateItemCarrinhoDTO {
  carrinho_id: string;
  produto_id: string;
  variacao_id: string;
  quantidade: number;
}

export interface UpdateItemCarrinhoDTO {
  quantidade: number;
}

export interface CreateConfiguracaoFreteDTO {
  loja_id: string;
  nome: string;
  tipo: FreteTipo;
  configuracao: Record<string, unknown>;
  prioridade: number;
}

export interface UpdateConfiguracaoFreteDTO {
  nome?: string;
  tipo?: FreteTipo;
  configuracao?: Record<string, unknown>;
  prioridade?: number;
  ativo?: boolean;
}

export interface CreateConfiguracaoPagamentoDTO {
  loja_id: string;
  gateway: PaymentGateway;
  credenciais_criptografadas: string;
  parcelamento_max: number;
  juros_parcela: Record<string, number>;
  modo_teste?: boolean;
}

export interface UpdateConfiguracaoPagamentoDTO {
  credenciais_criptografadas?: string;
  parcelamento_max?: number;
  juros_parcela?: Record<string, number>;
  ativo?: boolean;
  modo_teste?: boolean;
}

export interface CreateTransportadoraRastreamentoDTO {
  pedido_id: string;
  transportadora: Transportadora;
  codigo_rastreamento: string;
  url_rastreamento?: string;
}

export interface UpdateTransportadoraRastreamentoDTO {
  status_transportadora?: RastreamentoStatus;
  eventos?: RastreamentoEvento[];
  url_rastreamento?: string | null;
}

export interface CreatePedidoEventoDTO {
  pedido_id: string;
  tipo: string;
  descricao: string;
  usuario_id?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateWebhookEventDTO {
  event_type: WebhookEventType;
  payload: Record<string, unknown>;
  idempotency_key: string;
  scope: IdempotencyKeyScope;
}
