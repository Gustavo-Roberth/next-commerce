# Agent Instructions — NextCommerce Frontend (apps/web)

## Identidade do Repositório
- **Este repositório**: `apps/web` — Frontend Next.js 15
- **Contraparte**: `apps/api` — Backend Fastify
- **Compartilhado**: `@nextcommerce/shared` (packages/shared)
- **Projeto**: NextCommerce (SaaS e-commerce multi-tenant)

## Responsabilidades Exclusivas
- Interface de usuário (loja pública + painel admin)
- Navegação e roteamento (App Router)
- Componentes (reutilizáveis + domínio)
- Estados visuais e interação
- Formulários e validação client-side
- Consumo da API via `src/services` + TanStack Query
- Experiência do usuário (performance, acessibilidade, responsividade)

## Proibições Absolutas
- ❌ Acesso direto ao banco/Prisma
- ❌ Repositories ou services do backend
- ❌ Regras exclusivas da API
- ❌ Credenciais privadas (service role keys, secrets)
- ❌ Código de infraestrutura do backend
- ❌ Default exports (apenas named exports)
- ❌ `cn()` helper (usar `twMerge` direto)
- ❌ Componentes monolíticos ou excessivamente configuráveis

## Arquitetura de Referência
```
/docs/tech.md (seção Frontend)
/docs/behavior.md (comportamento funcional)
/docs/entities.md (modelo de domínio)
/docs/phases.md (Fase 1 ativa: Fundação e MVP Loja)
```

## Stack Obrigatória
- Next.js 15 (App Router, RSC)
- TypeScript 5 (strict)
- Tailwind CSS 4 + shadcn/ui (Radix UI)
- TanStack Query v5 (server state)
- Zustand (client state mínimo)
- React Hook Form + Zod (forms)
- Ky (HTTP client)
- Biome (lint + format)
- Vitest + Playwright (testes)

## Padrões de Código

### Componentes
```tsx
// components/loja/ProductCard.tsx
// Named export, PascalCase, responsabilidade única
export function ProductCard({ product, variant }: ProductCardProps) {
  // Server Component por padrão
  // Client Component apenas se 'use client' no topo
}
```

### Hooks
```tsx
// hooks/useCart.ts
// Encapsula comportamento, não renderiza UI
export function useCart() {
  // TanStack Query para server state
  // Zustand para client state (otimista)
}
```

### Services (Camada HTTP)
```tsx
// services/products.service.ts
// Não depende de React, reutilizável
export async function getProducts(params: GetProductsParams) {
  return api.get('/products', { searchParams: params }).json<ProductListResponse>();
}
```

### Schemas
```tsx
// schemas/product.schemas.ts
// Re-export de @nextcommerce/shared/schemas + UI-only
export const productFilterSchema = z.object({
  categoria: z.string().optional(),
  precoMin: z.coerce.number().optional(),
  // ...
});
```

### Estilização
```tsx
// tv para variantes, twMerge para composição
import { tv } from 'tailwind-variants';
import { twMerge } from 'tailwind-merge';

const buttonVariants = tv({ base: '', variants: { ... } });
// NÃO usar cn() — usar twMerge direto
```

## Estrutura de Pastas (Obrigatória)
```
src/
├── app/                    # App Router (pages, layouts)
│   ├── (loja)/             # Route group: vitrine, carrinho, checkout, conta
│   ├── (admin)/            # Route group: dashboard, produtos, pedidos, config
│   └── (auth)/             # Route group: login, register, recovery
├── components/
│   ├── ui/                 # shadcn/ui + custom reutilizáveis
│   ├── loja/               # Feature components (ProductCard, CartDrawer)
│   ├── admin/              # Feature components (DataTable, ProductForm)
│   └── shared/             # Header, Footer, Breadcrumbs
├── hooks/                  # useAuth, useCart, useToast, useDebounce
├── services/               # api.ts + feature services
├── schemas/                # Re-export shared + UI-only
├── types/                  # Re-export shared + UI-only
├── lib/                    # Utilitários puros (formatCurrency, validators)
├── constants/              # QUERY_KEYS, COOKIE_NAMES, APP_CONFIG
├── providers/              # AuthProvider, QueryProvider, ThemeProvider
└── assets/                 # Imagens, fontes estáticas
```

## Nomenclatura Obrigatória
| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Páginas | `{Feature}Page.tsx` | `ProdutosPage.tsx`, `CheckoutPage.tsx` |
| Componentes reutilizáveis | kebab-case inglês | `data-table.tsx`, `confirm-dialog.tsx` |
| Hooks | `useCamelCase` | `useCart`, `useAuth` |
| Services | `{feature}.service.ts` | `products.service.ts` |
| Types/Interfaces | PascalCase | `Product`, `CartItem` |
| Constantes | UPPER_SNAKE_CASE | `MAX_CART_ITEMS` |

## Integração com API
- Base URL: `process.env.NEXT_PUBLIC_API_URL`
- Auth: Bearer token (Supabase access token)
- Services em `src/services/` encapsulam tudo
- TanStack Query para cache, loading, error states
- Tipos via `@nextcommerce/shared/types`
- Validação via `@nextcommerce/shared/schemas`

## Testes
- **Unitários**: Vitest + React Testing Library (components críticos, hooks, utils)
- **E2E**: Playwright (fluxo compra, login, admin CRUD)
- Cobertura mínima: 80% em services/utils

## CI/CD
- Pre-commit: `biome check --write` + `tsc --noEmit`
- Pre-push: `pnpm test` + `pnpm test:e2e` (critical paths)
- Build: `pnpm build` (Vercel)

## Referências Cruzadas
- Backend API docs: `../api/README.md`
- Shared package: `../../packages/shared/README.md`
- Documentação raiz: `../../README.md`