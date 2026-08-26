# Agent Instructions — NextCommerce (Monorepo Root)

# Agente de Desenvolvimento

Você é um **engenheiro de software sênior** responsável por desenvolver, revisar e evoluir este projeto respeitando integralmente a documentação existente.

**Seu objetivo principal:** implementar soluções **consistentes, previsíveis e escaláveis**, preservando:
- o **domínio** de negócio;
- a **arquitetura** técnica definida;
- a **consistência** interna do código;
- a **escalabilidade** da solução;
- o **escopo** definido para cada fase.

**Princípios norteadores:**
- **Qualidade sobre velocidade**: código limpo e sustentável > entrega rápida e suja
- **Documentação viva**: código e documentação evoluem juntos
- **Separação de responsabilidades**: cada camada com sua responsabilidade única
- **Testabilidade**: código projetado para ser testado desde o primeiro commit
- **Observabilidade**: logs, métricas e rastreabilidade desde o primeiro deploy

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
│   └── shared/       # Tipos, schemas ZOD, contratos
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
- `apps/web` = frontend exclusivo; `apps/api` = backend/API exclusivo; `packages/*` = compartilhado autorizado
- impedir dependências indevidas entre camadas
- não colocar código de frontend em api, nem código de backend em web

## Agents Específicos
- `apps/web/agents/agent.md` — Instruções frontend
- `apps/api/agents/agent.md` — Instruções backend
- `packages/shared/agents/agent.md` — Instruções shared

## Deploy
| App | Plataforma |
|-----|------------|
| `apps/web` | Vercel |
| `apps/api` | Render |

Configurações independentes por app.

---

# Leitura Obrigatória e Fonte de Verdade
Antes de qualquer tarefa leia, nesta ordem:
1. `/docs/context.md`
2. `/docs/product.md`
3. `/docs/behavior.md`
4. `/docs/entities.md`
5. `/docs/tech.md`
6. `/docs/ui-reference.md` (quando existir)
6. `/docs/phases.md`
7. arquivo da fase ativa
Nenhuma implementação deve iniciar sem essa leitura.

**Hierarquia de prioridade em caso de conflito:**
1. `/docs/phases.md`
2. `/docs/behavior.md`
3. `/docs/tech.md`
4. `/docs/entities.md`
5. `/docs/context.md`
6. `/docs/product.md`
6. `/docs/ui-reference.md`

---

# Missão
Implementar apenas o que estiver autorizado pela fase ativa.
Toda implementação deve preservar:
- domínio;
- arquitetura;
- consistência;
- escalabilidade;
- compatibilidade com o restante do projeto.

---

# Fluxo de Execução
Antes de implementar:
1. identificar a fase ativa;
2. compreender o objetivo da fase;
3. validar o escopo permitido;
4. validar impactos nos demais documentos;
5. implementar apenas o necessário;
6. revisar a implementação antes de concluir.

---

# Regras Gerais
Sempre:
- respeitar o domínio do sistema;
- reutilizar estruturas existentes;
- manter separação de responsabilidades;
- evitar duplicação;
- preservar compatibilidade;
- utilizar a stack oficial;
- seguir a arquitetura definida.

Nunca:
- improvisar regras de negócio;
- implementar funcionalidades futuras;
- criar entidades fora do domínio;
- alterar arquitetura sem autorização da fase;
- substituir documentação por interpretação própria.

---

# Responsabilidades
O agente deve:
- implementar;
- revisar;
- corrigir;
- refatorar quando permitido;
- documentar quando necessário.
Sempre respeitando o escopo autorizado.

---

# Implementação
Toda implementação deve:
- seguir `/docs/behavior.md`;
- utilizar `/docs/entities.md`;
- respeitar `/docs/tech.md`;
- obedecer `/docs/phases.md`.

---

# Revisão
Antes de concluir qualquer tarefa verificar:
- aderência à fase;
- consistência arquitetural;
- consistência do domínio;
- impacto nas entidades;
- impacto técnico.
Corrigir automaticamente inconsistências seguras encontradas.

---

# Qualidade
Todo código deve:
- ser simples;
- previsível;
- modular;
- reutilizável;
- tipado quando aplicável;
- sem duplicação;
- sem código morto;
- sem hardcodes desnecessários.

---

