export type NotaFiscalStatus = 'PENDENTE' | 'EMITIDA' | 'ERRO' | 'CANCELADA';

export interface NotaFiscalResponse {
  id: string;
  pedido_id: string;
  numero: string | null;
  serie: string | null;
  chave_acesso: string | null;
  xml_url: string | null;
  pdf_url: string | null;
  status: NotaFiscalStatus;
  erro_mensagem: string | null;
  emitida_em: string | null;
  autorizada_em: string | null;
  cancelada_em: string | null;
  created_at: string;
  updated_at: string;
}
