# Notas de Atualização 0.0.1

## FASE 1 — Fundação e MVP Loja
### ✅ Concluído nesta fase

**1. Infraestrutura do monorepo**
- pnpm workspaces (apps/web, apps/api, packages/shared)
- tsconfig.json (root + por workspace, strict flags)
- biome.json (root + overrides; ignore de node_modules/.next/dist/coverage)
- .env.example e .gitignore

**2. packages/shared (100%)**
- Types: enums, entities, DTOs, API types
- Schemas Zod: auth, product, order, payment, stock, config
- Constants: roles, status labels, limits
- Utils: formatters, validators, helpers
- 11 testes unitários passando

**3. Banco de dados (Prisma 5.22.0)**
- schema.prisma (~30 entidades: Usuario, Perfil, Loja, Produto,
  Variacao, Pedido, Pagamento, Estoque, WebhookEvent, AuditLog...)
- seed.ts (perfis sistema, loja demo, categorias, produtos, estoque, cupom)
- Prisma Client gerado

**4. Backend bootstrap (apps/api)**
- Fastify 5 + cors, helmet, rate-limit, swagger
- Endpoint /health
- Build via tsc + tsc-alias

**5. Auth backend (apps/api)**
- JWT tokens locais (access + refresh) com jose (HS256)
- JWKS verification para Supabase (pronto para uso)
- Password hashing com bcryptjs (cost 12)
- RBAC middleware: perfis, permissões, roles (requireRole, requirePermission, requireAnyRole, requireAllRoles)
- Rotas: POST /api/v1/auth/login, POST /api/v1/auth/register, POST /api/v1/auth/refresh, GET /api/v1/auth/me, POST /api/v1/auth/logout
- Swagger docs em /docs
- 8 testes de auth passando

**6. Categorias CRUD (apps/api)**
- GET /api/v1/categorias (listagem paginada com cursor, filtros)
- GET /api/v1/categorias/:id (detalhe com pai, filhos, contagem produtos)
- POST /api/v1/categorias (criar - ADMIN/GESTOR)
- PUT /api/v1/categorias/:id (atualizar - ADMIN/GESTOR)
- DELETE /api/v1/categorias/:id (remover - ADMIN/GESTOR, validações de integridade)
- Validação de slug único por loja, prevenção de referência circular

**7. Produtos CRUD (apps/api)**
- GET /api/v1/produtos (listagem paginada, busca, filtros por categoria/status/destaque/preço)
- GET /api/v1/produtos/destaques (produtos em destaque para vitrine)
- GET /api/v1/produtos/:id (detalhe completo com variações, atributos, imagens)
- POST /api/v1/produtos (criar - ADMIN/GESTOR, validações SKU/código de barras/slug únicos)
- PUT /api/v1/produtos/:id (atualizar - ADMIN/GESTOR)
- DELETE /api/v1/produtos/:id (arquivar - ADMIN/GESTOR, soft delete via status ARQUIVADO)
- Serialização de Decimal para number

**8. Carrinho (apps/api)**
- GET /api/v1/carrinho (obter carrinho do usuário/sessão com itens, subtotal)
- POST /api/v1/carrinho/itens (adicionar item com validação de estoque)
- PUT /api/v1/carrinho/itens/:item_id (atualizar quantidade com validação de estoque)
- DELETE /api/v1/carrinho/itens/:item_id (remover item)
- DELETE /api/v1/carrinho (limpar carrinho)
- Suporte a usuário autenticado e sessão anônima (x-session-id header)

**9. Checkout (apps/api)**
- POST /api/v1/checkout/calcular-frete (cálculo de frete simplificado por peso/volume)
- POST /api/v1/checkout/aplicar-cupom (validação e aplicação de cupom)
- POST /api/v1/checkout (criar pedido a partir do carrinho, criar pagamento, integração Mercado Pago)
- Validação de estoque no checkout, aplicação de cupom, endereços de entrega/cobrança
- Integração Mercado Pago: criação de preference, geração de URL de pagamento, PIX QR code
- Idempotency key para pagamentos

**10. Frontend bootstrap (apps/web)**
- Next.js 15 (App Router) + Tailwind CSS 4 (@tailwindcss/postcss)
- layout.tsx, globals.css (design tokens), page.tsx inicial
- rewrites /api/backend → API_URL (condicional quando env ausente)

**11. Quality Gates — todos verdes**
- lint ✅ | typecheck ✅ | test ✅ (31 testes) | build ✅

