# Phases - NextCommerce
## Fase ativa: FASE 3.1 — Estoque: Telas Admin
**Início:** 2026-08-29 | **Fim estimado:** 2026-09-03 | **Status:** EM DESENVOLVIMENTO

---

## Visão geral das fases

| Fase | Nome | Período | Foco Principal |
|------|------|---------|----------------|
| **0** | Correção e Atualização de Dependências | Ago 2026 (1 semana) | Auditar e atualizar todo `package.json` do monorepo para `latest` estável |
| **1** | Fundação e MVP Loja | Ago–Nov 2026 | Auth, Catálogo, Carrinho, Checkout, Pagamentos, Pedidos básicos |
| **2** | Design e Polimento Visual | Nov 2026 (3 semanas) | Motion, microinterações, estados de loading/vazio, responsividade e acessibilidade sobre o MVP |
| **3** | Gestão Completa + Admin | Dez 2026–Fev 2027 | Estoque multi-depósito, Dashboard, Relatórios, NF-e, Configurações |
| **4** | Escala e Multi-loja | Fev–Abr 2027 | Multi-tenant real, Marketplace sync, API pública, Webhooks gerenciáveis |
| **5** | Inteligência e Ecossistema | Mai–Jun 2027 | IA (recomendação, previsão), App store, Extensibilidade, White-label |

> 🧠 **Datas são estimativas** recalculadas a partir do cronograma original — ajuste manualmente conforme velocidade real da equipe.

---

# ⚪ FASE 0 — Correção e Atualização de Versões de Dependências
**Status: CONCLUÍDA**
**Início:** 2026-08-26 | **Fim estimado:** 2026-08-29 | **Concluído:** 2026-08-26

## Objetivo
Auditar todas as dependências já instaladas no monorepo e atualizá-las para a maior versão estável disponível (`latest`), corrigindo inconsistências de versionamento introduzidas na geração inicial do projeto, antes de iniciar a implementação de funcionalidades (Fase 1). Nenhuma funcionalidade de produto é implementada nesta fase.

## Entregáveis (Definition of Done)

### Infra & Shared
- [x] `package.json` da raiz auditado: `@prisma/client` e `prisma` atualizados para `^7.10.0` (versão `latest` estável) — migração Prisma 5→7 executada (client TS/WASM + `@prisma/adapter-pg`)
- [x] `packageManager` (`pnpm@9.15.9`) e `engines.node` (`>=20.9.0`) atualizados para as versões `latest` estáveis correspondentes
- [x] `husky` atualizado para `^9.1.7`
- [x] `apps/web/package.json`, `apps/api/package.json` e `packages/shared/package.json` auditados individualmente e atualizados para `latest` estável
- [x] `pnpm install` executado na raiz sem erros fatais de peer dependency

### Backend
- [x] `@fastify/multipart` (em `apps/api`) e demais plugins Fastify atualizados para `latest`
- [x] Build (`build:api`) e testes (`test`) passando após a atualização (56 testes, 0 falhas)

### Frontend
- [x] Família `@radix-ui/react-*` atualizada para `latest` estável em `apps/web`
- [x] Build (`build:web`) e testes (`test`) passando após a atualização

### Deploy & Ops
- [x] `/docs/tech.md` atualizado (Next 16, React 19.2, Prisma 7 + adapter-pg, pnpm 9.15.9)

## Ajuste técnico identificado (não bloqueante para a fase, registrar como subfase se não for corrigido aqui)
- ✅ Resolvido: os pacotes `@radix-ui/react-*` foram movidos da raiz para `apps/web/package.json` e atualizados para `latest` (regra de monorepo `0.13` atendida).

## Critérios de aceitação
1. Desenvolvedor consegue: rodar `pnpm install` na raiz → instalação completa sem conflitos de versão
2. Desenvolvedor consegue: rodar build e testes em `web` e `api` → sucesso sem regressões
3. Nenhuma dependência exclusiva de UI permanece na raiz do monorepo
4. `/docs/tech.md` reflete exatamente as versões finais instaladas, todas `latest` estáveis (nenhuma `alpha`/`beta`/`rc`/`canary`)

---

# ⚪ FASE 0.1 — Qualidade de Lint + Garantia de Execução
**Status: CONCLUÍDA**
**Início:** 2026-08-26 | **Fim estimado:** 2026-08-29 | **Concluído:** 2026-08-26

## Origem
A Fase 0 atualizou as dependências do monorepo (Prisma 5→7, Next 15→16, React 19.2, Radix/Fastify `latest`). Essa atualização introduziu erros de lint na API e expôs erros/warnings pré-existentes no web que bloqueiam o CI. Além disso, o boot de `pnpm dev` e o fluxo E2E ainda não foram verificados após as mudanças da Fase 0.

