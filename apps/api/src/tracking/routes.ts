import type { RastreamentoStatus, Transportadora } from '@/generated/prisma/client';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware, requireRole } from '../auth/middleware.js';
import {
  addTrackingEventSchema,
  trackingResponseSchema,
  trackingWebhookPayloadSchema,
} from '../schemas/tracking.schemas.js';
import { getTrackingTimeline, processTrackingWebhook, registerTrackingEvent } from './service.js';

export async function trackingWebhookRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/webhooks/transportadora',
    {
      schema: {
        body: trackingWebhookPayloadSchema,
        response: {
          200: { type: 'object', properties: { received: { type: 'boolean' } } },
          400: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as {
        codigo_rastreamento: string;
        transportadora: string;
        evento: { data: string; status: string; local?: string; descricao?: string };
      };
      const signature = request.headers['x-webhook-signature'] as string;

      if (!signature) {
        return reply.code(400).send({ error: 'Assinatura do webhook ausente' });
      }

      const payload = JSON.stringify(body);
      const crypto = await import('crypto');
      const expected = crypto
        .createHmac('sha256', process.env.TRACKING_WEBHOOK_SECRET || 'dev-tracking-secret')
        .update(payload)
        .digest('hex');

      if (expected !== signature) {
        return reply.code(401).send({ error: 'Assinatura inválida' });
      }

      const idempotencyKey = `${body.codigo_rastreamento}-${body.evento.data}-${body.evento.status}`;

      try {
        const result = await processTrackingWebhook({
          codigo_rastreamento: body.codigo_rastreamento,
          transportadora: body.transportadora as Transportadora,
          evento: body.evento,
          idempotencyKey,
        });
        return reply.send(result);
      } catch (error) {
        console.error('Erro ao processar webhook de rastreamento:', error);
        return reply.code(500).send({ error: 'Erro interno' });
      }
    }
  );
}

export async function trackingRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/pedidos/:id/rastreamento',
    {
      preHandler: [authMiddleware],
      schema: {
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        response: {
          200: trackingResponseSchema,
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const userId = request.user?.sub;
      const userRoles = request.user?.perfis.map((p) => p.codigo) || [];
      const isAdmin =
        userRoles.includes('ADMIN') ||
        userRoles.includes('GESTOR') ||
        userRoles.includes('OPERADOR');
      const lojaId = request.user?.loja_id;

      const tracking = await getTrackingTimeline(id);

      if (!tracking) {
        return reply.code(404).send({ error: 'Rastreamento não encontrado' });
      }

      const pedido = await (await import('../lib/prisma.js')).prisma.pedido.findUnique({
        where: { id },
        select: { loja_id: true, cliente_id: true },
      });

      if (!pedido) {
        return reply.code(404).send({ error: 'Pedido não encontrado' });
      }

      if (!isAdmin && pedido.cliente_id !== userId) {
        return reply.code(403).send({ error: 'Acesso negado' });
      }

      if (isAdmin && lojaId && pedido.loja_id !== lojaId) {
        return reply.code(403).send({ error: 'Acesso negado' });
      }

      return reply.send(tracking);
    }
  );

  app.post(
    '/pedidos/:id/rastreamento',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR', 'OPERADOR')],
      schema: {
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        body: addTrackingEventSchema,
        response: {
          200: trackingResponseSchema,
          400: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        transportadora?: string;
        codigo_rastreamento?: string;
        url_rastreamento?: string;
        status_transportadora?: string;
        evento?: {
          data: string;
          status: string;
          local?: string;
          descricao?: string;
        };
      };

      const pedido = await (await import('../lib/prisma.js')).prisma.pedido.findUnique({
        where: { id },
        select: { id: true, loja_id: true },
      });

      if (!pedido) {
        return reply.code(404).send({ error: 'Pedido não encontrado' });
      }

      try {
        const trackingData: {
          transportadora?: Transportadora;
          codigo_rastreamento?: string;
          url_rastreamento?: string;
          status_transportadora?: RastreamentoStatus;
          evento?: {
            data: Date;
            status: RastreamentoStatus;
            local?: string;
            descricao?: string;
          };
        } = {};

        if (body.transportadora !== undefined)
          trackingData.transportadora = body.transportadora as Transportadora;
        if (body.codigo_rastreamento !== undefined)
          trackingData.codigo_rastreamento = body.codigo_rastreamento;
        if (body.url_rastreamento !== undefined)
          trackingData.url_rastreamento = body.url_rastreamento;
        if (body.status_transportadora !== undefined)
          trackingData.status_transportadora = body.status_transportadora as RastreamentoStatus;

        if (body.evento !== undefined) {
          trackingData.evento = {
            data: new Date(body.evento.data),
            status: body.evento.status as RastreamentoStatus,
            ...(body.evento.local !== undefined ? { local: body.evento.local } : {}),
            ...(body.evento.descricao !== undefined ? { descricao: body.evento.descricao } : {}),
          };
        }

        const tracking = await registerTrackingEvent(id, trackingData);

        return reply.send({
          id: tracking.id,
          pedido_id: tracking.pedido_id,
          transportadora: tracking.transportadora,
          codigo_rastreamento: tracking.codigo_rastreamento,
          url_rastreamento: tracking.url_rastreamento,
          status_transportadora: tracking.status_transportadora,
          eventos: tracking.eventos as unknown as Array<{
            data: Date;
            status: RastreamentoStatus;
            local: string | null;
            descricao: string;
          }>,
          ultima_atualizacao: tracking.ultima_atualizacao,
          webhook_recebido_em: tracking.webhook_recebido_em,
        });
      } catch (error) {
        console.error('Erro ao registrar evento de rastreamento:', error);
        return reply.code(400).send({ error: (error as Error).message });
      }
    }
  );
}
