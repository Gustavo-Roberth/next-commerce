import type { Prisma } from '@/generated/prisma/client';
import type { AuditAction, AuditEntity } from '@shared/types';
import { prisma } from '../lib/prisma.js';

export interface AuditLogListFilters {
  cursor?: string | undefined;
  limit?: number | undefined;
  acao?: AuditAction | undefined;
  entidade?: AuditEntity | undefined;
  entidade_id?: string | undefined;
  usuario_id?: string | undefined;
  loja_id?: string | undefined;
  data_inicio?: string | undefined;
  data_fim?: string | undefined;
}

export interface AuditLogEntityHistoryParams {
  entidade: AuditEntity;
  entidadeId: string;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface PaginatedAuditLogResult {
  data: Array<{
    id: string;
    usuario_id: string | null;
    loja_id: string | null;
    acao: string;
    entidade: string;
    entidade_id: string | null;
    antes: Prisma.JsonValue | null;
    depois: Prisma.JsonValue | null;
    ip: string | null;
    user_agent: string | null;
    created_at: Date;
  }>;
  nextCursor: string | null;
  total: number;
}

export async function findAuditLogsPaginated(
  lojaId: string,
  filters: AuditLogListFilters
): Promise<PaginatedAuditLogResult> {
  const {
    cursor,
    limit = 20,
    acao,
    entidade,
    entidade_id,
    usuario_id,
    data_inicio,
    data_fim,
  } = filters;

  const where: Prisma.AuditLogWhereInput = {
    loja_id: lojaId,
  };

  if (acao) where.acao = acao;
  if (entidade) where.entidade = entidade;
  if (entidade_id) where.entidade_id = entidade_id;
  if (usuario_id) where.usuario_id = usuario_id;
  if (data_inicio || data_fim) {
    where.created_at = {};
    if (data_inicio) (where.created_at as Prisma.DateTimeFilter).gte = new Date(data_inicio);
    if (data_fim) (where.created_at as Prisma.DateTimeFilter).lte = new Date(data_fim);
  }
  if (cursor) where.id = { gt: cursor };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      take: limit + 1,
      orderBy: { created_at: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, -1) : logs;
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? lastItem.id : null;

  return { data: items, nextCursor, total };
}

export async function findAuditLogById(
  id: string,
  lojaId: string
): Promise<{
  id: string;
  usuario_id: string | null;
  loja_id: string | null;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  antes: Prisma.JsonValue | null;
  depois: Prisma.JsonValue | null;
  ip: string | null;
  user_agent: string | null;
  created_at: Date;
} | null> {
  return prisma.auditLog.findFirst({
    where: { id, loja_id: lojaId },
  });
}

export async function findAuditLogsByEntity(
  lojaId: string,
  params: AuditLogEntityHistoryParams
): Promise<PaginatedAuditLogResult> {
  const { entidade, entidadeId, cursor, limit = 50 } = params;

  const where: Prisma.AuditLogWhereInput = {
    loja_id: lojaId,
    entidade,
    entidade_id: entidadeId,
  };

  if (cursor) where.id = { gt: cursor };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      take: limit + 1,
      orderBy: { created_at: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, -1) : logs;
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? lastItem.id : null;

  return { data: items, nextCursor, total };
}
