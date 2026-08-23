# Agent Instructions — NextCommerce Shared (packages/shared)

## Identidade do Pacote
- **Este pacote**: `@nextcommerce/shared` — Tipos, schemas, contratos
- **Consumidores**: `apps/web` (frontend), `apps/api` (backend)
- **Projeto**: NextCommerce (SaaS e-commerce multi-tenant)

## Responsabilidade
- Tipos TypeScript do domínio (entidades, enums, DTOs)
- Schemas Zod de validação (request/response da API)
- Enums e constantes compartilhadas
- Utilitários puros (formatters, validators, helpers)

## Proibições
- ❌ Código específico de frontend (React, Next.js, browser APIs)
- ❌ Código específico de backend (Fastify, Prisma, Node.js APIs)
- ❌ Regras de negócio
- ❌ Side effects (I/O, rede, banco, filesystem)
- ❌ Default exports

## Estrutura
```
src/
├── types/
│   ├── entities.ts         # Interfaces das entidades (User, Product, Order, etc.)
│   ├── enums.ts            # Enums (OrderStatus, PaymentMethod, UserRole, etc.)
│   ├── dto.ts              # DTOs (CreateProductDTO, UpdateOrderDTO, etc.)
│   └── api.ts              # Tipos request/response da API
├── schemas/
│   ├── auth.schemas.ts
│   ├── product.schemas.ts
│   ├── order.schemas.ts
│   ├── payment.schemas.ts
│   ├── stock.schemas.ts
│   ├── config.schemas.ts
│   └── index.ts            # Barrel export
├── constants/
│   ├── roles.ts             # Perfis sistema, permissões
│   ├── status.ts            # Status padronizados
│   └── limits.ts            # Limites (paginação, upload, etc.)
├── utils/
│   ├── formatters.ts        # formatCurrency, formatDate, formatCPF
│   ├── validators.ts        # isValidCPF, isValidCNPJ, isValidCEP
│   └── helpers.ts           # Pure helpers (slugify, generateSKU, etc.)
└── index.ts                 # Barrel export principal
```

## Convenções
- **Named exports apenas**
- **Tipagem forte** — inferir tipos dos schemas Zod (`z.infer<typeof schema>`)
- **Schemas = source of truth** — tipos derivados dos schemas
- **Utilitários puros** — sem side effects, testáveis isoladamente
- **Versão**: Workspace protocol (`workspace:*`) no monorepo

## Uso nos Apps
```typescript
// apps/web ou apps/api
import { Product, CreateProductDTO, productCreateSchema } from '@nextcommerce/shared';
import { formatCurrency } from '@nextcommerce/shared/utils';
```

## Testes
- Vitest para utilitários puros
- Schema validation tests (valid/invalid inputs)

## CI/CD
- Pre-commit: biome + typecheck
- Publicação futura: npm (quando versionado independentemente)

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

# Regra Final
O objetivo do agente não é apenas concluir tarefas.
O objetivo é garantir que toda evolução do projeto permaneça consistente com o domínio, a arquitetura e a fase ativa.