# Phases - NextCommerce
## Fase ativa: FASE 0.3 — Alinhamento de data-testids para E2E Smoke
**Início:** 2026-08-27 | **Fim estimado:** 2026-08-29 | **Status:** EM DESENVOLVIMENTO

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
**Início:** 2026-08-26 | **Fim estimado:** 2026-08-29

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

## Objetivo
Executar o fluxo E2E smoke (`pnpm test:e2e`) e confirmar a conexão da API ao banco via `@prisma/adapter-pg` em um ambiente com PostgreSQL/Supabase acessível.

## Entregáveis
- [ ] `pnpm dev` com API conectada ao banco (query real sem `ECONNREFUSED`)
- [ ] Fluxo E2E smoke (`pnpm test:e2e`) passando ponta a ponta

## Critérios de aceitação
1. Desenvolvedor consegue: rodar `pnpm dev` → API conecta ao banco e serve dados reais
2. Fluxo E2E smoke confirma a aplicação funcional de ponta a ponta

---

# 🟢 FASE 0.3 — Alinhamento de data-testids para E2E Smoke
**Status: EM DESENVOLVIMENTO**

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

# 🔒 FASE 0.4 — E2E Smoke: Auth Flow + Test Data Setup
**Status: PENDENTE**

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

# 🔒 FASE 1 — Fundação e MVP Loja
**Status: BLOQUEADA**

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

# 🔒 FASE 2 — Design e Polimento Visual
**Status: BLOQUEADA**
**Início:** 2026-11-07 | **Fim estimado:** 2026-11-28

## Objetivo
Aplicar uma camada de polimento visual, motion e microinterações sobre o MVP da loja já funcional (Fase 1), tornando a experiência atraente e moderna antes de avançar para as funcionalidades de gestão (Fase 3). Esta fase **não** altera contratos de API, regras de negócio ou cria funcionalidades novas — apenas refina o que já existe.

## Entregáveis (Definition of Done)

### Frontend (`apps/web`)
- [ ] Biblioteca de animação (ex: Framer Motion) integrada ao Design System
- [ ] Microinterações: hover em cards de produto, feedback visual ao adicionar ao carrinho, abertura do drawer do carrinho, transição entre imagens na galeria do produto
- [ ] Transições de página suaves entre listagem → detalhe → carrinho → checkout (sem "saltos" de layout)
- [ ] Estados de carregamento (skeletons) em: listagem de produtos, detalhe de produto, checkout, pedidos
- [ ] Estados vazios ilustrados: carrinho vazio, busca sem resultado, sem pedidos
- [ ] Revisão de hierarquia tipográfica, espaçamento e cor aplicada a todas as telas já existentes (loja e admin básico)
- [ ] Auditoria de responsividade (mobile, tablet, desktop) em todas as telas da Fase 1
- [ ] Auditoria de acessibilidade básica (contraste, foco visível, labels em formulários, navegação por teclado)
- [ ] Home revisitada: hero com destaque visual mais forte, entrada animada de categorias/destaques

### Infra & Shared
- [ ] Tokens de motion (duração e easing padrão) formalizados junto ao Design System, ao lado dos tokens de cor/spacing/tipografia já existentes

## Critérios de aceitação
1. Cliente percebe transições suaves ao navegar entre as telas da loja, sem "saltos" de layout perceptíveis
2. Toda tela da Fase 1 possui estado de carregamento e estado vazio tratados visualmente (nunca tela em branco ou quebrada)
3. Nenhuma regra de negócio ou contrato de API foi alterado nesta fase — apenas camada visual
4. Tokens de motion (duração/easing) documentados e reutilizados de forma consistente entre componentes
5. Auditoria de acessibilidade não encontra bloqueadores críticos (contraste insuficiente, foco não visível)

---

# 🔒 FASE 3 — Gestão Completa + Admin
**Status: BLOQUEADA**
**Início:** 2026-11-28 | **Fim estimado:** 2027-02-06

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
