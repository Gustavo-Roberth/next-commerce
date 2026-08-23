export const ORDER_STATUS_LABELS: Record<string, string> = {
  CRIADO: 'Criado',
  PAGAMENTO_PENDENTE: 'Pagamento Pendente',
  PAGO: 'Pago',
  SEPARANDO: 'Separando',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  CRIADO: 'gray',
  PAGAMENTO_PENDENTE: 'yellow',
  PAGO: 'blue',
  SEPARANDO: 'purple',
  ENVIADO: 'indigo',
  ENTREGUE: 'green',
  CANCELADO: 'red',
};

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  CRIADO: ['PAGAMENTO_PENDENTE', 'CANCELADO'],
  PAGAMENTO_PENDENTE: ['PAGO', 'CANCELADO', 'EXPIRADO'],
  PAGO: ['SEPARANDO', 'CANCELADO'],
  SEPARANDO: ['ENVIADO', 'CANCELADO'],
  ENVIADO: ['ENTREGUE', 'CANCELADO'],
  ENTREGUE: [],
  CANCELADO: [],
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  INICIADO: 'Iniciado',
  PROCESSANDO: 'Processando',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
  EXPIRADO: 'Expirado',
  ESTORNADO: 'Estornado',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  INICIADO: 'gray',
  PROCESSANDO: 'yellow',
  APROVADO: 'green',
  RECUSADO: 'red',
  EXPIRADO: 'orange',
  ESTORNADO: 'purple',
};

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  ARQUIVADO: 'Arquivado',
};

export const PRODUCT_STATUS_COLORS: Record<string, string> = {
  RASCUNHO: 'gray',
  ATIVO: 'green',
  INATIVO: 'yellow',
  ARQUIVADO: 'gray',
};

export const CATEGORY_STATUS_LABELS: Record<string, string> = {
  ATIVA: 'Ativa',
  INATIVA: 'Inativa',
};

export const CUPOM_STATUS_LABELS: Record<string, string> = {
  ATIVO: 'Ativo',
  EXPIRADO: 'Expirado',
  ESGOTADO: 'Esgotado',
  DESATIVADO: 'Desativado',
};

export const CUPOM_TYPE_LABELS: Record<string, string> = {
  PERCENTUAL: 'Percentual',
  VALOR_FIXO: 'Valor Fixo',
  FRETE_GRATIS: 'Frete Grátis',
};

export const ENDERECO_TIPO_LABELS: Record<string, string> = {
  ENTREGA: 'Entrega',
  COBRANCA: 'Cobrança',
  RETIRADA: 'Retirada',
};

export const ESTOQUE_MOVIMENTO_LABELS: Record<string, string> = {
  ENTRADA_COMPRA: 'Entrada - Compra',
  ENTRADA_DEVOLUCAO: 'Entrada - Devolução',
  ENTRADA_AJUSTE: 'Entrada - Ajuste',
  SAIDA_VENDA: 'Saída - Venda',
  SAIDA_PERDA: 'Saída - Perda',
  SAIDA_DOACAO: 'Saída - Doação',
  SAIDA_AJUSTE: 'Saída - Ajuste',
  TRANSFERENCIA_SAIDA: 'Transferência - Saída',
  TRANSFERENCIA_ENTRADA: 'Transferência - Entrada',
  RESERVA: 'Reserva',
  LIBERACAO_RESERVA: 'Liberação de Reserva',
};

export const AVALIACAO_STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
};

export const RASTREAMENTO_STATUS_LABELS: Record<string, string> = {
  COLETADO: 'Coletado',
  EM_TRANSITO: 'Em Trânsito',
  SAIU_ENTREGA: 'Saiu para Entrega',
  ENTREGUE: 'Entregue',
  DEVOLVIDO: 'Devolvido',
};

export const RASTREAMENTO_STATUS_COLORS: Record<string, string> = {
  COLETADO: 'blue',
  EM_TRANSITO: 'purple',
  SAIU_ENTREGA: 'indigo',
  ENTREGUE: 'green',
  DEVOLVIDO: 'red',
};

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] || status;
}

export function getOrderStatusColor(status: string): string {
  return ORDER_STATUS_COLORS[status] || 'gray';
}

export function canTransitionOrderStatus(from: string, to: string): boolean {
  const allowed = ORDER_STATUS_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function getPaymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] || status;
}

export function getPaymentStatusColor(status: string): string {
  return PAYMENT_STATUS_COLORS[status] || 'gray';
}

export function getProductStatusLabel(status: string): string {
  return PRODUCT_STATUS_LABELS[status] || status;
}

export function getProductStatusColor(status: string): string {
  return PRODUCT_STATUS_COLORS[status] || 'gray';
}

export function getCupomStatusLabel(status: string): string {
  return CUPOM_STATUS_LABELS[status] || status;
}

export function getCupomTypeLabel(tipo: string): string {
  return CUPOM_TYPE_LABELS[tipo] || tipo;
}

export function getEnderecoTipoLabel(tipo: string): string {
  return ENDERECO_TIPO_LABELS[tipo] || tipo;
}

export function getEstoqueMovimentoLabel(tipo: string): string {
  return ESTOQUE_MOVIMENTO_LABELS[tipo] || tipo;
}

export function getAvaliacaoStatusLabel(status: string): string {
  return AVALIACAO_STATUS_LABELS[status] || status;
}

export function getRastreamentoStatusLabel(status: string): string {
  return RASTREAMENTO_STATUS_LABELS[status] || status;
}

export function getRastreamentoStatusColor(status: string): string {
  return RASTREAMENTO_STATUS_COLORS[status] || 'gray';
}
