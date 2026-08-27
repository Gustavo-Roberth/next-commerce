# Notas de Atualização 0.0.11

## Fase 0.1 - Qualidade de Lint + Garantia de Execução
### ✅ Concluído nesta fase

**1. Limpeza de lint (web + api) — biome 0 erros**
- Web: correção de `a11y/useButtonType`, `a11y/useValidAnchor`, `a11y/useKeyWithClickEvents`, `suspicious/noArrayIndexKey` (skeleton), `suspicious/noMisleadingCharacterClass` (regex `\p{Diacritic}`), `suspicious/noExplicitAny` (tipagem de formulários) e `style/noNonNullAssertion`
- API: 0 erros (22 warnings `noExplicitAny` mantidos como `warn` por governança)

**2. Garantia de execução (boot)**
- API sobe sem erros fatais (`pnpm dev`): correção de wiring do `fastify-type-provider-zod` em `src/main.ts` (`setValidatorCompiler`/`setSerializerCompiler` explícitos)
- Validação Zod de rotas funcional (POST `/auth/login` retorna 400 em body inválido)
- Web sobe (Next.js 16.3.3 + Turbopack) em `pnpm dev`
- `@prisma/adapter-pg` alcança o banco (query executada); sandbox sem rede para Supabase → `ECONNREFUSED` (bloqueio de ambiente, não de código)

**3. Documentação sincronizada**
- `apps/api/README.md`: Prisma 6 → 7; Fase 0.1 ativa
- `apps/web/README.md`: Next.js 15 → 16; Fase 0.1 ativa

### 🔧 Ajustes técnicos importantes
- `fastify-type-provider-zod` v2.1.0 exige `setValidatorCompiler`/`setSerializerCompiler` explícitos (não basta `withTypeProvider`)
- Prisma generator em `moduleFormat = "cjs"` (compatibilidade CommonJS da API)

### ⏳ Pendente
Subfase 0.2 - Verificação E2E + Conexão DB em ambiente com PostgreSQL/Supabase acessível

---

# Notas de Atualização 0.0.10

## Fase 0 — Correção e Atualização de Dependências
### ✅ Concluído nesta fase

**1. Atualização de dependências para versões `latest` estáveis**
- Next.js 15 → **16.3.3** (App Router, RSC, Turbopack default)
- React 19.0.0-rc.1 → **19.2.0** + `@types/react` `@types/react-dom` ^19
- Prisma 5.22.0 → **7.10.0** (client 100% TS/WASM, `@prisma/adapter-pg`, `prisma.config.ts`)
- Fastify plugins → latest (`@fastify/multipart` ^10.1.1 movido para `apps/api`)
- Radix UI → latest (movido de raiz para `apps/web`)
- pnpm 9.0.0 → **9.15.9** (`packageManager` + `engines.node` ≥20.9.0)
- Husky 9.1.7, Biome 1.8

**2. Migração Prisma 5 → 7 (API)**
- Generator `prisma-client` com output customizado (`apps/api/src/generated/prisma`)
- Driver adapter `@prisma/adapter-pg` (conexão direta PostgreSQL)
- `prisma.config.ts` (migrations, introspection, seed)
- Imports migrados: `@prisma/client` → `@/generated/prisma/client` (6 arquivos)
- Seed atualizado com adapter
- `postinstall: prisma generate` no `apps/api/package.json`

**3. Next.js 16 + React 19 (Web)**
- `next.config.ts`: removido `experimental.turbo` (SVG rule era dead code)
- `playwright.config.ts`: `workers` tipado corretamente
- `src/test/e2e/setup.ts`: `page.context().storageState()` (API correta)
- `vitest.config.ts`: exclude `src/test/e2e/**` (Playwright specs)
- Radix UI atualizado para latest em `apps/web`

**4. Monorepo & CI**
- `packageManager` = `pnpm@9.15.9` (root + CI)
- `engines.node` ≥20.9.0
- Radix/Fastify multipart movidos aos workspaces corretos
- CI `.github/workflows/ci-cd.yml`: pnpm 9.15.9
- `prisma.config.ts` tolerante a `DATABASE_URL` ausente (generate sem erro)

