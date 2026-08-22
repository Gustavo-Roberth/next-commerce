# Entities - NextCommerce
## Fonte de verdade desta consolidação
Este documento consolida o modelo inicial de domínio utilizando exclusivamente as informações descritas neste PRD. Detalhes técnicos poderão ser refinados futuramente sem alterar o domínio funcional.

## Convenções gerais de domínio
- Identificador principal: `id` (UUID v7)
- Status padronizado: `ativo`, `inativo`, `arquivado`
- Auditoria: `created_at`, `updated_at`, `deleted_at` (soft delete)
- Unicidade: constraints no banco para campos de negócio (SKU, e-mail, código cupom)
- Integridade: foreign keys obrigatórias, cascade configurado por domínio
- Exclusão lógica: obrigatória para entidades transacionais
- Relacionamentos obrigatórios: definidos por cardinalidade de negócio
- Moeda: sempre centavos (`int64`, `preco_cents`)

## Entidades nucleares

### Segurança e Administração

#### Usuario
Pessoa física com acesso ao sistema (interno ou cliente).
Campos principais:
- id (UUID v7)
- email (único, RFC 5322)
- nome_completo
- telefone (E.164)
- cpf_cnpj (algoritmo oficial, único por loja quando preenchido)
- avatar_url (Supabase Storage)
- ultimo_login_em
- ativo (boolean)
- email_verificado_em

Regras:
- E-mail único global (multi-tenant via UsuarioPerfil.loja_id)
- CPF/CNPJ opcional para clientes, obrigatório para internos
- Soft delete: `deleted_at` preenchido ao desativar

Relacionamentos:
- 1:N UsuarioPerfil
- 1:N Endereco
- 1:N Pedido (cliente)
- 1:N Avaliacao
- 1:N Carrinho

#### Perfil
Conjunto de permissões (RBAC) — imutável, definido pelo sistema.
Campos principais:
- id
- codigo (único: ADMIN, GESTOR, OPERADOR, ESTOQUISTA, CLIENTE)
- nome
- descricao
- permissoes (JSON: `{ "route:action": true }` ex: `pedidos:write`)

Regras:
- Perfis de sistema não editáveis via API
- Permissões granulares por rota e ação

Relacionamentos:
- N:M Usuario (via UsuarioPerfil)

#### UsuarioPerfil
Vínculo usuário-perfil com escopo de loja (tenant).
Campos principais:
- id
- usuario_id
- perfil_id
- loja_id
- ativo
- atribuido_por_id
- atribuido_em

Regras:
- Usuário pode ter múltiplos perfis em lojas diferentes
- Cliente tem perfil CLIENTE automático na loja ao se cadastrar

Relacionamentos:
- N:1 Usuario
- N:1 Perfil
- N:1 Loja

### Cadastros Base

#### Loja
Instância do tenant (multi-tenancy).
Campos principais:
- id
- nome
- slug (único global, URL amigável)
- dominio_customizado (verificação DNS TXT)
- logo_url
- cores_tema (JSON: design tokens — primary, secondary, background, text)
- configuracoes_seo (JSON: meta_title_template, meta_description_template, og_image)
- ativa
- plano_id (referência futura)
- trial_ate

Regras:
- Slug único global
- Domínio customizado verificado via DNS
- Configurações herdadas como padrão para entidades filhas

Relacionamentos:
- 1:N UsuarioPerfil
- 1:N Produto
- 1:N Categoria
- 1:N Pedido
- 1:N ConfiguracaoFrete
- 1:N ConfiguracaoPagamento
- 1:N Cupom
- 1:N Deposito

#### Categoria
Classificação hierárquica de produtos (max 3 níveis).
Campos principais:
- id
- loja_id
- nome
- slug (único por loja)
- descricao
- imagem_url
- pai_id (auto-relacionamento, nullable)
- ordem_exibicao
- ativa

Regras:
- Árvore profundidade máxima 3
- Slug único por loja
- Exclusão impede se houver produtos vinculados ativos

Relacionamentos:
- 1:N Categoria (filhas)
- N:1 Categoria (pai)
- 1:N Produto

