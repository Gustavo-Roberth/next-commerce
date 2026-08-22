# Tech - NextCommerce
## Fonte de verdade desta consolidação
Este documento representa a referência técnica oficial do projeto.
- Regras funcionais pertencem ao `/docs/behavior.md`
- Entidades pertencem ao `/docs/entities.md`
- Evolução do projeto pertence ao `/docs/phases.md`

## Objetivo arquitetural
Monorepo único com três workspaces:
- `apps/web` — Frontend Next.js 15 (App Router)
- `apps/api` — Backend Fastify + TypeScript
- `packages/shared` — Tipos, schemas Zod, contratos de API

Estratégia de repositórios: **Monorepo (Opção A do PRD)**
Compartilhamento: **Packages compartilhados permitidos (Opção A do PRD)**

Responsabilidades:
- **Frontend (`apps/web`)**: Interface, navegação, componentes, estados visuais, formulários, consumo da API, UX
- **Backend (`apps/api`)**: API REST, casos de uso, regras de domínio, validações, autorização, persistência, integrações externas
- **Shared (`packages/shared`)**: Tipos TypeScript, schemas Zod (request/response), enums, constantes, utilitários puros

Comunicação: HTTP/REST + JSON. Contratos definidos em `packages/shared/schemas`.
Dependências: Workspace protocol (`workspace:*`).
Build: Independente por app (`pnpm build:web`, `pnpm build:api`).
Testes: Vitest (unitários), Playwright (E2E web).
Deploy: Vercel (web), Render (api) — configurações independentes.

## Stack consolidada

### Frontend (`apps/web`)
| Item | Tecnologia |
|------|------------|
| Framework | Next.js 15 (App Router, RSC) |
| Linguagem | TypeScript 5 (strict) |
| Roteamento | Next.js App Router (file-based) |
| UI | Tailwind CSS 4 + shadcn/ui (Radix UI) |
| Ícones | Lucide React |
| Formulários | React Hook Form + Zod (resolver) |
| Cliente HTTP | Ky (fetch wrapper) + TanStack Query (server state) |
| Estado global | Zustand (client state mínimo) |
| Validação | Zod (schemas de `packages/shared`) |
| Lint/Format | Biome |
| Testes unitários | Vitest + React Testing Library |
| Testes E2E | Playwright |
| Auth client | Supabase JS SDK (auth helpers) |

### Backend (`apps/api`)
| Item | Tecnologia |
|------|------------|
| Framework | Fastify 5 |
| Linguagem | TypeScript 5 (strict) |
| Arquitetura | Modular (routes → controllers → services → repositories) |
| Validação | Zod (schemas de `packages/shared`) |
| Autenticação | Supabase Auth (JWT verification via JWKS) |
| Organização | Camadas: routes, controllers, services, repositories, providers, middleware, lib, types |
| ORM | Prisma 6 (PostgreSQL) |
| Banco | Supabase (PostgreSQL 16) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime (opcional, notificações) |
| Lint/Format | Biome |
| Testes | Vitest |
| Docs API | Scalar/OpenAPI (auto-gerado via schemas) |

### Persistência
- **Banco**: Supabase PostgreSQL 16 (managed)
- **ORM**: Prisma 6 (schema.prisma em `apps/api/prisma/`)
- **Migrations**: Prisma Migrate (versionadas, `prisma/migrations/`)
- **Seeds**: `prisma/seed.ts` (perfis sistema, configs iniciais)
- **Constraints**: Unicidade, FK, CHECK no banco sempre que possível
- **Auditoria**: Triggers PostgreSQL para `created_at`/`updated_at` + tabela `audit_log` (eventos críticos)
- **Soft delete**: `deleted_at` + partial unique indexes onde aplicável
- **Storage**: Supabase Storage (buckets: product-images, nfe-xml, nfe-pdf, user-avatars)
- **Cache**: Redis (Upstash) — sessions, rate limit, CEP/frete cache, materialized view refresh flags

### Qualidade
Ferramentas:
- **Lint/Format**: Biome (formatter + linter, single tool)
- **Typecheck**: `tsc --noEmit` (strict mode)
- **Testes unitários**: Vitest (coverage ≥ 80% em services/repositories)
- **Testes E2E**: Playwright (critical paths: checkout, login, admin CRUD)
- **Git hooks**: Husky (pre-commit: lint + typecheck; pre-push: testes)
- **CI**: GitHub Actions (lint, typecheck, test, build, db migrate check)

