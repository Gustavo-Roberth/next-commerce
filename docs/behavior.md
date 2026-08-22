# Behavior - NextCommerce
## Fonte de verdade desta consolidação
Este documento consolida o comportamento esperado do sistema com base nas informações fornecidas pelo desenvolvedor neste PRD. Implementações existentes não devem ser consideradas fonte de verdade funcional.

## Escopo funcional consolidado
SaaS de e-commerce multi-perfil (Cliente, Estoquista, Operador, Gestor, Administrador) com módulos de catálogo, carrinho, checkout, pagamentos, pedidos, estoque, dashboard, relatórios, avaliações e frete. Tipo: SaaS B2C/B2B multi-tenant.

## Regras transversais de comportamento

### Controle de acesso
- Autenticação via Supabase Auth (e-mail/senha, OAuth opcional, MFA TOTP opcional)
- Autorização baseada em RBAC com 5 perfis imutáveis:
  - **Administrador**: acesso total (configurações, usuários, integrações, tudo)
  - **Gestor**: leitura total + relatórios + dashboards (sem escrita em cadastros)
  - **Operador**: pedidos (leitura/escrita), catálogo (leitura/escrita), clientes (leitura)
  - **Estoquista**: estoque (leitura/escrita), separação de pedidos, inventário
  - **Cliente**: próprio perfil, endereços, pedidos, carrinho, favoritos, avaliações
- Isolamento de dados por loja (tenant): cada loja acessa apenas seus dados
- Sessões com access token (JWT, 15min) + refresh token (rotação a cada uso, 30 dias)
- Bloqueio após 5 tentativas falhas (15min), recuperação por e-mail com token único

### Integridade e rastreabilidade
- Todos os registros: `id` (UUID v7), `created_at`, `updated_at`, `deleted_at` (soft delete obrigatório)
- Auditoria imutável de ações críticas: login, alteração de preço, estoque, status de pedido, pagamentos, concessão de perfis
- Event sourcing leve para Pedido e Pagamento: `PedidoEvento`, `PagamentoEvento` append-only
- Exclusão lógica obrigatória para entidades transacionais (Pedido, Produto, Estoque, Cupom, etc.)
- Constraints de unicidade no banco: SKU por loja, e-mail de usuário, código de cupom, slug de categoria/produto

### Validação de dados
- Campos obrigatórios validados na API (schemas Zod em `packages/shared`)
- Formatos: e-mail (RFC 5322), CPF/CNPJ (algoritmo oficial), CEP (8 dígitos + validação ViaCEP), telefone (E.164), moeda (centavos inteiros, `int64`)
- Unicidade: SKU por loja, e-mail de usuário, código de cupom por loja, slug por loja
- Consistência: estoque disponível ≥ 0, preço > 0, quantidade > 0, parcelas ≤ máximo configurado
- Validação cruzada: CEP válido para frete, cupom válido/expirado/uso máximo/escopo, variação ativa para venda

### Ciclo de vida operacional
**Produto:** `RASCUNHO` → `ATIVO` → `INATIVO` → `ARQUIVADO` (apenas ATIVO + categoria ATIVA = visível)
**Pedido:** `CRIADO` → `PAGAMENTO_PENDENTE` → `PAGO` → `SEPARANDO` → `ENVIADO` → `ENTREGUE` | `CANCELADO` (em qualquer etapa antes de ENTREGUE)
**Pagamento:** `INICIADO` → `PROCESSANDO` → `APROVADO` | `RECUSADO` | `EXPIRADO` → `ESTORNADO` (após APROVADO)
**Estoque item:** `DISPONIVEL` → `RESERVADO` → `BAIXADO` | `LIBERADO` (cancelamento)
**Cupom:** `ATIVO` → `EXPIRADO` | `ESGOTADO` | `DESATIVADO`

## Comportamento por módulo

### Identidade e Acesso
- Login retorna access token + refresh token (httpOnly cookie opcional)
- Refresh token rotação a cada uso (revoga anterior, emite novo)
- Perfil define permissões granulares: `route:action` (ex: `pedidos:write`, `produtos:read`)
- Administrador convida usuários via e-mail → define perfis por loja
- Cliente auto-cadastro → verificação de e-mail obrigatória → perfil CLIENTE automático
- Troca de senha: token de uso único, expiração 1h, invalida sessões ativas

### Vitrine e Catálogo
- Apenas produtos `ATIVO` com categoria `ATIVA` aparecem na vitrine
- Busca full-text: nome, descrição, tags, SKU (PostgreSQL tsvector + trigram)
- Filtros combinados: categoria (árvore), faixa preço (centavos), atributos (cor/tamanho/voltagem), disponibilidade (estoque > 0)
- Paginação cursor-based (performance, sem offset)
- Favoritos: toggle por cliente, lista privada, persiste cross-device
- Avaliações: apenas cliente com pedido `ENTREGUE` daquele produto → 1-5 estrelas + texto + imagens opcionais → moderação opcional (aprovada por admin)

### Carrinho e Checkout
- Carrinho persistido no banco (server-side) + localStorage (otimista, sync via `updated_at`)
- Sessão de carrinho expira em 24h (limpeza via job)
- Cupom: valida código (case-insensitive), vigência, valor mínimo, uso total, uso por cliente, escopo (categorias/produtos), primeira compra
- Frete: consulta CEP → retorna opções ordenadas (prazo, valor, transportadora) — cache 1h por CEP+loja
- Endereço: cliente seleciona cadastrado ou informa novo (validação CEP inline)
- Checkout single-page: validação inline, resumo lateral, loading states por seção

