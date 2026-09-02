import type { RastreamentoStatus, Transportadora } from '@/generated/prisma/client';
import { prisma } from '../lib/prisma.js';

export async function findTrackingByPedidoId(pedidoId: string) {
  return prisma.transportadoraRastreamento.findUnique({
    where: { pedido_id: pedidoId },
  });
}

export async function createTracking(data: {
  pedido_id: string;
  transportadora: Transportadora;
  codigo_rastreamento: string;
  url_rastreamento?: string | null;
  status_transportadora: RastreamentoStatus;
  eventos?: Array<{
    data: Date;
    status: RastreamentoStatus;
    local: string | null;
    descricao: string;
  }>;
}) {
  return prisma.transportadoraRastreamento.create({
    data: {
      ...data,
      eventos: data.eventos ?? [],
      ultima_atualizacao: new Date(),
      webhook_recebido_em: new Date(),
    },
  });
}

export async function updateTrackingEvent(
  pedidoId: string,
  evento: {
    data: Date;
    status: RastreamentoStatus;
    local?: string | null;
    descricao: string;
  }
) {
  return prisma.transportadoraRastreamento.update({
    where: { pedido_id: pedidoId },
    data: {
      eventos: { push: evento },
      status_transportadora: evento.status,
      ultima_atualizacao: new Date(),
      webhook_recebido_em: new Date(),
    },
  });
}

export async function createOrUpdateTracking(data: {
  pedido_id: string;
  transportadora: Transportadora;
  codigo_rastreamento: string;
  url_rastreamento?: string | null;
  status_transportadora: RastreamentoStatus;
  evento?: {
    data: Date;
    status: RastreamentoStatus;
    local?: string | null;
    descricao: string;
  };
}) {
  const existing = await findTrackingByPedidoId(data.pedido_id);

  if (existing) {
    const updateData: Record<string, unknown> = {
      status_transportadora: data.status_transportadora,
      ultima_atualizacao: new Date(),
      webhook_recebido_em: new Date(),
    };

    if (data.evento) {
      updateData.eventos = { push: data.evento };
    }

    return prisma.transportadoraRastreamento.update({
      where: { pedido_id: data.pedido_id },
      data: updateData,
    });
  }

  return createTracking({
    ...data,
    eventos: data.evento ? [{ ...data.evento, local: data.evento.local ?? null }] : [],
  });
}

export async function listTrackingByLoja(lojaId: string, status?: RastreamentoStatus) {
  return prisma.transportadoraRastreamento.findMany({
    where: {
      pedido: { loja_id: lojaId },
      ...(status && { status_transportadora: status }),
    },
    include: { pedido: { select: { numero_sequencial: true, cliente_id: true } } },
    orderBy: { ultima_atualizacao: 'desc' },
  });
}