## Objetivo
Zerar os erros de lint em todo o monorepo (web, api, shared), confirmar que a aplicação sobe corretamente em ambiente de desenvolvimento (`pnpm dev`) com a API conectando via `adapter-pg`, validar o fluxo E2E smoke, e atualizar toda a documentação (READMEs e docs técnicos) para refletir as versões finais instaladas na Fase 0. Nenhuma funcionalidade de produto é implementada nesta fase.

## Entregáveis (Definition of Done)

### Backend (API)
- [ ] 12 erros de lint corrigidos (FIXABLE) — troca de import `@prisma/client` → `@/generated/prisma/client`
- [ ] `pnpm lint` em `apps/api` = 0 erros

### Frontend (Web)
- [ ] 63 erros de lint pré-existentes corrigidos em `apps/web`
- [ ] 19 warnings pré-existentes corrigidos ou triados em `apps/web`
- [ ] `pnpm lint` em `apps/web` = 0 erros

### Execução & Integração
- [ ] `pnpm dev` verificado: web e api sobem simultaneamente sem erros fatais
- [ ] API confirma conexão ao banco via `@prisma/adapter-pg`
- [ ] Fluxo E2E smoke executado com sucesso

### Deploy & Ops
- [ ] Todos os `README.md` do monorepo atualizados para as versões finais dos respectivos `package.json`
- [ ] Documentações técnicas adicionais (além de `/docs/tech.md`, já coberto na Fase 0) revisadas e sincronizadas com as versões atuais

## Critérios de aceitação
1. Desenvolvedor consegue: rodar `pnpm lint` na raiz → 0 erros em `web`, `api` e `shared`
2. Desenvolvedor consegue: rodar `pnpm build` e `pnpm test` (typecheck/build/unit) → sucesso sem regressões
3. Desenvolvedor consegue: rodar `pnpm dev` → web e api sobem corretamente, API conectada ao banco via `adapter-pg`
4. Fluxo E2E smoke confirma que a aplicação está funcional de ponta a ponta
5. Todos os `README.md` e documentações refletem exatamente as versões instaladas na Fase 0

---

# ⚪ FASE 0.2 — Verificação E2E + Conexão DB
**Status: CONCLUÍDA**
**Início:** 2026-08-26 | **Fim estimado:** 2026-08-26 | **Concluído:** 2026-08-27

## Objetivo
Executar o fluxo E2E smoke (`pnpm test:e2e`) e confirmar a conexão da API ao banco via `@prisma/adapter-pg` em um ambiente com PostgreSQL/Supabase acessível.

## Entregáveis
- [ ] `pnpm dev` com API conectada ao banco (query real sem `ECONNREFUSED`)
- [ ] Fluxo E2E smoke (`pnpm test:e2e`) passando ponta a ponta

## Critérios de aceitação
1. Desenvolvedor consegue: rodar `pnpm dev` → API conecta ao banco e serve dados reais
2. Fluxo E2E smoke confirma a aplicação funcional de ponta a ponta

---

# ⚪ FASE 0.3 — Alinhamento de data-testids para E2E Smoke
**Status: CONCLUÍDA**
**Início:** 2026-08-27 | **Fim estimado:** 2026-08-27 | **Concluído:** 2026-08-27

## Objetivo
Adicionar atributos `data-testid` nos componentes da UI para que os testes E2E existentes localizem os elementos corretamente (product-card, cart-button, cart-item, orders-table, order-row, user-menu, pix-qr-code, favorite-item, etc.).

## Entregáveis
- [ ] `data-testid="product-card"` nos cards de produto (store + admin)
- [ ] `data-testid="cart-button"` / `cart-item` / `cart-drawer` no carrinho
- [ ] `data-testid="orders-table"` / `order-row` / `user-menu` no admin
- [ ] `data-testid="pix-qr-code"` no checkout
- [ ] `data-testid="favorite-item"` / `order-row` / `order-items` / `order-timeline` na área do cliente

## Critérios de aceitação
1. `pnpm test:e2e` passa em todos os 3 suites (purchase-flow, admin-flow, client-account)
2. Seletores baseados em `data-testid` funcionam sem depender de textos em português

---

# ⚪ FASE 0.4 — E2E Smoke: Auth Flow + Test Data Setup
**Status: CONCLUÍDA**

## Objetivo
Completar a infraestrutura para E2E smoke 100% verde: implementar fluxo de autenticação real nos testes, configurar dados de teste persistentes (usuários, produtos, pedidos) e garantir que a API esteja acessível no ambiente de teste Playwright.

## Entregáveis
- [ ] Fixture de autenticação Playwright (login prévio via API, storage state)
- [ ] Dados de teste seedados via script dedicado para E2E (usuários, produtos, pedidos com status variados)
- [ ] API rodando em background durante `pnpm test:e2e` (health check + readiness)
- [ ] Testes de registration/login/password-reset funcionando com dados reais
- [ ] Cleanup de dados de teste entre suites (isolamento)

