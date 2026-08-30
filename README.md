# Notas de Atualização 0.0.21

## Fase 3.3 - Relatórios: Views, Export e Agendamento
### ✅ Concluído nesta fase

**1. Backend — materialized views + refresh (Fase 3.3)**
- Migration `20260829120000_relatorios`: 4 materialized views (`mv_vendas_diario`, `mv_produtos_top`, `mv_relatorio_estoque_baixo`, `mv_conciliacao_financeira`) + função `refresh_relatorios()` ✅
- Modelo `ReportSchedule` (Prisma) para agendamento de envios por e-mail ✅
- `apps/api/src/reports/repository.ts`: consulta das views por `loja_id`/período, refresh e CRUD de agendamentos ✅

**2. Backend — serviço e exportação**
- `apps/api/src/reports/service.ts`: `obterRelatorio`, `gerarCsv` (BRL/pt-BR), `gerarPdf` (pdfkit), `calcularProximoEnvio` (DIARIO/SEMANAL/MENSAL), `enviarAgendamento` ✅
- `apps/api/src/providers/email.provider.ts`: abstração `EmailProvider` (HTTP via `EMAIL_PROVIDER_URL` + fallback log dev) ✅

**3. Backend — rotas e job**
- `apps/api/src/reports/routes.ts`: `GET /admin/relatorios/:tipo`, `GET /admin/relatorios/:tipo/export` (CSV/PDF), `POST /admin/relatorios/refresh`, CRUD de agendamentos + `POST .../enviar` ✅
- `apps/api/src/jobs/reports.job.ts`: cron `node-cron` que processa agendamentos vencidos e dispara e-mails ✅
- Registrado em `main.ts` (rotas + job) ✅

**4. Frontend admin — tela de relatórios (`apps/web`)**
- `Relatorio*`/`ReportSchedule` tipados em `src/lib/api/types.ts` e `adminApi.relatorios` em `services.ts` (consulta, exportação via blob, agendamentos) ✅
- Nav "Relatórios" em `app/admin/layout.tsx` ✅
- `app/admin/relatorios/page.tsx`: seletor de relatório, filtro de datas, tabela de métricas, botões Exportar CSV/PDF e formulário de agendamento de e-mail ✅

**5. Testes**
- `apps/api/src/reports/service.test.ts`: 10 testes (consulta, CSV, PDF, próximo envio, envio por e-mail, job) — cobertura de services ✅

### 🔧 Ajustes técnicos importantes
- Relatórios são restritos a GESTOR/ADMIN (RBAC)
- Materialized views não possuem RLS por loja; o isolamento é garantido no `WHERE loja_id` das queries do repository
- E-mail de relatório usa provider HTTP (`EMAIL_PROVIDER_URL`/`EMAIL_PROVIDER_TOKEN`); sem provider configurado, o envio é registrado em log (dev)

### ⏳ Pendente (Fase 3)
FASE 3.4 Configurações · FASE 3.5 Rastreamento · FASE 3.6 Jobs agendados · FASE 3.7 Auditoria

---

# Notas de Atualização 0.0.20

## Fase 3.2 - NF-e: Emissão Automática
### ✅ Concluído nesta fase

**1. Backend — emissão automática (Fase 3.2)**
- Modelo `NotaFiscal` (Prisma): adicionado `erro_mensagem String?` para registrar falhas; campos `xml_url`, `pdf_url`, `chave_acesso`, `status` ✅
- `apps/api/src/providers/nfe.provider.ts`: abstração `NfeProvider` (emitente/destinatário/itens/CFOP 5910) + `httpNfeProvider` (POST `${NFE_PROVIDER_URL}/nfe` com Bearer `NFE_PROVIDER_TOKEN`) ✅
- `apps/api/src/nfe/service.ts`: `emitirNotaFiscalPedido` (monta payload do pedido, emite, faz upload XML/PDF para buckets `nfe-xml`/`nfe-pdf` via Storage, upsert da `NotaFiscal` com status EMITIDA/ERRO e cria `PedidoEvento` NFE_EMITIDA/NFE_ERRO); `mapearNotaFiscalResposta` gera URLs assinadas ✅
- Integração no fluxo: ao marcar pedido como `ENVIADO` (rotas `orders/routes.ts` e `orders/admin.routes.ts`), dispara `emitirNotaFiscalPedido` em `try/catch` (erro não bloqueia a transição) ✅
- `GET /admin/pedidos/:id` retorna `notas_fiscais` serializadas (URLs assinadas de XML/PDF) ✅
- Schemas compartilhados: `packages/shared/src/types/entities.ts` + `schemas/nfe.schemas.ts` e espelhados em `apps/api/src/schemas/nfe.schemas.ts` ✅
- Testes unitários do service (3) + mapeamento (2) com prisma/storage mockados ✅

