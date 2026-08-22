# Phases - NextCommerce
## Fase ativa: FASE 1 — Fundação e MVP Loja
**Início:** 2026-08-22 | **Fim estimado:** 2026-10-31 | **Status:** EM DESENVOLVIMENTO

---

## Visão geral das fases

| Fase | Nome | Período | Foco Principal |
|------|------|---------|----------------|
| **1** | Fundação e MVP Loja | Ago–Out 2026 | Auth, Catálogo, Carrinho, Checkout, Pagamentos, Pedidos básicos |
| **2** | Gestão Completa + Admin | Nov 2026–Jan 2027 | Estoque multi-depósito, Dashboard, Relatórios, NF-e, Configurações |
| **3** | Escala e Multi-loja | Fev–Abr 2027 | Multi-tenant real, Marketplace sync, API pública, Webhooks gerenciáveis |
| **4** | Inteligência e Ecossistema | Mai–Jul 2027 | IA (recomendação, previsão), App store, Extensibilidade, White-label |

---

# 🟢 FASE 1 — Fundação e MVP Loja
**Status: EM DESENVOLVIMENTO**

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
- [ ] Next.js 15 App Router + Tailwind 4 + shadcn/ui configurado
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

# 🔒 FASE 2 — Gestão Completa + Admin
**Status: BLOQUEADA**

## Objetivo
Operação completa: estoque real, relatórios, NF-e, configurações ricas, multi-depósito.

## Entregáveis
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

### Shared
- [ ] Schemas/tipos expandidos: estoque, NF-e, relatórios, configurações

## Critérios de aceitação
1. Estoquista consegue: ver alertas → receber mercadoria (entrada NF) → separar pedido → inventário
2. Financeiro consegue: conciliação diária automática + divergências em fila
3. Gestor consegue: dashboard tempo real + relatórios agendados por e-mail
4. NF-e emitida automaticamente ao marcar "Enviado"

---

# 🔒 FASE 3 — Escala e Multi-loja
**Status: BLOQUEADA**

## Objetivo
Multi-tenant real, sincronização marketplaces, API pública para parceiros.

## Entregáveis
- [ ] Multi-loja: isolamento RLS completo, onboarding self-service, planos/limites
- [ ] Marketplace Sync: Mercado Livre / Shopee / Amazon (produtos, pedidos, estoque)
- [ ] API Pública: OAuth2 para parceiros, rate limiting, documentação Scalar
- [ ] Webhooks Gerenciáveis: UI para configurar URLs, secrets, retry, logs
- [ ] Cache distribuído: Redis cluster, invalidação por tags
- [ ] Observabilidade: OpenTelemetry, traces, dashboards Grafana

---

# 🔒 FASE 4 — Inteligência e Ecossistema
**Status: BLOQUEADA**

## Objetivo
IA nativa, marketplace de apps, white-label, expansão internacional.

## Entregáveis
- [ ] Recomendação: "Compre junto", "Quem viu viu", personalização home
- [ ] Previsão: demanda (reposição), churn, LTV, sazonalidade
- [ ] App Store: SDK para extensões, marketplace interno, revenue share
- [ ] White-label: multi-brand, domínios ilimitados, customização profunda
- [ ] Internacionalização: multi-moeda, multi-idioma, tax compliance (LatAm/EU)

## Governança de fases
### Transição de fase
- Apenas quando **todos** critérios de aceitação da fase atual atendidos
- Aprovação: Tech Lead + Product Owner
- Documentação atualizada (`phases.md`, `CHANGELOG.md`)
- Tag semver: `v1.0.0` (fim F1), `v2.0.0` (fim F2), etc.
- **Mudança de status (BLOQUEADA → EM DESENVOLVIMENTO → CONCLUÍDA) é MANUAL** — não deve ser realizada pelo agente durante execução de tarefas; apenas humano autorizado altera os arquivos de fase

## Mudanças estruturais durante fase
- Permitidas: refatorações internas, otimizações, bug fixes
- **Não permitidas**: alterar contratos de API (breaking), remover entidades, mudar arquitetura de camadas
- Exceções requerem: ADR (Architecture Decision Record) + aprovação Tech Lead

## Dívida técnica
- Registrada em `TECH_DEBT.md` na raiz
- Priorizada na fase seguinte (máx 20% capacity)
- Não bloqueia transição se critérios de aceitação atendidos

---