## Critérios de aceitação
1. `pnpm test:e2e` passa em todos os 3 suites (purchase-flow, admin-flow, client-account) sem timeouts
2. Testes não dependem de estado compartilhado entre si
3. Auth flow (login, logout, registro, recuperação senha) validado end-to-end

---

# ⚪ FASE 1 — Fundação e MVP Loja
**Status: CONCLUÍDA**
**Início:** 2026-08-26 | **Fim estimado:** 2026-08-29 | **Concluído:** 2026-08-27

## Objetivo
Entregar loja funcional end-to-end: cliente navega, compra, paga; admin vê pedidos básicos.

## Entregáveis (Definition of Done)
### Infra & Shared
- [ ] Monorepo configurado (pnpm, Biome, Husky, CI)
- [ ] `packages/shared` com tipos, enums, schemas Zod do domínio core
- [ ] Supabase project: PostgreSQL, Auth, Storage, Realtime
- [ ] Prisma schema + migrations iniciais (entidades core)
- [ ] Seed: perfis sistema (ADMIN, GESTOR, OPERADOR, ESTOQUISTA, CLIENTE)
- [ ] CI: lint, typecheck, test, build, db migrate check

### Backend (`apps/api`)
- [ ] Fastify bootstrap + plugins (cors, helmet, rate-limit, swagger)
- [ ] Auth: JWT verify (JWKS Supabase), RBAC middleware, login/register/refresh
- [ ] CRUD Produto/Categoria (admin)
- [ ] Vitrine pública: listagem paginada, busca, filtros, detalhes
- [ ] Carrinho API: create, add/remove/update item, apply cupom, get
- [ ] Checkout API: calcular frete (CEP), criar pedido (transação atômica)
- [ ] Pagamentos: integração Mercado Pago (PIX, cartão, boleto) + webhooks
- [ ] Pedidos: listagem, detalhes, timeline, transição status (manual admin)
- [ ] Webhooks: payment.approved/expired, idempotência, DLQ
- [ ] Testes: unitários services/repositories (≥80%), integração auth/pedidos

### Frontend (`apps/web`)
- [ ] Next.js 16 App Router + Tailwind 4 + shadcn/ui configurado
- [ ] Design System: tokens (cores, spacing, typografia), componentes base
- [ ] Loja pública:
  - [ ] Home (hero, destaques, categorias)
  - [ ] Listagem produtos (busca, filtros, paginação, grid)
  - [ ] Detalhe produto (galeria, variação, preço, add carrinho, avaliações)
  - [ ] Carrinho (drawer + página, cupom, estimativa frete)
  - [ ] Checkout single-page (endereço, frete, pagamento, resumo)
  - [ ] Conta cliente (login, pedidos, endereços, favoritos, perfil)
- [ ] Admin (básico):
  - [ ] Login admin (separado da loja)
  - [ ] Dashboard: KPIs básicos (vendas dia, pedidos pendentes)
  - [ ] Produtos: listagem, criar/editar (básico), ativar/inativar
  - [ ] Pedidos: listagem, detalhes, alterar status
- [ ] TanStack Query + services tipados (shared schemas)
- [ ] Testes: unitários componentes críticos, E2E fluxo compra (Playwright)

### Deploy & Ops
- [ ] Vercel (web): preview deployments, production
- [ ] Render (api): auto-deploy main, health check, logs
- [ ] Variáveis de ambiente configuradas (staging + prod)
- [ ] Monitoramento básico: uptime, error rate, latency

### Critérios de aceitação da fase
1. Cliente anônimo consegue: buscar produto → adicionar carrinho → checkout → pagar PIX → receber confirmação
2. Admin consegue: login → ver pedido → marcar como pago/enviado/entregue
3. Zero erros de tipo (typecheck passa)
4. Zero warnings de lint
5. Testes E2E fluxo compra passam em CI
6. Deploy staging funcional (web + api)

---

# ⚪ FASE 1.1 — Deploy Staging + Polish
**Status: CONCLUÍDA**
**Início:** 2026-08-28 | **Fim estimado:** 2026-09-03 | **Concluído:** 2026-08-28

## Objetivo
Realizar deploy em ambiente de staging (Vercel + Render + Supabase), configurar monitoramento, validar smoke tests pós-deploy e aplicar polimento final (lint, tipos, acessibilidade, performance) antes de encerrar a Fase 1.

## Entregáveis (Definition of Done)

### Deploy & Ops
- [ ] Vercel (web): preview deployments, production
- [ ] Render (api): auto-deploy main, health check, logs
- [ ] Supabase Staging: PostgreSQL, Auth, Storage, RLS policies configuradas
- [ ] Variáveis de ambiente configuradas (staging + prod)