#### Endereco
Endereço de entrega/cobrança/retirada.
Campos principais:
- id
- usuario_id
- tipo (ENTREGA, COBRANCA, RETIRADA)
- cep (8 dígitos, validado ViaCEP)
- logradouro
- numero
- complemento
- bairro
- cidade
- uf
- pais (padrão BRA)
- principal (boolean)
- apelido (ex: "Casa", "Trabalho")

Regras:
- CEP validado via API Correios/ViaCEP no cadastro
- Um endereço principal por tipo por usuário

Relacionamentos:
- N:1 Usuario
- 1:N Pedido (entrega/cobrança)

### Operação

#### Produto
Item vendível na loja (pai das variações).
Campos principais:
- id
- loja_id
- categoria_id
- nome
- slug (único por loja)
- descricao_curta (plain text, max 500)
- descricao_completa (rich text, TipTap/HTML sanitizado)
- sku (único por loja, identificador fiscal do produto pai)
- codigo_barras (GTIN/EAN, opcional)
- ncm (8 dígitos)
- cest (7 dígitos, opcional)
- origem_mercadoria (0-7, tabela IBPT)
- peso_bruto_kg (decimal 10,3)
- peso_liquido_kg (decimal 10,3)
- dimensoes_cm (JSON: `{altura, largura, comprimento}`)
- ativo
- destaque (boolean, home)
- permite_avaliacao (boolean)
- meta_title
- meta_description
- publicado_em

Regras:
- SKU único por loja (identificador fiscal)
- Slug único por loja (URL canônica)
- Produto `ATIVO` + categoria `ATIVA` = visível na vitrine
- Variações geram SKUs filhos (ProdutoVariacao.sku)

Relacionamentos:
- N:1 Loja
- N:1 Categoria
- 1:N ProdutoVariacao
- 1:N ProdutoImagem
- 1:N ProdutoAtributo (via ProdutoVariacaoAtributo)
- 1:N Avaliacao
- 1:N ItemCarrinho
- 1:N ItemPedido
- 1:N EstoqueMovimento

#### ProdutoVariacao
Variação concreta = SKU único vendível (cor, tamanho, voltagem).
Campos principais:
- id
- produto_id
- sku (único por loja, obrigatório NF-e)
- nome (ex: "Vermelho / GG")
- codigo_barras
- preco_cents (override do produto pai, nullable = herda)
- custo_cents (custo médio ponderado)
- peso_bruto_kg
- peso_liquido_kg
- dimensoes_cm
- ativo
- ordem_exibicao

Regras:
- SKU único por loja (identificador fiscal da variação)
- Preço override opcional (herda do pai se null)
- Estoque gerenciado no nível da variação (Estoque.variacao_id)

Relacionamentos:
- N:1 Produto
- 1:N ProdutoVariacaoAtributo
- 1:N Estoque
- 1:N ItemCarrinho
- 1:N ItemPedido

#### ProdutoAtributo
Atributo definidor de variação (ex: Cor, Tamanho, Voltagem).
Campos principais:
- id
- loja_id
- nome
- tipo (COR, TAMANHO, VOLTAGEM, PERSONALIZADO)
- valores (JSON array: `["Vermelho", "Azul", "Preto"]`)

Regras:
- Valores pré-definidos para consistência
- Usado para gerar variações combinatórias

Relacionamentos:
- N:1 Loja
- N:M ProdutoVariacao (via ProdutoVariacaoAtributo)

#### ProdutoVariacaoAtributo
Valor do atributo para uma variação específica.
Campos principais:
- id
- variacao_id
- atributo_id
- valor (ex: "Vermelho", "GG", "110V")

Regras:
- Um valor por atributo por variação
- Combinação única define a variação

Relacionamentos:
- N:1 ProdutoVariacao
- N:1 ProdutoAtributo

#### ProdutoImagem
Imagens do produto/variacao.
Campos principais:
- id
- produto_id
- variacao_id (opcional, se específico da variação)
- url (Supabase Storage CDN)
- alt_text
- principal (boolean)
- ordem

Regras:
- Uma principal por produto/variacao
- Upload para Supabase Storage, CDN automático
- WebP/AVIF otimizado via edge function

Relacionamentos:
- N:1 Produto
- N:1 ProdutoVariacao (opcional)

### Financeiro

