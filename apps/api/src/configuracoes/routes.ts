import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware, requireRole } from '../auth/middleware.js';
import * as cupomService from '../cupom/service.js';
import * as freteService from '../frete/service.js';
import {
  atualizarCupomSchema,
  atualizarEmailTemplateSchema,
  atualizarFreteSchema,
  atualizarIntegracaoSchema,
  atualizarLojaSchema,
  atualizarPagamentoSchema,
  calcularFreteSchema,
  criarCupomSchema,
  criarEmailTemplateSchema,
  criarFreteSchema,
  criarIntegracaoSchema,
  criarPagamentoSchema,
  idParamSchema,
  validarCupomSchema,
} from '../schemas/config.schemas.js';
import type {
  AtualizarCupomInput,
  AtualizarEmailTemplateInput,
  AtualizarFreteInput,
  AtualizarIntegracaoInput,
  AtualizarLojaInput,
  AtualizarPagamentoInput,
  CalcularFreteInput,
  CriarCupomInput,
  CriarEmailTemplateInput,
  CriarFreteInput,
  CriarIntegracaoInput,
  CriarPagamentoInput,
  ValidarCupomInput,
} from '../schemas/config.schemas.js';
import * as emails from './emails.js';
import * as integracoes from './integracoes.js';
import * as lojaService from './loja.js';
import * as pagamentos from './pagamentos.js';

const LEITURA_ROLES = ['ADMIN', 'GESTOR'] as const;
const ESCRITA_ROLES = ['ADMIN'] as const;
const ok = { type: 'object', additionalProperties: true } as const;
const errorSchema = { type: 'object', properties: { error: { type: 'string' } } } as const;

function lojaId(request: FastifyRequest): string | null {
  return request.user?.loja_id ?? null;
}

function novoAtivo(body: unknown): boolean {
  return (body as { ativo?: boolean } | undefined)?.ativo ?? true;
}

function conflito(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002'
  );
}