### Monitoramento
- [ ] Uptime alerts (Vercel/Render + Sentry)
- [ ] Error rate alerts
- [ ] Latency alerts

### Testes Pós-Deploy
- [ ] Smoke tests: health checks, auth flow, CRUD básico
- [ ] Validação E2E purchase flow em staging

### Polimento
- [ ] Fix lint warnings restantes
- [ ] Fix type issues
- [ ] Auditoria acessibilidade (contraste, foco, labels, teclado)
- [ ] Auditoria performance (Core Web Vitals, bundle size)

## Critérios de aceitação
1. Deploy staging funcional (web + api) acessível via URLs de staging
2. Supabase Staging provisionado com RLS policies ativas
3. Monitoramento (uptime, error rate, latency) operacional com alertas
4. Smoke tests pós-deploy passando (health, auth, CRUD)
5. Zero lint warnings, zero type errors
6. E2E purchase flow validado em ambiente de staging

## Subfases percebidas durante a execução

> A execução local (Polish + artefatos) foi concluída. As subfases abaixo exigem
> credenciais/plataforma e são **PENDENTE** (ação humana — fora do sandbox).

- [ ] **PENDENTE** Provisionar Vercel project (web) e conectar ao repo; habilitar preview + production deploy (usar `apps/web/vercel.json`)
- [ ] **PENDENTE** Provisionar Render Blueprint (`render.yaml`): criar conta, apontar `DATABASE_URL` para Supabase pooler (ou usar o Postgres do próprio Render)
- [ ] **PENDENTE** Provisionar Supabase Staging: PostgreSQL, Auth (JWKS/`SUPABASE_JWT_SECRET`), Storage bucket `produtos`, RLS policies
- [ ] **PENDENTE** Definir secrets reais em Vercel/Render: `JWT_SECRET`, `SUPABASE_JWT_SECRET`, `MERCADO_PAGO_ACCESS_TOKEN`/`PUBLIC_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`
- [ ] **PENDENTE** Criar projetos Sentry (web + api), obter DSNs (`NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_DSN`) e configurar alertas de uptime/error-rate/latency
- [ ] **PENDENTE** Rodar `pnpm db:migrate` + `pnpm db:seed` (e `db:seed:e2e`) no banco de staging
- [ ] **PENDENTE** Executar `pnpm smoke:staging`/`STAGING_WEB_URL` e validar E2E purchase flow em staging

---

# ⚪ FASE 2 — Design e Polimento Visual
**Status: CONCLUÍDA**
**Início:** 2026-08-29 | **Fim estimado:** 2026-09-03 | **Concluído:** 2026-08-29

## Objetivo
Aplicar uma camada de polimento visual, motion e microinterações sobre o MVP da loja já funcional (Fase 1), tornando a experiência atraente e moderna antes de avançar para as funcionalidades de gestão (Fase 3). Esta fase **não** altera contratos de API, regras de negócio ou cria funcionalidades novas — apenas refina o que já existe.

## Entregáveis (Definition of Done)

### Frontend (`apps/web`)
- [x] Biblioteca de animação (ex: Framer Motion) integrada ao Design System
- [x] Microinterações: hover em cards de produto, feedback visual ao adicionar ao carrinho, abertura do drawer do carrinho, transição entre imagens na galeria do produto
- [x] Transições de página suaves entre listagem → detalhe → carrinho → checkout (sem "saltos" de layout)
- [x] Estados de carregamento (skeletons) em: listagem de produtos, detalhe de produto, checkout, pedidos
- [x] Estados vazios ilustrados: carrinho vazio, busca sem resultado, sem pedidos
- [x] Revisão de hierarquia tipográfica, espaçamento e cor aplicada a todas as telas já existentes (loja e admin básico)
- [x] Auditoria de responsividade (mobile, tablet, desktop) em todas as telas da Fase 1
- [x] Auditoria de acessibilidade básica (contraste, foco visível, labels em formulários, navegação por teclado)
- [x] Home revisitada: hero com destaque visual mais forte, entrada animada de categorias/destaques

### Infra & Shared
- [x] Tokens de motion (duração e easing padrão) formalizados junto ao Design System, ao lado dos tokens de cor/spacing/tipografia já existentes

## Critérios de aceitação
1. Cliente percebe transições suaves ao navegar entre as telas da loja, sem "saltos" de layout perceptíveis
2. Toda tela da Fase 1 possui estado de carregamento e estado vazio tratados visualmente (nunca tela em branco ou quebrada)
3. Nenhuma regra de negócio ou contrato de API foi alterado nesta fase — apenas camada visual
4. Tokens de motion (duração/easing) documentados e reutilizados de forma consistente entre componentes
5. Auditoria de acessibilidade não encontra bloqueadores críticos (contraste insuficiente, foco não visível)