## Estrutura por responsabilidade

### Frontend (`apps/web/src`)
```
src/
├── app/                    # App Router (páginas, layouts, route groups)
│   ├── (loja)/             # Grupo: vitrine, produto, carrinho, checkout, conta
│   ├── (admin)/            # Grupo: dashboard, produtos, pedidos, estoque, relatórios, config
│   ├── (auth)/             # Login, registro, recuperação, verificação
│   ├── api/                # Route handlers (webhooks, server actions)
│   ├── layout.tsx          # Root layout (providers, fonts, global styles)
│   ├── globals.css         # Tailwind v4 + design tokens CSS variables
│   └── not-found.tsx
├── components/
│   ├── ui/                 # shadcn/ui components (button, input, dialog, table, etc.)
│   ├── loja/               # Componentes de domínio loja (ProductCard, CartDrawer, CheckoutForm)
│   ├── admin/              # Componentes de domínio admin (DataTable, ProductForm, OrderTimeline)
│   └── shared/             # Compartilhados entre loja/admin (Header, Footer, Breadcrumbs)
├── hooks/                  # Hooks compartilhados (useAuth, useCart, useToast, useDebounce)
├── services/               # Camada HTTP (api.ts + feature services: products, orders, cart, auth)
├── schemas/                # Re-export de `packages/shared/schemas` + schemas locais de UI
├── types/                  # Re-export de `packages/shared/types` + tipos locais de UI
├── lib/                    # Utilitários puros (cn, formatCurrency, formatDate, validators)
├── constants/              # Constantes da aplicação (APP_NAME, COOKIE_NAMES, QUERY_KEYS)
├── providers/              # React Context Providers (AuthProvider, QueryProvider, ThemeProvider)
└── assets/                 # Imagens, fontes, ícones estáticos
```

**Regras de organização:**
- Componentes reutilizáveis (shadcn/ui) → `src/components/ui`
- Componentes de domínio → `src/components/[loja|admin]/[feature]`
- Páginas → exclusivamente `src/app/**/page.tsx`
- Hooks compartilhados → `src/hooks`
- Serviços HTTP → `src/services` (um arquivo por feature)
- Utilitários → `src/lib`
- Tipos compartilhados → `src/types` (re-export de shared)
- Schemas → `src/schemas` (re-export de shared + UI-only)
- Constantes → `src/constants`
- Assets → `src/assets` (organizado por categoria)

### Backend (`apps/api/src`)
```
src/
├── main.ts                 # Entry point (Fastify bootstrap, plugins, routes)
├── routes/                 # Definição de rotas (um arquivo por feature)
│   ├── auth.routes.ts
│   ├── products.routes.ts
│   ├── orders.routes.ts
│   └── ...
├── controllers/            # Recebem request, validam, delegam para services, retornam response
│   ├── auth.controller.ts
│   ├── products.controller.ts
│   └── ...
├── services/               # Casos de uso, regras de negócio, orquestração
│   ├── auth.service.ts
│   ├── products.service.ts
│   ├── orders.service.ts
│   ├── payments.service.ts
│   ├── stock.service.ts
│   └── ...
├── repositories/           # Encapsulam acesso ao banco (Prisma)
│   ├── user.repository.ts
│   ├── product.repository.ts
│   ├── order.repository.ts
│   └── ...
├── schemas/                # Re-export de `packages/shared/schemas` + validações internas
├── providers/              # Integrações externas (storage, email, pagamentos, frete, nfe)
│   ├── storage.provider.ts
│   ├── email.provider.ts
│   ├── payment.provider.ts
│   ├── shipping.provider.ts
│   └── nfe.provider.ts
├── middleware/             # Auth, autorização, rate limit, logging, error handling
│   ├── auth.middleware.ts
│   ├── rbac.middleware.ts
│   ├── rate-limit.middleware.ts
│   └── error.middleware.ts
├── lib/                    # Utilitários técnicos (prisma client, crypto, date, pagination)
├── types/                  # Re-export de `packages/shared/types` + tipos internos
├── jobs/                   # Jobs agendados (cron: conciliação, alertas estoque, relatórios)
│   ├── reconciliation.job.ts
│   ├── stock-alerts.job.ts
│   └── reports.job.ts
└── events/                 # Event handlers (webhooks, domain events)
    ├── payment.webhook.ts
    ├── shipping.webhook.ts
    └── order.events.ts
```

