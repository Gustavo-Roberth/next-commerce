import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware, requireRole } from '../auth/middleware.js';
import {
  type CreateReportScheduleInput,
  type ReportExportQuery,
  type ReportListQuery,
  type ReportTipo,
  createReportScheduleSchema,
  reportExportQuerySchema,
  reportListQuerySchema,
  reportParamsSchema,
  reportScheduleParamsSchema,
} from '../schemas/report.schemas.js';
import { atualizarProximoEnvio, buscarAgendamento, refreshRelatorios } from './repository.js';
import {
  calcularProximoEnvio,
  criarAgendamentoService,
  enviarAgendamento,
  gerarCsv,
  gerarPdf,
  listarAgendamentosService,
  obterRelatorio,
  removerAgendamentoService,
} from './service.js';

const RELATORIO_ROLES = ['ADMIN', 'GESTOR'] as const;
const ok = { type: 'object', additionalProperties: true } as const;
const errorSchema = { type: 'object', properties: { error: { type: 'string' } } } as const;

function montarPeriodo(
  query: Partial<ReportListQuery>,
  limite = query.limit ?? 100
): { data_inicio?: string; data_fim?: string; deposito_id?: string; limit: number } {
  const periodo: { data_inicio?: string; data_fim?: string; deposito_id?: string; limit: number } =
    {
      limit: limite,
    };
  if (query.data_inicio) periodo.data_inicio = query.data_inicio;
  if (query.data_fim) periodo.data_fim = query.data_fim;
  if (query.deposito_id) periodo.deposito_id = query.deposito_id;
  return periodo;
}

export async function reportsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/admin/relatorios/:tipo',
    {
      preHandler: [authMiddleware, requireRole(...RELATORIO_ROLES)],
      schema: {
        params: reportParamsSchema,
        querystring: reportListQuerySchema,
        response: { 200: ok, 400: errorSchema, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tipo } = request.params as { tipo: ReportTipo };
      const query = request.query as ReportListQuery;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const relatorio = await obterRelatorio(tipo, lojaId, montarPeriodo(query));
      return reply.send(relatorio);
    }
  );

  app.get(
    '/admin/relatorios/:tipo/export',
    {
      preHandler: [authMiddleware, requireRole(...RELATORIO_ROLES)],
      schema: {
        params: reportParamsSchema,
        querystring: reportExportQuerySchema,
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { tipo } = request.params as { tipo: ReportTipo };
      const query = request.query as ReportExportQuery;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const relatorio = await obterRelatorio(tipo, lojaId, montarPeriodo(query, 500));

      const dataStr = new Date().toISOString().slice(0, 10);
      if (query.formato === 'PDF') {
        const buffer = await gerarPdf(relatorio);
        return reply
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="${tipo}-${dataStr}.pdf"`)
          .send(buffer);
      }
      const csv = gerarCsv(relatorio);
      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${tipo}-${dataStr}.csv"`)
        .send(csv);
    }
  );

  app.post(
    '/admin/relatorios/refresh',
    {
      preHandler: [authMiddleware, requireRole('ADMIN', 'GESTOR')],
      schema: { response: { 200: ok, 400: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });
      await refreshRelatorios();
      return reply.send({ message: 'Relatórios atualizados com sucesso' });
    }
  );

  app.get(
    '/admin/relatorios/agendamentos',
    {
      preHandler: [authMiddleware, requireRole(...RELATORIO_ROLES)],
      schema: { response: { 200: ok } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });
      const agendamentos = await listarAgendamentosService(lojaId);
      return reply.send({ data: agendamentos });
    }
  );

  app.post(
    '/admin/relatorios/agendamentos',
    {
      preHandler: [authMiddleware, requireRole(...RELATORIO_ROLES)],
      schema: {
        body: createReportScheduleSchema,
        response: { 201: ok, 400: errorSchema, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as CreateReportScheduleInput;
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });

      const agendamento = await criarAgendamentoService(lojaId, request.user?.sub, body);
      const proximo = calcularProximoEnvio(agendamento);
      await atualizarProximoEnvio(agendamento.id, proximo);
      return reply.code(201).send({ ...agendamento, proximo_envio_em: proximo });
    }
  );

  app.delete(
    '/admin/relatorios/agendamentos/:id',
    {
      preHandler: [authMiddleware, requireRole(...RELATORIO_ROLES)],
      schema: {
        params: reportScheduleParamsSchema,
        response: { 200: ok, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrada' });
      const existente = await buscarAgendamento(id, lojaId);
      if (!existente) return reply.code(404).send({ error: 'Agendamento não encontrado' });
      await removerAgendamentoService(id, lojaId);
      return reply.send({ message: 'Agendamento removido com sucesso' });
    }
  );

  app.post(
    '/admin/relatorios/agendamentos/:id/enviar',
    {
      preHandler: [authMiddleware, requireRole(...RELATORIO_ROLES)],
      schema: {
        params: reportScheduleParamsSchema,
        response: { 200: ok, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const lojaId = request.user?.loja_id;
      if (!lojaId) return reply.code(400).send({ error: 'Loja não encontrado' });
      const agendamento = await buscarAgendamento(id, lojaId);
      if (!agendamento) return reply.code(404).send({ error: 'Agendamento não encontrado' });
      await enviarAgendamento(agendamento);
      return reply.send({ message: 'Relatório enviado por e-mail' });
    }
  );
}