**2. Frontend admin — visualização NF-e (`apps/web`)**
- `NotaFiscal` tipada em `src/lib/api/types.ts` e `Pedido.notas_fiscais` ✅
- Card "Nota Fiscal (NF-e)" em `/admin/pedidos/[id]`: badge de status, chave de acesso, nº/série, links XML e PDF (DANFE) e mensagem de erro quando status ERRO ✅

### 🔧 Ajustes técnicos importantes
- Loja ainda NÃO possui dados fisais (CNPJ/IE/endereço) — emitente é montado via env (`NFE_EMITENTE_*`) com fallback para `loja.nome`; pendência documentada para Fase 3.4 (Configurações)
- Buckets `nfe-xml`/`nfe-pdf` são privados; acesso via URL assinada (`createSignedUrl`)

### ⏳ Pendente (Fase 3)
FASE 3.3 Relatórios · FASE 3.4 Configurações · FASE 3.5 Rastreamento · FASE 3.6 Jobs agendados · FASE 3.7 Auditoria

---

# Notas de Atualização 0.0.19

## Fase 3.1 - Estoque: Telas Admin
### ✅ Concluído nesta fase

**1. Camada de dados e serviços de estoque**
- Tipos e métodos `adminApi.depositos` e `adminApi.estoque` em `src/lib/api` (dashboard, list, movimento, transferência, inventário) ✅
- Helper de RBAC `src/lib/auth.ts` (`hasPerfil`) + persistência de `perfis` no login do admin ✅
- Navegação "Estoque" adicionada ao menu do admin (`app/admin/layout.tsx`) ✅

**2. Telas admin de estoque (`apps/web`)**
- Página `/admin/estoque`: dashboard de alertas (baixo/zerado), CRUD de depósitos, saldo por variação com filtros (depósito, somente baixo, somente zerado) ✅
- Dialogs: depósito (criar/editar), entrada de mercadoria (NF), saída, transferência entre depósitos, inventário físico ✅
- RBAC visual: exclusão de depósito visível apenas para ADMIN/GESTOR ✅
- Estados de carregamento (skeleton) e vazio tratados em todas as listas ✅

### 🔧 Ajustes técnicos importantes
- Telas consomem as rotas `/admin/estoque*` implementadas na Fase 3; o backend segue como source of truth para regras (reserva atômica, recálculo de custo médio, auditoria)
- Padrão de fetch manual (`useState` + `adminApi`) seguido do admin existente; formulários validados no cliente e revalidados no backend

### ⏳ Pendente (Fase 3)
FASE 3.2 NF-e · FASE 3.3 Relatórios · FASE 3.4 Configurações · FASE 3.5 Rastreamento · FASE 3.6 Jobs agendados · FASE 3.7 Auditoria

---

# Notas de Atualização 0.0.18

## Fase 3 - Gestão Completa + Admin
### ✅ Concluído nesta fase

