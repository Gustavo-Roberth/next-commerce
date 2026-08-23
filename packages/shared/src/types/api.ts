import type {
  Carrinho,
  Categoria,
  Cupom,
  Endereco,
  ItemCarrinho,
  ItemPedido,
  Pagamento,
  Pedido,
  PedidoEvento,
  Perfil,
  Produto,
  ProdutoImagem,
  ProdutoVariacao,
  ProdutoVariacaoAtributo,
  TransportadoraRastreamento,
  Usuario,
} from './entities';

import type { OrderStatus, PaymentMethod, PaymentStatus, ProductStatus } from './enums';

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta: ResponseMeta | null;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  version: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nome_completo: string;
  telefone?: string;
  cpf_cnpj?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nome_completo: string;
  loja_id: string;
  perfis: Perfil[];
  permissoes: string[];
}

export interface ProdutoListParams extends PaginationParams {
  search?: string;
  categoria_id?: string;
  status?: ProductStatus;
  destaque?: boolean;
  preco_min?: number;
  preco_max?: number;
  atributos?: Record<string, string>;
  apenas_disponiveis?: boolean;
  sort?: string;
}

export interface ProdutoListResponse {
  data: (Produto & { variacoes: ProdutoVariacao[]; categoria: Categoria })[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ProdutoDetalheResponse {
  data: Produto & {
    variacoes: (ProdutoVariacao & { atributos: ProdutoVariacaoAtributo[] })[];
    imagens: ProdutoImagem[];
    categoria: Categoria;
    avaliacoes: { media: number; total: number };
  };
}

export interface CategoriaTreeResponse {
  data: (Categoria & { filhos: Categoria[] })[];
}

export interface CarrinhoResponse {
  data: Carrinho & {
    itens: (ItemCarrinho & { produto: Produto; variacao: ProdutoVariacao })[];
    subtotal_cents: number;
    total_itens: number;
  };
}

export interface AddItemCarrinhoRequest {
  produto_id: string;
  variacao_id: string;
  quantidade: number;
}

export interface UpdateItemCarrinhoRequest {
  quantidade: number;
}

export interface ApplyCupomRequest {
  codigo: string;
}

export interface ApplyCupomResponse {
  valido: boolean;
  desconto_cents: number;
  mensagem?: string;
  cupom?: Cupom;
}

export interface FreteCalculado {
  nome: string;
  tipo: string;
  prazo_dias: number;
  valor_cents: number;
  transportadora?: string;
}

export interface CalcularFreteRequest {
  cep_destino: string;
  itens: { variacao_id: string; quantidade: number }[];
}

export interface CalcularFreteResponse {
  opcoes: FreteCalculado[];
  cep_origem: string;
  cep_destino: string;
}

export interface CheckoutRequest {
  endereco_entrega_id: string;
  endereco_cobranca_id?: string;
  cupom_codigo?: string;
  frete_selecionado: FreteCalculado;
  pagamento: {
    gateway: string;
    metodo: PaymentMethod;
    parcelas?: number;
  };
}

export interface CheckoutResponse {
  pedido_id: string;
  pagamento_id: string;
  status: OrderStatus;
  payment_url?: string;
  pix_qr_code?: string;
  pix_qr_code_base64?: string;
  expires_at?: string;
}

export interface PedidoListParams extends PaginationParams {
  status?: OrderStatus;
  data_inicio?: string;
  data_fim?: string;
  cliente_id?: string;
}

export interface PedidoListResponse {
  data: (Pedido & {
    cliente: Pick<Usuario, 'id' | 'nome_completo' | 'email'>;
    endereco_entrega: Endereco;
    itens_count: number;
  })[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PedidoDetalheResponse {
  data: Pedido & {
    cliente: Usuario;
    endereco_entrega: Endereco;
    endereco_cobranca: Endereco;
    itens: (ItemPedido & { produto: Produto; variacao: ProdutoVariacao })[];
    pagamentos: Pagamento[];
    eventos: PedidoEvento[];
    rastreamento: TransportadoraRastreamento | null;
    cupom: Cupom | null;
  };
}

export interface UpdatePedidoStatusRequest {
  status: OrderStatus;
  observacoes_internas?: string;
}

export interface PagamentoListParams extends PaginationParams {
  status?: PaymentStatus;
  gateway?: string;
  metodo?: PaymentMethod;
  data_inicio?: string;
  data_fim?: string;
}

export interface PagamentoDetalheResponse {
  data: Pagamento & {
    pedido: Pedido;
    eventos: { tipo: string; descricao: string; criado_em: Date }[];
  };
}

export interface DashboardKPIs {
  vendas_hoje_cents: number;
  pedidos_pendentes: number;
  pedidos_pagos_hoje: number;
  ticket_medio_cents: number;
  conversao_pct: number;
  abandono_carrinho_pct: number;
}

export interface DashboardVendasDiarioParams {
  data_inicio: string;
  data_fim: string;
}

export interface DashboardVendasDiarioResponse {
  data: {
    data: string;
    pedidos_count: number;
    itens_count: number;
    receita_bruta_cents: number;
    desconto_cents: number;
    frete_cents: number;
    receita_liquida_cents: number;
    ticket_medio_cents: number;
    conversao_pct: number;
  }[];
}

export interface RelatorioProdutosParams {
  periodo_inicio: string;
  periodo_fim: string;
  limit?: number;
}

export interface RelatorioProdutosResponse {
  data: {
    produto_id: string;
    variacao_id: string | null;
    nome: string;
    sku: string;
    quantidade_total: number;
    receita_total_cents: number;
    margem_media_pct: number;
  }[];
}

export interface RelatorioEstoqueBaixoResponse {
  data: {
    loja_id: string;
    deposito_id: string;
    variacao_id: string;
    sku: string;
    nome: string;
    quantidade_fisica: number;
    quantidade_reservada: number;
    disponivel: number;
    minima: number;
    dias_estimados: number | null;
  }[];
}

export interface ConciliacaoFinanceiraParams {
  data_inicio: string;
  data_fim: string;
  gateway?: string;
}

export interface ConciliacaoFinanceiraResponse {
  data: {
    data: string;
    gateway: string;
    metodo: string;
    esperado_count: number;
    confirmado_count: number;
    divergente_count: number;
    valor_esperado_cents: number;
    valor_confirmado_cents: number;
    divergencias: Record<string, unknown>[];
  }[];
}

export interface WebhookPaymentPayload {
  id: string;
  status: string;
  external_reference: string;
  payment_method_id: string;
  payment_type_id: string;
  transaction_amount: number;
  date_approved?: string;
  date_created: string;
  date_last_updated: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  services: {
    database: 'ok' | 'down';
    redis: 'ok' | 'down';
    supabase: 'ok' | 'down';
  };
}
