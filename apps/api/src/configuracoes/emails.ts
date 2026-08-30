import type { EmailTemplate as EmailTemplateModel } from '@/generated/prisma/client';
import Handlebars from 'handlebars';
import mjml2html from 'mjml';
import { prisma } from '../lib/prisma.js';
import type {
  AtualizarEmailTemplateInput,
  CriarEmailTemplateInput,
} from '../schemas/config.schemas.js';

export async function listarEmailTemplates(lojaId: string): Promise<EmailTemplateModel[]> {
  return prisma.emailTemplate.findMany({
    where: { loja_id: lojaId, deleted_at: null },
    orderBy: { codigo: 'asc' },
  });
}

export async function buscarEmailTemplatePorId(
  lojaId: string,
  id: string
): Promise<EmailTemplateModel | null> {
  return prisma.emailTemplate.findFirst({ where: { loja_id: lojaId, id, deleted_at: null } });
}

export async function criarEmailTemplate(
  lojaId: string,
  input: CriarEmailTemplateInput
): Promise<EmailTemplateModel> {
  return prisma.emailTemplate.create({
    data: {
      loja_id: lojaId,
      codigo: input.codigo.toLowerCase(),
      nome: input.nome,
      assunto: input.assunto,
      corpo_mjml: input.corpo_mjml,
      variaveis: input.variaveis ?? [],
      ativo: input.ativo,
    },
  });
}

export async function atualizarEmailTemplate(
  lojaId: string,
  id: string,
  input: AtualizarEmailTemplateInput
): Promise<EmailTemplateModel> {
  const data: Record<string, unknown> = { loja_id: lojaId };
  if (input.codigo !== undefined) data.codigo = input.codigo.toLowerCase();
  if (input.nome !== undefined) data.nome = input.nome;
  if (input.assunto !== undefined) data.assunto = input.assunto;
  if (input.corpo_mjml !== undefined) data.corpo_mjml = input.corpo_mjml;
  if (input.variaveis !== undefined) data.variaveis = input.variaveis;
  if (input.ativo !== undefined) data.ativo = input.ativo;
  return prisma.emailTemplate.update({ where: { id }, data });
}

export async function removerEmailTemplate(lojaId: string, id: string): Promise<void> {
  await prisma.emailTemplate.update({
    where: { id, loja_id: lojaId },
    data: { deleted_at: new Date(), ativo: false },
  });
}

export async function alternarEmailTemplate(
  lojaId: string,
  id: string,
  ativo: boolean
): Promise<EmailTemplateModel> {
  return prisma.emailTemplate.update({ where: { id }, data: { ativo, loja_id: lojaId } });
}

export interface PreviewEmailTemplate {
  html: string;
  erros: string[];
}

export function previewEmailTemplate(
  corpoMjml: string,
  variaveis: Record<string, string> = {}
): PreviewEmailTemplate {
  const template = Handlebars.compile(corpoMjml);
  const mjmlFinal = template(variaveis);
  const { html, errors } = mjml2html(mjmlFinal, { validationLevel: 'soft' });
  return {
    html,
    erros: (errors ?? []).map(
      (e: { line?: number; message: string }) => `${e.line ?? '?'}: ${e.message}`
    ),
  };
}