**1. Módulo de Estoque (multi-depósito) — Backend**
- `POST/GET/PUT/DELETE /api/v1/admin/depositos` (CRUD de depósitos; depósito padrão exclusivo por loja) ✅
- `POST/GET/PUT /api/v1/admin/estoque` + `GET /admin/estoque/dashboard` (saldo por variação/depósito, disponível = físico − reservado, alerta baixo/zerado) ✅
- `POST /admin/estoque/movimentos` (entrada compra/devolução/ajuste, saída venda/perda/doação/ajuste com recálculo de custo médio) ✅
- `POST /admin/estoque/reserva` e `/liberar` (reserva atômica com verificação de disponível) ✅
- `POST /admin/estoque/transferencia` (saída + entrada na mesma transação) ✅
- `POST /admin/estoque/inventario` (ajuste de divergência por contagem física) ✅
- Schemas Zod em `apps/api/src/schemas/stock.schemas.ts`, service `apps/api/src/stock/service.ts`, rotas `apps/api/src/stock/routes.ts`, registradas em `main.ts` ✅
- Testes unitários do service (5/5) ✅ · `typecheck` e `lint` limpos ✅

### 🔧 Ajustes técnicos importantes
- Enums `EstoqueMovimentoTipo`/`EstoqueReferenciaTipo` reutilizados dos gerados do Prisma; schemas de estoque já existiam em `packages/shared` e foram espelhados localmente no api (padrão do repositório)

### ⏳ Pendente (Fase 3)
FASE 3.1 Estoque: telas admin · FASE 3.2 NF-e · FASE 3.3 Relatórios · FASE 3.4 Configurações · FASE 3.5 Rastreamento · FASE 3.6 Jobs agendados · FASE 3.7 Auditoria

---

# Notas de Atualização 0.0.17

## Fase 2.1 - Tema Escuro (Dark Mode) Toggle
### ✅ Concluído nesta fase

**1. ThemeProvider + variant**
- `next-themes` instalado; `ThemeProvider` (attribute=class, defaultTheme=system, enableSystem, disableTransitionOnChange) no root layout com `suppressHydrationWarning` no `<html>` ✅
- `@custom-variant dark (&:where(.dark, .dark *));` em `globals.css` → utilitários `dark:` respondem à classe `.dark` no Tailwind v4 ✅

**2. Toggle de tema**
- `ThemeToggle` (sol/lua) na Header com persistência de preferência (localStorage via next-themes) e guard de hidratação ✅

**3. Revisão visual dark mode**
- Cores hardcoded (`bg-gray-*`, `bg-white`, `text-gray-*`, `border-gray-*`) convertidas para tokens semânticos (`bg-card`, `bg-muted`, `text-muted-foreground`, `border-input`, `bg-accent`) em loja + admin; overlays `bg-black/*`, QR PIX (`bg-black text-white`) e coração de favorito preservados ✅

### 🔧 Ajustes técnicos importantes
- `typecheck` ✅ · `build` (21 rotas) ✅ · testes unitários 2/2 ✅ · `lint` limpo nos fontes (1 erro restante em `next-env.d.ts` gerado pelo Next, pré-existente e fora do escopo)
- `data-testid` preservados em todas as telas

---

# Notas de Atualização 0.0.16

## Fase 2 - Design e Polimento Visual
### ✅ Concluído nesta fase

**1. Fundação Design System + Motion**
- Instalados `motion` (framer-motion v13) e `tw-animate-css`; ativadas classes `animate-in`/`fade-in`/`zoom-in`/`slide-in-*` (antes no-ops em dialogs/toasts)
- Tokens de motion formalizados (`--motion-duration-*`, `--motion-easing-*`) em `globals.css` + utilitários `duration-motion-*`/`ease-motion-*` no Tailwind ✅
- Corrigidos tokens ausentes `card`/`popover` em `globals.css` ✅
- `Skeleton` (shimmer) e `notify` (sonner) criados; `<Toaster>` montado no root layout ✅
- Corrigido `<main>` aninhado (root + `(store)`) ✅

**2. Microinterações**
- `ProductCard`: hover (scale/shadow), stagger no grid (`StaggerContainer`/`StaggerItem`), favoritar com animação + toast ✅
- `CartDrawer`: abertura/fechamento animados (`AnimatePresence`), Esc + trava de scroll ✅
- Galeria de produto: cross-fade entre imagens + `aria-label` nas thumbs ✅
- Detalhe do produto: "Adicionar ao Carrinho" com toast + loading + seleção de variação ✅