#### Pedido
Registro da compra do cliente.
Campos principais:
- id
- loja_id
- cliente_id
- numero_sequencial (único por loja, auto-increment)
- status (CRIADO, PAGAMENTO_PENDENTE, PAGO, SEPARANDO, ENVIADO, ENTREGUE, CANCELADO)
- subtotal_cents
- desconto_cents
- frete_cents
- total_cents
- cupom_id (opcional)
- endereco_entrega_id
- endereco_cobranca_id
- observacoes_cliente
- observacoes_internas
- pago_em
- enviado_em
- entregue_em
- cancelado_em
- cancelamento_motivo

Regras:
- Numero sequencial por loja (não global)
- Total = subtotal - desconto + frete
- Status transicionam conforme fluxo definido em behavior.md
- Cancelamento: devolve estoque + estorna pagamento se pago

Relacionamentos:
- N:1 Loja
- N:1 Usuario (cliente)
- N:1 Cupom (opcional)
- N:1 Endereco (entrega)
- N:1 Endereco (cobrança)
- 1:N ItemPedido
- 1:N Pagamento
- 1:N PedidoEvento
- 1:N NotaFiscal
- 1:N TransportadoraRastreamento

#### ItemPedido
Linha do pedido (snapshot de produto + preço no momento).
Campos principais:
- id
- pedido_id
- produto_id
- variacao_id
- nome_produto (snapshot)
- sku (snapshot)
- quantidade
- preco_unitario_cents
- total_cents

Regras:
- Snapshot imutável de nome/SKU/preço no momento da compra
- Total = quantidade * preco_unitario_cents

Relacionamentos:
- N:1 Pedido
- N:1 Produto
- N:1 ProdutoVariacao

#### Pagamento
Tentativa de pagamento do pedido.
Campos principais:
- id
- pedido_id
- gateway (MERCADO_PAGO, STRIPE, PIX_GATEWAY, BOLETO_GATEWAY)
- metodo (PIX, CARTAO_CREDITO, CARTAO_DEBITO, BOLETO)
- status (INICIADO, PROCESSANDO, APROVADO, RECUSADO, ESTORNADO, EXPIRADO)
- valor_cents
- parcelas
- juros_cents
- idempotency_key (único, UUID v7)
- gateway_transaction_id
- gateway_response (JSON bruto)
- webhook_received_at
- aprovado_em
- estornado_em

Regras:
- Idempotency key obrigatória em todas mutações
- Um pagamento `APROVADO` por pedido (parcial futuro)
- Webhook atualiza status automaticamente (HMAC verificado)

Relacionamentos:
- N:1 Pedido
- 1:N PagamentoEvento

#### Cupom
Desconto promocional.
Campos principais:
- id
- loja_id
- codigo (único por loja, case-insensitive)
- nome
- tipo (PERCENTUAL, VALOR_FIXO, FRETE_GRATIS)
- valor (percentual 0-100 ou centavos)
- valor_minimo_pedido_cents
- uso_maximo_total
- uso_maximo_por_cliente
- uso_atual (contador atômico)
- valido_de
- valido_ate
- categorias_aplicaveis (JSON array ids)
- produtos_aplicaveis (JSON array ids)
- primeira_compra_only
- ativo

Regras:
- Código único por loja (case-insensitive)
- Validação: data, uso total, uso por cliente, valor mínimo, escopo
- Contador de uso atômico (increment no checkout)

Relacionamentos:
- N:1 Loja
- N:M Categoria (aplicável)
- N:M Produto (aplicável)
- 1:N Pedido

### Estoque

#### Estoque
Quantidade por variação por depósito.
Campos principais:
- id
- loja_id
- variacao_id
- deposito_id
- quantidade_fisica (int, ≥ 0)
- quantidade_reservada (int, ≥ 0)
- quantidade_minima (int, alerta)
- quantidade_maxima (int, opcional)
- custo_medio_cents (ponderado)
- atualizado_em

Regras:
- Disponível = fisica - reservada (computed)
- Reserva atômica no checkout (UPDATE com WHERE disponível ≥ qtd)
- Alerta job horário: disponível <= minima

Relacionamentos:
- N:1 Loja
- N:1 ProdutoVariacao
- N:1 Deposito
- 1:N EstoqueMovimento