# ⚪ FASE 2.1 — Tema Escuro (Dark Mode) Toggle
**Status: CONCLUÍDA**
**Início:** 2026-08-29 | **Fim estimado:** 2026-09-03 | **Concluído:** 2026-08-29

## Objetivo
Os tokens de cor do modo escuro (`--*` sob `.dark` em `apps/web/src/app/globals.css`) estão definidos, mas não há `ThemeProvider` nem toggle de tema — o dark mode está inativo. Adicionar um `ThemeProvider` (ex: next-themes) e um toggle de tema na Header para ativar o modo escuro de forma consistente, respeitando os tokens já existentes. Não altera contratos de API.

## Entregáveis
- [x] `ThemeProvider` configurado no root layout (sem alterar contratos de API)
- [x] Toggle de tema na Header (ícone sol/lua) com persistência de preferência
- [x] Revisão visual de todas as telas da Fase 1 sob dark mode (contraste/tokens)

## Critérios de aceitação
1. Usuário consegue: alternar tema → UI aplica tokens `.dark` sem quebra de layout
2. Preferência de tema persiste entre sessões

---

# ⚪ FASE 3 — Gestão Completa + Admin
**Status: CONCLUÍDA**
**Início:** 2026-08-29 | **Fim estimado:** 2026-09-03 | **Concluído:** 2026-08-29

## Objetivo
Operação completa: estoque real, relatórios, NF-e, configurações ricas, multi-depósito.

## Entregáveis (Definition of Done)
### Backend
- [ ] Estoque: multi-depósito, entrada/saída/transferência, reserva atômica, alertas, inventário
- [ ] NF-e: emissão automática (integração provedor), XML/PDF no Storage, evento `ENVIADO`
- [ ] Relatórios: materialized views (vendas diário, produtos top, estoque baixo, conciliação)
- [ ] Configurações: frete (regras priorizadas), pagamentos (credenciais criptografadas), cupons, e-mails (templates MJML)
- [ ] Rastreamento: webhook transportadoras, eventos append-only, notificação cliente
- [ ] Jobs: conciliação diária, alertas estoque horário, relatórios agendados
- [ ] Auditoria: trigger `audit_log` para ações críticas

### Frontend (Admin)
- [ ] Estoque: dashboard (baixo, zerado), entrada (NF compra), saída, transferência, inventário
- [ ] Relatórios: visualização + export CSV/PDF + agendamento e-mail
- [ ] Configurações: abas (Loja, Frete, Pagamentos, Cupons, E-mails, Integrações)
- [ ] Pedidos: timeline completa, imprimir etiqueta/NF-e, rastreamento
- [ ] Usuários/Perfis: convite, atribuição por loja, RBAC visual

### Infra & Shared
- [ ] Schemas/tipos expandidos: estoque, NF-e, relatórios, configurações

## Critérios de aceitação
1. Estoquista consegue: ver alertas → receber mercadoria (entrada NF) → separar pedido → inventário
2. Financeiro consegue: conciliação diária automática + divergências em fila
3. Gestor consegue: dashboard tempo real + relatórios agendados por e-mail
4. NF-e emitida automaticamente ao marcar "Enviado"

# ⚪ FASE 3.1 — Estoque: Telas Admin
**Status: CONCLUÍDA**
**Início:** 2026-08-29 | **Fim estimado:** 2026-09-03 | **Concluído:** 2026-08-29

## Origem
O módulo de estoque (multi-depósito) foi implementado no backend na FASE 3 (`/api/v1/admin/estoque*`, `depositos`, movimentações, reserva/liberação, transferência e inventário), mas ainda não há frontend administrativo consumindo essas rotas.

## Objetivo
Construir as telas do admin de estoque em `apps/web` consumindo as rotas `/admin/estoque*` já implementadas, permitindo que estoquistas e gestores operem o inventário sem acesso manual à API.

## Entregáveis (Definition of Done)

### Frontend (Admin — `apps/web`)
- [ ] Dashboard de estoque: lista depósitos, saldo por variação e alertas (baixo/zerado) consumindo `GET /admin/estoque/dashboard`
- [ ] Tela de depósitos: CRUD via `/admin/depositos` (inclui marcação de depósito padrão por loja)
- [ ] Tela de entrada de mercadoria (NF de compra) via `POST /admin/estoque/movimentos`
- [ ] Tela de saída (venda/perda/doação/ajuste) via `POST /admin/estoque/movimentos`
- [ ] Tela de transferência entre depósitos via `POST /admin/estoque/transferencia`
- [ ] Tela de inventário (contagem física) via `POST /admin/estoque/inventario`
- [ ] RBAC visual: botões/fluxos conforme perfil (ESTOQUISTA/OPERADOR/GESTOR/ADMIN)
- [ ] Estados de carregamento e vazio nas telas (padrão da FASE 2)

