import { Prisma } from '@/generated/prisma/client';
import type { AuditAction, AuditEntity } from '@shared/types';
import { prisma } from '../lib/prisma.js';

export interface AuditLogInput {
  usuarioId: string | null;
  lojaId: string | null;
  acao: AuditAction;
  entidade: AuditEntity;
  entidadeId: string | null;
  antes?: Prisma.InputJsonValue | null;
  depois?: Prisma.InputJsonValue | null;
  ip?: string | null;
  userAgent?: string | null;
}

export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        usuario_id: input.usuarioId,
        loja_id: input.lojaId,
        acao: input.acao,
        entidade: input.entidade,
        entidade_id: input.entidadeId,
        antes: input.antes ?? Prisma.JsonNull,
        depois: input.depois ?? Prisma.JsonNull,
        ip: input.ip ?? null,
        user_agent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error('Falha ao registrar auditoria:', error);
  }
}
