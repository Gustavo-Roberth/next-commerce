# NextCommerce — Frontend (apps/web)

Frontend Next.js 15 da plataforma NextCommerce: loja pública + painel administrativo.

## Stack
- **Framework**: Next.js 15 (App Router, React Server Components)
- **Linguagem**: TypeScript 5 (strict)
- **UI**: Tailwind CSS 4 + shadcn/ui (Radix UI) + Lucide React
- **Estado servidor**: TanStack Query v5
- **Estado cliente**: Zustand (mínimo)
- **Formulários**: React Hook Form + Zod
- **HTTP**: Ky (fetch wrapper) + services tipados
- **Auth**: Supabase Auth Helpers
- **Testes**: Vitest (unit), Playwright (E2E)
- **Lint/Format**: Biome

## Estrutura
```
apps/web/
├── src/
│   ├── app/                    # App Router (páginas, layouts, route groups)
│   │   ├── (loja)/             # Grupo: vitrine, produto, carrinho, checkout, conta
│   │   ├── (admin)/            # Grupo: dashboard, produtos, pedidos, estoque, relatórios, config
│   │   ├── (auth)/             # Login, registro, recuperação, verificação
│   │   ├── api/                # Route handlers (webhooks, server actions)
│   │   ├── layout.tsx          # Root layout (providers, fonts, globals)
│   │   ├── globals.css         # Tailwind v4 + design tokens CSS variables
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui + custom reutilizáveis
│   │   ├── loja/               # Domínio loja (ProductCard, CartDrawer, CheckoutForm)
│   │   ├── admin/              # Domínio admin (DataTable, ProductForm, OrderTimeline)
│   │   └── shared/             # Compartilhados (Header, Footer, Breadcrumbs)
│   ├── hooks/                  # Hooks compartilhados (useAuth, useCart, useToast)
│   ├── services/               # Camada HTTP (api.ts + feature services)
│   ├── schemas/                # Re-export @nextcommerce/shared/schemas + UI-only
│   ├── types/                  # Re-export @nextcommerce/shared/types + UI-only
│   ├── lib/                    # Utilitários puros (formatCurrency, cn, validators)
│   ├── constants/              # Constantes app (QUERY_KEYS, COOKIE_NAMES)
│   ├── providers/              # React Context (AuthProvider, QueryProvider, ThemeProvider)
│   └── assets/                 # Imagens, fontes, ícones estáticos
├── public/                     # Assets públicos (favicon, robots, sitemap)
├── package.json
├── tsconfig.json
├── biome.json
├── tailwind.config.ts
├── next.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── README.md
```

## Comandos
```bash
# Desenvolvimento
pnpm dev              # Turbopack (porta 3000)

# Build
pnpm build            # Produção (.next)

# Qualidade
pnpm lint             # Biome check + fix
pnpm lint:check       # Biome check only
pnpm format           # Biome format
pnpm typecheck        # tsc --noEmit

# Testes
pnpm test             # Vitest run
pnpm test:watch       # Vitest watch
pnpm test:coverage    # Coverage report
pnpm test:e2e         # Playwright
pnpm test:e2e:ui      # Playwright UI
```

## Variáveis de ambiente
`.env.local` (não versionado):
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Convenções
- **Componentes página**: `{Feature}Page.tsx` (ex: `ProdutosPage.tsx`, `CheckoutPage.tsx`)
- **Componentes reutilizáveis**: kebab-case inglês (ex: `data-table.tsx`, `confirm-dialog.tsx`)
- **Hooks**: `useCamelCase` (ex: `useCart`, `useAuth`)
- **Services**: `{feature}.service.ts` (ex: `products.service.ts`, `cart.service.ts`)
- **Named exports apenas** — nunca default
- **Server Components por padrão** — Client Components só quando necessário (`'use client'`)
- **Path aliases**: `@/*` = `src/*`, `@shared/*` = `../../packages/shared/src/*`

## Comunicação com API
Toda chamada HTTP via `src/services/api.ts` (instância Ky configurada):
- Base URL: `NEXT_PUBLIC_API_URL`
- Auth: Bearer token (access token do Supabase)
- Error handling padronizado
- Retry logic para requests idempotentes
- Response format: `{ data, error, meta }`

Feature services consomem `api.ts`:
- `products.service.ts` — vitrine, busca, detalhes
- `cart.service.ts` — carrinho, cupom, frete
- `checkout.service.ts` — criar pedido, pagamentos
- `orders.service.ts` — listagem, detalhes, timeline
- `auth.service.ts` — login, register, refresh, password reset
- `admin/*.service.ts` — CRUDs administrativos

## Deploy
**Vercel** — Build: `pnpm build`, Output: `.next`
- Preview deployments automáticos em PRs
- Variáveis de ambiente no dashboard Vercel
- Edge Functions para middleware/auth

## Documentação relacionada
- `/docs/context.md` — Contexto do sistema
- `/docs/product.md` — Visão de produto
- `/docs/behavior.md` — Comportamento funcional
- `/docs/entities.md` — Modelo de domínio
- `/docs/tech.md` — Arquitetura técnica (seção Frontend)
- `/docs/phases.md` — Roadmap (Fase 1 ativa)

## Contraparte
**Backend/API**: `apps/api` (Fastify + Prisma + Supabase)
Contratos compartilhados: `@nextcommerce/shared` (tipos, schemas Zod)