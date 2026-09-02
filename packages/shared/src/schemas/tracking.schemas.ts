import { z } from 'zod';
import { RastreamentoStatus, Transportadora } from '../types/enums';

export const rastreamentoEventoSchema = z.object({
  data: z.string(),
  status: z.nativeEnum(RastreamentoStatus),
  local: z.string(),
  descricao: z.string(),
});

export const trackingWebhookPayloadSchema = z.object({
  codigo_rastreamento: z.string(),
  transportadora: z.nativeEnum(Transportadora),
  evento: z.object({
    data: z.string(),
    status: z.nativeEnum(RastreamentoStatus),
    local: z.string().optional(),
    descricao: z.string().optional(),
  }),
});

export const addTrackingEventSchema = z.object({
  pedido_id: z.string().uuid(),
  transportadora: z.nativeEnum(Transportadora).optional(),
  codigo_rastreamento: z.string().optional(),
  url_rastreamento: z.string().url().optional().or(z.literal('')),
  status_transportadora: z.nativeEnum(RastreamentoStatus).optional(),
  evento: z
    .object({
      data: z.string(),
      status: z.nativeEnum(RastreamentoStatus),
      local: z.string().optional(),
      descricao: z.string().optional(),
    })
    .optional(),
});

export const trackingTimelineQuerySchema = z.object({
  pedido_id: z.string().uuid(),
});

export const trackingResponseSchema = z.object({
  id: z.string().uuid(),
  pedido_id: z.string().uuid(),
  transportadora: z.nativeEnum(Transportadora),
  codigo_rastreamento: z.string(),
  url_rastreamento: z.string().nullable(),
  status_transportadora: z.nativeEnum(RastreamentoStatus),
  eventos: z.array(rastreamentoEventoSchema),
  ultima_atualizacao: z.string().nullable(),
  webhook_recebido_em: z.string().nullable(),
});

export type RastreamentoEvento = z.infer<typeof rastreamentoEventoSchema>;
export type TrackingWebhookPayload = z.infer<typeof trackingWebhookPayloadSchema>;
export type AddTrackingEventInput = z.infer<typeof addTrackingEventSchema>;
export type TrackingTimelineQuery = z.infer<typeof trackingTimelineQuerySchema>;
export type TrackingResponse = z.infer<typeof trackingResponseSchema>;
