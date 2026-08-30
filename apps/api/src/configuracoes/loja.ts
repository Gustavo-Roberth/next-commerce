import type { Loja as LojaModel } from '@/generated/prisma/client';
import { prisma } from '../lib/prisma.js';
import type { AtualizarLojaInput } from '../schemas/config.schemas.js';

export async function buscarLoja(lojaId: string): Promise<LojaModel | null> {
  return prisma.loja.findFirst({ where: { id: lojaId, deleted_at: null } });
}

export async function atualizarLoja(lojaId: string, input: AtualizarLojaInput): Promise<LojaModel> {
  const data: Record<string, unknown> = { id: lojaId };
  if (input.nome !== undefined) data.nome = input.nome;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.dominio_customizado !== undefined) data.dominio_customizado = input.dominio_customizado;
  if (input.logo_url !== undefined) data.logo_url = input.logo_url === '' ? null : input.logo_url;
  if (input.cores_tema !== undefined) data.cores_tema = input.cores_tema;
  if (input.configuracoes_seo !== undefined) data.configuracoes_seo = input.configuracoes_seo;
  return prisma.loja.update({ where: { id: lojaId }, data });
}
