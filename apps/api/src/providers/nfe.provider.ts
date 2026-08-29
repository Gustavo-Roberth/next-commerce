export interface NfeEndereco {
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface NfeEmitente {
  cnpj: string;
  nome: string;
  inscricao_estadual?: string | null;
  inscricao_municipal?: string | null;
  endereco: NfeEndereco;
}

export interface NfeDestinatario {
  tipo: 'CPF' | 'CNPJ';
  documento: string;
  nome: string;
  email?: string | null;
  endereco: NfeEndereco;
}

export interface NfeItem {
  sku: string;
  descricao: string;
  ncm: string | null;
  cfop: string;
  quantidade: number;
  unidade: string;
  valor_unitario_cents: number;
}

export interface NfeEmissaoInput {
  emitente: NfeEmitente;
  destinatario: NfeDestinatario;
  itens: NfeItem[];
  valor_frete_cents: number;
  valor_desconto_cents: number;
  natureza_operacao: string;
}

export interface NfeEmissaoResult {
  chave_acesso: string;
  numero: string;
  serie: string;
  xml: string;
  pdf: string;
  protocolo: string;
}

export interface NfeProvider {
  emitir(input: NfeEmissaoInput): Promise<NfeEmissaoResult>;
}

const NFE_PROVIDER_URL = process.env.NFE_PROVIDER_URL;
const NFE_PROVIDER_TOKEN = process.env.NFE_PROVIDER_TOKEN;

interface NfeProviderHttpResponse {
  chave_acesso?: string;
  chaveAcesso?: string;
  numero?: string;
  serie?: string;
  xml?: string;
  pdf?: string;
  protocolo?: string;
}

export const httpNfeProvider: NfeProvider = {
  async emitir(input: NfeEmissaoInput): Promise<NfeEmissaoResult> {
    if (!NFE_PROVIDER_URL) {
      throw new Error('Provedor de NF-e não configurado (NFE_PROVIDER_URL ausente)');
    }

    const response = await fetch(`${NFE_PROVIDER_URL.replace(/\/$/, '')}/nfe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(NFE_PROVIDER_TOKEN ? { Authorization: `Bearer ${NFE_PROVIDER_TOKEN}` } : {}),
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const texto = await response.text().catch(() => '');
      throw new Error(`Falha na emissão da NF-e (HTTP ${response.status}): ${texto.slice(0, 500)}`);
    }

    const data = (await response.json()) as NfeProviderHttpResponse;
    const chave_acesso = data.chave_acesso ?? data.chaveAcesso;
    if (!chave_acesso || !data.xml || !data.pdf) {
      throw new Error('Resposta do provedor de NF-e incompleta (chave/xml/pdf)');
    }

    return {
      chave_acesso,
      numero: data.numero ?? '',
      serie: data.serie ?? '',
      xml: data.xml,
      pdf: data.pdf,
      protocolo: data.protocolo ?? '',
    };
  },
};

export const nfeProvider: NfeProvider = httpNfeProvider;
