# Agent Instructions — NextCommerce API (apps/api)

## Identidade do Repositório
- **Este repositório**: `apps/api` — Backend Fastify
- **Contraparte**: `apps/web` — Frontend Next.js
- **Compartilhado**: `@nextcommerce/shared` (packages/shared)
- **Projeto**: NextCommerce (SaaS e-commerce multi-tenant)

## Responsabilidades Exclusivas
- API REST (rotas, controllers)
- Casos de uso e regras de domínio
- Validações de entrada/saída (Zod)
- Autorização e controle de acesso (RBAC)
- Persistência (Prisma + PostgreSQL)
- Integrações externas (pagamentos, frete, storage, NF-e, email)
- Geração de documentos (NF-e XML/PDF, relatórios)
- Processamento assíncrono (jobs, webhooks, events)

## Proibições Absolutas
- ❌ Componentes React
- ❌ Código de interface/visual
- ❌ Lógica de frontend
- ❌ Código específico do navegador (window, document, localStorage)
- ❌ Default exports (apenas named exports)
- ❌ Prisma Client fora de `repositories/`
- ❌ Regras de negócio em `controllers/` ou `routes/`
- ❌ Credenciais em código (usar variáveis de ambiente + criptografia no banco)

## Arquitetura de Referência
```
/docs/tech.md (seção Backend)
/docs/behavior.md (comportamento funcional)
/docs/entities.md (modelo de domínio)
/docs/phases.md (Fase 1 ativa: Fundação e MVP Loja)
```

## Stack Obrigatória
- Fastify 5 + TypeScript 5 (strict)
- Zod (validação + type inference)
- Prisma 6 (ORM)
- Supabase (PostgreSQL 16, Auth, Storage, Realtime)
- Redis/Upstash (cache, rate limit, idempotency)
- node-cron (jobs agendados)
- Biome (lint + format)
- Vitest (testes)
- Scalar/OpenAPI (docs auto)

## Camadas e Regras (Obrigatórias)

### Routes (`src/routes/`)
```typescript
// routes/products.routes.ts
// Apenas define rotas, registra controllers
export async function productsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [auth, rbac('produtos:read')] }, productsController.list);
  app.post('/', { preHandler: [auth, rbac('produtos:write')] }, productsController.create);
}
```

### Controllers (`src/controllers/`)
```typescript
// controllers/products.controller.ts
// Valida (Zod), chama service, formata response HTTP
export const productsController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = productListQuerySchema.parse(request.query);
    const result = await productsService.list(query, request.user.lojaId);
    return reply.send({ data: result.data, meta: result.meta });
  },
};
```

### Services (`src/services/`)
```typescript
// services/products.service.ts
// REGRAS DE NEGÓCIO, casos de uso, transações
// USA repositories (não Prisma direto)
export const productsService = {
  async create(data: CreateProductDTO, lojaId: string) {
    return prisma.$transaction(async (tx) => {
      const product = await productRepository.create(tx, { ...data, lojaId });
      await auditLogRepository.log(tx, { action: 'PRODUCT_CREATE', entityId: product.id });
      return product;
    });
  },
};
```

### Repositories (`src/repositories/`)
```typescript
// repositories/product.repository.ts
// ÚNICO LUGAR COM PRISMA CLIENT
export const productRepository = {
  async create(tx: Prisma.TransactionClient, data: ProductCreateInput) {
    return tx.produto.create({ data });
  },
  async findById(tx: Prisma.TransactionClient, id: string) {
    return tx.produto.findUnique({ where: { id } });
  },
};
```

### Providers (`src/providers/`)
```typescript
// providers/payment.provider.ts
// Abstrai integração externa (Mercado Pago, Stripe)
export const paymentProvider = {
  async createPixPayment(data: PixPaymentInput) { ... },
  async verifyWebhook(signature: string, payload: string) { ... },
};
```

### Middleware (`src/middleware/`)
```typescript
// middleware/auth.middleware.ts
// JWT verify → request.user = { id, lojaId, perfis: string[] }
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) { ... }

// middleware/rbac.middleware.ts
// Verifica permissão route:action
export function rbac(permission: string) { ... }
```

## Estrutura de Pastas (Obrigatória)
```
src/
├── main.ts                 # Bootstrap Fastify
├── routes/                 # *.routes.ts (um por feature)
├── controllers/            # *.controller.ts
├── services/               # *.service.ts (regras de negócio)
├── repositories/           # *.repository.ts (Prisma encapsulado)
├── schemas/                # Re-export @nextcommerce/shared/schemas
├── providers/              # storage, email, payment, shipping, nfe
├── middleware/             # auth, rbac, rate-limit, error
├── lib/                    # prisma, crypto, date, pagination, idempotency
├── types/                  # Re-export @nextcommerce/shared/types
├── jobs/                   # reconciliation, stock-alerts, reports
└── events/                 # payment.webhook, shipping.webhook, order.events
```

## Prisma Schema
- Localização: `prisma/schema.prisma`
- Entidades baseadas em `/docs/entities.md`
- Migrations versionadas: `prisma/migrations/`
- Seed: `prisma/seed.ts` (perfis sistema, configs iniciais)
- RLS (Row Level Security) para isolamento multi-tenant

## Autenticação & RBAC
- JWT RS256 (JWKS Supabase) — 15min access, refresh rotation
- `authMiddleware` extrai `user: { id, lojaId, perfis: string[] }`
- `rbac('route:action')` verifica permissão no perfil
- Perfis: ADMIN, GESTOR, OPERADOR, ESTOQUISTA, CLIENTE (imutáveis)

## Padrões de API
- REST: `/api/v1/produtos`, `/api/v1/pedidos`, `/api/v1/estoque`
- Paginação cursor: `?cursor=&limit=20` → `{ data, nextCursor, hasMore }`
- Filtros: query params Zod (`?status=PAGO&data_inicio=2024-01-01`)
- Erros: RFC 9457 Problem Details
- Webhooks: HMAC SHA256 + Idempotency-Key + retry 3x + DLQ

## Jobs Agendados
- Conciliação financeira: diária 02:00
- Alertas estoque: horário
- Relatórios: conforme agendamento usuário

## Testes
- Unitários: Vitest (services, repositories, providers, utils)
- Cobertura mínima: 80% em services/repositories
- Mock: Prisma via repository interface, providers via interface

## CI/CD
- Pre-commit: `biome check --write` + `tsc --noEmit`
- Build: `pnpm build` → `dist/`
- Deploy: Render (auto-deploy main)

## Dados Sensíveis
- Credenciais gateways criptografadas no banco (AES-256)
- Chave em `ENCRYPTION_KEY` (env)
- Service role Supabase apenas backend

## Referências Cruzadas
- Frontend: `../web/README.md`
- Shared: `../../packages/shared/README.md`
- Documentação raiz: `../../README.md`