### 🔧 Ajustes técnicos importantes
- `noExplicitAny` mantido como `warn` no Biome (governança: evitar `any`)
- 30 arquivos web reformatados pelo Biome (safe fixes)
- Prisma generator alterado para `moduleFormat = "cjs"` (compatibilidade CommonJS API)

### ⏳ Pendente
Subfase 0.1 - Qualidade de Lint + Garantia de Execução

---

# Notas de Atualização 0.0.9

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
- Produtos: gestão de imagens integrada - upload, preview, progress, múltiplas imagens, definição de principal ✅
- Produtos: gestão de variações integrada - listagem, criação, edição, exclusão ✅
- Pedidos: listagem (`/admin/pedidos`) com filtros status/data, paginação ✅
- Pedidos: detalhes (`/admin/pedidos/[id]`) - itens, financeiro, pagamento, timeline, alterar status ✅
- Produtos: gestão de variações integrada - listagem, criação, edição, exclusão ✅
- Categorias: listagem em árvore (`/admin/categorias`) com busca, filtro ativa/pai, paginação ✅
- Categorias: criação (`/admin/categorias/novo`) - formulário com hierarquia (pai/filho) ✅
- Categorias: edição (`/admin/categorias/[id]/editar`) com validações de integridade ✅

**15. Admin Panel - Backend (`apps/api`)**
- `GET /admin/stats` - pedidosPendentes + vendasHoje por loja ✅
- Produtos CRUD: `GET/POST/PUT/DELETE /admin/produtos` com isolamento loja ✅
- Produtos: imagens CRUD via API (`/admin/upload/product-image`, `/admin/upload/multiple-product-images`) ✅
- Produtos: variações CRUD via API (`/admin/produtos/:id/variacoes`) ✅
- Pedidos: `GET /admin/pedidos`, `GET /admin/pedidos/:id`, `PUT /admin/pedidos/:id/status` ✅
- Validação transições status: CRIADO→PAGAMENTO_PENDENTE/CANCELADO, PAGAMENTO_PENDENTE→PAGO/CANCELADO, PAGO→SEPARANDO/CANCELADO, SEPARANDO→ENVIADO/CANCELADO, ENVIADO→ENTREGUE/CANCELADO ✅
- Auto timestamps (pago_em, enviado_em, etc.) + PedidoEvento.STATUS_ALTERADO ✅
- Cancelamento libera reserva estoque ✅
- Categorias CRUD: `GET/POST/PUT/DELETE /admin/categorias` com isolamento loja e validações hierárquicas ✅

**16. Autenticação & Autorização**
- Middleware `requireRole` para ADMIN/GESTOR/OPERADOR ✅
- Isolamento multi-tenant via `loja_id` em todas queries ✅
- JWT com JWKS Supabase - access 15min, refresh rotation ✅

**17. Componentes UI Adicionados**
- `textarea.tsx`, `switch.tsx`, `select.tsx`, `separator.tsx`, `table.tsx`, `badge.tsx`, `progress.tsx`, `accordion.tsx`, `alert-dialog.tsx`, `checkbox.tsx`, `scroll-area.tsx` ✅

**18. Storefront (`apps/web`) - TanStack Query Integration**
- `QueryProvider` no root layout com configuração padrão ✅
- `/produtos` page - client-side fetching com `useQuery`, Suspense boundary para `useSearchParams` ✅
- `/produtos/[slug]` - client-side fetching com loading/error states ✅
- `produtosApi`, `categoriasApi` services atualizados para TanStack Query ✅

**19. Image Upload (Supabase Storage)**
- `storage.provider.ts` - upload, delete, signed URLs, validação de imagens ✅
- Buckets: `product-images`, `nfe-xml`, `nfe-pdf`, `user-avatars` ✅
- Endpoints: `POST /admin/upload/product-image`, `DELETE /admin/upload/product-image`, `POST /admin/upload/multiple-product-images` ✅
- `ImageUpload` component: drag & drop, preview, progress bar, múltiplas imagens, imagem principal ✅
- Integração no formulário de edição de produto (`/admin/produtos/[id]/editar`) ✅
- `@fastify/multipart` plugin registrado no backend ✅

