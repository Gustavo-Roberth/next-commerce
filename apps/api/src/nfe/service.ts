import { prisma } from '../lib/prisma.js';
import {
  type NfeEmitente,
  type NfeEndereco,
  type NfeProvider,
  nfeProvider,
} from '../providers/nfe.provider.js';
import { STORAGE_BUCKETS, createSignedUrl, uploadFile } from '../providers/storage.provider.js';
import type { NotaFiscalResponse, NotaFiscalStatus } from '../schemas/nfe.schemas.js';

const CFOP_VENDA = process.env.NFE_CFOP_PADRAO ?? '5910';
const UNIDADE_PADRAO = 'UN';

function emitenteEnderecoFallback(): NfeEndereco {
  const bruto = process.env.NFE_EMITENTE_ENDERECO;
  if (bruto) {
    try {
      return JSON.parse(bruto) as NfeEndereco;
    } catch {
      // ignora JSON inválido e usa fallback vazio
    }
  }
  return {
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
  };
}

function buildEmitente(lojaNome: string): NfeEmitente {
  return {
    cnpj: process.env.NFE_EMITENTE_CNPJ ?? '',
    nome: process.env.NFE_EMITENTE_NOME ?? lojaNome,
    inscricao_estadual: process.env.NFE_EMITENTE_IE ?? null,
    inscricao_municipal: process.env.NFE_EMITENTE_IM ?? null,
    endereco: emitenteEnderecoFallback(),
  };
}

function documentoTipo(documento: string): 'CPF' | 'CNPJ' {
  const apenasNumeros = documento.replace(/\D/g, '');
  return apenasNumeros.length === 14 ? 'CNPJ' : 'CPF';
}

async function resolverUrlAssinada(
  bucket: (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS],
  path: string | null
): Promise<string | null> {
  if (!path) return null;
  try {
    return await createSignedUrl(bucket, path, 3600);
  } catch {
    return path;
  }
}

export async function emitirNotaFiscalPedido(
  pedidoId: string,
  lojaId: string,
  usuarioId: string | undefined,
  provider: NfeProvider = nfeProvider
): Promise<void> {
  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, loja_id: lojaId },
    include: {
      itens: { include: { produto: true } },
      cliente: true,
      endereco_entrega: true,
      loja: true,
    },
  });

  if (!pedido) {
    throw new Error('Pedido não encontrado para emissão de NF-e');
  }

  const emitente = buildEmitente(pedido.loja.nome);
  const destinatario = {
    tipo: documentoTipo(pedido.cliente.cpf_cnpj ?? ''),
    documento: pedido.cliente.cpf_cnpj ?? '',
    nome: pedido.cliente.nome_completo,
    email: pedido.cliente.email,
    endereco: {
      logradouro: pedido.endereco_entrega.logradouro,
      numero: pedido.endereco_entrega.numero,
      complemento: pedido.endereco_entrega.complemento,
      bairro: pedido.endereco_entrega.bairro,
      cidade: pedido.endereco_entrega.cidade,
      uf: pedido.endereco_entrega.uf,
      cep: pedido.endereco_entrega.cep,
    },
  };

  const itens = pedido.itens.map((item) => ({
    sku: item.sku,
    descricao: item.nome_produto,
    ncm: item.produto.ncm ?? null,
    cfop: CFOP_VENDA,
    quantidade: item.quantidade,
    unidade: UNIDADE_PADRAO,
    valor_unitario_cents: item.preco_unitario_cents,
  }));

  try {
    const resultado = await provider.emitir({
      emitente,
      destinatario,
      itens,
      valor_frete_cents: pedido.frete_cents,
      valor_desconto_cents: pedido.desconto_cents,
      natureza_operacao: 'Venda de mercadoria',
    });

    const xmlPath = await uploadFile({
      bucket: STORAGE_BUCKETS.NFE_XML,
      path: `${lojaId}/${pedidoId}.xml`,
      file: Buffer.from(resultado.xml, 'utf-8'),
      contentType: 'application/xml',
      upsert: true,
    });

    const pdfPath = await uploadFile({
      bucket: STORAGE_BUCKETS.NFE_PDF,
      path: `${lojaId}/${pedidoId}.pdf`,
      file: Buffer.from(resultado.pdf, 'base64'),
      contentType: 'application/pdf',
      upsert: true,
    });

    const agora = new Date();
    await prisma.notaFiscal.upsert({
      where: { pedido_id: pedidoId },
      create: {
        pedido_id: pedidoId,
        numero: resultado.numero,
        serie: resultado.serie,
        chave_acesso: resultado.chave_acesso,
        xml_url: xmlPath.path,
        pdf_url: pdfPath.path,
        status: 'EMITIDA',
        emitida_em: agora,
        autorizada_em: agora,
      },
      update: {
        numero: resultado.numero,
        serie: resultado.serie,
        chave_acesso: resultado.chave_acesso,
        xml_url: xmlPath.path,
        pdf_url: pdfPath.path,
        status: 'EMITIDA',
        emitida_em: agora,
        autorizada_em: agora,
        erro_mensagem: null,
      },
    });

    await prisma.pedidoEvento.create({
      data: {
        pedido_id: pedidoId,
        tipo: 'NFE_EMITIDA',
        descricao: `NF-e emitida (chave ${resultado.chave_acesso})`,
        usuario_id: usuarioId ?? null,
        metadata: { chave_acesso: resultado.chave_acesso, protocolo: resultado.protocolo },
      },
    });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido na emissão';
    await prisma.notaFiscal.upsert({
      where: { pedido_id: pedidoId },
      create: {
        pedido_id: pedidoId,
        status: 'ERRO',
        erro_mensagem: mensagem,
      },
      update: {
        status: 'ERRO',
        erro_mensagem: mensagem,
      },
    });

    await prisma.pedidoEvento.create({
      data: {
        pedido_id: pedidoId,
        tipo: 'NFE_ERRO',
        descricao: `Falha na emissão da NF-e: ${mensagem.slice(0, 300)}`,
        usuario_id: usuarioId ?? null,
        metadata: { erro: mensagem },
      },
    });

    throw error;
  }
}

export async function mapearNotaFiscalResposta(nota: {
  id: string;
  pedido_id: string;
  numero: string | null;
  serie: string | null;
  chave_acesso: string | null;
  xml_url: string | null;
  pdf_url: string | null;
  status: string;
  erro_mensagem: string | null;
  emitida_em: Date | null;
  autorizada_em: Date | null;
  cancelada_em: Date | null;
  created_at: Date;
  updated_at: Date;
}): Promise<NotaFiscalResponse> {
  return {
    id: nota.id,
    pedido_id: nota.pedido_id,
    numero: nota.numero,
    serie: nota.serie,
    chave_acesso: nota.chave_acesso,
    xml_url: await resolverUrlAssinada(STORAGE_BUCKETS.NFE_XML, nota.xml_url),
    pdf_url: await resolverUrlAssinada(STORAGE_BUCKETS.NFE_PDF, nota.pdf_url),
    status: nota.status as NotaFiscalStatus,
    erro_mensagem: nota.erro_mensagem,
    emitida_em: nota.emitida_em ? nota.emitida_em.toISOString() : null,
    autorizada_em: nota.autorizada_em ? nota.autorizada_em.toISOString() : null,
    cancelada_em: nota.cancelada_em ? nota.cancelada_em.toISOString() : null,
    created_at: nota.created_at.toISOString(),
    updated_at: nota.updated_at.toISOString(),
  };
}
