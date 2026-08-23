import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { extractTokenFromHeader } from './jwks.js';
import { type TokenPayload, verifyAccessToken } from './service.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = extractTokenFromHeader(request.headers.authorization);
  if (!token) {
    return reply.code(401).send({ error: 'Token de acesso não fornecido' });
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return reply.code(401).send({ error: 'Token inválido ou expirado' });
  }

  request.user = payload;
}

export function requirePermission(...permissions: string[]) {
  return async function permissionMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.user) {
      return reply.code(401).send({ error: 'Não autenticado' });
    }

    const userPermissions = request.user.permissoes || [];
    const hasPermission = permissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      return reply.code(403).send({ error: 'Permissão insuficiente' });
    }
  };
}

export function requireRole(...roles: string[]) {
  return async function roleMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.user) {
      return reply.code(401).send({ error: 'Não autenticado' });
    }

    const userRoles = request.user.perfis.map((p) => p.codigo);
    const hasRole = roles.some((r) => userRoles.includes(r));

    if (!hasRole) {
      return reply.code(403).send({ error: 'Função necessária não encontrada' });
    }
  };
}

export function requireAnyRole(...roles: string[]) {
  return requireRole(...roles);
}

export function requireAllRoles(...roles: string[]) {
  return async function allRolesMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.user) {
      return reply.code(401).send({ error: 'Não autenticado' });
    }

    const userRoles = request.user.perfis.map((p) => p.codigo);
    const hasAllRoles = roles.every((r) => userRoles.includes(r));

    if (!hasAllRoles) {
      return reply.code(403).send({ error: 'Todas as funções são necessárias' });
    }
  };
}

export async function registerAuthMiddleware(app: FastifyInstance): Promise<void> {
  app.decorateRequest('user', undefined);
  app.addHook('preHandler', async (request) => {
    const token = extractTokenFromHeader(request.headers.authorization);
    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload) {
        request.user = payload;
      }
    }
  });
}
