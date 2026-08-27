# NextCommerce — API (apps/api)

Backend Fastify da plataforma NextCommerce: API REST para todo o domínio de e-commerce.

## Stack
- **Framework**: Fastify 5 + TypeScript 5 (strict)
- **Arquitetura**: Modular (routes → controllers → services → repositories)
- **Validação**: Zod (schemas de `@nextcommerce/shared`)
- **Auth**: Supabase Auth (JWT verification via JWKS)
- **ORM**: Prisma 7 (PostgreSQL) + `@prisma/adapter-pg`
- **Banco**: Supabase (PostgreSQL 16, Auth, Storage, Realtime)
- **Cache/Queue**: Redis (Upstash) — sessions, rate limit, cache
- **Jobs**: node-cron (conciliação, alertas, relatórios)
- **Testes**: Vitest
- **Lint/Format**: Biome
- **Docs API**: Scalar/OpenAPI (auto-gerado via Zod schemas)

## Estrutura
```
apps/api/
├── src/
│   ├── main.ts                 # Entry point (Fastify bootstrap, plugins, routes)
│   ├── routes/                 # Definição de rotas (um arquivo por feature)
│   │   ├── auth.routes.ts
│   │   ├── products.routes.ts
│   │   ├── orders.routes.ts
│   │   ├── cart.routes.ts
│   │   ├── checkout.routes.ts
│   │   ├── payments.routes.ts
│   │   ├── stock.routes.ts
│   │   ├── reports.routes.ts
│   │   ├── config.routes.ts
│   │   └── webhooks.routes.ts
│   ├── controllers/            # Recebem request, validam, delegam para services
│   │   ├── auth.controller.ts
│   │   ├── products.controller.ts
│   │   ├── orders.controller.ts
│   │   ├── cart.controller.ts
│   │   ├── checkout.controller.ts
│   │   ├── payments.controller.ts
│   │   ├── stock.controller.ts
│   │   └── ...
│   ├── services/               # Casos de uso, regras de negócio, orquestração
│   │   ├── auth.service.ts
│   │   ├── products.service.ts
│   │   ├── orders.service.ts
│   │   ├── cart.service.ts
│   │   ├── checkout.service.ts
│   │   ├── payments.service.ts
│   │   ├── stock.service.ts
│   │   ├── reports.service.ts
│   │   └── ...
│   ├── repositories/           # Encapsulam acesso ao banco (Prisma)
│   │   ├── user.repository.ts
│   │   ├── product.repository.ts
│   │   ├── order.repository.ts
│   │   ├── stock.repository.ts
│   │   └── ...
│   ├── schemas/                # Re-export @nextcommerce/shared/schemas + validações internas
│   ├── providers/              # Integrações externas
│   │   ├── storage.provider.ts      # Supabase Storage
│   │   ├── email.provider.ts        # E-mail transacional (Resend/SendGrid)
│   │   ├── payment.provider.ts      # Mercado Pago / Stripe
│   │   ├── shipping.provider.ts     # Correios / Jadlog / Melhor Envio
│   │   └── nfe.provider.ts          # Emissão NF-e (provedor)
│   ├── middleware/             # Auth, RBAC, rate limit, logging, error handling
│   │   ├── auth.middleware.ts       # JWT verify → userId, lojaId, perfis[]
│   │   ├── rbac.middleware.ts       # Permissão route:action
│   │   ├── rate-limit.middleware.ts # Por IP + user
│   │   └── error.middleware.ts      # RFC 9457 Problem Details
│   ├── lib/                    # Utilitários técnicos
│   │   ├── prisma.ts                # PrismaClient singleton
│   │   ├── crypto.ts                # AES-256 encrypt/decrypt
│   │   ├── date.ts                  # Helpers date-fns
│   │   ├── pagination.ts            # Cursor pagination helpers
│   │   └── idempotency.ts           # Idempotency key store (Redis)
│   ├── types/                  # Re-export @nextcommerce/shared/types + internos
│   ├── jobs/                   # Jobs agendados (cron)
│   │   ├── reconciliation.job.ts    # Conciliação financeira diária
│   │   ├── stock-alerts.job.ts      # Alertas estoque horário
│   │   └── reports.job.ts           # Relatórios agendados
│   └── events/                 # Event handlers (webhooks, domain events)
│       ├── payment.webhook.ts       # Mercado Pago / Stripe webhooks
│       ├── shipping.webhook.ts      # Transportadoras webhooks
│       └── order.events.ts          # Domain events (pedido criado, status changed)
├── prisma/
│   ├── schema.prisma           # Schema Prisma (entidades de entities.md)
│   ├── migrations/             # Migrations versionadas
│   └── seed.ts                 # Seed: perfis sistema, configs iniciais
├── package.json
├── tsconfig.json
├── biome.json
├── vitest.config.ts
└── README.md
```