### Pagamentos
- Integração 100% assíncrona via webhooks (HMAC assinado)
- PIX: QR code expira 15min, webhook `payment.approved` confirma, `payment.expired` cancela
- Cartão: tokenização no frontend (SDK gateway), 3DS challenge quando exigido, webhook confirma
- Boleto: vencimento D+1, webhook `payment.paid` confirma, `payment.expired` cancela
- Idempotência: `Idempotency-Key` header obrigatório em todas mutações (UUID v7)
- Conciliação: job diário compara `Pagamento.APROVADO` vs extrato gateway → divergências em fila manual

### Pedidos
- Criação atômica (transação): `Pedido` + `ItemPedido[]` + `Estoque.reserva` + `Pagamento.INICIADO`
- Timeline de eventos visível ao cliente (público) e interno (comentários da equipe)
- Cancelamento: transação inverte reserva estoque, estorna pagamento se `APROVADO`, emite `PedidoEvento.CANCELADO`
- NF-e: emissão automática (integração provedor) ao status `ENVIADO` → XML + PDF armazenados no Supabase Storage
- Rastreamento: código + URL transportadora, webhook atualiza `TransportadoraRastreamento.eventos[]` → notifica cliente

### Estoque
- SKU = `ProdutoVariacao` (identificador fiscal único)
- Quantidade disponível = `fisica` - `reservada` (computed, não persistido)
- Reserva atômica no checkout: `UPDATE estoque SET reservada = reservada + qtd WHERE variacao_id = ? AND deposito_id = ? AND (fisica - reservada) >= qtd` — retry exponencial 3x
- Entrada: `NOTA_COMPRA` (atualiza custo médio ponderado), `DEVOLUCAO`, `AJUSTE_POSITIVO`
- Saída: `VENDA` (baixa reservada), `PERDA`, `DOACAO`, `AJUSTE_NEGATIVO`
- Transferência: `TRANSFERENCIA_SAIDA` (origem) + `TRANSFERENCIA_ENTRADA` (destino) — mesma transação
- Alerta: job horário verifica `disponivel <= minima` → notifica estoquista + admin
- Inventário: contagem física → `AJUSTE_POSITIVO/NEGATIVO` com divergência registrada

### Dashboard e Relatórios
- KPIs tempo real: materialized views atualizadas via trigger/evento (vendas dia/mês, ticket médio, conversão, abandono)
- Filtros: período (date range), canal (loja/marketplace), vendedor, categoria
- Exportação: CSV (dados brutos), PDF (relatórios formatados com logo/loja)
- Agendamento: relatórios recorrentes (diário/semanal/mensal) → e-mail com anexo + link painel

### Configurações
- Loja: nome, logo, cores (design tokens), domínio customizado (verificação DNS TXT), SEO (meta, sitemap, robots), redes sociais
- Frete: múltiplas regras avaliadas por prioridade — Correios (tabela), transportadora (API), tabela preço (CEP faixa), grátis por valor mínimo, grátis por região (UF)
- Pagamento: credenciais criptografadas (AES-256, chave por loja), parcelamento máx, juros por parcela (JSON), modo teste/homologação
- Cupons: `%` ou `valor_fixo` (centavos), `frete_gratis`, primeira compra, escopo categoria/produto, validade, limite uso
- E-mails: templates MJML/HTML (boas-vindas, pedido criado, pagamento aprovado, envio, entrega, avaliação, carrinho abandonado) — variáveis handlebars
- Integrações: API keys criptografadas, webhook URLs com HMAC secret, logs de entrega

## Fluxos macro consolidados
1. **Compra completa**: Cliente navega → busca/filtra → carrinho → checkout (cupom + CEP → frete + endereço) → pagamento (PIX/cartão/boleto) → webhook aprova → pedido `PAGO` + estoque reservado → notifica equipe
2. **Operação logística**: Equipe vê pedidos `PAGO` → estoquista separa itens → confirma separação → `SEPARANDO` → `ENVIADO` (NF-e emitida, etiqueta impressa) → transportadora coleta → webhook rastreamento → `ENTREGUE`
3. **Pós-venda**: `ENTREGUE` → cliente recebe e-mail avaliação → avalia (verificada) → financeiro concilia recebíveis → gestor analisa KPIs (ticket, conversão, LTV, CAC)
4. **Gestão contínua**: Admin configura regras → operador cadastra produtos/variações → estoquista recebe NF compra → entrada estoque (custo médio) → produtos disponíveis para venda

## Regras de compatibilidade para fases seguintes
Este documento representa a fonte de verdade do comportamento funcional da fase atual. Mudanças estruturais devem respeitar a fase ativa definida em `/docs/phases.md`.

## Fluxo oficial para alterações de banco de dados
Toda alteração estrutural segue:
1. **Migration** versionada (Prisma Migrate) — nome descritivo `YYYYMMDDhhmmss_descricao_curta`, timestamp
2. **Seed** quando necessário para parametrização (perfis de sistema, configs iniciais, dados de referência)
3. **Revisão técnica** — PR revisado por 2+ devs, CI passa (lint, typecheck, testes unitários, build)
4. **Aprovação operacional** — PO valida impacto em dados existentes, rollback testado em staging
5. **Rollback** — script de reversão (`down` migration) testado, tempo de execução < 5min
6. **Versionamento** — tag semver no monorepo (`vX.Y.Z`), changelog atualizado (`CHANGELOG.md`)