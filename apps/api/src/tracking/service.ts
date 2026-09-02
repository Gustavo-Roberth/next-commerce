import type { RastreamentoStatus, Transportadora } from '@/generated/prisma/client';
import type { Prisma } from '@/generated/prisma/client';
import { emitNotification } from '../lib/notification.js';
import { prisma } from '../lib/prisma.js';

function normalizeTransportadoraStatus(status: string): RastreamentoStatus {
  const statusMap: Record<string, RastreamentoStatus> = {
    COLETADO: 'COLETADO',
    COLETA: 'COLETADO',
    EM_TRANSITO: 'EM_TRANSITO',
    EM_TRANSITO_ENTREGA: 'EM_TRANSITO',
    SAIU_ENTREGA: 'SAIU_ENTREGA',
    SAIU_PARA_ENTREGA: 'SAIU_ENTREGA',
    ENTREGUE: 'ENTREGUE',
    DEVOLVIDO: 'DEVOLVIDO',
    CANCELADO: 'DEVOLVIDO',
  };
  return statusMap[status?.toUpperCase()] || 'EM_TRANSITO';
}

function isRelevantStatus(status: RastreamentoStatus): boolean {
  return ['COLETADO', 'SAIU_ENTREGA', 'ENTREGUE', 'DEVOLVIDO'].includes(status);
}

export async function processTrackingWebhook(payload: {
  codigo_rastreamento: string;
  transportadora: Transportadora;
  evento: {
    data: string;
    status: string;
    local?: string;
    descricao?: string;
  };
  idempotencyKey: string;
}): Promise<{ received: boolean }> {
  const { codigo_rastreamento, transportadora, evento, idempotencyKey } = payload;

  const existingEvent = await prisma.webhookEvent.findFirst({
    where: { idempotency_key: idempotencyKey, event_type: 'SHIPPING_UPDATE' },
  });

  if (existingEvent?.processed) {
    return { received: true };
  }

  const normalizedStatus = normalizeTransportadoraStatus(evento.status);
  const eventoData = new Date(evento.data);

  const trackingEvento = {
    data: eventoData,
    status: normalizedStatus,
    local: evento.local ?? null,
    descricao: evento.descricao ?? `Status: ${normalizedStatus}`,
  };

  await prisma.$transaction(async (tx) => {
    const tracking = await tx.transportadoraRastreamento.findFirst({
      where: { codigo_rastreamento },
      include: { pedido: true },
    });

    if (tracking) {
      await tx.transportadoraRastreamento.update({
        where: { id: tracking.id },
        data: {
          eventos: { push: trackingEvento },
          status_transportadora: normalizedStatus,
          ultima_atualizacao: eventoData,
          webhook_recebido_em: new Date(),
        },
      });

      await tx.pedidoEvento.create({
        data: {
          pedido_id: tracking.pedido_id,
          tipo: 'RASTREAMENTO_ATUALIZADO',
          descricao: `Rastreamento atualizado: ${trackingEvento.descricao} (${transportadora})`,
          metadata: {
            transportadora,
            codigo_rastreamento,
            status: normalizedStatus,
            local: evento.local,
          },
        },
      });

      if (isRelevantStatus(normalizedStatus)) {
        await emitNotification(tracking.pedido_id, normalizedStatus, trackingEvento);
      }
    }

    await tx.webhookEvent.create({
      data: {
        event_type: 'SHIPPING_UPDATE',
        payload: payload as Prisma.InputJsonValue,
        idempotency_key: idempotencyKey,
        scope: 'WEBHOOK',
        processed: true,
        processed_at: new Date(),
      },
    });
  });

  return { received: true };
}

export async function getTrackingTimeline(pedidoId: string) {
  const tracking = await prisma.transportadoraRastreamento.findUnique({
    where: { pedido_id: pedidoId },
  });

  if (!tracking) {
    return null;
  }

  return {
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
  };
}

export async function registerTrackingEvent(
  pedidoId: string,
  data: {
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
  }
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.transportadoraRastreamento.findUnique({
      where: { pedido_id: pedidoId },
    });

    let tracking: typeof existing;
    if (existing) {
      const updateData: Record<string, unknown> = {
        ultima_atualizacao: new Date(),
        webhook_recebido_em: new Date(),
      };

      if (data.transportadora) updateData.transportadora = data.transportadora;
      if (data.codigo_rastreamento) updateData.codigo_rastreamento = data.codigo_rastreamento;
      if (data.url_rastreamento !== undefined) updateData.url_rastreamento = data.url_rastreamento;
      if (data.status_transportadora) updateData.status_transportadora = data.status_transportadora;
      if (data.evento) updateData.eventos = { push: data.evento };

      tracking = await tx.transportadoraRastreamento.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      if (!data.transportadora || !data.codigo_rastreamento || !data.status_transportadora) {
        throw new Error(
          'Transportadora, código de rastreamento e status são obrigatórios para novo rastreamento'
        );
      }
      tracking = await tx.transportadoraRastreamento.create({
        data: {
          pedido_id: pedidoId,
          transportadora: data.transportadora,
          codigo_rastreamento: data.codigo_rastreamento,
          url_rastreamento: data.url_rastreamento ?? null,
          status_transportadora: data.status_transportadora,
          eventos: data.evento ? [data.evento] : [],
          ultima_atualizacao: new Date(),
          webhook_recebido_em: new Date(),
        },
      });
    }

    if (data.evento) {
      await tx.pedidoEvento.create({
        data: {
          pedido_id: pedidoId,
          tipo: 'RASTREAMENTO_MANUAL',
          descricao: `Evento manual adicionado: ${data.evento.descricao}`,
          metadata: {
            ...data.evento,
            transportadora: data.transportadora,
            codigo_rastreamento: data.codigo_rastreamento,
          },
        },
      });
    }

    return tracking;
  });
}
