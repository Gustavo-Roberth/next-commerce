export * from './types';
export * from './schemas';
export * from './constants';
export * from './utils';

// Re-export commonly used types from schemas for convenience
export type {
  LoginInput,
  RegisterInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ChangePasswordInput,
  LoginResponse,
  UserProfile,
} from './schemas/auth.schemas';

export type {
  CreateProdutoInput,
  UpdateProdutoInput,
  ProdutoParams,
  ProdutoListQuery,
  ProdutoVariacaoInput,
  UpdateProdutoVariacaoInput,
  ProdutoAtributoInput,
  UpdateProdutoAtributoInput,
  ProdutoVariacaoAtributoInput,
  ProdutoImagemInput,
  CategoriaInput,
  UpdateCategoriaInput,
  CategoriaParams,
  EnderecoInput,
  UpdateEnderecoInput,
  EnderecoParams,
  FreteConfigInput,
  UpdateFreteConfigInput,
  FreteConfigParams,
  CalcularFreteInput,
  FreteOpcao,
  CalcularFreteResponse,
} from './schemas/product.schemas';

export type {
  CreatePedidoInput,
  UpdatePedidoStatusInput,
  PedidoParams,
  PedidoListQuery,
  ItemPedidoInput,
  CupomInput,
  UpdateCupomInput,
  CupomParams,
  ApplyCupomInput,
  ApplyCupomResponse,
  CarrinhoItemInput,
  UpdateCarrinhoItemInput,
  CarrinhoParams,
  AvaliacaoInput,
  UpdateAvaliacaoInput,
  AvaliacaoParams,
  FavoritoInput,
  FavoritoParams,
} from './schemas/order.schemas';

export type {
  CreatePagamentoInput,
  UpdatePagamentoStatusInput,
  PagamentoParams,
  PagamentoListQuery,
  CheckoutInput,
  CheckoutResponse,
  MercadoPagoWebhookPayload,
  PixQrCode,
} from './schemas/payment.schemas';

export type {
  CreateEstoqueInput,
  UpdateEstoqueInput,
  EstoqueParams,
  EstoqueListQuery,
  CreateDepositoInput,
  UpdateDepositoInput,
  DepositoParams,
  CreateEstoqueMovimentoInput,
  EstoqueMovimentoParams,
  EstoqueMovimentoListQuery,
  ReservaEstoqueInput,
  LiberaReservaInput,
  TransferenciaEstoqueInput,
  InventarioInput,
} from './schemas/stock.schemas';

export type {
  ConfiguracaoPagamentoInput,
  UpdateConfiguracaoPagamentoInput,
  ConfiguracaoPagamentoParams,
  ConfiguracaoPagamentoListQuery,
  WebhookEventInput,
  WebhookEventParams,
  WebhookEventListQuery,
  AuditLogInput,
  AuditLogListQuery,
} from './schemas/config.schemas';

export type { NotaFiscal, NotaFiscalStatus } from './schemas/nfe.schemas';

export type {
  RastreamentoEvento,
  TrackingWebhookPayload,
  TrackingResponse,
  AddTrackingEventInput,
  TrackingTimelineQuery,
} from './schemas/tracking.schemas';