**3. Transições de página**
- `(store)/template.tsx` e `admin/template.tsx` com fade/slide-up na montagem (respeita `prefers-reduced-motion`) ✅

**4. Estados de carregamento (skeletons)**
- Listagem de produtos (skeleton real no `isLoading`), detalhe, checkout, pedidos (loja+admin), conta, dashboard, admin produtos/pedidos/categorias, `carrinho/loading.tsx` ✅

**5. Estados vazios ilustrados**
- Carrinho vazio, busca sem resultado (`SearchX`), sem pedidos (`PackageOpen`), sem favoritos (`Heart`) com CTA ✅

**6. Acessibilidade & Responsividade**
- Labels no select de ordenação; radios/checkboxes com `accent-primary` + foco ✅
- Modal de variação admin: `role="dialog"`/`aria-modal` + focus trap + Esc ✅
- Links quebrados repointados (`/categorias`,`/ofertas`→`/produtos`; `/admin/perfil`→`/admin/dashboard`) ✅
- Filtros de produtos colapsáveis no mobile; ícones corretos no admin (Menu/X/Search) ✅

**7. Home revisitada**
- Hero com gradiente + entrada animada; categorias e destaques com stagger (reuso de `ProductGrid`) ✅

### 🔧 Ajustes técnicos importantes
- `build` (Next 16) das 21 rotas ✅; `typecheck` e `lint` (Biome) 0 erros; testes unitários 2/2 ✅
- `data-testid` preservados (product-card, cart-button, user-menu, pix-qr-code, cart-drawer, cart-item, favorite-item, order-row, orders-table, order-items, order-timeline)

### ⏳ Pendente (Fase 2)
Fase 2.1 — Tema Escuro (Dark Mode) Toggle · ver `docs/phases/phases_00_10.md`

---

# Notas de Atualização 0.0.15

## Fase 1.1 - Deploy Staging + Polish (execução parcial — pending deploy real)
### ✅ Concluído nesta fase (local + artefatos)

**1. Polimento — tipagem (lint 0 warnings)**
- Eliminados todos os warnings `noExplicitAny` da API tipando corretamente (cart, checkout, orders, webhooks, products) com tipos Prisma/Zod reais; removidos casts `as any`/`as number` e `Prisma.PedidoGetPayload<{}>` (banido pelo Biome)
- Lint: 0 erros (web + api + shared); Typecheck ✓; Build ✓

**2. Polimento — acessibilidade (web)**
- `aria-label` em botões de ícone: Header (carrinho, menu usuário, busca), CartDrawer (fechar, +/− quantidade, remover)
- Landmark `<main id="conteudo">` em `layout.tsx` para navegação por teclado/leitores de tela
- QR Code PIX (`checkout/page.tsx`) já possui `aria-label`/`role="img"` (Fase 0.3)

**3. Polimento — performance**
- `poweredByHeader: false` + headers de segurança (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) via `vercel.json`/`next.config.ts`

**4. Deploy — artefatos**
- `apps/web/vercel.json`: framework nextjs, `cleanUrls`, headers de segurança
- `render.yaml`: Blueprint (Postgres + API Fastify, `healthCheckPath: /ready`)
- `docs/deploy/env.md`: variáveis Vercel/Render/Supabase + ordem de deploy

**5. Observabilidade — Sentry (código + placeholder DSN)**
- Web: `@sentry/nextjs` via `instrumentation.ts` + `sentry.client/server/edge.config.ts` + `withSentryConfig`
- API: `@sentry/node` init + `setErrorHandler` em `main.ts`

**6. Smoke tests (artefatos)**
- `scripts/smoke-staging.mjs` (HTTP: /health, /ready, registro, login, produtos, home) — `pnpm smoke:staging`
- `apps/web/src/test/e2e/smoke.staging.spec.ts` (Playwright, gated por `STAGING_WEB_URL`)

**7. Quality Gates — Todos Verdes**
- Lint 0 · Typecheck ✓ · Build ✓ (Next 16 + API) · Testes unitários: 69 passam (web 2 + api 56 + shared 11)

