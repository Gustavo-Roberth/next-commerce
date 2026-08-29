# PHASES.md

# 📌 OBJETIVO
Documento central de governança das fases do projeto NextCommerce.
Este arquivo define:
- descoberta da fase ativa;
- regras de execução;
- regras de revisão;
- regras de refinamento;
- fluxo operacional do agente;
- limites de escopo;
- organização das fases.

---

## Fonte de Verdade
- O fluxo operacional deve seguir `/agents/agent.md`.
- O controle de fases, regras e escopo deve seguir `/docs/phases.md`.

## Ordem Obrigatória de Leitura
O agente deve SEMPRE ler nesta ordem:
1. `/agents/agent.md`
2. `/docs/context.md`
3. `/docs/product.md`
4. `/docs/behavior.md`
5. `/docs/entities.md`
6. `/docs/tech.md`
7. `/docs/ui-reference.md` (quando existir)
7. `/docs/phases.md`
8. arquivo modular da fase ativa

## Hierarquia Documental
Em caso de conflito entre documentos:
1. `/docs/phases.md`
2. `/docs/behavior.md`
3. `/docs/tech.md`
4. `/docs/entities.md`
5. `/docs/context.md`
6. `/docs/product.md`
6. `/docs/ui-reference.md`

O agente deve sempre respeitar a maior prioridade documental.

---

# 🚨 REGRAS DE OURO
O agente NUNCA deve:
- implementar fases futuras;
- antecipar entidades;
- criar contratos não previstos;
- quebrar arquitetura;
- substituir regras documentadas.

Apenas a fase **🟢 EM DESENVOLVIMENTO** é autorizada para:
- implementação
- revisão
- refinamento
- correções estruturais

Tudo não explicitamente descrito na fase ativa é:
- fora de escopo | bloqueado | futuro | não autorizado

Fases futuras servem apenas como:
- referência arquitetural | entendimento contextual | compatibilidade estrutural
- nunca como autorização de implementação antecipada.

**Exceção — Subfases:** registrar uma subfase nova (status `PENDENTE`) dentro da fase ativa **não é** antecipar fase futura. É documentar, de forma estruturada, uma necessidade real percebida durante a execução (dívida técnica ou trabalho pendente). Registrar não é implementar — a subfase só pode ser implementada depois de assumir status `🟢 EM DESENVOLVIMENTO`, exatamente como qualquer fase.

---

# 🚨 FASE ATUAL DO PROJETO
## FASE ATIVA

🟢 **FASE 2 — Design e Polimento Visual**
**Status: EM DESENVOLVIMENTO**
**Início:** 2026-08-29 | **Fim estimado:** 2026-09-03

Arquivo:
- `/docs/phases/phases_00_10.md`

---

# 📌 DEFINIÇÕES DE STATUS DE FASE

## 🔒 BLOQUEADA
Fase futura que **não deve ser desenvolvida**.
- Não implementar, não revisar, não refinar
- Apenas referência arquitetural/compatibilidade
- Exemplo: `# 🔒 FASE 3 — Escala e Multi-loja\n**Status: BLOQUEADA**`

## 🟢 EM DESENVOLVIMENTO
Fase ativa autorizada para:
- Implementação
- Revisão
- Refinamento
- Correções estruturais
- Exemplo: `# 🟢 FASE 1 — Fundação e MVP Loja\n**Status: EM DESENVOLVIMENTO**`

## ⚪ CONCLUÍDA
Fase finalizada — **não reescrever, adaptar, modificar ou apagar**.
- Código/estrutura consolidados
- Apenas manutenção corretiva (bugs críticos)
- Exemplo: `# ⚪ FASE 1 — Fundação e MVP Loja\n**Status: CONCLUÍDA**`

---

# 📌 ARTEFATOS DE CONCLUSÃO DE FASE
Ao concluir uma fase, o desenvolvedor deve registrar manualmente em `docs/phases/phases_mac.md`:

1. **Marcos Importantes (Milestones)** — Data real, status, comparação planejado vs. realizado
2. **Riscos e Mitigações** — Riscos materializados, novos riscos descobertos, mitigações aplicadas
3. **Próximas Ações Imediatas** — Top 5-7 ações prioritárias para a próxima fase

> O agente de IA **não deve** escrever em `docs/phases/phases_mac.md`. O agente apenas gera conteúdo bruto para revisão; o desenvolvedor inclui manualmente.

---

## Referência Histórica
Artefatos detalhados de todas as fases concluídas (marcos, riscos, sprints) estão em: `docs/phases/phases_mac.md`

---

# 🚫 PROIBIÇÃO DE ESCRITA EM ARQUIVOS DE FASE
O agente de IA **NÃO deve** escrever em:
- `docs/phases/phases_mac.md`
- `docs/phases/phases_XX_YY.md`
- `docs/phases.md`

Durante execução de fases, o agente apenas **gera conteúdo bruto** para revisão humana.
O desenvolvedor inclui manualmente os artefatos nos arquivos apropriados.

**Exceção — Subfases:** o agente **pode** acrescentar uma nova subfase (status `PENDENTE`) ao final da seção "Subfases percebidas durante a execução" do arquivo `docs/phases/phases_XX_YY.md` correspondente à fase ativa. Esta é a única escrita permitida neste arquivo, e está restrita a:
- apenas **adicionar** uma subfase nova ao final da lista — nunca editar, remover ou reordenar subfases existentes;
- apenas com status `PENDENTE` — o agente nunca altera status de nenhuma fase ou subfase;
- nunca alterar qualquer outro conteúdo do arquivo (fases, entregáveis, critérios de aceitação já existentes, governança).

