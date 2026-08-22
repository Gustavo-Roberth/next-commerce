# Phases MAC — Marcos, Riscos & Ações Imediatas

> **Arquivo de registro histórico das fases concluídas.**  
> O agente de IA NÃO deve escrever neste arquivo. O desenvolvedor inclui manualmente ao final de cada fase.  
> Template baseado em `docs/phases/phases_00_10.md`.

---

## FASE 1 — Fundação e MVP Loja

### Marcos Importantes (Milestones)

| Marco | Data Alvo | Data Real | Status |
|-------|-----------|-----------|--------|
| Monorepo + CI funcionando | 2026-08-29 | | Pendente |
| Auth + RBAC funcionando | 2026-09-05 | | Pendente |
| Vitrine + Carrinho + Checkout | 2026-09-26 | | Pendente |
| Pagamentos (PIX + Cartão + Boleto) | 2026-10-10 | | Pendente |
| Pedidos + Admin básico | 2026-10-24 | | Pendente |
| **Fase 1 Done** | **2026-10-31** | | Pendente |

### Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação | Status Real |
|-------|---------------|---------|-----------|-------------|
| Complexidade Pagamentos (webhooks, idempotência) | Alta | Alto | Spike técnico semana 1; provider abstraction; testes de contrato | |
| Performance busca/filtros (full-text + trigram) | Média | Médio | Índices GIN + tsvector; paginação cursor; cache Redis | |
| Multi-tenant RLS (isolamento dados) | Média | Crítico | Políticas RLS desde migration 1; testes de isolamento automatizados | |
| Design System consistência | Baixa | Médio | shadcn/ui base; tokens centralizados; storybook (futuro) | |
| Deploy Vercel + Render sincronizado | Baixa | Baixo | Variáveis compartilhadas via `.env.example`; health checks | |

### Próximas Ações Imediatas (Sprint 1)

| # | Ação | Responsável | Status | Observação |
|---|------|-------------|--------|------------|
| 1 | Configurar monorepo: pnpm-workspace, Biome, Husky, GitHub Actions | | Pendente | |
| 2 | Criar `packages/shared` com tipos/enums/schemas core | | Pendente | |
| 3 | Provisionar Supabase (dev + staging) | | Pendente | |
| 4 | Prisma schema inicial + migrate + seed perfis | | Pendente | |
| 5 | Fastify bootstrap + auth middleware + health check | | Pendente | |
| 6 | Next.js bootstrap + Tailwind 4 + shadcn/ui + providers | | Pendente | |
| 7 | CI pipeline passando (lint, typecheck, test, build) | | Pendente | |

---

## FASE 2 — Gestão Completa + Admin

### Marcos Importantes (Milestones)

| Marco | Data Alvo | Data Real | Status |
|-------|-----------|-----------|--------|
| Estoque multi-depósito | 2026-11-21 | | Pendente |
| NF-e automática | 2026-12-12 | | Pendente |
| Relatórios + Configurações | 2027-01-09 | | Pendente |
| **Fase 2 Done** | **2027-01-23** | | Pendente |

### Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação | Status Real |
|-------|---------------|---------|-----------|-------------|
| Complexidade emissão NF-e (integração provedor) | Alta | Crítico | Provedor homologado; sandbox completo; fallback manual | |
| Performance relatórios (materialized views) | Média | Alto | Índices compostos; refresh assíncrono; paginação cursor | |
| Complexidade configurações (frete/pagamentos/cupons) | Média | Médio | Validação schema Zod; testes integração; feature flags | |
| Sincronização estoque multi-depósito | Média | Alto | Transações distribuídas; idempotência; auditoria | |

### Próximas Ações Imediatas (Sprint Inicial Fase 2)

| # | Ação | Responsável | Status | Observação |
|---|------|-------------|--------|------------|
| 1 | Estoque: multi-depósito, entrada/saída/transferência | | Pendente | |
| 2 | NF-e: emissão automática + XML/PDF no Storage | | Pendente | |
| 3 | Relatórios: materialized views (vendas, produtos, estoque) | | Pendente | |
| 4 | Configurações: frete, pagamentos, cupons, e-mails | | Pendente | |
| 5 | Rastreamento: webhook transportadoras + eventos | | Pendente | |
| 6 | Jobs: conciliação diária + alertas estoque + relatórios | | Pendente | |
| 7 | Auditoria: trigger `audit_log` para ações críticas | | Pendente | |

