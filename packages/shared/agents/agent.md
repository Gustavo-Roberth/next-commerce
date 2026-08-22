# Agent Instructions — NextCommerce Shared (packages/shared)

## Identidade do Pacote
- **Este pacote**: `@nextcommerce/shared` — Tipos, schemas, contratos
- **Consumidores**: `apps/web` (frontend), `apps/api` (backend)
- **Projeto**: NextCommerce (SaaS e-commerce multi-tenant)

## Responsabilidade
- Tipos TypeScript do domínio (entidades, enums, DTOs)
- Schemas Zod de validação (request/response da API)
- Enums e constantes compartilhadas
- Utilitários puros (formatters, validators, helpers)

## Proibições
- ❌ Código específico de frontend (React, Next.js, browser APIs)
- ❌ Código específico de backend (Fastify, Prisma, Node.js APIs)
- ❌ Regras de negócio
- ❌ Side effects (I/O, rede, banco, filesystem)
- ❌ Default exports

## Estrutura
```
src/
├── types/
│   ├── entities.ts         # Interfaces das entidades (User, Product, Order, etc.)
│   ├── enums.ts            # Enums (OrderStatus, PaymentMethod, UserRole, etc.)
│   ├── dto.ts              # DTOs (CreateProductDTO, UpdateOrderDTO, etc.)
│   └── api.ts              # Tipos request/response da API
├── schemas/
│   ├── auth.schemas.ts
│   ├── product.schemas.ts
│   ├── order.schemas.ts
│   ├── payment.schemas.ts
│   ├── stock.schemas.ts
│   ├── config.schemas.ts
│   └── index.ts            # Barrel export
├── constants/
│   ├── roles.ts            # Perfis sistema, permissões
│   ├── status.ts           # Status padronizados
│   └── limits.ts           # Limites (paginação, upload, etc.)
├── utils/
│   ├── formatters.ts       # formatCurrency, formatDate, formatCPF
│   ├── validators.ts       # isValidCPF, isValidCNPJ, isValidCEP
│   └── helpers.ts          # Pure helpers (slugify, generateSKU, etc.)
└── index.ts                # Barrel export principal
```

## Convenções
- **Named exports apenas**
- **Tipagem forte** — inferir tipos dos schemas Zod (`z.infer<typeof schema>`)
- **Schemas = source of truth** — tipos derivados dos schemas
- **Utilitários puros** — sem side effects, testáveis isoladamente
- **Versão**: Workspace protocol (`workspace:*`) no monorepo

## Uso nos Apps
```typescript
// apps/web ou apps/api
import { Product, CreateProductDTO, productCreateSchema } from '@nextcommerce/shared';
import { formatCurrency } from '@nextcommerce/shared/utils';
```

## Testes
- Vitest para utilitários puros
- Schema validation tests (valid/invalid inputs)

## CI/CD
- Pre-commit: biome + typecheck
- Publicação futura: npm (quando versionado independentemente)