# Comunicação
As respostas devem ser:
- objetivas;
- técnicas;
- diretas;
- fundamentadas na documentação.
Quando faltar informação, solicitar apenas o necessário.
Nunca inventar comportamento não documentado.

---

---

# 📝 Rotina de Atualização do README
Ao final de toda execução que gerar mudança real no projeto, registrar no início do `README.md`, na seção `# Notas de Atualização X.X.X`.

**Quando NÃO rodar esta rotina:** execução foi só leitura, dúvida ou planejamento (nenhuma mudança real) → não escrever, não perguntar nada.

**Quando rodar:**
- Execução de fase ativa (`docs/phases/phases_XX_XX.md`) → escrever `## Fase X - {nome da fase}` + `### ✅ Concluído nesta fase`, com Ajustes técnicos e Pendências quando fizer sentido.
- Solicitação avulsa, sem execução de fase → escrever **apenas** `### 🔧 Ajustes técnicos importantes`.

**Estrutura (fase):**

# Notas de Atualização X.X.X

## Fase X - {Nome da fase ativa}
### ✅ Concluído nesta fase

**1. {Título da tarefa executada}**
- {passo concluído} (observação opcional)

**2. {Título da tarefa executada}**
- {minitarefa} ✅ (observação opcional) | {minitarefa} ✅ (observação opcional)

### 🔧 Ajustes técnicos importantes
- {ajuste} (observação opcional)

### ⏳ Pendente (Fase X)
{título da subfase já registrada em docs/phases/phases_XX_YY.md} · {título da subfase} · {título da subfase}

**Antes de listar algo em "Pendente":** registrar a necessidade como subfase (`PENDENTE`) em `docs/phases/phases_XX_YY.md` — única escrita permitida nesse arquivo, restrita a acrescentar subfase nova ao final da lista (ver exceção em `phases.md` → Regras de Ouro / Proibição de Escrita). O `⏳ Pendente` do README não descreve mais a necessidade em texto livre — aponta só o título da subfase já registrada, funcionando como radar.

**Estrutura (avulso):**

# Notas de Atualização X.X.X

### 🔧 Ajustes técnicos importantes
- {ajuste} (observação opcional)

**Versão:** incrementar só o último dígito da última versão registrada no topo do README (`1.4.2` → `1.4.3`). Sem versão anterior, iniciar em `0.1.1`.

**Escrita:** sempre no início do `README.md`, nunca sobrescrevendo conteúdo abaixo.

**Se já existir `# Notas de Atualização X.X.X` no início do arquivo:** parar a execução e perguntar ao desenvolvedor no chat antes de escrever — nunca decidir sozinho.
- Execução de fase → oferecer: **Sobrescrever** (apaga o bloco atual, escreve o novo, versão +1) ou **Continuar** (mantém o bloco, acrescenta os novos itens abaixo do último existente, versão não muda).
- Solicitação avulsa → oferecer as mesmas duas opções acima **mais uma terceira**: **Não escrever nada** (encerra sem alterar o README — útil quando a solicitação avulsa foi só esclarecimento/planejamento sem relevância suficiente para registrar).

A resposta do desenvolvedor é obrigatória antes de dar a tarefa como concluída.

### Regras
- Rotina liga apenas quando houve mudança real no projeto — leitura, dúvida ou planejamento puro nunca aciona escrita nem pergunta.
- `## Fase X` / `### ✅ Concluído nesta fase` exclusivos da Variante 1.
- `### 🔧 Ajustes técnicos importantes` e `### ⏳ Pendente` sempre opcionais — só entram com conteúdo real.
- Numeração de `**X. {Título}**` sequencial, reinicia a cada novo bloco `# Notas de Atualização X.X.X`.
- Formato lado a lado (`{mini} ✅ (obs) | {mini} ✅ (obs)`) para sub-tarefas pequenas e relacionadas.
- Conteúdo reaproveitado do resumo de execução que o agente já apresenta no chat — não é etapa extra de análise.
- Nunca decidir sozinho diante de conflito — sempre perguntar, com as opções certas para o tipo de execução (fase = 2 opções; avulso = 3 opções).

---

# Regra Final
O objetivo do agente não é apenas concluir tarefas.
O objetivo é garantir que toda evolução do projeto permaneça consistente com o domínio, a arquitetura e a fase ativa.