---

## FASE 3 — Escala e Multi-loja

### Marcos Importantes (Milestones)

| Marco | Data Alvo | Data Real | Status |
|-------|-----------|-----------|--------|
| Multi-loja: isolamento RLS completo | | | Pendente |
| Marketplace Sync: Mercado Livre / Shopee / Amazon | | | Pendente |
| API Pública: OAuth2 + Scalar docs | | | Pendente |
| Webhooks Gerenciáveis UI | | | Pendente |
| Cache distribuído Redis cluster | | | Pendente |
| Observabilidade OpenTelemetry | | | Pendente |

### Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação | Status Real |
|-------|---------------|---------|-----------|-------------|
| Complexidade multi-tenant (RLS + onboarding) | Alta | Crítico | Testes de isolamento automatizados; CI/CD gates | |
| Instabilidade APIs marketplaces | Alta | Alto | Circuit breaker; retry exponencial; DLQ monitorada | |
| Performance cache distribuído | Média | Alto | Invalidação por tags; TTL adaptativo; monitoramento | |
| Complexidade OAuth2 + gestão webhooks | Média | Médio | SDKs oficiais; validação schema; documentação Scalar | |

### Próximas Ações Imediatas (Sprint Inicial Fase 3)

| # | Ação | Responsável | Status | Observação |
|---|------|-------------|--------|------------|
| 1 | Multi-loja: RLS + onboarding self-service + planos | | Pendente | |
| 2 | Marketplace Sync: produtos + pedidos + estoque | | Pendente | |
| 3 | API Pública: OAuth2 + rate limiting + Scalar docs | | Pendente | |
| 4 | Webhooks Gerenciáveis: UI config + secrets + logs | | Pendente | |
| 5 | Cache Redis cluster + invalidação por tags | | Pendente | |
| 6 | Observabilidade: OpenTelemetry + Grafana dashboards | | Pendente | |

---

## FASE 4 — Inteligência e Ecossistema

### Marcos Importantes (Milestones)

| Marco | Data Alvo | Data Real | Status |
|-------|-----------|-----------|--------|
| Recomendação: "Compre junto" + personalização | | | Pendente |
| Previsão: demanda + churn + LTV | | | Pendente |
| App Store: SDK + marketplace + revenue share | | | Pendente |
| White-label: multi-brand + domínios ilimitados | | | Pendente |
| Internacionalização: multi-moeda + multi-idioma | | | Pendente |

### Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação | Status Real |
|-------|---------------|---------|-----------|-------------|
| Qualidade modelos ML (recomendação/previsão) | Média | Alto | Métricas offline A/B; fallback regras; monitoramento drift | |
| Complexidade App Store (SDK + sandbox) | Alta | Alto | Spec-first; contrato versionado; testes integração | |
| Complexidade white-label (temas + domínios) | Média | Médio | Design tokens isolados; feature flags; testes multi-tenant | |
| Compliance internacional (LGPD, GDPR, tax) | Alta | Crítico | Auditoria legal; data residency; consent management | |

### Próximas Ações Imediatas (Sprint Inicial Fase 4)

| # | Ação | Responsável | Status | Observação |
|---|------|-------------|--------|------------|
| 1 | Recomendação: engine + "quem viu viu" + personalização | | Pendente | |
| 2 | Previsão: modelos demanda/churn/LTV + sazonalidade | | Pendente | |
| 3 | App Store: SDK + marketplace interno + revenue share | | Pendente | |
| 4 | White-label: multi-brand + domínios + customização | | Pendente | |
| 5 | Internacionalização: multi-moeda + multi-idioma + tax | | Pendente | |

---

## Regras de Uso

### Para o Desenvolvedor
- Ao concluir uma fase, **preencha manualmente** as seções acima com dados reais
- Atualize: "Data Real", "Status", "Status Real" (riscos), "Status" (ações)
- Mantenha o histórico para auditoria e retrospectivas

### Para o Agente de IA
- **PROIBIDO** escrever neste arquivo (`docs/phases/phases_mac.md`)
- **PROIBIDO** escrever em `docs/phases/phases_XX_YY.md`
- **PROIBIDO** escrever em `docs/phases.md`
- Durante execução de fases, o agente apenas **gera conteúdo bruto** para revisão humana
- O desenvolvedor inclui manualmente os artefatos nos arquivos apropriados