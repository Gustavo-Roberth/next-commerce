import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from './middleware.js';
import {
  type LoginInput,
  type RefreshTokenInput,
  type RegisterInput,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from './schemas.js';
import {
  type UsuarioPerfilComPerfil,
  generateAuthTokens,
  generateRefreshToken,
  hashPassword,
  verifyPassword,
  verifyRefreshToken,
} from './service.js';

const loginBodySchema = loginSchema;
const registerBodySchema = registerSchema;
const refreshBodySchema = refreshTokenSchema;

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: LoginInput }>(
    '/auth/login',
    {
      schema: {
        body: loginBodySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              access_token: { type: 'string' },
              refresh_token: { type: 'string' },
              expires_in: { type: 'number' },
              token_type: { type: 'string', enum: ['Bearer'] },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
                  nome_completo: { type: 'string' },
                  loja_id: { type: 'string', format: 'uuid' },
                  perfis: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        codigo: { type: 'string' },
                        nome: { type: 'string' },
                      },
                    },
                  },
                  permissoes: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
      const { email, password } = request.body;

      const user = await prisma.usuario.findUnique({
        where: { email },
        include: {
          perfis: {
            where: { ativo: true },
            include: { perfil: true },
          },
        },
      });

      if (!user || !user.ativo) {
        return reply.code(401).send({ error: 'Credenciais inválidas' });
      }

      const isValid = await verifyPassword(password, user.senha_hash);
      if (!isValid) {
        return reply.code(401).send({ error: 'Credenciais inválidas' });
      }

      const activePerfis = user.perfis.filter(
        (up): up is UsuarioPerfilComPerfil => up.ativo && up.perfil != null
      );
      if (activePerfis.length === 0) {
        return reply.code(403).send({ error: 'Usuário sem perfil ativo' });
      }

      await prisma.usuario.update({
        where: { id: user.id },
        data: { ultimo_login_em: new Date() },
      });

      const tokens = await generateAuthTokens(user, activePerfis);

      return reply.send({
        ...tokens,
        token_type: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          nome_completo: user.nome_completo,
          loja_id: activePerfis[0]?.loja_id,
          perfis: activePerfis.map((up) => ({ codigo: up.perfil.codigo, nome: up.perfil.nome })),
          permissoes: activePerfis.flatMap((up) =>
            Object.entries((up.perfil.permissoes as Record<string, unknown>) || {})
              .filter(([, v]) => v === true)
              .map(([k]) => k)
          ),
        },
      });
    }
  );

  app.post<{ Body: RegisterInput }>(
    '/auth/register',
    {
      schema: {
        body: registerBodySchema,
        response: {
          201: {
            type: 'object',
            properties: {
              access_token: { type: 'string' },
              refresh_token: { type: 'string' },
              expires_in: { type: 'number' },
              token_type: { type: 'string', enum: ['Bearer'] },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
                  nome_completo: { type: 'string' },
                  loja_id: { type: 'string', format: 'uuid' },
                  perfis: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        codigo: { type: 'string' },
                        nome: { type: 'string' },
                      },
                    },
                  },
                  permissoes: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          409: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
      const { email, password, nome_completo, telefone, cpf_cnpj } = request.body;

      const existingUser = await prisma.usuario.findFirst({
        where: { OR: [{ email }, { cpf_cnpj: cpf_cnpj ?? null }] },
      });

      if (existingUser) {
        return reply.code(409).send({ error: 'E-mail ou CPF/CNPJ já cadastrado' });
      }

      const clientePerfil = await prisma.perfil.findUnique({
        where: { codigo: 'CLIENTE' },
      });

      if (!clientePerfil) {
        return reply.code(500).send({ error: 'Perfil CLIENTE não configurado' });
      }

      const defaultLoja = await prisma.loja.findFirst({ where: { ativa: true } });
      if (!defaultLoja) {
        return reply.code(500).send({ error: 'Nenhuma loja ativa disponível' });
      }

      const senha_hash = await hashPassword(password);

      const user = await prisma.usuario.create({
        data: {
          email,
          senha_hash,
          nome_completo,
          telefone: telefone ?? null,
          cpf_cnpj: cpf_cnpj ?? null,
          ativo: true,
          perfis: {
            create: {
              perfil_id: clientePerfil.id,
              loja_id: defaultLoja.id,
              ativo: true,
            },
          },
        },
        include: {
          perfis: {
            where: { ativo: true },
            include: { perfil: true },
          },
        },
      });

      const activePerfis = user.perfis.filter(
        (up): up is UsuarioPerfilComPerfil => up.ativo && up.perfil != null
      );
      const tokens = await generateAuthTokens(user, activePerfis);

      return reply.code(201).send({
        ...tokens,
        token_type: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          nome_completo: user.nome_completo,
          loja_id: activePerfis[0]?.loja_id,
          perfis: activePerfis.map((up) => ({ codigo: up.perfil.codigo, nome: up.perfil.nome })),
          permissoes: activePerfis.flatMap((up) =>
            Object.entries((up.perfil.permissoes as Record<string, unknown>) || {})
              .filter(([, v]) => v === true)
              .map(([k]) => k)
          ),
        },
      });
    }
  );

  app.post<{ Body: RefreshTokenInput }>(
    '/auth/refresh',
    {
      schema: {
        body: refreshBodySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              access_token: { type: 'string' },
              refresh_token: { type: 'string' },
              expires_in: { type: 'number' },
              token_type: { type: 'string', enum: ['Bearer'] },
            },
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RefreshTokenInput }>, reply: FastifyReply) => {
      const { refresh_token } = request.body;

      const payload = await verifyRefreshToken(refresh_token);
      if (!payload) {
        return reply.code(401).send({ error: 'Refresh token inválido ou expirado' });
      }

      const user = await prisma.usuario.findUnique({
        where: { id: payload.sub },
        include: {
          perfis: {
            where: { ativo: true },
            include: { perfil: true },
          },
        },
      });

      if (!user || !user.ativo) {
        return reply.code(401).send({ error: 'Usuário não encontrado ou inativo' });
      }

      const activePerfis = user.perfis.filter(
        (up): up is UsuarioPerfilComPerfil => up.ativo && up.perfil != null
      );
      if (activePerfis.length === 0) {
        return reply.code(403).send({ error: 'Usuário sem perfil ativo' });
      }

      const newAccessToken = (await generateAuthTokens(user, activePerfis)).access_token;
      const newRefreshToken = await generateRefreshToken(user.id);

      return reply.send({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: 15 * 60,
        token_type: 'Bearer',
      });
    }
  );

  app.get(
    '/auth/me',
    {
      preHandler: [authMiddleware],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              nome_completo: { type: 'string' },
              telefone: { type: 'string', nullable: true },
              cpf_cnpj: { type: 'string', nullable: true },
              avatar_url: { type: 'string', nullable: true },
              ativo: { type: 'boolean' },
              email_verificado_em: { type: 'string', format: 'date-time', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              loja_id: { type: 'string', format: 'uuid' },
              perfis: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    codigo: { type: 'string' },
                    nome: { type: 'string' },
                  },
                },
              },
              permissoes: { type: 'array', items: { type: 'string' } },
            },
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.sub;
      if (!userId) {
        return reply.code(401).send({ error: 'Não autenticado' });
      }
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        include: {
          perfis: {
            where: { ativo: true },
            include: { perfil: true },
          },
        },
      });

      if (!user) {
        return reply.code(404).send({ error: 'Usuário não encontrado' });
      }

      const activePerfis = user.perfis.filter(
        (up): up is UsuarioPerfilComPerfil => up.ativo && up.perfil != null
      );

      return reply.send({
        id: user.id,
        email: user.email,
        nome_completo: user.nome_completo,
        telefone: user.telefone,
        cpf_cnpj: user.cpf_cnpj,
        avatar_url: user.avatar_url,
        ativo: user.ativo,
        email_verificado_em: user.email_verificado_em?.toISOString() ?? null,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
        loja_id: activePerfis[0]?.loja_id ?? '',
        perfis: activePerfis.map((up) => ({ codigo: up.perfil.codigo, nome: up.perfil.nome })),
        permissoes: activePerfis.flatMap((up) =>
          Object.entries((up.perfil.permissoes as Record<string, unknown>) || {})
            .filter(([, v]) => v === true)
            .map(([k]) => k)
        ),
      });
    }
  );

  app.post(
    '/auth/logout',
    {
      preHandler: [authMiddleware],
      schema: {
        response: {
          200: { type: 'object', properties: { message: { type: 'string' } } },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({ message: 'Logout realizado com sucesso' });
    }
  );
}