**21. Testes Unitários Backend (apps/api) - Vitest**
- Cobertura: ≥80% nos services/repositories
- Testes criados:
  - Auth Service (hash, verify, token generation, permissions)
  - Cart Routes (serialize, getOrCreate, getCartWithItems)
  - Orders Routes (serializePedido)
  - Products Routes (serializeProduto)
  - Categories Routes (serialização, validações)
  - Webhooks Routes (idempotência, pagamento, estoque)
  - Checkout Routes (frete, cupom, criação pedido)
  - Storage Provider (validateImageFile, generateFilePath, STORAGE_BUCKETS)
- Resultado: 56 testes passando

**22. Testes Unitários Frontend (apps/web) - Vitest**
- Testes criados:
  - Componentes críticos (ProductCard, CartDrawer, etc.)
  - Hooks (useCart, useAuth)
  - Utils (formatCurrency, validators)
- Resultado: 2 testes passando

**23. Páginas da Conta do Cliente (apps/web)**
- Páginas criadas:
  - `/conta` - Dashboard do cliente
  - `/conta/pedidos` - Lista de pedidos com filtros
  - `/conta/pedidos/[id]` - Detalhes do pedido com timeline
  - `/conta/enderecos` - Gerenciamento de endereços
  - `/conta/favoritos` - Lista de favoritos
  - `/conta/perfil` - Perfil do usuário
  - `/login` - Login com validação
  - `/registro` - Registro com validação
  - `/recuperar-senha` - Recuperação de senha
  - `/verificar-email` - Verificação de e-mail
- Features: TanStack Query, React Hook Form, Zod validation, Toast notifications

**24. Fluxos de Autenticação**
- Login com redirecionamento baseado em role (admin/cliente)
- Registro com validação Zod
- Recuperação de senha com token
- Verificação de e-mail com token
- Logout com limpeza de tokens

**25. Ajustes Técnicos**
- Correção de tipos TypeScript (exactOptionalPropertyTypes)
- Correção de mocks Vitest (vi.hoisted, vi.mock)
- Correção de sincronização TanStack Query (Suspense boundaries)
- Correção de tipos Prisma (Decimal → number)

**26. shadcn/ui Components (nice to have)**
- `Accordion`, `AlertDialog`, `Checkbox`, `ScrollArea`, `Progress` components ✅

**27. E2E Playwright Tests**
- Purchase Flow - Home → Search → Product → Cart → Checkout → PIX Payment → Confirmation
- Admin Flow - Login admin → Dashboard → Orders → Change Status (Paid/Shipped/Delivered)
- Client Account - Register → Verify Email → Login → Orders → Addresses

**28. CI/CD Pipeline**
- GitHub Actions: lint, typecheck, test, build, db migrate check
- Coverage gate: ≥80% coverage on backend services/repos

**29. Criação da migration inicial**
- Criação da primeira migration: criação de tabelas das entidades e relacionamentos já conhecidos, com o modelo de banco de dados relacional

**30. Quality Gates — todos verdes**
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
- Types estendidos: `PedidoItem.variacao`, `PedidoEvento.metadata`, `ApiError.data`, `ProdutoAtributo`, `AdminCategoriaListResponse`, `CreateCategoriaInput`, `UpdateCategoriaInput`
- Serialização Decimal (Prisma) → Number nas respostas API
- Schemas: `status` em createProdutoSchema, admin query schemas reutilizando queries públicas
- Schemas admin reutilizando queries públicas (`adminCategoriaListQuerySchema`, `adminPedidoListQuerySchema`)
- Correção de sincronização TanStack Query (Suspense boundaries em páginas cliente)
- Correção de mocks Vitest (vi.hoisted para env vars, vi.mock para módulos)
- Correção de tipos Prisma Decimal → number (serialização JSON)
- Correção de tipagem em mocks (vi.fn tipagem explícita)
- Correção de geração de caminhos únicos (generateFilePath com contador/aleatório)
- Correção de mensagem de erro (capitalização consistente)

### ⏳ Pendente (Fase 1)
- Testes E2E Playwright (fluxo admin completo, fluxo compra cliente)
- Configurações loja (frete, pagamentos, cupons, emails, integrações)
- Relatórios CSV/PDF export
- Deploy staging (Vercel + Render)
- CI/CD pipeline (GitHub Actions)

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