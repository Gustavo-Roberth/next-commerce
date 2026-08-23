import { createRemoteJWKSet, jwtVerify } from 'jose';

const SUPABASE_JWKS_URL =
  process.env.SUPABASE_JWKS_URL ||
  `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/auth/v1/.well-known/jwks.json`;

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS(): ReturnType<typeof createRemoteJWKSet> {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(SUPABASE_JWKS_URL), {
      cacheMaxAge: 600000,
      cooldownDuration: 30000,
    });
  }
  return jwksCache;
}

export interface SupabaseJWTPayload {
  sub: string;
  email: string;
  phone?: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    email?: string;
    full_name?: string;
    phone?: string;
    [key: string]: unknown;
  };
  aud: string;
  role: string;
  aal: string;
  amr: Array<{ method: string; timestamp: number }>;
  session_id: string;
  is_anonymous: boolean;
  exp: number;
  iat: number;
  iss: string;
}

export async function verifySupabaseJWT(
  token: string
): Promise<{ payload: SupabaseJWTPayload; protectedHeader: import('jose').JWTHeaderParameters }> {
  const jwks = getJWKS();
  const result = await jwtVerify<SupabaseJWTPayload>(token, jwks, {
    issuer: `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/auth/v1`,
    audience: 'authenticated',
  });
  return result;
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length < 2) return null;
  const scheme = parts[0];
  if (!scheme || scheme.toLowerCase() !== 'bearer') return null;
  const token = parts[1];
  return token ?? null;
}
