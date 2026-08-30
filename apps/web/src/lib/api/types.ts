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
  notas_fiscais?: NotaFiscal[];
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

export interface NotaFiscal {
  id: string;
  pedido_id: string;
  numero: string | null;
  serie: string | null;
  chave_acesso: string | null;
  xml_url: string | null;
  pdf_url: string | null;
  status: string;
  erro_mensagem: string | null;
  emitida_em: string | null;
  autorizada_em: string | null;
  cancelada_em: string | null;
  created_at: string;
  updated_at: string;
}

export type RelatorioTipo = 'vendas-diario' | 'produtos-top' | 'estoque-baixo' | 'conciliacao';

export interface RelatorioColuna {
  chave: string;
  rotulo: string;
  formato?: 'cents' | 'date' | 'numero';
}

export interface RelatorioConsulta {
  tipo: RelatorioTipo;
  titulo: string;
  colunas: RelatorioColuna[];
  linhas: Record<string, unknown>[];
}

export type RelatorioFormato = 'CSV' | 'PDF';
export type RelatorioFrequencia = 'DIARIO' | 'SEMANAL' | 'MENSAL';

export interface ReportSchedule {
  id: string;
  loja_id: string;
  tipo: RelatorioTipo;
  formato: RelatorioFormato;
  email_destino: string;
  frequencia: RelatorioFrequencia;
  hora: number;
  dia_semana?: number | null;
  dia_mes?: number | null;
  ativo: boolean;
  ultimo_envio_em?: string | null;
  proximo_envio_em?: string | null;
  criado_por?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReportScheduleInput {
  tipo: RelatorioTipo;
  formato: RelatorioFormato;
  email_destino: string;
  frequencia: RelatorioFrequencia;
  hora?: number;
  dia_semana?: number;
  dia_mes?: number;
}

export interface ReportScheduleListResponse {
  data: ReportSchedule[];
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

export interface Deposito {
  id: string;
  loja_id: string;
  nome: string;
  codigo: string;
  endereco_completo: string;
  padrao: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepositoListResponse {
  data: Deposito[];
  nextCursor: string | null;
  total: number;
}

export interface EstoqueItem {
  id: string;
  loja_id: string;
  variacao_id: string;
  deposito_id: string;
  quantidade_fisica: number;
  quantidade_reservada: number;
  quantidade_minima: number;
  quantidade_maxima: number | null;
  custo_medio_cents: number;
  disponivel: number;
  created_at: string;
  variacao?: { sku: string; nome: string } | null;
}

export interface EstoqueListResponse {
  data: EstoqueItem[];
  nextCursor: string | null;
  total: number;
}

export interface EstoqueDashboard {
  total_itens: number;
  quantidade_baixa: number;
  quantidade_zerada: number;
  total_fisico: number;
}

export interface CreateDepositoInput {
  nome: string;
  codigo: string;
  endereco_completo: string;
  padrao?: boolean;
}

export interface UpdateDepositoInput {
  nome?: string;
  codigo?: string;
  endereco_completo?: string;
  padrao?: boolean;
  ativo?: boolean;
}

export type EstoqueMovimentoTipoValue =
  | 'ENTRADA_COMPRA'
  | 'ENTRADA_DEVOLUCAO'
  | 'ENTRADA_AJUSTE'
  | 'SAIDA_VENDA'
  | 'SAIDA_PERDA'
  | 'SAIDA_DOACAO'
  | 'SAIDA_AJUSTE';

export type EstoqueReferenciaTipoValue =
  | 'PEDIDO'
  | 'NOTA_COMPRA'
  | 'AJUSTE'
  | 'INVENTARIO'
  | 'TRANSFERENCIA';

export interface CreateMovimentoInput {
  variacao_id: string;
  deposito_id: string;
  tipo: EstoqueMovimentoTipoValue;
  quantidade: number;
  custo_unitario_cents?: number;
  referencia_tipo: EstoqueReferenciaTipoValue;
  referencia_id?: string;
  observacao?: string;
}

export interface TransferenciaEstoqueInput {
  variacao_id: string;
  deposito_origem_id: string;
  deposito_destino_id: string;
  quantidade: number;
  observacao?: string;
}

export interface InventarioItemInput {
  variacao_id: string;
  quantidade_contada: number;
}

export interface InventarioEstoqueInput {
  deposito_id: string;
  itens: InventarioItemInput[];
  observacao?: string;
}

// ===================== Configurações (FASE 3.4) =====================

export interface LojaTema {
  cor_primaria?: string;
  cor_secundaria?: string;
  fonte?: string;
}

export interface LojaSeo {
  title?: string;
  description?: string;
  og_image?: string;
}

export interface LojaConfig {
  id: string;
  nome: string;
  slug: string;
  documento?: string;
  email_contato?: string;
  telefone?: string;
  dominio?: string;
  endereco?: Record<string, unknown>;
  moeda: string;
  fuso_horario?: string;
  idioma?: string;
  tema: LojaTema;
  seo: LojaSeo;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type FreteTipo =
  | 'GRATIS_VALOR'
  | 'GRATIS_REGIAO'
  | 'TABELA_PRECO'
  | 'CORREIOS'
  | 'TRANSPORTADORA';

export interface FreteRegiao {
  cep_inicio: string;
  cep_fim: string;
}

export interface FreteFaixa {
  ate_kg: number;
  valor_cents: number;
  prazo_dias?: number;
}

export interface FreteConfiguracao {
  valor_minimo_cents?: number;
  regioes?: FreteRegiao[];
  faixas?: FreteFaixa[];
  valor_cents?: number;
  prazo_dias?: number;
}

export interface ConfiguracaoFrete {
  id: string;
  loja_id: string;
  nome: string;
  tipo: FreteTipo;
  configuracao: FreteConfiguracao;
  prioridade: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CriarFreteInput {
  nome: string;
  tipo: FreteTipo;
  configuracao: FreteConfiguracao;
  prioridade?: number;
  ativo?: boolean;
}

export type AtualizarFreteInput = Partial<CriarFreteInput>;

export interface CalcularFreteInput {
  cep_destino: string;
  subtotal_cents: number;
  peso_kg?: number;
  itens?: { variacao_id: string; quantidade: number }[];
}

export interface OpcaoFrete {
  id: string;
  nome: string;
  tipo: FreteTipo;
  valor_cents: number;
  prazo_dias?: number;
  frete_gratis: boolean;
  observacao?: string;
}

export type PagamentoMetodo =
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'BOLETO'
  | 'TRANSFERENCIA'
  | 'DINHEIRO'
  | 'CARTAO'
  | 'OUTRO';

export interface ConfiguracaoPagamento {
  id: string;
  loja_id: string;
  metodo: PagamentoMetodo;
  nome: string;
  ativo: boolean;
  instrucoes?: string;
  parcelas_max?: number;
  juros_parcela?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface CriarPagamentoInput {
  metodo: PagamentoMetodo;
  nome: string;
  credenciais?: Record<string, unknown>;
  ativo?: boolean;
  instrucoes?: string;
  parcelas_max?: number;
  juros_parcela?: Record<string, number>;
}

export type AtualizarPagamentoInput = Partial<CriarPagamentoInput>;

export interface AtualizarLojaInput {
  nome?: string | undefined;
  documento?: string | undefined;
  email_contato?: string | undefined;
  telefone?: string | undefined;
  dominio?: string | undefined;
  moeda?: string | undefined;
  fuso_horario?: string | undefined;
  idioma?: string | undefined;
  tema?: LojaTema | undefined;
  seo?: LojaSeo | undefined;
  ativo?: boolean | undefined;
}

export type CupomTipo = 'PERCENTUAL' | 'VALOR_FIXO' | 'FRETE_GRATIS';
export type CupomStatus = 'ATIVO' | 'DESATIVADO' | 'EXPIRADO';

export interface CupomConfig {
  id: string;
  loja_id: string;
  codigo: string;
  nome: string;
  tipo: CupomTipo;
  valor: number;
  valor_minimo_pedido_cents: number;
  uso_maximo_total: number | null;
  uso_maximo_por_cliente: number | null;
  valido_de: string;
  valido_ate: string;
  categorias_aplicaveis: string[];
  produtos_aplicaveis: string[];
  primeira_compra_only: boolean;
  ativo: boolean;
  status: CupomStatus;
  uso_atual: number;
  created_at: string;
  updated_at: string;
}

export interface CriarCupomInput {
  codigo: string;
  nome: string;
  tipo: CupomTipo;
  valor: number;
  valor_minimo_pedido_cents?: number;
  uso_maximo_total?: number;
  uso_maximo_por_cliente?: number;
  valido_de: string;
  valido_ate: string;
  categorias_aplicaveis?: string[];
  produtos_aplicaveis?: string[];
  primeira_compra_only?: boolean;
  ativo?: boolean;
}

export type AtualizarCupomInput = Partial<CriarCupomInput>;

export interface ValidarCupomInput {
  codigo: string;
  cliente_id?: string;
  subtotal_cents: number;
  categorias?: string[];
  produtos?: string[];
}

export interface ResultadoValidacaoCupom {
  valido: boolean;
  cupom_id?: string;
  codigo?: string;
  tipo?: CupomTipo;
  valor?: number;
  desconto_cents: number;
  frete_gratis: boolean;
  mensagem?: string;
}

export type EmailTemplateTipo =
  | 'BOAS_VINDAS'
  | 'CONFIRMACAO_PEDIDO'
  | 'ENVIADO'
  | 'ENTREGUE'
  | 'TROCA_SENHA'
  | 'CUPOM'
  | 'OUTRO';

export interface EmailTemplate {
  id: string;
  loja_id: string;
  codigo: string;
  nome: string;
  assunto: string;
  tipo: EmailTemplateTipo;
  corpo_mjml: string;
  variaveis: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CriarEmailTemplateInput {
  codigo: string;
  nome: string;
  assunto: string;
  tipo: EmailTemplateTipo;
  corpo_mjml: string;
  variaveis?: string[];
  ativo?: boolean;
}

export type AtualizarEmailTemplateInput = Partial<CriarEmailTemplateInput>;

export type IntegracaoTipo =
  | 'MARKETPLACE'
  | 'ERP'
  | 'GATEWAY'
  | 'LOGISTICA'
  | 'MARKETING'
  | 'OUTRO';

export interface Integracao {
  id: string;
  loja_id: string;
  nome: string;
  tipo: IntegracaoTipo;
  ativo: boolean;
  configuracao?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CriarIntegracaoInput {
  nome: string;
  tipo: IntegracaoTipo;
  credenciais?: Record<string, unknown>;
  configuracao?: Record<string, unknown>;
  ativo?: boolean;
}

export type AtualizarIntegracaoInput = Partial<CriarIntegracaoInput>;
