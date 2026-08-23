import type {
  AvaliacaoStatus,
  CupomStatus,
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
} from './enums';

export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Usuario extends BaseEntity {
  email: string;
  nome_completo: string;
  telefone: string | null;
  cpf_cnpj: string | null;
  avatar_url: string | null;
  ultimo_login_em: Date | null;
  ativo: boolean;
  email_verificado_em: Date | null;
}

export interface Perfil extends BaseEntity {
  codigo: PerfilCodigo;
  nome: string;
  descricao: string | null;
  permissoes: Record<string, boolean>;
}

export interface UsuarioPerfil extends BaseEntity {
  usuario_id: string;
  perfil_id: string;
  loja_id: string;
  ativo: boolean;
  atribuido_por_id: string | null;
  atribuido_em: Date;
}

export interface Loja extends BaseEntity {
  nome: string;
  slug: string;
  dominio_customizado: string | null;
  logo_url: string | null;
  cores_tema: Record<string, string>;
  configuracoes_seo: Record<string, string>;
  ativa: boolean;
  plano_id: string | null;
  trial_ate: Date | null;
}

export interface Categoria extends BaseEntity {
  loja_id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  imagem_url: string | null;
  pai_id: string | null;
  ordem_exibicao: number;
  ativa: boolean;
}

export interface Endereco extends BaseEntity {
  usuario_id: string;
  tipo: EnderecoTipo;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  pais: string;
  principal: boolean;
  apelido: string | null;
}

export interface Produto extends BaseEntity {
  loja_id: string;
  categoria_id: string;
  nome: string;
  slug: string;
  descricao_curta: string | null;
  descricao_completa: string | null;
  sku: string;
  codigo_barras: string | null;
  ncm: string | null;
  cest: string | null;
  origem_mercadoria: number;
  peso_bruto_kg: number | null;
  peso_liquido_kg: number | null;
  dimensoes_cm: Record<string, number> | null;
  ativo: boolean;
  destaque: boolean;
  permite_avaliacao: boolean;
  meta_title: string | null;
  meta_description: string | null;
  publicado_em: Date | null;
  status: ProductStatus;
}

export interface ProdutoVariacao extends BaseEntity {
  produto_id: string;
  sku: string;
  nome: string;
  codigo_barras: string | null;
  preco_cents: number | null;
  custo_cents: number | null;
  peso_bruto_kg: number | null;
  peso_liquido_kg: number | null;
  dimensoes_cm: Record<string, number> | null;
  ativo: boolean;
  ordem_exibicao: number;
}

export interface ProdutoAtributo extends BaseEntity {
  loja_id: string;
  nome: string;
  tipo: ProdutoAtributoTipo;
  valores: string[];
}

export interface ProdutoVariacaoAtributo extends BaseEntity {
  variacao_id: string;
  atributo_id: string;
  valor: string;
}

export interface ProdutoImagem extends BaseEntity {
  produto_id: string;
  variacao_id: string | null;
  url: string;
  alt_text: string | null;
  principal: boolean;
  ordem: number;
}

export interface Pedido extends BaseEntity {
  loja_id: string;
  cliente_id: string;
  numero_sequencial: number;
  status: OrderStatus;
  subtotal_cents: number;
  desconto_cents: number;
  frete_cents: number;
  total_cents: number;
  cupom_id: string | null;
  endereco_entrega_id: string;
  endereco_cobranca_id: string;
  observacoes_cliente: string | null;
  observacoes_internas: string | null;
  pago_em: Date | null;
  enviado_em: Date | null;
  entregue_em: Date | null;
  cancelado_em: Date | null;
  cancelamento_motivo: string | null;
}

export interface ItemPedido extends BaseEntity {
  pedido_id: string;
  produto_id: string;
  variacao_id: string;
  nome_produto: string;
  sku: string;
  quantidade: number;
  preco_unitario_cents: number;
  total_cents: number;
}

export interface Pagamento extends BaseEntity {
  pedido_id: string;
  gateway: PaymentGateway;
  metodo: PaymentMethod;
  status: PaymentStatus;
  valor_cents: number;
  parcelas: number;
  juros_cents: number;
  idempotency_key: string;
  gateway_transaction_id: string | null;
  gateway_response: Record<string, unknown> | null;
  webhook_received_at: Date | null;
  aprovado_em: Date | null;
  estornado_em: Date | null;
}

