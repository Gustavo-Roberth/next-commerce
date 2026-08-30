import type { Prisma } from '@/generated/prisma/client';
import type { ConfiguracaoFrete as ConfiguracaoFreteModel } from '@/generated/prisma/client';
import { prisma } from '../lib/prisma.js';
import type { AtualizarFreteInput, CriarFreteInput } from '../schemas/config.schemas.js';

export async function listarFrete(lojaId: string): Promise<ConfiguracaoFreteModel[]> {
  return prisma.configuracaoFrete.findMany({
    where: { loja_id: lojaId, deleted_at: null },
    orderBy: { prioridade: 'asc' },
  });
}

export async function buscarFretePorId(
  lojaId: string,
  id: string
): Promise<ConfiguracaoFreteModel | null> {
  return prisma.configuracaoFrete.findFirst({
    where: { loja_id: lojaId, id, deleted_at: null },
  });
}

export async function criarFrete(
  lojaId: string,
  input: CriarFreteInput
): Promise<ConfiguracaoFreteModel> {
  return prisma.configuracaoFrete.create({
    data: { loja_id: lojaId, ...input } as Prisma.ConfiguracaoFreteUncheckedCreateInput,
  });
}

export async function atualizarFrete(
  lojaId: string,
  id: string,
  input: AtualizarFreteInput
): Promise<ConfiguracaoFreteModel> {
  return prisma.configuracaoFrete.update({
    where: { id, loja_id: lojaId },
    data: { ...input } as Prisma.ConfiguracaoFreteUncheckedUpdateInput,
  });
}

export async function removerFrete(lojaId: string, id: string): Promise<void> {
  await prisma.configuracaoFrete.update({
    where: { id, loja_id: lojaId },
    data: { deleted_at: new Date(), ativo: false },
  });
}

export async function alternarFrete(
  lojaId: string,
  id: string,
  ativo: boolean
): Promise<ConfiguracaoFreteModel> {
  return prisma.configuracaoFrete.update({
    where: { id },
    data: { ativo, loja_id: lojaId },
  });
}
