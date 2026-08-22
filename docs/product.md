# Visão de Produto Inicial - NextCommerce
Plataforma SaaS de e-commerce que resolve a fragmentação de pequenos lojistas entre Instagram, WhatsApp, marketplaces e planilhas, centralizando catálogo, pedidos, estoque, pagamentos e gestão em uma única solução própria.

## Funcionalidades esperadas
- Login (autenticação multi-perfil, MFA opcional)
- Catálogo de produtos com variações (SKU por variação)
- Busca full-text e filtros por atributos
- Carrinho persistente (server + localStorage otimista)
- Favoritos (wishlist) por cliente
- Checkout single-page com cupom, frete, endereço
- Pagamentos: PIX (QR code 15min), cartão (3DS), boleto (D+1)
- Gestão de pedidos: timeline, status, NF-e, rastreamento
- Estoque: multi-depósito, reserva atômica, alertas, inventário
- Dashboard executivo: vendas, ticket médio, conversão, abandono
- Relatórios: produtos mais vendidos, estoque baixo, conciliação financeira
- Avaliações: apenas compradores verificados (pedido entregue)
- Configurações: loja, frete, pagamentos, cupons, e-mails, integrações

## Módulos esperados

### Identidade e Acesso
Autenticação (Supabase Auth), autorização RBAC granular, perfis de sistema imutáveis, convite de usuários, recuperação de senha, verificação de e-mail.

### Vitrine e Catálogo
Produtos ativos visíveis, busca textual, filtros por categoria/preço/atributos/disponibilidade, paginação cursor-based, detalhes com galeria, avaliações, favoritos.

### Carrinho e Checkout
Carrinho server-side com sincronismo localStorage, sessão 24h, cupom (validação: código, data, valor mínimo, uso total, uso por cliente, escopo), frete (consulta CEP → opções com prazo/valor/transportadora), endereços salvos, checkout single-page.

### Pagamentos
Integração assíncrona via webhooks, idempotência obrigatória, PIX (QR code expiração 15min), cartão (tokenização, 3DS), boleto (vencimento D+1), conciliação diária automática + manual, estorno/reembolso.

### Pedidos
Criação atômica (pedido + itens + reserva estoque + pagamento pendente), timeline de eventos, transições de status controladas, cancelamento (devolve estoque + estorna se pago), NF-e automática no envio, rastreamento via webhook transportadora.

### Estoque
SKU = variação única, quantidade disponível = física - reservada, reserva otimista com retry no checkout, entradas (compra, devolução, ajuste), saídas (venda, perda, doação, ajuste), transferência entre depósitos, alerta quantidade ≤ mínima, inventário com ajuste de divergência.

### Dashboard e Relatórios
KPIs tempo real (vendas dia/mês, ticket médio, conversão, carrinho abandonado), filtros (período, canal, categoria), exportação CSV/PDF, agendamento de relatórios recorrentes por e-mail.

### Configurações
Loja (nome, logo, cores, domínio customizado, SEO, redes sociais), frete (Correios, transportadoras, tabela preço, grátis por valor/região), pagamentos (credenciais criptografadas, parcelamento, juros), cupons (%/valor fixo, primeira compra, categoria/produto), e-mails (templates transacionais), integrações (API keys, webhooks).

## Visão funcional
O lojista configura a loja, cadastra produtos com variações e estoque, define regras de frete/pagamento e começa a vender. O cliente navega, adiciona ao carrinho, aplica cupom, escolhe frete e paga. O pedido entra no fluxo operacional: separação pelo estoquista, emissão de NF-e, envio com rastreamento. Gestores acompanham dashboards em tempo real. Financeiro concilia pagamentos e emite relatórios.

## Fluxos macro
1. **Compra**: Cliente → vitrine → carrinho → checkout (cupom + frete) → pagamento → pedido criado + estoque reservado
2. **Operação**: Pagamento aprovado → notificação equipe → estoquista separa → NF-e emitida → etiqueta impressa → transportadora coleta
3. **Pós-venda**: Entregue → cliente avalia → financeiro concilia → gestor analisa KPIs
4. **Gestão**: Admin configura → operador cadastra produtos → estoquista recebe mercadoria → financeiro acompanha fluxo de caixa

## Capacidades esperadas
- Loja online visual profissional (referências: Shopify, Linear, Apple, Vercel, Stripe)
- Checkout rápido, sem fricção, múltiplas formas de pagamento
- Performance alta (Next.js App Router, edge, cache inteligente, ISR)
- Estoque tempo real com reserva atômica no checkout
- Dashboard executivo com KPIs acionáveis
- Relatórios fiscais e gerenciais exportáveis
- Multi-perfil RBAC granular
- Integrações nativas: pagamentos, frete, NF-e, e-mail transacional
- Escalabilidade horizontal (pequeno → médio lojista sem migração)