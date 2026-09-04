import type { AuditAction, AuditEntity } from './enums.js';

export interface AuditLog {
  id: string;
  usuario_id: string | null;
  loja_id: string | null;
  acao: AuditAction;
  entidade: AuditEntity;
  entidade_id: string | null;
  antes: Record<string, unknown> | null;
  depois: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface AuditLogQueryParams {
  cursor?: string;
  limit?: number;
  acao?: AuditAction;
  entidade?: AuditEntity;
  entidade_id?: string;
  usuario_id?: string;
  loja_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  nextCursor: string | null;
  total: number;
}

export interface AuditLogEntityHistoryParams {
  entidade: AuditEntity;
  entidadeId: string;
  cursor?: string;
  limit?: number;
}
