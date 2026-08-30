import { criptografar, descriptografar } from '../lib/crypto.js';
import { prisma } from '../lib/prisma.js';
import type { AtualizarIntegracaoInput, CriarIntegracaoInput } from '../schemas/config.schemas.js';

const SELECAO = {
  id: true,
  loja_id: true,
  tipo: true,
  nome: true,
  ativo: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
} as const;

export async function listarIntegracoes(lojaId: string) {
  return prisma.integracao.findMany({
    where: { loja_id: lojaId, deleted_at: null },
    select: SELECAO,
    orderBy: { nome: 'asc' },
  });
}

export async function buscarIntegracaoPorId(lojaId: string, id: string) {
  return prisma.integracao.findFirst({
    where: { loja_id: lojaId, id, deleted_at: null },
    select: SELECAO,
  });
}

export async function buscarCredenciaisIntegracao(lojaId: string, id: string) {
  const integracao = await prisma.integracao.findFirst({
    where: { loja_id: lojaId, id, deleted_at: null },
  });
  if (!integracao) return null;
  const credenciais = descriptografar<Record<string, unknown>>(
    lojaId,
    integracao.credenciais_criptografadas
  );
  return { ...integracao, credenciais_criptografadas: undefined, credenciais };
}

export async function criarIntegracao(lojaId: string, input: CriarIntegracaoInput) {
  const credenciais_criptografadas = criptografar(lojaId, input.credenciais);
  return prisma.integracao.create({
    data: {
      loja_id: lojaId,
      tipo: input.tipo,
      nome: input.nome,
      credenciais_criptografadas,
      ativo: input.ativo,
    },
    select: SELECAO,
  });
}

export async function atualizarIntegracao(
  lojaId: string,
  id: string,
  input: AtualizarIntegracaoInput
) {
  const data: Record<string, unknown> = { loja_id: lojaId };
  if (input.credenciais !== undefined) {
    data.credenciais_criptografadas = criptografar(lojaId, input.credenciais);
  }
  if (input.tipo !== undefined) data.tipo = input.tipo;
  if (input.nome !== undefined) data.nome = input.nome;
  if (input.ativo !== undefined) data.ativo = input.ativo;
  return prisma.integracao.update({ where: { id }, data, select: SELECAO });
}

export async function removerIntegracao(lojaId: string, id: string): Promise<void> {
  await prisma.integracao.update({
    where: { id, loja_id: lojaId },
    data: { deleted_at: new Date(), ativo: false },
  });
}

export async function alternarIntegracao(lojaId: string, id: string, ativo: boolean) {
  return prisma.integracao.update({
    where: { id },
    data: { ativo, loja_id: lojaId },
    select: SELECAO,
  });
}