export interface Cupom extends BaseEntity {
  loja_id: string;
  codigo: string;
  nome: string;
  tipo: CupomType;
  valor: number;
  valor_minimo_pedido_cents: number | null;
  uso_maximo_total: number | null;
  uso_maximo_por_cliente: number | null;
  uso_atual: number;
  valido_de: Date;
  valido_ate: Date;
  categorias_aplicaveis: string[] | null;
  produtos_aplicaveis: string[] | null;
  primeira_compra_only: boolean;
  ativo: boolean;
  status: CupomStatus;
}

export interface Estoque extends BaseEntity {
  loja_id: string;
  variacao_id: string;
  deposito_id: string;
  quantidade_fisica: number;
  quantidade_reservada: number;
  quantidade_minima: number;
  quantidade_maxima: number | null;
  custo_medio_cents: number;
  atualizado_em: Date;
}

export interface Deposito extends BaseEntity {
  loja_id: string;
  nome: string;
  codigo: string;
  endereco_completo: string;
  padrao: boolean;
  ativo: boolean;
}

export interface EstoqueMovimento extends BaseEntity {
  loja_id: string;
  variacao_id: string;
  deposito_id: string;
  tipo: EstoqueMovimentoTipo;
  quantidade: number;
  custo_unitario_cents: number | null;
  referencia_tipo: EstoqueReferenciaTipo;
  referencia_id: string | null;
  usuario_id: string | null;
  observacao: string | null;
}

export interface Avaliacao extends BaseEntity {
  loja_id: string;
  produto_id: string;
  cliente_id: string;
  pedido_id: string;
  nota: number;
  titulo: string | null;
  comentario: string | null;
  imagens_urls: string[];
  verificada: boolean;
  aprovada: boolean;
  publicada_em: Date | null;
  status: AvaliacaoStatus;
}

export interface Favorito extends BaseEntity {
  cliente_id: string;
  produto_id: string;
  variacao_id: string | null;
}

export interface Carrinho extends BaseEntity {
  cliente_id: string | null;
  sessao_id: string | null;
  expira_em: Date;
  atualizado_em: Date;
}

export interface ItemCarrinho extends BaseEntity {
  carrinho_id: string;
  produto_id: string;
  variacao_id: string;
  quantidade: number;
  preco_unitario_cents: number;
  adicionado_em: Date;
}

export interface ConfiguracaoFrete extends BaseEntity {
  loja_id: string;
  nome: string;
  tipo: FreteTipo;
  configuracao: Record<string, unknown>;
  prioridade: number;
  ativo: boolean;
}

export interface ConfiguracaoPagamento extends BaseEntity {
  loja_id: string;
  gateway: PaymentGateway;
  credenciais_criptografadas: string;
  parcelamento_max: number;
  juros_parcela: Record<string, number>;
  ativo: boolean;
  modo_teste: boolean;
}

export interface TransportadoraRastreamento extends BaseEntity {
  pedido_id: string;
  transportadora: Transportadora;
  codigo_rastreamento: string;
  url_rastreamento: string | null;
  status_transportadora: RastreamentoStatus;
  eventos: RastreamentoEvento[];
  ultima_atualizacao: Date | null;
  webhook_recebido_em: Date | null;
}

export interface RastreamentoEvento {
  data: Date;
  status: RastreamentoStatus;
  local: string | null;
  descricao: string;
}

export interface PedidoEvento extends BaseEntity {
  pedido_id: string;
  tipo: string;
  descricao: string;
  usuario_id: string | null;
  metadata: Record<string, unknown> | null;
}

export interface PagamentoEvento extends BaseEntity {
  pagamento_id: string;
  tipo: string;
  descricao: string;
  gateway_response: Record<string, unknown> | null;
}

export interface WebhookEvent extends BaseEntity {
  event_type: WebhookEventType;
  payload: Record<string, unknown>;
  idempotency_key: string;
  scope: IdempotencyKeyScope;
  processed: boolean;
  processed_at: Date | null;
  attempts: number;
  last_error: string | null;
}

export interface WebhookDlq extends BaseEntity {
  event_type: WebhookEventType;
  payload: Record<string, unknown>;
  idempotency_key: string;
  scope: IdempotencyKeyScope;
  error: string;
  attempts: number;
  last_attempt_at: Date;
}

export interface AuditLog extends BaseEntity {
  usuario_id: string | null;
  loja_id: string | null;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  antes: Record<string, unknown> | null;
  depois: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
}