export async function configuracoesRoutes(app: FastifyInstance): Promise<void> {
  // ---------- Loja (dados gerais) ----------
  app.get(
    '/admin/configuracoes/loja',
    {
      preHandler: [authMiddleware, requireRole(...LEITURA_ROLES)],
      schema: { response: { 200: ok } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const loja = await lojaService.buscarLoja(id);
      if (!loja) return reply.code(404).send({ error: 'Loja não encontrada' });
      return reply.send(loja);
    }
  );

  app.patch(
    '/admin/configuracoes/loja',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { body: atualizarLojaSchema, response: { 200: ok, 409: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      try {
        const loja = await lojaService.atualizarLoja(id, request.body as AtualizarLojaInput);
        return reply.send(loja);
      } catch (e) {
        if (conflito(e)) return reply.code(409).send({ error: 'Slug já está em uso' });
        throw e;
      }
    }
  );

  // ---------- Frete ----------
  app.get(
    '/admin/configuracoes/frete',
    {
      preHandler: [authMiddleware, requireRole(...LEITURA_ROLES)],
      schema: { response: { 200: ok } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      return reply.send({ data: await freteService.listarFrete(id) });
    }
  );

  app.post(
    '/admin/configuracoes/frete',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { body: criarFreteSchema, response: { 201: ok, 400: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const frete = await freteService.criarFrete(id, request.body as CriarFreteInput);
      return reply.code(201).send(frete);
    }
  );

  app.patch(
    '/admin/configuracoes/frete/:id',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: {
        params: idParamSchema,
        body: atualizarFreteSchema,
        response: { 200: ok, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: freteId } = request.params as { id: string };
      const frete = await freteService.atualizarFrete(
        id,
        freteId,
        request.body as AtualizarFreteInput
      );
      return reply.send(frete);
    }
  );

  app.delete(
    '/admin/configuracoes/frete/:id',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: freteId } = request.params as { id: string };
      await freteService.removerFrete(id, freteId);
      return reply.send({ message: 'Regra de frete removida' });
    }
  );

  app.post(
    '/admin/configuracoes/frete/:id/alternar',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: freteId } = request.params as { id: string };
      const frete = await freteService.alternarFrete(id, freteId, novoAtivo(request.body));
      return reply.send(frete);
    }
  );

  app.post(
    '/admin/configuracoes/frete/calcular',
    {
      preHandler: [authMiddleware, requireRole(...LEITURA_ROLES)],
      schema: { body: calcularFreteSchema, response: { 200: ok, 400: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const opcoes = await freteService.calcularFrete(id, request.body as CalcularFreteInput);
      return reply.send({ data: opcoes });
    }
  );

  // ---------- Pagamentos ----------
  app.get(
    '/admin/configuracoes/pagamentos',
    {
      preHandler: [authMiddleware, requireRole(...LEITURA_ROLES)],
      schema: { response: { 200: ok } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      return reply.send({ data: await pagamentos.listarPagamentos(id) });
    }
  );

  app.get(
    '/admin/configuracoes/pagamentos/:id',
    {
      preHandler: [authMiddleware, requireRole(...LEITURA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: pagId } = request.params as { id: string };
      const config = await pagamentos.buscarPagamentoPorId(id, pagId);
      if (!config) return reply.code(404).send({ error: 'Configuração não encontrada' });
      return reply.send(config);
    }
  );

  app.get(
    '/admin/configuracoes/pagamentos/:id/credenciais',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: pagId } = request.params as { id: string };
      const config = await pagamentos.buscarCredenciaisPagamento(id, pagId);
      if (!config) return reply.code(404).send({ error: 'Configuração não encontrada' });
      return reply.send(config);
    }
  );

  app.post(
    '/admin/configuracoes/pagamentos',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { body: criarPagamentoSchema, response: { 201: ok, 400: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const config = await pagamentos.criarPagamento(id, request.body as CriarPagamentoInput);
      return reply.code(201).send(config);
    }
  );

  app.patch(
    '/admin/configuracoes/pagamentos/:id',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: {
        params: idParamSchema,
        body: atualizarPagamentoSchema,
        response: { 200: ok, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: pagId } = request.params as { id: string };
      const config = await pagamentos.atualizarPagamento(
        id,
        pagId,
        request.body as AtualizarPagamentoInput
      );
      return reply.send(config);
    }
  );

  app.delete(
    '/admin/configuracoes/pagamentos/:id',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: pagId } = request.params as { id: string };
      await pagamentos.removerPagamento(id, pagId);
      return reply.send({ message: 'Configuração de pagamento removida' });
    }
  );

  app.post(
    '/admin/configuracoes/pagamentos/:id/alternar',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: pagId } = request.params as { id: string };
      const config = await pagamentos.alternarPagamento(id, pagId, novoAtivo(request.body));
      return reply.send(config);
    }
  );

  // ---------- Cupons ----------
  app.get(
    '/admin/configuracoes/cupons',
    {
      preHandler: [authMiddleware, requireRole(...LEITURA_ROLES)],
      schema: { response: { 200: ok } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      return reply.send({ data: await cupomService.listarCupom(id) });
    }
  );

  app.post(
    '/admin/configuracoes/cupons',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { body: criarCupomSchema, response: { 201: ok, 400: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      try {
        const cupom = await cupomService.criarCupom(id, request.body as CriarCupomInput);
        return reply.code(201).send(cupom);
      } catch (e) {
        if (conflito(e))
          return reply.code(409).send({ error: 'Código de cupom já existe nesta loja' });
        throw e;
      }
    }
  );

  app.patch(
    '/admin/configuracoes/cupons/:id',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: {
        params: idParamSchema,
        body: atualizarCupomSchema,
        response: { 200: ok, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: cupomId } = request.params as { id: string };
      const cupom = await cupomService.atualizarCupom(
        id,
        cupomId,
        request.body as AtualizarCupomInput
      );
      return reply.send(cupom);
    }
  );

  app.delete(
    '/admin/configuracoes/cupons/:id',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: cupomId } = request.params as { id: string };
      await cupomService.removerCupom(id, cupomId);
      return reply.send({ message: 'Cupom removido' });
    }
  );

  app.post(
    '/admin/configuracoes/cupons/:id/alternar',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: cupomId } = request.params as { id: string };
      const cupom = await cupomService.alternarCupom(id, cupomId, novoAtivo(request.body));
      return reply.send(cupom);
    }
  );

  app.post(
    '/admin/configuracoes/cupons/validar',
    {
      preHandler: [authMiddleware, requireRole(...LEITURA_ROLES)],
      schema: { body: validarCupomSchema, response: { 200: ok, 400: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const resultado = await cupomService.validarCupom(id, request.body as ValidarCupomInput);
      return reply.send(resultado);
    }
  );

  // ---------- E-mails (templates MJML) ----------
  app.get(
    '/admin/configuracoes/emails',
    {
      preHandler: [authMiddleware, requireRole(...LEITURA_ROLES)],
      schema: { response: { 200: ok } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      return reply.send({ data: await emails.listarEmailTemplates(id) });
    }
  );

  app.post(
    '/admin/configuracoes/emails',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { body: criarEmailTemplateSchema, response: { 201: ok, 400: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const template = await emails.criarEmailTemplate(id, request.body as CriarEmailTemplateInput);
      return reply.code(201).send(template);
    }
  );

  app.patch(
    '/admin/configuracoes/emails/:id',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: {
        params: idParamSchema,
        body: atualizarEmailTemplateSchema,
        response: { 200: ok, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: tplId } = request.params as { id: string };
      const template = await emails.atualizarEmailTemplate(
        id,
        tplId,
        request.body as AtualizarEmailTemplateInput
      );
      return reply.send(template);
    }
  );

  app.delete(
    '/admin/configuracoes/emails/:id',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: tplId } = request.params as { id: string };
      await emails.removerEmailTemplate(id, tplId);
      return reply.send({ message: 'Template de e-mail removido' });
    }
  );

  app.post(
    '/admin/configuracoes/emails/:id/alternar',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: tplId } = request.params as { id: string };
      const template = await emails.alternarEmailTemplate(id, tplId, novoAtivo(request.body));
      return reply.send(template);
    }
  );

  app.post(
    '/admin/configuracoes/emails/:id/preview',
    {
      preHandler: [authMiddleware, requireRole(...LEITURA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: tplId } = request.params as { id: string };
      const template = await emails.buscarEmailTemplatePorId(id, tplId);
      if (!template) return reply.code(404).send({ error: 'Template não encontrado' });
      const variaveis = (request.body as { variaveis?: Record<string, string> })?.variaveis ?? {};
      const preview = emails.previewEmailTemplate(template.corpo_mjml, variaveis);
      return reply.send(preview);
    }
  );

  // ---------- Integrações ----------
  app.get(
    '/admin/configuracoes/integracoes',
    {
      preHandler: [authMiddleware, requireRole(...LEITURA_ROLES)],
      schema: { response: { 200: ok } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      return reply.send({ data: await integracoes.listarIntegracoes(id) });
    }
  );

  app.get(
    '/admin/configuracoes/integracoes/:id',
    {
      preHandler: [authMiddleware, requireRole(...LEITURA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: intId } = request.params as { id: string };
      const config = await integracoes.buscarIntegracaoPorId(id, intId);
      if (!config) return reply.code(404).send({ error: 'Integração não encontrada' });
      return reply.send(config);
    }
  );

  app.get(
    '/admin/configuracoes/integracoes/:id/credenciais',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: intId } = request.params as { id: string };
      const config = await integracoes.buscarCredenciaisIntegracao(id, intId);
      if (!config) return reply.code(404).send({ error: 'Integração não encontrada' });
      return reply.send(config);
    }
  );

  app.post(
    '/admin/configuracoes/integracoes',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { body: criarIntegracaoSchema, response: { 201: ok, 400: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const config = await integracoes.criarIntegracao(id, request.body as CriarIntegracaoInput);
      return reply.code(201).send(config);
    }
  );

  app.patch(
    '/admin/configuracoes/integracoes/:id',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: {
        params: idParamSchema,
        body: atualizarIntegracaoSchema,
        response: { 200: ok, 404: errorSchema },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: intId } = request.params as { id: string };
      const config = await integracoes.atualizarIntegracao(
        id,
        intId,
        request.body as AtualizarIntegracaoInput
      );
      return reply.send(config);
    }
  );

  app.delete(
    '/admin/configuracoes/integracoes/:id',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: intId } = request.params as { id: string };
      await integracoes.removerIntegracao(id, intId);
      return reply.send({ message: 'Integração removida' });
    }
  );

  app.post(
    '/admin/configuracoes/integracoes/:id/alternar',
    {
      preHandler: [authMiddleware, requireRole(...ESCRITA_ROLES)],
      schema: { params: idParamSchema, response: { 200: ok, 404: errorSchema } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = lojaId(request);
      if (!id) return reply.code(400).send({ error: 'Loja não encontrada' });
      const { id: intId } = request.params as { id: string };
      const config = await integracoes.alternarIntegracao(id, intId, novoAtivo(request.body));
      return reply.send(config);
    }
  );
}
