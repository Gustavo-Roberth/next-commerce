import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma.js';
interface MercadoPagoWebhookPayload {
  id: string;
  status: string;
  external_reference: string;
  payment_method_id: string;
  payment_type_id: string;
  transaction_amount: number;
  date_approved: string;
  date_created: string;
  date_last_updated: string;
}

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/webhooks/mercado-pago',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            external_reference: { type: 'string' },
            payment_method_id: { type: 'string' },
            payment_type_id: { type: 'string' },
            transaction_amount: { type: 'number' },
            date_approved: { type: 'string', format: 'date-time' },
            date_created: { type: 'string', format: 'date-time' },
            date_last_updated: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          200: { type: 'object', properties: { received: { type: 'boolean' } } },
          400: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as MercadoPagoWebhookPayload;

      const {
        id,
        status,
        external_reference,
        payment_method_id,
        payment_type_id,
        transaction_amount,
        date_approved,
        date_created,
        date_last_updated,
      } = body;

      if (!external_reference) {
        return reply.code(400).send({ error: 'external_reference ausente' });
      }

      const pagamento = await prisma.pagamento.findFirst({
        where: { idempotency_key: external_reference },
        include: { pedido: true },
      });

      if (!pagamento) {
        console.warn(`Pagamento não encontrado para external_reference: ${external_reference}`);
        return reply.code(404).send({ error: 'Pagamento não encontrado' });
      }

      const existingEvent = await prisma.webhookEvent.findFirst({
        where: { idempotency_key: external_reference, event_type: 'PAYMENT_APPROVED' },
      });

      if (existingEvent && existingEvent.processed) {
        return reply.send({ received: true });
      }

      await prisma.webhookEvent.create({
        data: {
          event_type: 'PAYMENT_APPROVED',
          payload: body as any,
          idempotency_key: external_reference,
          scope: 'PAYMENT',
          processed: true,
          processed_at: new Date(),
        },
      });

      let novoStatus: string;
      let aprovadoEm: Date | null = null;

      switch (status) {
        case 'approved':
          novoStatus = 'APROVADO';
          aprovadoEm = date_approved ? new Date(date_approved) : new Date();
          break;
        case 'rejected':
        case 'cancelled':
          novoStatus = 'RECUSADO';
          break;
        case 'pending':
        case 'in_process':
          novoStatus = 'PROCESSANDO';
          break;
        case 'expired':
          novoStatus = 'EXPIRADO';
          break;
        case 'refunded':
          novoStatus = 'ESTORNADO';
          break;
        case 'charged_back':
          novoStatus = 'ESTORNADO';
          break;
        default:
          novoStatus = pagamento.status;
      }

      await prisma.$transaction(async (tx) => {
        await tx.pagamento.update({
          where: { id: pagamento.id },
          data: {
            status: novoStatus as any,
            gateway_transaction_id: id,
            gateway_response: body as any,
            webhook_received_at: new Date(),
            aprovado_em: aprovadoEm,
            estornado_em: ['RECUSADO', 'ESTORNADO'].includes(novoStatus) ? new Date() : null,
          },
        });

        if (novoStatus === 'APROVADO' && pagamento.pedido.status === 'PAGAMENTO_PENDENTE') {
          await tx.pedido.update({
            where: { id: pagamento.pedido_id },
            data: { status: 'PAGO', pago_em: new Date() },
          });

          await tx.pedidoEvento.create({
            data: {
              pedido_id: pagamento.pedido_id,
              tipo: 'PAGAMENTO_APROVADO',
              descricao: 'Pagamento aprovado via webhook Mercado Pago',
              metadata: { payment_id: id, gateway: 'MERCADO_PAGO' },
            },
          });

          for (const item of await tx.itemPedido.findMany({
            where: { pedido_id: pagamento.pedido_id },
          })) {
            await tx.estoque.updateMany({
              where: { variacao_id: item.variacao_id, loja_id: pagamento.pedido.loja_id },
              data: {
                quantidade_reservada: { decrement: item.quantidade },
                quantidade_fisica: { decrement: item.quantidade },
              },
            });
          }
        }

        if (
          ['RECUSADO', 'EXPIRADO', 'ESTORNADO'].includes(novoStatus) &&
          ['CRIADO', 'PAGAMENTO_PENDENTE'].includes(pagamento.pedido.status)
        ) {
          await tx.pedido.update({
            where: { id: pagamento.pedido_id },
            data: {
              status: 'CANCELADO',
              cancelado_em: new Date(),
              cancelamento_motivo: `Pagamento ${novoStatus.toLowerCase()}`,
            },
          });

          await tx.pedidoEvento.create({
            data: {
              pedido_id: pagamento.pedido_id,
              tipo: 'PAGAMENTO_RECUSADO',
              descricao: `Pagamento ${novoStatus.toLowerCase()} - pedido cancelado`,
              metadata: { payment_id: id, gateway: 'MERCADO_PAGO', motivo: novoStatus },
            },
          });

          for (const item of await tx.itemPedido.findMany({
            where: { pedido_id: pagamento.pedido_id },
          })) {
            await tx.estoque.updateMany({
              where: { variacao_id: item.variacao_id, loja_id: pagamento.pedido.loja_id },
              data: { quantidade_reservada: { decrement: item.quantidade } },
            });
          }
        }

        await tx.pagamentoEvento.create({
          data: {
            pagamento_id: pagamento.id,
            tipo: `WEBHOOK_${status.toUpperCase()}`,
            descricao: `Webhook recebido: ${status}`,
            gateway_response: body as any,
          },
        });
      });

      return reply.send({ received: true });
    }
  );
}