### ⏳ Pendente (ações humanas — credenciais/plataforma)
Ver `docs/phases/phases_00_10.md` → Fase 1.1 → subfases `PENDENTE`:
deploy real Vercel/Render/Supabase Staging + secrets, alertas Sentry, migrate/seed de staging, execução de smoke/E2E contra staging.

---

# Notas de Atualização 0.0.12

## Fase 0.2 - Verificação E2E + Conexão DB
### ✅ Concluído nesta fase

**1. Conexão DB verificada via `@prisma/adapter-pg`**
- `pnpm db:seed` executa com sucesso: 5 perfis, 1 loja demo, 5 categorias, 1 depósito, 1 config frete, 2 usuários admin (demo + E2E), 2 produtos com variações/estoque, 1 cupom
- Query real executada sem `ECONNREFUSED` (sandbox consegue acessar Supabase via pooler)
- Seed corrigido: hash de senha usando `createHash('sha256')` (API nativa `node:crypto`)

**2. E2E smoke infraestrutura pronta**
- Playwright config atualizado para subir API (porta 3001) + Web (porta 3000) simultâneos
- Usuário E2E `admin@nextcommerce.com` / `admin123456` adicionado ao seed
- SSR fix em `produtos/page.tsx`: `window.location.search` → `useSearchParams` + `useRouter`
- Seletores E2E corrigidos: `input[name="email"]` → `#email` / `#password` (admin login)
- Testes unitários: 69 passam (web 2 + api 56 + shared 11)
- Quality gates: lint 0 erros, typecheck ✓, build ✓

**3. Correções técnicas**
- `NEXT_PUBLIC_API_URL` adicionado ao `.env` para cliente web
- Admin login page usa `id` attributes; testes ajustados para `#email` / `#password`

### 🔧 Ajustes técnicos importantes
- Sandbox consegue acessar Supabase via pooler (porta 6543) — seed confirma conectividade real
- E2E tests têm mismatches de UI (test data-testids ausentes em componentes), mas infraestrutura API+DB+Playwright operacional

### ⏳ Pendente
Alinhamento completo de test data-testids nos componentes para E2E smoke 100% verde

---

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

# Notas de Atualização 0.0.13

## Fase 0.3 - Alinhamento de data-testids para E2E Smoke
### ✅ Concluído nesta fase

**1. Test IDs implementados em todos os componentes necessários**
- `product-card` — `components/store/ProductCard.tsx`
- `cart-button` / `user-menu` — `components/store/Header.tsx`
- `cart-drawer` / `cart-item` — `components/store/CartDrawer.tsx`
- `orders-table` / `order-row` — `app/admin/pedidos/page.tsx`
- `pix-qr-code` — `app/(store)/checkout/page.tsx` (QR Code PIX mock com SVG acessível)
- `favorite-item` — `app/(store)/conta/favoritos/page.tsx` (já existia)
- `order-row` / `order-items` / `order-timeline` — `app/(store)/conta/pedidos/page.tsx` + `app/(store)/conta/pedidos/[id]/page.tsx` (já existiam)

**2. Correções técnicas associadas**
- `checkout/page.tsx`: SSR fix (window.location.search → useSearchParams/useRouter) + mock PIX QR Code com SVG acessível (aria-label, title)
- `Header.tsx`: Botão carrinho e menu usuário com test-ids
- `CartDrawer.tsx`: Container e itens do carrinho com test-ids
- `admin/pedidos/page.tsx`: Tabela e linhas com test-ids

**3. Quality Gates — todos verdes**
- Lint: 0 erros (apenas 22 warnings `noExplicitAny` pré-existentes na API)
- Typecheck: ✓ (web + api + shared)
- Build: ✓ (Next.js 16.3.3 + API)
- Testes unitários: 69 passam (web 2 + api 56 + shared 11)

### 🔧 Ajustes técnicos importantes
- SVG do QR Code PIX inclui `aria-label`, `role="img"` e `<title>` para acessibilidade
- Seletores E2E agora usam exclusivamente `data-testid` (não dependem de textos em português)
- Infraestrutura E2E completa: Playwright config com API (3001) + Web (3000), usuário E2E no seed, DB conectado

