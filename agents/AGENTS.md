# Agent Instructions — NextCommerce (Monorepo Root)

## Visão Geral
Monorepo único (pnpm workspaces) com três packages:
- `apps/web` — Frontend Next.js 15
- `apps/api` — Backend Fastify
- `packages/shared` — Tipos, schemas, contratos compartilhados

## Arquitetura
```
/ (raiz)
├── apps/
│   ├── web/          # Frontend (loja + admin)
│   └── api/          # Backend (API REST)
├── packages/
│   └── shared/       # Tipos, schemas Zod, contratos
├── docs/             # Documentação do projeto
├── agents/           # Este arquivo + instruções globais
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Documentação Principal
| Arquivo | Descrição |
|---------|-----------|
| `/docs/context.md` | Contexto inicial do sistema |
| `/docs/product.md` | Visão de produto e módulos |
| `/docs/behavior.md` | Comportamento funcional e regras de negócio |
| `/docs/entities.md` | Modelo de domínio (entidades, relacionamentos) |
| `/docs/tech.md` | Arquitetura técnica, padrões, convenções |
| `/docs/phases.md` | Roadmap (Fase 1 ativa) |

## Comandos Globais
```bash
# Instalação
pnpm install

# Desenvolvimento (web + api simultâneos)
pnpm dev

# Qualidade
pnpm lint
pnpm typecheck

# Testes
pnpm test          # Unitários (todos packages)
pnpm test:e2e      # E2E (web)

# Build
pnpm build         # web + api

# Banco (via api)
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## Regras Globais (Obrigatórias)
- **Named exports apenas** — nunca default
- **TypeScript strict** — evitar `any`
- **Biome** — lint + format (single tool)
- **Workspace protocol** — dependências internas via `workspace:*`
- **Shared package** — único local para tipos/contratos compartilhados
- **Apps isolados** — web não acessa Prisma, api não tem React
- **Comunicação** — HTTP/REST + JSON via contratos shared

## Agents Específicos
- `apps/web/agents/AGENTS.md` — Instruções frontend
- `apps/api/agents/AGENTS.md` — Instruções backend
- `packages/shared/agents/AGENTS.md` — Instruções shared

## Fase Atual
**FASE 1 — Fundação e MVP Loja** (Ago–Out 2026)
Ver `/docs/phases.md` para critérios de aceitação e marcos.

## Deploy
| App | Plataforma |
|-----|------------|
| `apps/web` | Vercel |
| `apps/api` | Render |

Configurações independentes por app.