### 🔧 Ajustes técnicos importantes
- @tailwindcss/postcss obrigatório no Tailwind 4 (plugin mudou de pacote)
- Rewrite do Next só é registrado se API_URL estiver definida (evita erro de build)
- Biome precisou de files.ignore (travava sem ele)
- Prisma 5: relations exigem campo oposto; String[]? → String[] @default([])
- Shared package: "type": "module" + moduleResolution: "Bundler" para imports sem extensão
- Auth tests usam import .js (resolvido pelo tsc-alias)
- Fastify routes com type assertions para compatibilidade com exactOptionalPropertyTypes
- Token JWT inclui nome_completo para uso no checkout
- Cart routes suportam usuário autenticado + sessão anônima
- Checkout integra Mercado Pago (preference + PIX)

### ⏳ Pendente (Fase 1)
Pedidos: listar/detalhe/cancelar + Webhooks (Mercado Pago) ·
Design System/shadcn-ui · Loja pública · Admin ·
TanStack Query · E2E · CI/CD · Deploy

---

# NextCommerce
Plataforma completa de vendas online (SaaS) para pequenos lojistas — catálogo, pedidos, estoque, pagamentos e gestão integrados.

## Arquitetura
Monorepo com três workspaces:
```
/
├── apps/
│   ├── web/          # Frontend Next.js (loja + admin)
│   └── api/          # Backend Fastify (API REST)
├── packages/
│   └── shared/       # Tipos, schemas Zod, contratos compartilhados
├── docs/             # Documentação do projeto
├── agents/           # Instruções para agentes de IA
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Stack
| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Lucide, React Hook Form, Zod |
| **Backend** | Fastify, TypeScript, Prisma ORM, Zod |
| **Dados** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **Testes** | Vitest (unitários), Playwright (E2E) |
| **Qualidade** | Biome (lint + format) |

## Apps
### apps/web — Frontend
- Loja pública (vitrine, carrinho, checkout, conta do cliente)
- Painel administrativo (dashboard, produtos, pedidos, estoque, relatórios, configurações)
- Consome exclusivamente a API `apps/api`

### apps/api — Backend
- API REST para todo o domínio: auth, catálogo, carrinho, checkout, pagamentos, pedidos, estoque, relatórios
- RBAC com 5 perfis: Administrador, Gestor, Operador, Estoquista, Cliente
- Integrações: gateways de pagamento (PIX, cartão, boleto), frete (Correios, transportadoras), NF-e, e-mail

### packages/shared
- Tipos TypeScript do domínio (entidades, enums, DTOs)
- Schemas Zod de validação (entrada/saída da API)
- Contratos de API (request/response)
- Utilitários puros (formatação, validação, constantes)

## Comandos
```bash
# Instalação
pnpm install

# Desenvolvimento (web + api simultâneos)
pnpm dev

# Apenas frontend
pnpm dev:web

# Apenas backend
pnpm dev:api

# Build de produção
pnpm build

# Qualidade de código
pnpm lint
pnpm typecheck

# Testes
pnpm test          # Unitários (Vitest)
pnpm test:e2e      # E2E (Playwright)

# Banco de dados (via API)
pnpm db:generate   # Prisma generate
pnpm db:push       # Push schema (dev)
pnpm db:migrate    # Migrações versionadas
pnpm db:seed       # Seed de dados
pnpm db:studio     # Prisma Studio
```

## Deploy
| App | Plataforma | Configuração |
|-----|------------|--------------|
| `apps/web` | Vercel | Build: `pnpm build:web`, Output: `.next` |
| `apps/api` | Render | Build: `pnpm build:api`, Start: `node dist/main.js` |

Cada app possui configuração de deploy independente.

## Documentação
- `/docs/context.md` — Contexto inicial do sistema
- `/docs/product.md` — Visão de produto e módulos
- `/docs/behavior.md` — Comportamento funcional e regras de negócio
- `/docs/entities.md` — Modelo de domínio (entidades, relacionamentos)
- `/docs/tech.md` — Arquitetura técnica, padrões, convenções
- `/docs/phases.md` — Roadmap e fases de evolução

## Contrapartes
- **Frontend** (`apps/web`) → consome **API** (`apps/api`)
- **API** (`apps/api`) → expõe contratos consumidos pelo **Frontend**
- **Shared** (`packages/shared`) → tipos/contratos usados por ambos

## Requisitos
- Node.js >= 20
- pnpm >= 9
- Conta Supabase (PostgreSQL + Auth + Storage)