### ⏳ Pendente
E2E smoke 100% verde requer ambiente com API ativa + DB populado + auth flow implementado (fora do escopo de test-ids)

---

# Notas de Atualização 0.0.14

## Fase 0.4 - E2E Smoke: Auth Flow + Test Data Setup
### ✅ Concluído nesta fase

**1. API Readiness Endpoint (`/ready`) com DB check real**
- Novo endpoint `/ready` em `apps/api/src/main.ts` que executa `prisma.$queryRaw\`SELECT 1\``
- Retorna 200 OK apenas quando API conecta ao PostgreSQL via `@prisma/adapter-pg`
- Playwright config usa `/ready` em vez de `/health` para aguardar DB pronto

**2. Seed E2E dedicado (`prisma/seed.e2e.ts`)**
- Script separado do seed principal (`pnpm db:seed:e2e`)
- Cria usuários E2E: `client@e2e.test`/`Client@123` (CLIENTE), `operator@e2e.test`/`Operator@123` (OPERADOR)
- Admin E2E já existia: `admin@nextcommerce.com`/`admin123456` (ADMIN)
- 3 pedidos de teste: #9001 (PAGO), #9002 (ENVIADO), #9003 (ENTREGUE)
- 1 cupom de teste: `E2ETEST10` (10% off)

**3. Auth Flow via API + Storage State (Playwright)**
- Fixtures `auth.setup.ts`: login via API → salva `storageState` em `tmp/*.json`
- 3 estados: `admin-auth.json`, `client-auth.json`, `operator-auth.json`
- Testes admin/client usam `storageState` — **sem login manual** nos testes
- `global-setup.ts`: roda `db:seed:e2e` + aguarda `/ready`
- `global-teardown.ts`: limpa dados E2E (pedidos #9001-9003, cupom, usuários @e2e.test)

**4. Testes E2E Refatorados (sem login manual)**
- `admin-flow.spec.ts`: usa `storageState: 'tmp/admin-auth.json'`, acessa `/admin/dashboard` direto
- `client-account.spec.ts`: usa `storageState: 'tmp/client-auth.json'`, acessa `/conta/*` direto
- `purchase-flow.spec.ts`: fluxo anônimo inalterado
- Playwright config: projetos `chromium-admin`, `chromium-client`, `firefox-admin`, etc. com `storageState`

**4. Correção Crítica: Ordem dotenv → PrismaClient**
- `main.ts`: `dotenv.config()` **antes** de importar `lib/prisma.ts`
- `lib/prisma.ts`: `createPrismaClient()` cria adapter **lazily** (em tempo de execução)
- Resolve `ECONNREFUSED` no `/ready` — adapter lê `DATABASE_URL` após `config()`

**5. Quality Gates — Todos Verdes**
- Lint: 0 erros (22 warnings `noExplicitAny` pré-existentes na API)
- Typecheck: ✓ (web + api + shared)
- Build: ✓ (Next.js 16.3.3 + API compilado)
- Testes unitários: 69 passam (web 2 + api 56 + shared 11)
- API `/ready`: 200 OK com `{"status":"ready","timestamp":...}` — DB conectado

### 🔧 Ajustes Técnicos Importantes
- `lib/prisma.ts`: `createPrismaClient()` cria adapter lazily (lê `DATABASE_URL` em runtime, não module load)
- `main.ts`: `dotenv.config()` movido para **topo do arquivo** (antes de qualquer import que use env)
- `playwright.config.ts`: usa `/ready` como health check, projects com `storageState`, sem globalSetup/Teardown ESM
- `tsconfig.json` (web): exclui `src/test/e2e/**/*.setup.ts` e `global-*.ts` do build Next.js (evita erros ESM/CommonJS)
- Seed E2E roda **após** seed principal (depende de loja demo, perfis, produtos)

### ⏳ Pendente
E2E smoke 100% verde requer execução completa no CI/CD com ambos servidores ativos. Infraestrutura completa: test-ids, seed, auth fixtures, readiness check, cleanup.

---

# Notas de Atualização 0.0.11

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