Qualquer escrita fora desses limites continua proibida e segue a regra geral acima.

---

# 🔧 MODOS DE EXECUÇÃO
## IMPLEMENTAÇÃO
Quando solicitado implementar:
- executar apenas a fase ativa;
- respeitar behavior/entities/tech;
- usar mocks somente quando permitido;
- manter separação de responsabilidades.

### Backend
- regras de negócio fora das rotas;
- persistência desacoplada;
- services obrigatórios;
- validações centralizadas.

### Frontend
- UI desacoplada da regra de negócio;
- componentes reutilizáveis;
- responsividade obrigatória;
- consistência visual.

---

## REVISÃO
Quando solicitado revisar:
- validar aderência à fase;
- detectar antecipações;
- revisar arquitetura;
- revisar contratos;
- classificar problemas:
  - 🔴 crítico
  - 🟡 médio
  - 🟢 melhoria

---

## REFINAMENTO VISUAL
Quando solicitado refinamento:
- melhorar UX/UI;
- preservar regras de negócio;
- não alterar contratos;
- respeitar design system;
- melhorar legibilidade e hierarquia visual.

---

# 📌 REGRAS DE MOCK
Mocks são permitidos SOMENTE quando:
- dependência pertence a fase futura;
- integração ainda não existe;
- explicitamente permitido pela fase.

---

# 📂 ORGANIZAÇÃO DAS FASES
As fases estão distribuídas em:
- `/docs/phases/phases_mac.md` (Marcos, Riscos & Ações — histórico de todas as fases)
- `/docs/phases/phases_00_10.md` (Fases 0-10: Fundação, MVP, Gestão)
- `/docs/phases/phases_11_20.md` (Fases 11-20: Escala, Multi-loja)
- `/docs/phases/phases_21_30.md` (Fases 21-30: Inteligência, Ecossistema)
- `/docs/phases/phases_31_40.md` (Reservado)
- `/docs/phases/phases_41_50.md` (Reservado)

---

# 📐 ESTRUTURA OBRIGATÓRIA PARA ARQUIVOS DE FASE
Todo arquivo em `/docs/phases/` DEVE seguir exatamente esta organização e ordem:

## 1. Visão geral das fases
Tabela com todas as fases do range coberto pelo arquivo:
| Fase | Nome | Período | Foco Principal |

## 2. Por fase (ordem crescente de número)
Para cada fase, obrigatoriamente:

### Cabeçalho da fase (escolher status conforme caso):
```markdown
# 🔒 FASE X — Nome da fase
**Status: BLOQUEADA**

# 🟢 FASE X — Nome da fase
**Status: EM DESENVOLVIMENTO**

# ⚪ FASE X — Nome da fase
**Status: CONCLUÍDA**
```

**Início:** YYYY-MM-DD | **Fim estimado:** YYYY-MM-DD

### Objetivo
Descrição clara do objetivo da fase.

### Entregáveis (Definition of Done)
Subdividido por camada (apenas as aplicáveis):
- `### Infra & Shared`
- `### Backend`
- `### Frontend`
- `### Deploy & Ops`

Cada item como checkbox: `- [ ] Descrição técnica clara`

### 2.3 Critérios de aceitação
Lista numerada, testável, orientada a usuário:
1. `Papel consegue: ação → resultado observável`

## 2.4 Subfases percebidas durante a execução
Toda fase pode conter, ao final do seu conteúdo, uma seção `## Subfases percebidas durante a execução`, contendo subfases geradas por dívida técnica ou por necessidades percebidas durante a execução.

Uma subfase segue **exatamente a aparência de uma fase padrão**, em miniatura — sem tag de origem, sem categorização especial:

```markdown
# 🔒 FASE X.Y — Nome da subfase
**Status: PENDENTE**

## Objetivo
Descrição clara do objetivo da subfase.

## Entregáveis
- [ ] Item técnico claro

## Critérios de aceitação
1. Papel consegue: ação → resultado observável
```

Regras:
- Numeração `X.Y`, onde `X` é o número da fase-mãe e `Y` é sequencial, crescente, dentro daquela fase.
- Status inicial sempre `PENDENTE` (aguardando priorização humana) — os únicos status válidos para subfase são `PENDENTE`, `🟢 EM DESENVOLVIMENTO` e `⚪ CONCLUÍDA` (subfase não usa `🔒 BLOQUEADA`, já que nasce dentro da fase ativa, não é fase futura).
- Mudança de status `PENDENTE` → `🟢 EM DESENVOLVIMENTO` é manual, mesma regra de transição de fase.
- Ao concluir, a subfase segue para `⚪ CONCLUÍDA` e seus marcos entram em `phases_mac.md` junto com os da fase-mãe — não precisa de registro próprio separado.

## 3. Governança de fases (idêntica em todos os arquivos)
- `## Transição de fase`
- `## Mudanças estruturais durante fase`
- `## Dívida técnica`

---

**Regra de validação:** O agente DEVE verificar conformidade com esta estrutura ao criar ou atualizar qualquer arquivo em `/docs/phases/`. Não conformidade = bloqueio.

---
