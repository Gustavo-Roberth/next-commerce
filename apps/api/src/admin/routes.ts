import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware, requireRole } from '../auth/middleware.js';
import { prisma } from '../lib/prisma.js';

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/admin/stats',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR', 'OPERADOR')],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              pedidosPendentes: { type: 'number' },
              vendasHoje: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const lojaId = request.user?.loja_id;
      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [pedidosPendentes, vendasHoje] = await Promise.all([
        prisma.pedido.count({
          where: {
            loja_id: lojaId,
            status: { in: ['CRIADO', 'PAGAMENTO_PENDENTE', 'PAGO', 'SEPARANDO'] },
          },
        }),
        prisma.pedido.aggregate({
          where: {
            loja_id: lojaId,
            status: { in: ['PAGO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE'] },
            created_at: { gte: today, lt: tomorrow },
          },
          _sum: { total_cents: true },
        }),
      ]);

      return reply.send({
        pedidosPendentes,
        vendasHoje: vendasHoje._sum.total_cents ?? 0,
      });
    }
  );
}
