export interface Produto {
  id: string;
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
  origem_mercadoria: number | null;
  peso_bruto_kg: number | null;
  peso_liquido_kg: number | null;
  dimensoes_cm: Record<string, number> | null;
  ativo: boolean;
  destaque: boolean;
  permite_avaliacao: boolean;
  meta_title: string | null;
  meta_description: string | null;
  publicado_em: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  categoria?: {
    id: string;
    nome: string;
    slug: string;
  };
  variacoes: ProdutoVariacao[];
  imagens: ProdutoImagem[];
  _count?: {
    variacoes: number;
    imagens: number;
  };
}

export interface ProdutoVariacao {
  id: string;
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
  atributos: ProdutoVariacaoAtributo[];
  imagens: ProdutoImagem[];
}

export interface ProdutoVariacaoAtributo {
  atributo_id: string;
  nome: string;
  valor: string;
}

export interface ProdutoAtributo {
  atributo_id: string;
  nome: string;
  valores: string[];
}

export interface ProdutoImagem {
  id: string;
  url: string;
  alt_text: string | null;
  principal: boolean;
  ordem: number;
}

export interface ProdutosListResponse {
  data: Produto[];
  nextCursor: string | null;
  total: number;
}

export interface ProdutoDestaqueResponse {
  data: ProdutoDestaque[];
}

export interface ProdutoDestaque {
  id: string;
  nome: string;
  slug: string;
  descricao_curta: string | null;
  sku: string;
  preco_cents: number | null;
  imagens: { url: string; alt_text: string | null; principal: boolean }[];
}

export interface Categoria {
  id: string;
  loja_id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  imagem_url: string | null;
  pai_id: string | null;
  ordem_exibicao: number;
  ativa: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    produtos: number;
    filhos: number;
  };
}

export interface CategoriasListResponse {
  data: Categoria[];
  nextCursor: string | null;
  total: number;
}

export interface CarrinhoItem {
  id: string;
  carrinho_id: string;
  produto_id: string;
  variacao_id: string;
  quantidade: number;
  preco_unitario_cents: number;
  total_cents: number;
  adicionado_em: string;
  produto: {
    id: string;
    nome: string;
    slug: string;
    sku: string;
    ativo: boolean;
    status: string;
    imagens: { url: string; alt_text: string | null; principal: boolean }[];
  };
  variacao: {
    id: string;
    sku: string;
    nome: string;
    preco_cents: number | null;
    ativo: boolean;
    imagens: { url: string; alt_text: string | null; principal: boolean }[];
  };
}

export interface CarrinhoResponse {
  id: string;
  cliente_id: string | null;
  sessao_id: string | null;
  loja_id: string;
  expira_em: string;
  atualizado_em: string;
  subtotal_cents: number;
  itens: CarrinhoItem[];
}

export interface AddItemToCartInput {
  variacao_id: string;
  quantidade: number;
}

export interface UpdateCartItemInput {
  quantidade: number;
}

export interface CheckoutInput {
  endereco_entrega_id: string;
  endereco_cobranca_id?: string;
  cupom_codigo?: string;
  frete_selecionado: {
    nome: string;
    tipo: string;
    prazo_dias: number;
    valor_cents: number;
    transportadora?: string;
  };
  pagamento: {
    gateway: string;
    metodo: string;
    parcelas?: number;
  };
}

export interface CheckoutResponse {
  pedido_id: string;
  pagamento_id: string;
  status: string;
  payment_url?: string;
  pix_qr_code?: string;
  pix_qr_code_base64?: string;
  expires_at?: string;
}

export interface Pedido {
  id: string;
  loja_id: string;
  cliente_id: string;
  numero_sequencial: number;
  status: string;
  subtotal_cents: number;
  desconto_cents: number;
  frete_cents: number;
  total_cents: number;
  cupom_id: string | null;
  endereco_entrega_id: string;
  endereco_cobranca_id: string;
  observacoes_cliente: string | null;
  observacoes_internas: string | null;
  pago_em: string | null;
  enviado_em: string | null;
  entregue_em: string | null;
  cancelado_em: string | null;
  cancelamento_motivo: string | null;
  created_at: string;
  updated_at: string;
  itens: PedidoItem[];
  endereco_entrega: Endereco;
  endereco_cobranca: Endereco;
  cupom: Cupom | null;
  pagamentos: Pagamento[];
  eventos: PedidoEvento[];
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  produto_id: string;
  variacao_id: string;
  nome_produto: string;
  sku: string;
  quantidade: number;
  preco_unitario_cents: number;
  total_cents: number;
  variacao?: {
    id: string;
    sku: string;
    nome: string;
    preco_cents: number | null;
    ativo: boolean;
    imagens: { url: string; alt_text: string | null; principal: boolean }[];
  };
}

export interface Endereco {
  id: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Cupom {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  valor: number;
}

export interface Pagamento {
  id: string;
  gateway: string;
  metodo: string;
  status: string;
  valor_cents: number;
  parcelas: number;
  juros_cents: number;
  gateway_transaction_id: string | null;
  aprovado_em: string | null;
  estornado_em: string | null;
}

export interface PedidoEvento {
  id: string;
  tipo: string;
  descricao: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface PedidosListResponse {
  data: Pedido[];
  nextCursor: string | null;
  total: number;
}

export interface ApplyCupomInput {
  codigo: string;
}

export interface ApplyCupomResponse {
  valido: boolean;
  desconto_cents: number;
  mensagem?: string;
  cupom?: {
    id: string;
    codigo: string;
    nome: string;
    tipo: string;
    valor: number;
  };
}

export interface FreteOpcao {
  nome: string;
  tipo: string;
  prazo_dias: number;
  valor_cents: number;
  transportadora?: string;
}

export interface CalcularFreteResponse {
  opcoes: FreteOpcao[];
  cep_origem: string;
  cep_destino: string;
}

export interface AdminStats {
  pedidosPendentes: number;
  vendasHoje: number;
}

export interface AdminProdutoListResponse {
  data: Produto[];
  nextCursor: string | null;
  total: number;
}

export interface AdminPedidoListResponse {
  data: Pedido[];
  nextCursor: string | null;
  total: number;
}

export interface AdminCategoriaListResponse {
  data: Categoria[];
  nextCursor: string | null;
  total: number;
}

export interface CreateCategoriaInput {
  loja_id: string;
  nome: string;
  slug: string;
  descricao?: string;
  imagem_url?: string;
  pai_id?: string;
  ordem_exibicao?: number;
}

export interface UpdateCategoriaInput {
  nome?: string;
  slug?: string;
  descricao?: string;
  imagem_url?: string;
  pai_id?: string;
  ordem_exibicao?: number;
  ativa?: boolean;
}

export interface CreateProdutoInput {
  loja_id: string;
  categoria_id: string;
  nome: string;
  slug: string;
  sku: string;
  descricao_curta?: string;
  descricao_completa?: string;
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
  status?: string;
}

export interface UpdateProdutoInput {
  nome?: string;
  slug?: string;
  descricao_curta?: string;
  descricao_completa?: string;
  sku?: string;
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
  status?: string;
  categoria_id?: string;
}

export interface UpdatePedidoStatusInput {
  status: string;
  observacoes_internas?: string;
}