## Regras de camadas (obrigatórias)
| Camada | Responsabilidade | Proibido |
|--------|------------------|----------|
| `routes` | Definir rotas, registrar controllers | Lógica de negócio, Prisma |
| `controllers` | Validar (Zod), chamar service, formatar response | Regras de negócio, Prisma |
| `services` | **Regras de negócio**, casos de uso, transações | Prisma direto (usar repositories) |
| `repositories` | **Único lugar com Prisma Client** | Regras de negócio, HTTP |
| `providers` | Abstrair integrações externas | Regras de negócio, Prisma |
| `middleware` | Auth, RBAC, rate limit, logging, errors | Regras de domínio |

## Comandos
```bash
# Desenvolvimento
pnpm dev              # tsx watch (porta 3001)

# Build
pnpm build            # tsc + tsc-alias → dist/

# Banco de dados
pnpm db:generate      # prisma generate
pnpm db:push          # Push schema (dev only)
pnpm db:migrate       # Migração versionada (dev)
pnpm db:migrate:deploy # Deploy migrações (prod)
pnpm db:seed          # Seed dados iniciais
pnpm db:studio        # Prisma Studio

# Qualidade
pnpm lint             # Biome check + fix
pnpm lint:check       # Biome check only
pnpm format           # Biome format
pnpm typecheck        # tsc --noEmit

# Testes
pnpm test             # Vitest run
pnpm test:watch       # Vitest watch
pnpm test:coverage    # Coverage report
```

## Variáveis de ambiente
`.env` (não versionado):
```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
DIRECT_URL="postgresql://user:pass@host:5432/db?schema=public"

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# JWT (para tokens próprios se necessário)
JWT_SECRET="..."
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="..."
REFRESH_TOKEN_EXPIRES_IN="30d"

# Encryption (credenciais gateways no banco)
ENCRYPTION_KEY="32-char-base64-string"

# Redis (Upstash)
REDIS_URL="rediss://..."
REDIS_TOKEN="..."

# App
API_URL="http://localhost:3001"
NODE_ENV="development"
PORT=3001

# Gateways (configuração inicial, depois no banco criptografado)
MERCADO_PAGO_CLIENT_ID="..."
MERCADO_PAGO_CLIENT_SECRET="..."
STRIPE_SECRET_KEY="..."
```

## Autenticação & Autorização
- **Access Token**: JWT RS256 (JWKS do Supabase), 15min
- **Refresh Token**: Rotação, httpOnly cookie opcional
- **Middleware `auth`**: Valida JWT → anexa `request.user = { id, lojaId, perfis[] }`
- **Middleware `rbac`**: Verifica `permissao` por rota (`route:action` ex: `pedidos:write`)
- **Perfis**: ADMIN, GESTOR, OPERADOR, ESTOQUISTA, CLIENTE (imutáveis, seed)

## Padrões de API
- **REST**: Recursos plural (`/api/v1/produtos`, `/api/v1/pedidos`)
- **Versionamento**: `/api/v1/` + header `Accept: application/vnd.nextcommerce.v1+json`
- **Paginação**: Cursor-based (`?cursor=&limit=20`) → `{ data, nextCursor, hasMore }`
- **Filtros**: Query params tipados Zod (`?status=PAGO&data_inicio=2024-01-01`)
- **Ordenação**: `?sort=created_at:desc`
- **Erros**: RFC 9457 Problem Details
  ```json
  { "type": "https://nextcommerce.com/errors/validation", "title": "Validation Error", "status": 422, "detail": "Invalid input", "instance": "/api/v1/pedidos", "errors": [{ "field": "email", "message": "Invalid email", "code": "INVALID_FORMAT" }] }
  ```

## Webhooks
- **HMAC SHA256** (secret por integração, configurado no banco)
- **Idempotency**: `Idempotency-Key` header + tabela `webhook_event` (chaves processadas)
- **Retry**: Exponencial 3x + Dead Letter Queue (`webhook_dlq`)
- **Logging**: Estruturado (request/response headers + body)

## Rate Limiting
- Por IP + por usuário autenticado (Redis)
- Configurável por rota: auth 10/min, checkout 30/min, admin 100/min

## Dados Sensíveis
- **Nunca** commitar secrets
- Credenciais gateways criptografadas no banco (AES-256, `ENCRYPTION_KEY` env)
- Service role keys apenas backend

## Deploy
**Render** — Build: `pnpm build`, Start: `node dist/main.js`
- Health check: `GET /health`
- Auto-deploy branch `main`
- Variáveis de ambiente no dashboard Render

## Documentação relacionada
- `/docs/context.md` — Contexto do sistema
- `/docs/product.md` — Visão de produto
- `/docs/behavior.md` — Comportamento funcional
- `/docs/entities.md` — Modelo de domínio
- `/docs/tech.md` — Arquitetura técnica (seção Backend)
- `/docs/phases.md` — Roadmap (Fase 0.1 ativa)

## Contraparte
**Frontend**: `apps/web` (Next.js 16 + TanStack Query)
Contratos compartilhados: `@nextcommerce/shared` (tipos, schemas Zod)