## Critérios de aceitação
1. Estoquista consegue: ver alertas → registrar entrada (NF) → operar saída → transferir → executar inventário, tudo pela UI, sem acesso manual à API
2. Gestor/Admin consegue: criar/editar/desativar depósitos e definir o depósito padrão da loja
3. Nenhuma tela fica em branco: estados de carregamento e vazio tratados
4. `typecheck`, `lint` e testes do web passando

---

# 🟢 FASE 3.2 — NF-e: Emissão Automática
**Status: EM DESENVOLVIMENTO**
**Início:** 2026-08-29 | **Fim estimado:** 2026-09-03 | **Concluído:** 2026-08-29

## Origem
O critério 4 da FASE 3 exige que a NF-e seja emitida automaticamente ao marcar um pedido como "Enviado". Hoje nenhuma emissão de documento fiscal é realizada.

## Objetivo
Implementar a emissão de Nota Fiscal eletrônica: integração com provedor de emissão (`providers/nfe.provider.ts`), armazenamento de XML/PDF no Storage (buckets `nfe-xml`/`nfe-pdf`), evento `ENVIADO` automático e integração com o status do pedido.

## Entregáveis (Definition of Done)

### Backend (`apps/api`)
- [ ] `providers/nfe.provider.ts` abstraindo a integração com o provedor de emissão (dados da loja + itens + destinatário)
- [ ] Fluxo de emissão: ao marcar pedido "Enviado" → emitir NF-e e registrar evento `ENVIADO`
- [ ] Persistência do XML e do PDF da NF-e no Storage (buckets `nfe-xml` e `nfe-pdf` do Supabase)
- [ ] Atualização do status/documento no pedido (id da NF-e, chave de acesso, link XML/PDF, situação)
- [ ] Schemas Zod e tipos compartilhados de NF-e (em `packages/shared` e espelhados em `apps/api/src/schemas`)

### Frontend (Admin — `apps/web`)
- [ ] Ação "marcar Enviado" no detalhe do pedido disparando a emissão
- [ ] Exibição do XML/PDF da NF-e e da chave de acesso no pedido

## Critérios de aceitação
1. NF-e é emitida automaticamente ao marcar "Enviado" em um pedido
2. XML e PDF da NF-e ficam disponíveis no Storage e acessíveis pelo admin
3. O pedido reflete a situação fiscal da NF-e (emitida/erro com mensagem)

---

# 🔒 FASE 3.3 — Relatórios: Views, Export e Agendamento
**Status: PENDENTE**
**Início:** _ | **Fim estimado:** _

## Origem
Os critérios 2 e 3 da FASE 3 exigem conciliação diária e relatórios agendados por e-mail. Não há camada de relatórios/dashboard gerencial além do estoque.

## Objetivo
Implementar relatórios gerenciais a partir de materialized views (vendas diário, produtos top, estoque baixo, conciliação), com exportação CSV/PDF e agendamento por e-mail.

## Entregáveis (Definition of Done)

### Backend (`apps/api`)
- [ ] Materialized views: vendas diário, produtos mais vendidos, estoque baixo e conciliação
- [ ] Controle de refresh das views (flag de invalidação via Redis/Upstash ou cron)
- [ ] Endpoints de consulta e exportação CSV/PDF dos relatórios
- [ ] Agendamento de envio por e-mail de relatórios

### Frontend (Admin — `apps/web`)
- [ ] Tela de relatórios com visualização das métricas
- [ ] Botões de exportação CSV/PDF
- [ ] Configuração de agendamento por e-mail dos relatórios

## Critérios de aceitação
1. Gestor consulta relatórios de vendas, produtos top, estoque baixo e conciliação na UI
2. Gestor exporta relatórios em CSV/PDF
3. Gestor agenda envio de relatório por e-mail e o recebe no dia/horário configurado

---

# 🔒 FASE 3.4 — Configurações: Abas Admin
**Status: PENDENTE**
**Início:** _ | **Fim estimado:** _

## Origem
A FASE 3 exige configurações ricas da loja (frete, pagamentos, cupons, e-mails, integrações). Atualmente essas configurações são ausentes no admin.

## Objetivo
Construir o módulo de configurações do admin em abas (Loja, Frete, Pagamentos, Cupons, E-mails, Integrações), com frete por regras priorizadas, credenciais de pagamento criptografadas, gestão de cupons e templates de e-mail em MJML.

## Entregáveis (Definition of Done)

### Backend (`apps/api`)
- [ ] Schemas e endpoints de configurações da loja (dados gerais, frete, pagamentos, cupons, e-mails, integrações)
- [ ] Frete por regras priorizadas (Correios, transportadoras, tabela própria)
- [ ] Credenciais de pagamento criptografadas em repouso
- [ ] CRUD de cupons (validação e aplicação no checkout)
- [ ] Templates de e-mail em MJML via `providers/email.provider.ts`

