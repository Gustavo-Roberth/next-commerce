# Notas de Atualização 0.0.7

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

**10. Pedidos (apps/api)**
- GET /api/v1/pedidos (listagem paginada com filtros por status, data, cliente)
- GET /api/v1/pedidos/:id (detalhe completo com itens, endereços, cupom, pagamentos, eventos)
- PUT /api/v1/pedidos/:id/status (atualizar status - ADMIN/GESTOR/OPERADOR, valida transições)
- POST /api/v1/pedidos/:id/cancelar (cancelar pedido - cliente ou admin, libera estoque, estorna pagamento)
- Máquina de estados de status: CRIADO → PAGAMENTO_PENDENTE → PAGO → SEPARANDO → ENVIADO → ENTREGUE / CANCELADO
- Eventos de auditoria automáticos

**11. Webhooks (apps/api)**
- POST /api/v1/webhooks/mercado-pago (processa notificações de pagamento)
- Atualiza status do pagamento (APROVADO, RECUSADO, EXPIRADO, ESTORNADO, PROCESSANDO)
- Atualiza status do pedido automaticamente (PAGO → libera estoque, RECUSADO/EXPIRADO → cancela)
- Deduplicação via idempotency_key
- Cria eventos de auditoria

**12. Design System / UI Components (apps/web)**
- shadcn/ui + Tailwind CSS 4 (@tailwindcss/postcss)
- Componentes: Button, Label, Input, Card, Badge, Avatar, DropdownMenu, Dialog, Toast
- Utils: cn() para className merging (clsx + tailwind-merge)
- class-variance-authority para variantes de componentes

**13. Frontend Storefront (apps/web)**
- Next.js 15 (App Router) + Tailwind CSS 4
- Layout da loja: Header, Footer, ProductCard, ProductGrid, CartDrawer
- Páginas: Home, Listagem de produtos (/produtos), Detalhe do produto (/produtos/[slug]), Carrinho (/carrinho), Checkout (/checkout)
- Rewrites /api/backend → API_URL (condicional quando env ausente)

**14. Admin Panel - Frontend (`apps/web`)**
- Login admin separado (`/admin/login`) com validação de roles (ADMIN, GESTOR, OPERADOR) ✅
- Dashboard (`/admin/dashboard`) com KPIs: vendas hoje, pedidos pendentes + ações rápidas ✅
- Produtos: listagem com busca, filtro status, paginação cursor, dropdown editar/arquivar ✅
- Produtos: criação (`/admin/produtos/novo`) - formulário completo (básico, fiscal, logística, SEO, config) ✅
- Produtos: edição (`/admin/produtos/[id]/editar`) com pré-preenchimento e validações ✅
- Pedidos: listagem (`/admin/pedidos`) com filtros status/data, paginação ✅
- Pedidos: detalhes (`/admin/pedidos/[id]`) - itens, financeiro, pagamento, timeline, alterar status ✅

**15. Admin Panel - Backend (`apps/api`)**
- `GET /admin/stats` - pedidosPendentes + vendasHoje por loja ✅
- Produtos CRUD: `GET/POST/PUT/DELETE /admin/produtos` com isolamento loja ✅
- Pedidos: `GET /admin/pedidos`, `GET /admin/pedidos/:id`, `PUT /admin/pedidos/:id/status` ✅
- Validação transições status: CRIADO→PAGAMENTO_PENDENTE/CANCELADO, PAGAMENTO_PENDENTE→PAGO/CANCELADO, PAGO→SEPARANDO/CANCELADO, SEPARANDO→ENVIADO/CANCELADO, ENVIADO→ENTREGUE/CANCELADO ✅
- Auto timestamps (pago_em, enviado_em, etc.) + PedidoEvento.STATUS_ALTERADO ✅
- Cancelamento libera reserva estoque ✅

**16. Autenticação & Autorização**
- Middleware `requireRole` para ADMIN/GESTOR/OPERADOR ✅
- Isolamento multi-tenant via `loja_id` em todas queries ✅

**17. Componentes UI Adicionados**
- `textarea.tsx`, `switch.tsx`, `select.tsx`, `separator.tsx`, `table.tsx` ✅

**18. Quality Gates — todos verdes**
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
- Webhook Mercado Pago atualiza pedido/pagamento automaticamente
- ProductCard suporta tanto Produto quanto ProdutoDestaque (type guard)
- Route group renomeado de `(admin)` para `admin` (evita conflito slug dinâmico com `(store)/produtos/[slug]`)
- Correção TypeScript `exactOptionalPropertyTypes` nos Select components (value com fallback)
- `Textarea` component nativo (sem dependência `@radix-ui/react-textarea` inexistente)
- Types estendidos: `PedidoItem.variacao`, `PedidoEvento.metadata`, `ApiError.data`
- Serialização Decimal (Prisma) → Number nas respostas API
- Schemas: `status` em createProdutoSchema, admin query schemas reutilizando queries públicas

### ⏳ Pendente (Fase 1)
Design System/shadcn-ui completo · Loja pública completa ·
TanStack Query + services tipados · E2E · CI/CD · Deploy

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