import { criptografar, descriptografar } from '../lib/crypto.js';
import { prisma } from '../lib/prisma.js';
import type { AtualizarPagamentoInput, CriarPagamentoInput } from '../schemas/config.schemas.js';

const SELECAO = {
  id: true,
  loja_id: true,
  gateway: true,
  parcelamento_max: true,
  juros_parcela: true,
  ativo: true,
  modo_teste: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
} as const;

export async function listarPagamentos(lojaId: string) {
  return prisma.configuracaoPagamento.findMany({
    where: { loja_id: lojaId, deleted_at: null },
    select: SELECAO,
    orderBy: { gateway: 'asc' },
  });
}

export async function buscarPagamentoPorId(lojaId: string, id: string) {
  return prisma.configuracaoPagamento.findFirst({
    where: { loja_id: lojaId, id, deleted_at: null },
    select: SELECAO,
  });
}

export async function buscarCredenciaisPagamento(lojaId: string, id: string) {
  const config = await prisma.configuracaoPagamento.findFirst({
    where: { loja_id: lojaId, id, deleted_at: null },
  });
  if (!config) return null;
  const credenciais = descriptografar<Record<string, unknown>>(
    lojaId,
    config.credenciais_criptografadas
  );
  return { ...config, credenciais_criptografadas: undefined, credenciais };
}

export async function criarPagamento(lojaId: string, input: CriarPagamentoInput) {
  const credenciais_criptografadas = criptografar(lojaId, input.credenciais);
  return prisma.configuracaoPagamento.upsert({
    where: { loja_id_gateway: { loja_id: lojaId, gateway: input.gateway } },
    create: {
      loja_id: lojaId,
      gateway: input.gateway,
      credenciais_criptografadas,
      parcelamento_max: input.parcelamento_max,
      juros_parcela: input.juros_parcela ?? {},
      ativo: input.ativo,
      modo_teste: input.modo_teste,
    },
    update: {
      credenciais_criptografadas,
      parcelamento_max: input.parcelamento_max,
      juros_parcela: input.juros_parcela ?? {},
      ativo: input.ativo,
      modo_teste: input.modo_teste,
    },
    select: SELECAO,
  });
}

export async function atualizarPagamento(
  lojaId: string,
  id: string,
  input: AtualizarPagamentoInput
) {
  const data: Record<string, unknown> = { loja_id: lojaId };
  if (input.credenciais !== undefined) {
    data.credenciais_criptografadas = criptografar(lojaId, input.credenciais);
  }
  if (input.parcelamento_max !== undefined) data.parcelamento_max = input.parcelamento_max;
  if (input.juros_parcela !== undefined) data.juros_parcela = input.juros_parcela;
  if (input.ativo !== undefined) data.ativo = input.ativo;
  if (input.modo_teste !== undefined) data.modo_teste = input.modo_teste;
  if (input.gateway !== undefined) data.gateway = input.gateway;
  return prisma.configuracaoPagamento.update({ where: { id }, data, select: SELECAO });
}

export async function removerPagamento(lojaId: string, id: string): Promise<void> {
  await prisma.configuracaoPagamento.update({
    where: { id, loja_id: lojaId },
    data: { deleted_at: new Date(), ativo: false },
  });
}

export async function alternarPagamento(lojaId: string, id: string, ativo: boolean) {
  return prisma.configuracaoPagamento.update({
    where: { id },
    data: { ativo, loja_id: lojaId },
    select: SELECAO,
  });
}