#### Deposito
Local físico de armazenagem.
Campos principais:
- id
- loja_id
- nome
- codigo (único por loja)
- endereco_completo
- padrao (boolean)
- ativo

Regras:
- Um padrão por loja (fallback alocação)
- Estoquista alocado a depósito(s) via perfil/config

Relacionamentos:
- N:1 Loja
- 1:N Estoque
- 1:N EstoqueMovimento (origem/destino)

#### EstoqueMovimento
Rastreabilidade imutável de toda entrada/saída/reserva.
Campos principais:
- id
- loja_id
- variacao_id
- deposito_id
- tipo (ENTRADA_COMPRA, ENTRADA_DEVOLUCAO, ENTRADA_AJUSTE, SAIDA_VENDA, SAIDA_PERDA, SAIDA_DOACAO, SAIDA_AJUSTE, TRANSFERENCIA_SAIDA, TRANSFERENCIA_ENTRADA, RESERVA, LIBERACAO_RESERVA)
- quantidade (int, > 0)
- custo_unitario_cents (opcional, para ENTRADA_COMPRA)
- referencia_tipo (PEDIDO, NOTA_COMPRA, AJUSTE, INVENTARIO, TRANSFERENCIA)
- referencia_id
- usuario_id
- observacao
- criado_em

Regras:
- Imutável após criado (append-only)
- Custo médio ponderado recalculado em ENTRADA_COMPRA
- RESERVA/LIBERACAO_RESERVA não alteram fisica, apenas reservada
- TRANSFERENCIA: duas linhas (SAIDA origem + ENTRADA destino) mesma transação

Relacionamentos:
- N:1 Loja
- N:1 ProdutoVariacao
- N:1 Deposito
- N:1 Usuario

### Comercial

#### Avaliacao
Avaliação de produto por cliente verificado.
Campos principais:
- id
- loja_id
- produto_id
- cliente_id
- pedido_id
- nota (1-5, int)
- titulo (opcional, max 100)
- comentario (text, max 2000)
- imagens_urls (JSON array, max 5, Supabase Storage)
- verificada (boolean — apenas se pedido ENTREGUE)
- aprovada (boolean — moderação admin)
- publicada_em

Regras:
- Única por cliente + produto + pedido
- Verificada = cliente recebeu o pedido (status ENTREGUE)
- Moderação opcional (aprovada por admin antes de publicar)

Relacionamentos:
- N:1 Loja
- N:1 Produto
- N:1 Usuario (cliente)
- N:1 Pedido

#### Favorito
Wishlist do cliente.
Campos principais:
- id
- cliente_id
- produto_id
- variacao_id (opcional)
- criado_em

Regras:
- Único por cliente + produto (+ variacao)
- Privado por cliente

Relacionamentos:
- N:1 Usuario (cliente)
- N:1 Produto
- N:1 ProdutoVariacao

#### Carrinho
Carrinho persistido server-side.
Campos principais:
- id
- cliente_id
- sessao_id (para anônimos, UUID)
- expira_em (24h)
- atualizado_em

Relacionamentos:
- N:1 Usuario (cliente, nullable)
- 1:N ItemCarrinho

#### ItemCarrinho
Linha do carrinho.
Campos principais:
- id
- carrinho_id
- produto_id
- variacao_id
- quantidade
- preco_unitario_cents (snapshot no add)
- adicionado_em

Regras:
- Preço snapshot no add (atualiza ao reabrir carrinho se mudou)
- Quantidade ≤ estoque disponível na validação checkout

Relacionamentos:
- N:1 Carrinho
- N:1 Produto
- N:1 ProdutoVariacao

### Configuração

#### ConfiguracaoFrete
Regra de cálculo de frete.
Campos principais:
- id
- loja_id
- nome
- tipo (CORREIOS, TRANSPORTADORA, TABELA_PRECO, GRATIS_VALOR, GRATIS_REGIAO)
- configuracao (JSON: credenciais, tabelas, CEPs, UFs, valor mínimo)
- prioridade (int, menor = maior prioridade)
- ativo

Regras:
- Múltiplas regras, avaliadas por prioridade
- Primeira que匹配 retorna opções
- Frete grátis por valor mínimo ou região (UF)

Relacionamentos:
- N:1 Loja