### Frontend (Admin — `apps/web`)
- [ ] Abas de configuração: Loja, Frete, Pagamentos, Cupons, E-mails, Integrações
- [ ] Formulários com validação, estados de carregamento e feedback (toast)

## Critérios de aceitação
1. Administrador configura dados da loja, regras de frete e credenciais de pagamento sem editar código
2. Credenciais de pagamento são armazenadas criptografadas (nunca em texto puro)
3. Cupons são criados/desativados e aplicados no checkout
4. E-mails transacionais usam templates MJML editáveis no admin

---

# 🔒 FASE 3.5 — Rastreamento de Pedidos
**Status: PENDENTE**
**Início:** _ | **Fim estimado:** _

## Origem
A FASE 3 prevê timeline completa de pedidos e rastreamento. Hoje o pedido não possui eventos de rastreamento nem integração com transportadoras.

## Objetivo
Implementar o rastreamento de pedidos: webhook de transportadoras, eventos append-only e notificação ao cliente sobre a evolução da entrega.

## Entregáveis (Definition of Done)

### Backend (`apps/api`)
- [ ] Webhook de transportadoras para receber eventos de rastreamento
- [ ] Registro de eventos de rastreamento de forma append-only (imutáveis e ordenados)
- [ ] Notificação ao cliente em eventos relevantes (ex.: despachado, entregue)
- [ ] Schemas/tipos compartilhados de rastreamento

### Frontend (Admin + Loja)
- [ ] Timeline de rastreamento no detalhe do pedido do admin (e no histórico do cliente)

## Critérios de aceitação
1. Eventos recebidos do webhook são registrados de forma append-only, sem sobrescrita
2. Cliente visualiza a timeline de rastreamento do pedido
3. Cliente é notificado em eventos relevantes da entrega

---

# 🔒 FASE 3.6 — Jobs Agendados
**Status: PENDENTE**
**Início:** _ | **Fim estimado:** _

## Origem
Os critérios 2 e 3 da FASE 3 exigem automação (conciliação diária, alertas de estoque horário, relatórios agendados). Não há camada de jobs agendados além das operações síncronas.

## Objetivo
Implementar jobs agendados (node-cron) para conciliação diária, alertas de estoque horário e relatórios agendados por e-mail.

## Entregáveis (Definition of Done)

### Backend (`apps/api`)
- [ ] Estrutura `src/jobs/` com registro e ciclo de vida dos agendamentos
- [ ] Job de conciliação diária (fila de divergências)
- [ ] Job de alerta de estoque horário (baixo/zerado → notificação)
- [ ] Job de relatórios agendados por e-mail

## Critérios de aceitação
1. Conciliação diária roda automaticamente e expõe divergências em fila
2. Alertas de estoque são disparados na frequência configurada (horária)
3. Relatórios agendados são gerados e enviados por e-mail no horário definido

---

# 🔒 FASE 3.7 — Auditoria de Ações Críticas
**Status: PENDENTE**
**Início:** _ | **Fim estimado:** _

## Origem
`docs/tech.md` define uma tabela `audit_log` para registrar eventos críticos (preço, estoque, status de pedido, alteração de perfis). O registro de auditoria ainda não existe na base.

## Objetivo
Criar a infraestrutura de auditoria: tabela `audit_log` e triggers PostgreSQL que registram automaticamente ações críticas de forma imutável.

## Entregáveis (Definition of Done)

### Backend / Banco de dados
- [ ] Tabela `audit_log` (evento, entidade, id, antes/depois, usuário, timestamp)
- [ ] Trigger de auditoria para alteração de preço de produto
- [ ] Trigger de auditoria para movimentações de estoque
- [ ] Trigger de auditoria para mudança de status de pedido
- [ ] Trigger de auditoria para alteração de perfis/usuários
- [ ] Registros imutáveis (sem UPDATE/DELETE nos dados de auditoria) e consulta via endpoint admin

## Critérios de aceitação
1. Ações críticas (preço, estoque, status de pedido, perfis) são registradas automaticamente e de forma imutável
2. Administrador consulta o histórico de auditoria de uma entidade na UI
3. Registro de auditoria não pode ser alterado ou apagado acidentalmente

---

# 🔒 FASE 4 — Escala e Multi-loja
**Status: BLOQUEADA**
**Início:** 2027-02-06 | **Fim estimado:** 2027-04-17

## Objetivo
Multi-tenant real, sincronização marketplaces, API pública para parceiros.

## Entregáveis (Definition of Done)
### Infra & Shared
- [ ] Redis cluster provisionado para cache distribuído
- [ ] Schemas/tipos expandidos: planos/limites (multi-loja), marketplace sync, webhooks gerenciáveis