**Regras de camadas:**
- `controllers`: Apenas recebem request, validam (Zod), delegam para service, formatam response
- `services`: Implementam casos de uso, regras de negócio, orquestram repositories/providers
- `repositories`: Encapsulam **completamente** o acesso ao Prisma (zero Prisma fora daqui)
- `providers`: Abstraem integrações externas (storage, email, gateways, frete, NF-e)
- `middleware`: Autenticação (JWT verify), autorização (RBAC), rate limit, logging, error handling
- Nenhuma regra crítica permanece nas rotas
- Toda validação de entrada/saída via schemas Zod (shared)
- Toda regra crítica validada independentemente do frontend

### Shared (`packages/shared/src`)
```
src/
├── types/                  # Tipos TypeScript do domínio
│   ├── entities.ts         # Interfaces das entidades (User, Product, Order, etc.)
│   ├── enums.ts            # Enums (OrderStatus, PaymentMethod, UserRole, etc.)
│   ├── dto.ts              # DTOs (CreateProductDTO, UpdateOrderDTO, etc.)
│   └── api.ts              # Tipos de request/response da API
├── schemas/                # Schemas Zod (validação + inferência de tipos)
│   ├── auth.schemas.ts
│   ├── product.schemas.ts
│   ├── order.schemas.ts
│   ├── payment.schemas.ts
│   └── ...
├── constants/              # Constantes compartilhadas (perfis, status, limites)
├── utils/                  # Utilitários puros (formatters, validators, helpers)
└── index.ts                # Barrel export
```

## Arquitetura alvo e limites de responsabilidade

### Frontend
**Responsabilidades:**
- Interface de usuário (loja pública + painel admin)
- Navegação e roteamento (App Router)
- Componentes (reutilizáveis + domínio)
- Estados visuais e interação
- Formulários e validação client-side (Zod + RHF)
- Consumo da API via `src/services` + TanStack Query
- Experiência do usuário (performance, acessibilidade, responsividade)

**Limitações:**
- Zero acesso direto ao banco/Prisma
- Zero repositories/backend services
- Zero regras exclusivas da API
- Zero credenciais privadas
- Zero código de infraestrutura do backend

**Boas práticas obrigatórias:**
- Priorizar Server Components (RSC) quando compatível
- Client Components apenas para interação, estado local, APIs do navegador
- Componentes com responsabilidade única, pequenos, testáveis
- Composição > duplicação > componentes excessivamente configuráveis
- Componentes visuais não conhecem detalhes internos da API
- Toda comunicação HTTP via `src/services`
- Named exports apenas (nunca default)

### Backend
**Responsabilidades:**
- API REST (rotas, controllers)
- Casos de uso e regras de domínio
- Validações de entrada/saída (Zod)
- Autorização e controle de acesso (RBAC)
- Persistência (Prisma + PostgreSQL)
- Integrações externas (pagamentos, frete, storage, NF-e, email)
- Geração de documentos (NF-e XML/PDF, relatórios)
- Processamento assíncrono (jobs, webhooks, events)

**Limitações:**
- Zero componentes React
- Zero código de interface
- Zero lógica visual
- Zero código específico do navegador

**Regras obrigatórias:**
- Controllers: apenas orquestram entrada/saída, delegam para services
- Services: implementam casos de uso e regras de negócio
- Repositories: encapsulam **completamente** acesso à persistência
- Providers: encapsulam integrações externas
- Middlewares: concentram auth, RBAC, responsabilidades transversais
- Nenhuma regra crítica nas rotas
- Toda validação via schemas Zod (shared)
- Toda regra crítica validada independentemente do frontend

### Banco de Dados
**Responsabilidades:**
- Persistência transacional (ACID)
- Integridade referencial (FK, constraints)
- Auditoria (triggers + audit_log)
- Soft delete (deleted_at + partial indexes)
- Performance (índices, materialized views, particionamento futuro)

**Regras:**
- Toda alteração estrutural via migration versionada (Prisma Migrate)
- Seeds para parametrização obrigatória (perfis, configs)
- RLS (Row Level Security) para isolamento multi-tenant
- Constraints de unicidade no nível do banco

