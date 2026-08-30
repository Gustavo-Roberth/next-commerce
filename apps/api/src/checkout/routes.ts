import type { Prisma } from '@/generated/prisma/client';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware } from '../auth/middleware.js';
import * as cupomService from '../cupom/service.js';
import * as freteService from '../frete/service.js';
import { prisma } from '../lib/prisma.js';
import {
  type CheckoutInput,
  checkoutResponseSchema,
  checkoutSchema,
} from '../schemas/checkout.schemas.js';
import {
  applyCupomResponseSchema,
  applyCupomSchema,
  calcularFreteResponseSchema,
  calcularFreteSchema,
} from '../schemas/order.schemas.js';

const checkoutBodySchema = checkoutSchema;
const applyCupomBodySchema = applyCupomSchema;
const calcularFreteBodySchema = calcularFreteSchema;

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

interface LojaConfig {
  cep_origem?: string;
  [key: string]: unknown;
}

export async function checkoutRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/checkout/calcular-frete',
    {
      preHandler: [authMiddleware],
      schema: {
        body: calcularFreteBodySchema,
        response: {
          200: calcularFreteResponseSchema,
          400: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as {
        cep_destino: string;
        itens: Array<{ variacao_id: string; quantidade: number }>;
      };
      const { cep_destino, itens } = body;

      const loja = await prisma.loja.findFirst({ where: { ativa: true } });
      if (!loja) {
        return reply.code(400).send({ error: 'Loja não configurada' });
      }

      const config = loja.configuracoes_seo as LojaConfig | null;
      const cepOrigem = (config?.cep_origem as string) || '01000-000';

      const detalhes = await Promise.all(
        itens.map(async (item) => {
          const variacao = await prisma.produtoVariacao.findUnique({
            where: { id: item.variacao_id },
            select: { peso_liquido_kg: true, preco_cents: true },
          });
          const preco = Number(variacao?.preco_cents || 0);
          const peso = Number(variacao?.peso_liquido_kg || 0.1) * item.quantidade;
          return { subtotal: preco * item.quantidade, peso };
        })
      );

      const subtotal_cents = detalhes.reduce((acc, d) => acc + d.subtotal, 0);
      const peso_kg = detalhes.reduce((acc, d) => acc + d.peso, 0);

      const regras = await freteService.calcularFrete(loja.id, {
        cep_destino,
        subtotal_cents,
        peso_kg,
      });

      const opcoes = regras.map((r) => ({
        nome: r.nome,
        tipo: r.tipo,
        prazo_dias: r.prazo_dias ?? 0,
        valor_cents: r.valor_cents,
        transportadora:
          r.tipo === 'CORREIOS'
            ? 'Correios'
            : r.tipo === 'TRANSPORTADORA'
              ? 'Transportadora'
              : r.tipo,
      }));

      return reply.send({
        opcoes,
        cep_origem: cepOrigem,
        cep_destino: cep_destino.replace(/^(\d{5})(\d{3})$/, '$1-$2'),
      });
    }
  );

  app.post(
    '/checkout/aplicar-cupom',
    {
      preHandler: [authMiddleware],
      schema: {
        body: applyCupomBodySchema,
        response: {
          200: applyCupomResponseSchema,
          400: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as {
        codigo: string;
        subtotal_cents: number;
        categorias?: string[];
        produtos?: string[];
      };
      const lojaId = request.user?.loja_id || '';
      const clienteId = request.user?.sub;

      const resultado = await cupomService.validarCupom(lojaId, {
        codigo: body.codigo,
        subtotal_cents: body.subtotal_cents,
        cliente_id: clienteId,
        categorias: body.categorias,
        produtos: body.produtos,
      });

      return reply.send({
        valido: resultado.valido,
        desconto_cents: resultado.desconto_cents,
        frete_gratis: resultado.frete_gratis,
        mensagem: resultado.mensagem,
        cupom: resultado.cupom_id
          ? {
              id: resultado.cupom_id,
              codigo: resultado.codigo ?? body.codigo,
              nome: '',
              tipo: resultado.tipo ?? '',
              valor: resultado.valor,
            }
          : undefined,
      });
    }
  );

  app.post(
    '/checkout',
    {
      preHandler: [authMiddleware],
      schema: {
        body: checkoutBodySchema,
        response: {
          201: checkoutResponseSchema,
          400: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
          409: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as CheckoutInput;
      const userId = request.user?.sub;

      if (!userId) {
        return reply.code(401).send({ error: 'Usuário não autenticado' });
      }

      const sessionId = (request.headers['x-session-id'] as string) || null;
      const lojaId = request.user?.loja_id || '';

      if (!lojaId) {
        return reply.code(400).send({ error: 'Loja não encontrada' });
      }

      const cart = await prisma.carrinho.findFirst({
        where: userId
          ? { cliente_id: userId, loja_id: lojaId }
          : { sessao_id: sessionId, loja_id: lojaId },
        include: {
          itens: {
            include: {
              produto: {
                select: {
                  id: true,
                  nome: true,
                  slug: true,
                  sku: true,
                  ativo: true,
                  status: true,
                  imagens: { where: { principal: true }, take: 1 },
                },
              },
              variacao: {
                select: {
                  id: true,
                  sku: true,
                  nome: true,
                  preco_cents: true,
                  ativo: true,
                  imagens: { where: { principal: true }, take: 1 },
                },
              },
            },
          },
        },
      });

      if (!cart || cart.itens.length === 0) {
        return reply.code(400).send({ error: 'Carrinho vazio' });
      }

      for (const item of cart.itens) {
        const variacao = await prisma.produtoVariacao.findUnique({
          where: { id: item.variacao_id },
          include: { estoques: { where: { loja_id: lojaId } } },
        });
        if (!variacao || !variacao.ativo) {
          return reply.code(409).send({ error: `Variação ${item.variacao_id} indisponível` });
        }
        const estoqueTotal = variacao.estoques.reduce((acc, e) => acc + e.quantidade_fisica, 0);
        if (estoqueTotal < item.quantidade) {
          return reply.code(409).send({ error: `Estoque insuficiente para ${variacao.nome}` });
        }
      }

      let descontoCents = 0;
      let cupomId: string | null = null;
      let freteGratis = false;

      if (body.cupom_codigo) {
        const subtotalCarrinho = cart.itens.reduce((acc, item) => {
          const preco = Number(item.variacao?.preco_cents || 0);
          return acc + preco * item.quantidade;
        }, 0);
        const resultado = await cupomService.validarCupom(lojaId, {
          codigo: body.cupom_codigo,
          subtotal_cents: subtotalCarrinho,
          cliente_id: userId,
        });
        if (!resultado.valido) {
          return reply.code(400).send({ error: resultado.mensagem || 'Cupom inválido' });
        }
        descontoCents = resultado.desconto_cents;
        cupomId = resultado.cupom_id ?? null;
        freteGratis = resultado.frete_gratis;
      }

      const enderecoEntrega = await prisma.endereco.findUnique({
        where: { id: body.endereco_entrega_id },
      });
      if (!enderecoEntrega || enderecoEntrega.usuario_id !== userId) {
        return reply.code(404).send({ error: 'Endereço de entrega não encontrado' });
      }

      let enderecoCobranca = enderecoEntrega;
      if (body.endereco_cobranca_id) {
        const ec = await prisma.endereco.findUnique({ where: { id: body.endereco_cobranca_id } });
        if (ec && ec.usuario_id === userId) enderecoCobranca = ec;
      }

      const freteValor = freteGratis ? 0 : body.frete_selecionado.valor_cents;
      const subtotalCents = cart.itens.reduce((acc, item) => {
        const preco = Number(item.variacao?.preco_cents || 0);
        return acc + preco * item.quantidade;
      }, 0);

      const totalCents = subtotalCents - descontoCents + freteValor;

      const numeroSequencial = (await prisma.pedido.count({ where: { loja_id: lojaId } })) + 1;

      const pedido = await prisma.pedido.create({
        data: {
          loja_id: lojaId,
          cliente_id: userId,
          numero_sequencial: numeroSequencial,
          status: 'CRIADO',
          subtotal_cents: subtotalCents,
          desconto_cents: descontoCents,
          frete_cents: freteValor,
          total_cents: totalCents,
          cupom_id: cupomId,
          endereco_entrega_id: body.endereco_entrega_id,
          endereco_cobranca_id: enderecoCobranca.id,
          observacoes_cliente: '',
        },
      });

      for (const item of cart.itens) {
        const precoUnitario = Number(item.variacao?.preco_cents || 0);
        await prisma.itemPedido.create({
          data: {
            pedido_id: pedido.id,
            produto_id: item.produto_id,
            variacao_id: item.variacao_id,
            nome_produto: item.produto?.nome || '',
            sku: item.variacao?.sku || '',
            quantidade: item.quantidade,
            preco_unitario_cents: precoUnitario,
            total_cents: precoUnitario * item.quantidade,
          },
        });
      }

      if (cupomId) {
        await prisma.cupom.update({
          where: { id: cupomId },
          data: { uso_atual: { increment: 1 } },
        });
      }

      const idempotencyKey = generateIdempotencyKey();
      const pagamento = await prisma.pagamento.create({
        data: {
          pedido_id: pedido.id,
          gateway: body.pagamento.gateway,
          metodo: body.pagamento.metodo,
          status: 'INICIADO',
          valor_cents: totalCents,
          parcelas: body.pagamento.parcelas || 1,
          juros_cents: 0,
          idempotency_key: idempotencyKey,
        },
      });

      await prisma.itemCarrinho.deleteMany({ where: { carrinho_id: cart.id } });
      await prisma.carrinho.delete({ where: { id: cart.id } });

      let paymentUrl: string | undefined;
      let pixQrCode: string | undefined;
      let pixQrCodeBase64: string | undefined;
      let expiresAt: string | undefined;

      if (body.pagamento.gateway === 'MERCADO_PAGO') {
        try {
          const mpResponse = await createMercadoPagoPreference({
            pedido_id: pedido.id,
            pagamento_id: pagamento.id,
            total_cents: totalCents,
            metodo: body.pagamento.metodo,
            parcelas: body.pagamento.parcelas || 1,
            cliente_email: request.user?.email || '',
            cliente_nome: request.user?.nome_completo || '',
            external_reference: idempotencyKey,
          });

          paymentUrl = mpResponse.init_point;
          pixQrCode = mpResponse.pix_qr_code;
          pixQrCodeBase64 = mpResponse.pix_qr_code_base64;
          expiresAt = mpResponse.expires_at;

          await prisma.pagamento.update({
            where: { id: pagamento.id },
            data: {
              gateway_transaction_id: mpResponse.preference_id,
              gateway_response: mpResponse as Prisma.InputJsonValue,
            },
          });
        } catch (error) {
          console.error('Erro ao criar preferência Mercado Pago:', error);
        }
      }

      return reply.code(201).send({
        pedido_id: pedido.id,
        pagamento_id: pagamento.id,
        status: pedido.status,
        payment_url: paymentUrl,
        pix_qr_code: pixQrCode,
        pix_qr_code_base64: pixQrCodeBase64,
        expires_at: expiresAt,
      });
    }
  );
}

interface MercadoPagoPreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

interface MercadoPagoPreferenceInput {
  items: MercadoPagoPreferenceItem[];
  payer: { email: string; name: string };
  payment_methods: {
    excluded_payment_types: Array<{ id: string }>;
    excluded_payment_methods: unknown[];
    installments: number;
  };
  external_reference: string;
  notification_url: string;
  auto_return: string;
  back_urls: { success: string; failure: string; pending: string };
  expires: boolean;
  expiration_date_from: string;
  expiration_date_to: string;
}

interface MercadoPagoPreferenceResult {
  id: string;
  init_point: string;
  pix?: { qr_code?: string; qr_code_base64?: string };
  expiration_date_to?: string;
}

async function createMercadoPagoPreference(data: {
  pedido_id: string;
  pagamento_id: string;
  total_cents: number;
  metodo: string;
  parcelas: number;
  cliente_email: string;
  cliente_nome: string;
  external_reference: string;
}): Promise<{
  preference_id: string;
  init_point: string;
  pix_qr_code?: string | undefined;
  pix_qr_code_base64?: string | undefined;
  expires_at?: string | undefined;
}> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('Mercado Pago access token não configurado');
  }

  const isPix = data.metodo === 'PIX';

  const items = [
    {
      id: data.pedido_id,
      title: `Pedido #${data.pedido_id}`,
      quantity: 1,
      unit_price: data.total_cents / 100,
      currency_id: 'BRL',
    },
  ];

  const body: MercadoPagoPreferenceInput = {
    items,
    payer: {
      email: data.cliente_email,
      name: data.cliente_nome,
    },
    payment_methods: {
      excluded_payment_types: [],
      excluded_payment_methods: [],
      installments: data.parcelas,
    },
    external_reference: data.external_reference,
    notification_url: `${process.env.API_PUBLIC_URL || 'http://localhost:3001'}/api/v1/webhooks/mercado-pago`,
    auto_return: 'approved',
    back_urls: {
      success: `${process.env.WEB_URL || 'http://localhost:3000'}/checkout/sucesso`,
      failure: `${process.env.WEB_URL || 'http://localhost:3000'}/checkout/falha`,
      pending: `${process.env.WEB_URL || 'http://localhost:3000'}/checkout/pendente`,
    },
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };

  if (isPix) {
    body.payment_methods.excluded_payment_types = [
      { id: 'credit_card' },
      { id: 'debit_card' },
      { id: 'boleto' },
    ];
    body.payment_methods.excluded_payment_methods = [];
  }

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Mercado Pago error: ${JSON.stringify(error)}`);
  }

  const result = (await response.json()) as MercadoPagoPreferenceResult;

  return {
    preference_id: result.id,
    init_point: result.init_point,
    pix_qr_code: result.pix?.qr_code,
    pix_qr_code_base64: result.pix?.qr_code_base64,
    expires_at: result.expiration_date_to,
  };
}