#### ConfiguracaoPagamento
Credenciais e regras de gateway.
Campos principais:
- id
- loja_id
- gateway (MERCADO_PAGO, STRIPE, etc.)
- credenciais_criptografadas (JSON, AES-256, chave por loja)
- parcelamento_max (int, 1-12)
- juros_parcela (JSON: `{ "2": 2.99, "3": 4.99 }` percentual)
- ativo
- modo_teste (boolean)

Regras:
- Credenciais criptografadas (AES-256, chave derivada por loja)
- Um ativo por gateway por loja

Relacionamentos:
- N:1 Loja

#### TransportadoraRastreamento
Rastreamento de pedido via transportadora.
Campos principais:
- id
- pedido_id
- transportadora (CORREIOS, JADLOG, MELHOR_ENVIO, etc.)
- codigo_rastreamento
- url_rastreamento
- status_transportadora (normalizado: COLETADO, EM_TRANSITO, SAIU_ENTREGA, ENTREGUE, DEVOLVIDO, etc.)
- eventos (JSON array append-only: `{data, status, local, descricao}`)
- ultima_atualizacao
- webhook_recebido_em

Regras:
- Atualizado por webhook (HMAC) ou polling (job)
- Eventos imutáveis (append-only)
- Notifica cliente a cada mudança de status relevante

Relacionamentos:
- N:1 Pedido

### Visões derivadas (read-only, materialized views)

#### DashboardVendasDiario
Objetivo: KPIs de vendas por dia para gestores.
Origem: Pedido (status PAGO/ENTREGUE) + ItemPedido + Produto.
Campos: data, loja_id, pedidos_count, itens_count, receita_bruta_cents, desconto_cents, frete_cents, receita_liquida_cents, ticket_medio_cents, conversao_pct.
Finalidade: Gráfico de linha, comparativo YoY/MoM, ticket médio, conversão.

#### RelatorioProdutosMaisVendidos
Objetivo: Top produtos por quantidade/faturamento.
Origem: ItemPedido (pedidos PAGO/ENTREGUE) + Produto + ProdutoVariacao.
Campos: periodo_inicio, periodo_fim, produto_id, variacao_id, nome, sku, quantidade_total, receita_total_cents, margem_media_pct.
Finalidade: Reposição, marketing, precificação.

#### RelatorioEstoqueBaixo
Objetivo: Alertas de reposição.
Origem: Estoque (disponivel <= minima) + ProdutoVariacao + Produto + Deposito.
Campos: loja_id, deposito_id, variacao_id, sku, nome, quantidade_fisica, quantidade_reservada, disponivel, minima, dias_estimados (base vendas médias).
Finalidade: Compras, estoquista.

#### ConciliacaoFinanceira
Objetivo: Conferir recebíveis vs gateway.
Origem: Pagamento (APROVADO) + gateway extrato (API/webhook log).
Campos: data, gateway, metodo, esperado_count, confirmado_count, divergente_count, valor_esperado_cents, valor_confirmado_cents, divergencias (JSON).
Finalidade: Financeiro, auditoria.

## Relações de alto nível
- Loja 1:N UsuarioPerfil, Produto, Categoria, Pedido, ConfiguracaoFrete, ConfiguracaoPagamento, Cupom, Deposito, Estoque
- Usuario N:M Perfil (via UsuarioPerfil) | 1:N Endereco, Pedido, Avaliacao, Favorito, Carrinho
- Categoria 1:N Categoria (filhas) | 1:N Produto
- Produto 1:N ProdutoVariacao, ProdutoImagem, Avaliacao, ItemCarrinho, ItemPedido, EstoqueMovimento
- ProdutoVariacao 1:N ProdutoVariacaoAtributo, Estoque, ItemCarrinho, ItemPedido, EstoqueMovimento
- Pedido 1:N ItemPedido, Pagamento, PedidoEvento, NotaFiscal, TransportadoraRastreamento
- Estoque N:1 Deposito, ProdutoVariacao | 1:N EstoqueMovimento
- Cupom 1:N Pedido

## Observações de domínio
Este documento representa o domínio funcional consolidado do sistema. Permitir refinamentos técnicos futuros (tipos, índices, particionamento, RLS policies) sem alterar a modelagem funcional definida aqui.