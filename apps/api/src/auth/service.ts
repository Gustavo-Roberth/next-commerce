import type { Perfil, Prisma, Usuario, UsuarioPerfil } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { type JWTPayload, SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production'
);
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production'
);
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  loja_id: string;
  perfis: Array<{ codigo: string; nome: string }>;
  permissoes: string[];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type UsuarioPerfilComPerfil = UsuarioPerfil & { perfil: Perfil };

export function buildPermissions(usuarioPerfis: UsuarioPerfilComPerfil[]): string[] {
  const permissions = new Set<string>();
  for (const up of usuarioPerfis) {
    if (up.ativo && up.perfil.permissoes) {
      const permissoes = up.perfil.permissoes as Prisma.JsonValue;
      if (typeof permissoes === 'object' && permissoes !== null && !Array.isArray(permissoes)) {
        for (const [key, value] of Object.entries(permissoes as Record<string, unknown>)) {
          if (value === true) permissions.add(key);
        }
      }
    }
  }
  return Array.from(permissions);
}

export async function generateAccessToken(
  payload: Omit<TokenPayload, 'exp' | 'iat'>
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function generateRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify<TokenPayload>(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify<{ sub: string; type: string }>(token, JWT_REFRESH_SECRET);
    if (payload.type !== 'refresh') return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

export async function generateAuthTokens(
  user: Usuario,
  usuarioPerfis: UsuarioPerfilComPerfil[]
): Promise<AuthTokens> {
  const perfis = usuarioPerfis.map((up) => ({ codigo: up.perfil.codigo, nome: up.perfil.nome }));
  const permissoes = buildPermissions(usuarioPerfis);

  const accessToken = await generateAccessToken({
    sub: user.id,
    email: user.email,
    loja_id: usuarioPerfis[0]?.loja_id || '',
    perfis,
    permissoes,
  });

  const refreshToken = await generateRefreshToken(user.id);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 15 * 60,
  };
}
