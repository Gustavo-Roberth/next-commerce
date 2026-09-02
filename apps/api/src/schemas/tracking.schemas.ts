import { RastreamentoStatus, Transportadora } from '@/generated/prisma/client';
import { z } from 'zod';

export const trackingEventSchema = z.object({
  data: z.string().datetime(),
  status: z.nativeEnum(RastreamentoStatus),
  local: z.string().optional().nullable(),
  descricao: z.string(),
});

export const trackingWebhookPayloadSchema = z.object({
  codigo_rastreamento: z.string(),
  transportadora: z.nativeEnum(Transportadora),
  evento: z.object({
    data: z.string().datetime(),
    status: z.nativeEnum(RastreamentoStatus),
    local: z.string().optional().nullable(),
    descricao: z.string().optional().nullable(),
  }),
});

export const addTrackingEventSchema = z.object({
  transportadora: z.nativeEnum(Transportadora).optional(),
  codigo_rastreamento: z.string().optional(),
  url_rastreamento: z.string().url().optional().nullable(),
  status_transportadora: z.nativeEnum(RastreamentoStatus).optional(),
  evento: z
    .object({
      data: z.string().datetime(),
      status: z.nativeEnum(RastreamentoStatus),
      local: z.string().optional().nullable(),
      descricao: z.string().optional().nullable(),
    })
    .optional(),
});

export const trackingResponseSchema = z.object({
  id: z.string().uuid(),
  pedido_id: z.string().uuid(),
  transportadora: z.nativeEnum(Transportadora),
  codigo_rastreamento: z.string(),
  url_rastreamento: z.string().nullable(),
  status_transportadora: z.nativeEnum(RastreamentoStatus),
  eventos: z.array(trackingEventSchema),
  ultima_atualizacao: z.string().datetime().nullable(),
  webhook_recebido_em: z.string().datetime().nullable(),
});

export type TrackingEvent = z.infer<typeof trackingEventSchema>;
export type TrackingWebhookPayload = z.infer<typeof trackingWebhookPayloadSchema>;
export type AddTrackingEventInput = z.infer<typeof addTrackingEventSchema>;
export type TrackingResponse = z.infer<typeof trackingResponseSchema>;