### Backend
- [ ] Multi-loja: isolamento RLS completo, onboarding self-service, planos/limites
- [ ] Marketplace Sync: Mercado Livre / Shopee / Amazon (produtos, pedidos, estoque)
- [ ] API Pública: OAuth2 para parceiros, rate limiting, documentação Scalar
- [ ] Webhooks: engine de disparo (secrets, retry, logs)
- [ ] Cache distribuído: invalidação por tags
- [ ] Observabilidade: OpenTelemetry, traces

### Frontend (Admin)
- [ ] Onboarding self-service (criação de loja, escolha de plano)
- [ ] Webhooks Gerenciáveis: UI para configurar URLs, secrets, retry, logs

### Deploy & Ops
- [ ] Cluster Redis (staging + prod)
- [ ] Dashboards Grafana (observabilidade)

## Critérios de aceitação
1. Novo lojista consegue: cadastrar-se → escolher plano → operar loja isolada por RLS
2. Parceiro consegue: autenticar via OAuth2 → consumir API pública documentada
3. Loja consegue: configurar webhook próprio → receber eventos com retry automático
4. Produto/pedido sincroniza automaticamente com pelo menos 1 marketplace integrado
5. Cache distribuído reduz latência de leitura sem servir dados desatualizados entre lojas

---

# 🔒 FASE 5 — Inteligência e Ecossistema
**Status: BLOQUEADA**
**Início:** 2027-04-17 | **Fim estimado:** 2027-06-26

## Objetivo
IA nativa, marketplace de apps, white-label, expansão internacional.

## Entregáveis (Definition of Done)
### Infra & Shared
- [ ] Pipeline de dados para treinamento de modelos (recomendação/previsão)
- [ ] Schemas/tipos expandidos: multi-moeda, multi-idioma, revenue share

### Backend
- [ ] Recomendação: engine "compre junto", "quem viu viu"
- [ ] Previsão: modelos de demanda (reposição), churn, LTV, sazonalidade
- [ ] App Store: SDK para extensões, sandbox, revenue share
- [ ] Internacionalização: multi-moeda, tax compliance (LatAm/EU)

### Frontend
- [ ] Personalização de home (recomendação)
- [ ] App Store: marketplace interno de extensões
- [ ] White-label: customização de tema/domínio por loja
- [ ] Internacionalização: multi-idioma na interface

### Deploy & Ops
- [ ] Provisionamento dinâmico de domínios ilimitados (white-label)
- [ ] Monitoramento de modelos ML (drift, performance)

## Critérios de aceitação
1. Cliente consegue: ver recomendações personalizadas relevantes na home
2. Gestor consegue: visualizar previsão de demanda/reposição para produtos-chave
3. Parceiro consegue: publicar extensão na App Store e receber revenue share
4. Loja consegue: aplicar white-label (marca, domínio próprio) sem afetar outras lojas
5. Cliente internacional consegue: comprar em sua moeda/idioma com impostos calculados corretamente

---

# 📌 Governança de fases
## Transição de fase
- Apenas quando **todos** critérios de aceitação da fase atual atendidos
- Aprovação: Tech Lead + Product Owner
- Documentação atualizada (`phases.md`, `CHANGELOG.md`)
- Tag semver: `vX.Y.Z` (fim F1), `vX.Y.Z` (fim F2), etc.
- **Mudança de status (BLOQUEADA → EM DESENVOLVIMENTO → CONCLUÍDA) é MANUAL** — não deve ser realizada pelo agente durante execução de tarefas; apenas humano autorizado altera os arquivos de fase

## Mudanças estruturais durante fase
- Permitidas: refatorações internas, otimizações, bug fixes
- **Não permitidas**: alterar contratos de API (breaking), remover entidades, mudar arquitetura de camadas
- Exceções requerem: ADR (Architecture Decision Record) + aprovação Tech Lead

## Dívida técnica
- Toda dívida técnica identificada é registrada como uma subfase (`PENDENTE`) na seção "Subfases percebidas durante a execução" da fase onde foi percebida
- Priorizada na fase seguinte (máx 20% capacity)
- Não bloqueia transição de fase se critérios de aceitação da fase-mãe estiverem atendidos

---

## Artefatos de Conclusão de Fase
Ao concluir uma fase, o desenvolvedor deve registrar manualmente em `docs/phases/phases_mac.md`:

1. **Marcos Importantes (Milestones)** — Data real, status, comparação planejado vs. realizado
2. **Riscos e Mitigações** — Riscos materializados, novos riscos descobertos, mitigações aplicadas

> O agente de IA **não deve** escrever em `docs/phases/phases_mac.md`. O agente apenas gera conteúdo bruto para revisão; o desenvolvedor inclui manualmente.

---

## Referência Histórica

Artefatos detalhados de todas as fases concluídas (marcos, riscos) estão em: `docs/phases/phases_mac.md`

---