## Regras gerais (obrigatórias)
- **Named exports apenas** — nunca default exports
- **Tipagem forte** — `strict: true`, evitar `any` (salvo inevitável)
- **Regras de negócio desacopladas da interface** — backend é source of truth
- **Comunicação frontend↔backend apenas via services** — componentes não chamam fetch direto
- **Reutilização antes de criação** — verificar existente antes de novo componente/hook/service
- **Evitar duplicação** — DRY real, não cerimônia
- **Responsabilidade única** — componentes, hooks, services, functions
- **Composição > herança > duplicação**
- **Props = configuração pública** — tipagem explícita, estender HTML nativo quando aplicável
- **Extensões HTML nativas** — `React.ComponentPropsWithoutRef<'button'>` etc.
- **Arquitetura orientada por domínio** — features isoladas, baixo acoplamento
- **Integrações externas abstraídas** — providers/services, nunca direto em controllers
- **Evitar dependências circulares** — entre módulos, features, layers
- **Compatibilidade** — alterações preservam compatibilidade quando possível
- **Respeito à arquitetura consolidada** — novas implantações não quebram módulos existentes

## Configuração

### TypeScript (`tsconfig.json` base + extends por app/package)
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitReturns: true`
- `forceConsistentCasingInFileNames: true`
- Path aliases: `@/*`, `@/components/*`, `@/lib/*`, `@/hooks/*`, `@shared/*`

### Biome (`biome.json`)
- Formatter: indent 2, single quotes, trailing commas es5, line width 100
- Linter: recommended + correctness + style + suspicious + a11y
- Organize imports: on
- Override: Next.js (web), Node (api/shared)

### Tailwind (`apps/web/tailwind.config.ts`)
- Design tokens como CSS variables (cores, spacing, radius, shadows)
- `tailwind-variants (tv)` para componentes com variantes
- `tailwind-merge (twMerge)` para composição de classes
- **Não usar `cn()`** — usar `twMerge` diretamente
- Evitar interpolação manual de classes
- Tokens exclusivos do Design System

### Aliases (tsconfig paths)
| Alias | Resolve para |
|-------|--------------|
| `@/*` | `apps/web/src/*` |
| `@shared/*` | `packages/shared/src/*` |
| `@api/*` | `apps/api/src/*` |

### Variáveis de ambiente
**Raiz (`.env.example`):**
```
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
API_URL="http://localhost:3001"

# Auth
JWT_SECRET="..."
REFRESH_TOKEN_SECRET="..."

# Gateways (criptografados no banco, mas chaves de criptografia aqui)
ENCRYPTION_KEY="32-char-base64"
```

### Convenções de nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Arquivos | kebab-case | `product-card.tsx`, `order.service.ts` |
| Pastas | kebab-case | `components/ui`, `hooks/use-cart` |
| Componentes | PascalCase | `ProductCard`, `DataTable` |
| Hooks | camelCase + prefix `use` | `useCart`, `useAuth` |
| Types/Interfaces/Enums | PascalCase | `Product`, `OrderStatus`, `UserRole` |
| Funções | camelCase | `formatCurrency`, `calculateFreight` |
| Variáveis | camelCase | `productList`, `isLoading` |
| Constantes | UPPER_SNAKE_CASE | `MAX_CART_ITEMS`, `DEFAULT_PAGE_SIZE` |
| Exports | Named apenas | `export function...`, `export interface...` |
| Imports | Ordenados: libs → internos → relativos | — |

### Dependências
- Priorizar bibliotecas consolidadas, amplamente usadas
- Evitar redundâncias (ex: não ter date-fns + dayjs)
- Remover não utilizadas (knip no CI)
- Dependências estruturais requerem justificativa técnica
- Compatíveis com stack oficial (Next.js, Fastify, Prisma, Supabase)

### API / Services

**Frontend (`apps/web/src/services`):**
- Toda chamada HTTP via `src/services/api.ts` (Ky instance configurada)
- Feature services: `products.service.ts`, `orders.service.ts`, `cart.service.ts`, `auth.service.ts`
- Services encapsulam: URLs, auth headers, error handling, retry logic
- Respostas padronizadas: `{ data, error, meta }`
- Loading/error/success states consistentes via TanStack Query

**Backend (`apps/api/src`):**
- Rotas: apenas recebem, validam (Zod), delegam para controllers
- Controllers: orquestram, chamam services, formatam response HTTP
- Services: casos de uso, regras de negócio, transações
- Repositories: **único** lugar com Prisma Client
- Providers: abstrações de integrações externas
- Validação de entrada **antes** de executar regras de negócio

### Estilização
- Tailwind CSS 4 como principal mecanismo
- Design Tokens via CSS variables (cores, spacing, typography, radius, shadows)
- `tailwind-variants (tv)` para variantes de componentes
- `tailwind-merge (twMerge)` para composição
- **Não usar `cn()` helper** — usar `twMerge` direto
- Evitar CSS isolado (modules, styled-components) — Tailwind atende
- Evitar estilos inline
- Espaçamentos, tipografia, cores padronizados via Design System
- Variantes reutilizáveis via `tv`

### Escalabilidade
- Estrutura permite crescimento incremental sem reorganização arquitetural
- Features isoladas em pastas próprias (colocation)
- Shared package versionado independentemente (futuro: npm publish)
- Materialized views para dashboards (performance)
- Jobs assíncronos para processamento pesado (conciliação, relatórios)
- Cache multi-camada (Redis + Next.js cache + CDN)

## Padrões de Componentização

### Organização Geral
- Previsibilidade, reutilização, legibilidade, manutenibilidade
- Responsabilidade única por componente
- Pequenos, coesos, single purpose
- Composição > componentes configuráveis excessivamente
- Evitar monolíticos, evitar componentes grandes
- Reutilizáveis não dependem de regras de domínio
- Compartilhados não dependem de features específicas
- Verificar existente antes de criar novo

### Nomenclatura de Arquivos

**Componentes de Página** (App Router pages):
- Padrão: `{NomeDaFuncionalidade}Page.tsx`
- PascalCase, português, sufixo `Page` obrigatório
- Ex: `ProdutosPage.tsx`, `CheckoutPage.tsx`, `PedidosPage.tsx`, `ConfiguracoesPage.tsx`

**Componentes reutilizáveis e internos** (ui, shared, feature components):
- kebab-case, inglês, responsabilidade clara
- Sufixos comportamentais: `dialog`, `modal`, `table`, `badge`, `card`, `form`, `input`, `selector`
- Ex: `data-table.tsx`, `filter-bar.tsx`, `confirm-dialog.tsx`, `status-badge.tsx`, `chart-card.tsx`, `image-input.tsx`

### Organização por Responsabilidade
- Reutilizáveis (shadcn/ui + custom) → `src/components/ui`
- Domínio loja → `src/components/loja/[feature]`
- Domínio admin → `src/components/admin/[feature]`
- Compartilhados loja/admin → `src/components/shared`
- Features concentram próprios componentes
- Compartilhados desacoplados do domínio
- Específicos isolados na própria feature
- Páginas apenas compõem componentes

### Componentes
- Props = configuração pública, tipagem explícita
- API pública simples, previsível
- Reutilização antes de criação
- Evitar duplicação de JSX
- Sem lógica de negócio em componentes visuais
- Facilmente reutilizáveis em diferentes telas
- Nomes compatíveis com responsabilidade

### Props
- Representam toda configuração pública
- Tipagem explícita (Zod inferred types quando possível)
- Estender HTML nativo: `React.ComponentPropsWithoutRef<'button'>`
- Evitar excesso — agrupar em objetos quando relacionado
- Preferir componentes especializados a super-configuráveis
- Variações controladas por props sem comprometer legibilidade → reutilizar

### Hooks
- Encapsulam comportamento reutilizável
- Não renderizam interface
- Não conhecem detalhes visuais
- Podem encapsular integração com services
- Responsabilidade única
- Ex: `useCart`, `useAuth`, `useProducts`, `useDebounce`, `useToast`

### Services (Frontend)
- Não dependem de componentes React
- Reutilizáveis
- Centralizam auth, headers, error handling, retry
- Toda comunicação HTTP centralizada aqui
- Um arquivo por feature/domínio

### Schemas
- Contratos de entrada/saída
- Desacoplados dos componentes
- Reutilizados (shared + local)
- Exclusivamente validação e contratos

### Types
- Compartilhados → `src/types` (re-export shared)
- Específicos → próximos da feature
- Evitar duplicação de equivalentes

### Utils
- Funções puras sempre que possível
- Sem dependência de contexto visual
- Desacoplados de regras de domínio

### Lib
- Helpers, adapters, clients, integrações técnicas
- **Sem regra de negócio**

### Layouts
- Apenas organizam composição visual
- Sem regra de negócio
- Providers globais registrados nos layouts apropriados
- Navegação desacoplada do domínio

### Formulários
- React Hook Form para gerenciamento
- Zod para validação (resolver)
- Componentes de formulário reutilizáveis (FormField, FormSelect, etc.)
- Mensagens de erro padronizadas (toast + inline)
- Backend = validação definitiva

### Tabelas (DataTable)
- Componente reutilizável genérico (`data-table.tsx`)
- Paginação desacoplada da regra de negócio
- Filtros independentes da implementação visual
- Loading/empty/error/success padronizados
- Ordenação e paginação consistentes em toda aplicação

### Estados
Todos os componentes que consomem dados preveem:
- `loading` (skeleton/shimmer)
- `success` (dados)
- `empty` (sem dados — estado ilustrado + action)
- `error` (retry + mensagem amigável)
Comportamento consistente em toda aplicação.

### Estilização (componentes)
- `tailwind-variants (tv)` para múltiplas variantes
- `tailwind-merge (twMerge)` para composição
- **Não usar `cn()`**
- Evitar interpolação manual de classes
- Exclusivamente tokens do Design System

### Reutilização (obrigatório antes de criar)
1. Analisar estrutura existente
2. Reutilizar: componentes, hooks, services, schemas, types, layouts, tabelas, formulários
3. Consolidar responsabilidades equivalentes
4. Mover diferenças para props quando fizer sentido
5. Evitar componentes genéricos em excesso
6. Preservar APIs previsíveis
7. Evitar duplicação estrutural

### Evolução da Componentização
Revisão contínua para identificar:
- Componentes com responsabilidade excessiva
- Componentes excessivamente grandes
- Oportunidades de extração/composição
- Duplicação não intencional

## Convenções de API (Backend)

### REST
- Recursos no plural: `/api/produtos`, `/api/pedidos`, `/api/estoque`
- Verbos HTTP semânticos: GET, POST, PATCH, DELETE
- Versionamento: `/api/v1/...` (header `Accept: application/vnd.nextcommerce.v1+json`)
- Paginação: cursor-based (`?cursor=&limit=20`), response: `{ data, nextCursor, hasMore }`
- Filtros: query params tipados (`?status=PAGO&data_inicio=2024-01-01`)
- Ordenação: `?sort=created_at:desc`
- Erros: RFC 9457 (Problem Details) — `{ type, title, status, detail, instance, errors[] }`

### Autenticação
- Access Token: JWT (RS256, JWKS do Supabase), 15min
- Refresh Token: rotação, httpOnly cookie (opcional) + body
- Middleware `auth.middleware.ts` valida JWT + extrai `userId`, `lojaId`, `perfis[]`
- Middleware `rbac.middleware.ts` verifica `permissao` por rota (`route:action`)

### Validação
- Schemas Zod em `packages/shared/schemas`
- Request: `body`, `query`, `params`, `headers` validados no controller
- Response: schema de saída para documentação + type safety
- Erros de validação: array `{ field, message, code }` no response 422

### Webhooks
- HMAC SHA256 (secret por integração)
- Idempotency via `Idempotency-Key` header + tabela `webhook_event` (processed keys)
- Retry exponencial (3x) + dead letter queue (tabela `webhook_dlq`)
- Logging estruturado (request/response headers + body)

### Rate Limiting
- Por IP + por usuário autenticado
- Configurável por rota (auth: 10/min, checkout: 30/min, admin: 100/min)
- Redis (Upstash) para contadores distribuídos

## Dados Sensíveis
- **Nunca** commitar secrets (`.env`, keys, tokens)
- `.env.example` versionado, `.env` no `.gitignore`
- Credenciais de gateway criptografadas no banco (AES-256)
- Chave de criptografia em variável de ambiente (`ENCRYPTION_KEY`)
- Service role keys apenas no backend (Supabase Admin API)

## Observabilidade
- Logs estruturados (pino): requestId, userId, lojaId, duration, status
- Métricas: latency (p50/p95/p99), error rate, throughput
- Traces: OpenTelemetry (futuro)
- Alertas: error rate > 1%, latency p95 > 2s, jobs falhando