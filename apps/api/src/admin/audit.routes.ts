import { AuditAction, AuditEntity } from '@shared/types';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  findAuditLogById,
  findAuditLogsByEntity,
  findAuditLogsPaginated,
} from '../audit/repository.js';
import { authMiddleware, requireRole } from '../auth/middleware.js';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const listQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  acao: z.nativeEnum(AuditAction).optional(),
  entidade: z.nativeEnum(AuditEntity).optional(),
  entidade_id: z.string().uuid().optional(),
  usuario_id: z.string().uuid().optional(),
  loja_id: z.string().uuid().optional(),
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const entityHistoryParamsSchema = z.object({
  entidade: z.nativeEnum(AuditEntity),
  entidadeId: z.string().uuid(),
});

const entityHistoryQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

type AuditLogListQuery = z.infer<typeof listQuerySchema>;
type AuditLogParams = z.infer<typeof paramsSchema>;
type AuditLogEntityHistoryParams = z.infer<typeof entityHistoryParamsSchema>;
type AuditLogEntityHistoryQuery = z.infer<typeof entityHistoryQuerySchema>;

export async function adminAuditRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/admin/audit-logs',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR')],
      schema: {
        querystring: listQuerySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    usuario_id: { type: 'string', format: 'uuid', nullable: true },
                    loja_id: { type: 'string', format: 'uuid', nullable: true },
                    acao: { type: 'string' },
                    entidade: { type: 'string' },
                    entidade_id: { type: 'string', format: 'uuid', nullable: true },
                    antes: { type: 'object', nullable: true, additionalProperties: true },
                    depois: { type: 'object', nullable: true, additionalProperties: true },
                    ip: { type: 'string', nullable: true },
                    user_agent: { type: 'string', nullable: true },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
              nextCursor: { type: 'string', format: 'uuid', nullable: true },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as AuditLogListQuery;
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const result = await findAuditLogsPaginated(lojaId, query);
      return reply.send(result);
    }
  );

  app.get(
    '/admin/audit-logs/:id',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR')],
      schema: {
        params: paramsSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              usuario_id: { type: 'string', format: 'uuid', nullable: true },
              loja_id: { type: 'string', format: 'uuid', nullable: true },
              acao: { type: 'string' },
              entidade: { type: 'string' },
              entidade_id: { type: 'string', format: 'uuid', nullable: true },
              antes: { type: 'object', nullable: true, additionalProperties: true },
              depois: { type: 'object', nullable: true, additionalProperties: true },
              ip: { type: 'string', nullable: true },
              user_agent: { type: 'string', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as AuditLogParams;
      const { id } = params;
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const log = await findAuditLogById(id, lojaId);
      if (!log) {
        return reply.code(404).send({ error: 'Registro de auditoria não encontrado' });
      }

      return reply.send(log);
    }
  );

  app.get(
    '/admin/audit-logs/entity/:entidade/:entidadeId',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR')],
      schema: {
        params: entityHistoryParamsSchema,
        querystring: entityHistoryQuerySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    usuario_id: { type: 'string', format: 'uuid', nullable: true },
                    loja_id: { type: 'string', format: 'uuid', nullable: true },
                    acao: { type: 'string' },
                    entidade: { type: 'string' },
                    entidade_id: { type: 'string', format: 'uuid', nullable: true },
                    antes: { type: 'object', nullable: true, additionalProperties: true },
                    depois: { type: 'object', nullable: true, additionalProperties: true },
                    ip: { type: 'string', nullable: true },
                    user_agent: { type: 'string', nullable: true },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
              nextCursor: { type: 'string', format: 'uuid', nullable: true },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as AuditLogEntityHistoryParams;
      const query = request.query as AuditLogEntityHistoryQuery;
      const { entidade, entidadeId } = params;
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const result = await findAuditLogsByEntity(lojaId, { entidade, entidadeId, ...query });
      return reply.send(result);
    }
  );
}
