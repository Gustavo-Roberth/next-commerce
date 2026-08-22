# Contexto Inicial do NextCommerce
## Visão geral do sistema
**NextCommerce** é um **SaaS** (Software as a Service) cujo objetivo principal é criar uma plataforma completa de vendas online com gestão de produtos, pedidos, estoque e pagamentos para pequenos lojistas que hoje dependem de Instagram, WhatsApp, Mercado Livre, planilhas e sistemas separados.

## Estrutura da solução
Projeto
├── apps/web
├── apps/api
└── packages/shared

Frontend e backend são partes de uma única solução, independentemente da estratégia física de repositórios. O código compartilhado (`packages/shared`) contém tipos, schemas Zod e contratos de API usados por ambos os apps. A comunicação ocorre via API REST.

## Problema que o sistema resolve
Pequenos lojistas precisam vender online sem depender exclusivamente de marketplaces e sem possuir sistemas integrados para pedidos, estoque e pagamentos.

**Situação atual:** Instagram, WhatsApp, Mercado Livre, Planilhas, Sistemas separados — gerando retrabalho, falta de centralização, controle precário e baixa visibilidade gerencial.

## Contexto operacional
O sistema atende um e-commerce B2C/B2B com necessidade de:
- Catálogo de produtos com busca e filtros
- Carrinho, favoritos, checkout com cupom
- Pagamentos integrados (PIX, cartão, boleto)
- Gestão de pedidos e estoque multi-depósito
- Dashboard e relatórios para gestores
- Avaliações de produtos
- Cálculo de frete (Correios, transportadoras, tabela própria)

Ambiente multi-perfil: clientes compram, estoquistas gerenciam inventário, administradores configuram a loja, financeiro acompanha faturamento, gestores analisam indicadores.

## Objetivos do produto
- Centralizar vendas online em plataforma própria
- Integrar catálogo, pedidos, estoque e pagamentos
- Eliminar dependência exclusiva de marketplaces
- Automatizar processos manuais (planilhas, WhatsApp)
- Fornecer visibilidade gerencial em tempo real
- Escalar operação do pequeno ao médio lojista sem migração

## Usuários e grupos macro
| Perfil | Descrição |
|--------|-----------|
| Cliente | Compra na loja, acompanha pedidos, avalia produtos, gerencia endereços |
| Estoquista | Gerencia estoque, entradas/saídas, inventário, separação de pedidos |
| Operador | Cadastra produtos, gerencia catálogo, processa pedidos |
| Gestor | Analisa dashboards, KPIs, relatórios, toma decisões estratégicas |
| Administrador | Configura loja, usuários, perfis, integrações, regras de negócio |

**Grupos de acesso:** Administrador, Gestor, Operador, Estoquista, Cliente

## Escopo geral
NextCommerce é um SaaS de e-commerce completo multi-tenant. Sua evolução seguirá a fase ativa definida em `/docs/phases.md`.