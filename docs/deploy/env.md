# Deploy — Variáveis de Ambiente e Provisoning

Este documento acompanha os artefatos de deploy:
- `apps/web/vercel.json` — config da loja (Vercel / Next.js)
- `render.yaml` — Blueprint do backend (Render / Fastify)

> **Status:** os artefatos estão prontos, porém o deploy real, a criação das
> contas (Vercel/Render/Supabase) e a definição dos secrets são **ações humanas**
> (credenciais não disponíveis no sandbox). Veja `docs/phases/phases_00_10.md`
> → Fase 1.1 → subfases `PENDENTE`.

## 1. Supabase Staging (PostgreSQL + Auth + Storage)
1. Criar projeto `nextcommerce-staging` no Supabase.
2. Anotar a **Connection string** do pooler (`6543`, modo transaction) → `DATABASE_URL`.
3. Auth: o app usa o Supabase apenas como provedor de JWT (JWKS) e Storage.
   - `SUPABASE_JWT_SECRET` vem das configurações de Auth do projeto.
4. Storage: bucket `produtos` (público) para imagens de catálogo.
5. **RLS:** a aplicação aplica autorização em **nível de aplicação** (Prisma +
   middleware `verifyAccessToken` via JWKS). As policies de RLS do Supabase
   permanecem como defesa em profundidade; não há multi-tenant via RLS nesta fase.

> Alternativa: usar o Postgres gerenciado do próprio Render (bloco `databases`
> em `render.yaml`) — basta remover o `databases` e apontar `DATABASE_URL`
> manualmente para o Supabase pooler.

## 2. API (Render) — variáveis
| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | ✅ | Pooler Supabase (ou Render PG) — `fromDatabase` no Blueprint |
| `NODE_ENV` | ✅ | `production` |
| `API_URL` | ✅ | URL pública da API (`https://nextcommerce-api.onrender.com`) |
| `API_PUBLIC_URL` | ✅ | Mesma da `API_URL` (usada em webhooks/callbacks) |
| `FRONTEND_URL` | ✅ | URL da loja (Vercel) para CORS/callbacks |
| `JWT_SECRET` | ✅ | Segredo HMAC dos access tokens (`generateValue` no Blueprint) |
| `SUPABASE_JWT_SECRET` | ✅ | Valida JWTs do Supabase Auth |
| `MERCADO_PAGO_ACCESS_TOKEN` | ⚠️ | Necessário para checkout real |
| `MERCADO_PAGO_PUBLIC_KEY` | ⚠️ | Checkout front-end |
| `SENTRY_DSN` | ⚠️ | Observabilidade (ver seção Sentry) |

## 3. Web (Vercel) — variáveis
Definir em **Project Settings → Environment Variables** (todas como "Plain"):
| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://nextcommerce-api.onrender.com` (ou proxy `/api/backend`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase staging |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN do Sentry (opcional) |

## 4. Sentry (observabilidade)
- Web: `@sentry/nextjs` (ver `apps/web/src/instrumentation.ts`).
- API: `@sentry/node` (ver `apps/api/src/main.ts`).
- Criar dois projetos no Sentry (ou um com dois ambientes) e copiar os DSNs
  para `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`.
- Configurar alertas de **uptime**, **taxa de erro** e **latência** uma vez
  que os serviços estejam no ar.

## 5. Ordem de deploy (sugerida)
1. Banco (Supabase/Render PG) + `pnpm db:migrate` + `pnpm db:seed`.
2. API no Render (aguarda `/ready` = 200).
3. Web na Vercel (build `pnpm --filter @nextcommerce/web build`).
4. Smoke tests (ver `apps/web/src/test/e2e/smoke.staging.spec.ts`).
