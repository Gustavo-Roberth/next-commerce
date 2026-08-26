-- Função auxiliar para o default uuid() do Prisma.
-- PostgreSQL 13+ já expõe gen_random_uuid() em core (sem extensões).
CREATE OR REPLACE FUNCTION uuid_generate_uuid() RETURNS uuid
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT gen_random_uuid();
$$;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GESTOR', 'OPERADOR', 'ESTOQUISTA', 'CLIENTE');

-- CreateEnum
CREATE TYPE "PerfilCodigo" AS ENUM ('ADMIN', 'GESTOR', 'OPERADOR', 'ESTOQUISTA', 'CLIENTE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CRIADO', 'PAGAMENTO_PENDENTE', 'PAGO', 'SEPARANDO', 'ENVIADO', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INICIADO', 'PROCESSANDO', 'APROVADO', 'RECUSADO', 'EXPIRADO', 'ESTORNADO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('MERCADO_PAGO', 'STRIPE', 'PIX_GATEWAY', 'BOLETO_GATEWAY');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('RASCUNHO', 'ATIVO', 'INATIVO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ATIVA', 'INATIVA');

-- CreateEnum
CREATE TYPE "CupomStatus" AS ENUM ('ATIVO', 'EXPIRADO', 'ESGOTADO', 'DESATIVADO');

-- CreateEnum
CREATE TYPE "CupomType" AS ENUM ('PERCENTUAL', 'VALOR_FIXO', 'FRETE_GRATIS');

-- CreateEnum
CREATE TYPE "EnderecoTipo" AS ENUM ('ENTREGA', 'COBRANCA', 'RETIRADA');

-- CreateEnum
CREATE TYPE "EstoqueMovimentoTipo" AS ENUM ('ENTRADA_COMPRA', 'ENTRADA_DEVOLUCAO', 'ENTRADA_AJUSTE', 'SAIDA_VENDA', 'SAIDA_PERDA', 'SAIDA_DOACAO', 'SAIDA_AJUSTE', 'TRANSFERENCIA_SAIDA', 'TRANSFERENCIA_ENTRADA', 'RESERVA', 'LIBERACAO_RESERVA');

-- CreateEnum
CREATE TYPE "EstoqueReferenciaTipo" AS ENUM ('PEDIDO', 'NOTA_COMPRA', 'AJUSTE', 'INVENTARIO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "ProdutoAtributoTipo" AS ENUM ('COR', 'TAMANHO', 'VOLTAGEM', 'PERSONALIZADO');

-- CreateEnum
CREATE TYPE "FreteTipo" AS ENUM ('CORREIOS', 'TRANSPORTADORA', 'TABELA_PRECO', 'GRATIS_VALOR', 'GRATIS_REGIAO');

-- CreateEnum
CREATE TYPE "Transportadora" AS ENUM ('CORREIOS', 'JADLOG', 'MELHOR_ENVIO');

-- CreateEnum
CREATE TYPE "RastreamentoStatus" AS ENUM ('COLETADO', 'EM_TRANSITO', 'SAIU_ENTREGA', 'ENTREGUE', 'DEVOLVIDO');

-- CreateEnum
CREATE TYPE "AvaliacaoStatus" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');

-- CreateEnum
CREATE TYPE "WebhookEventType" AS ENUM ('PAYMENT_APPROVED', 'PAYMENT_EXPIRED', 'PAYMENT_REJECTED', 'SHIPPING_UPDATE');

-- CreateEnum
CREATE TYPE "IdempotencyKeyScope" AS ENUM ('PAYMENT', 'ORDER', 'WEBHOOK');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "email" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "telefone" TEXT,
    "cpf_cnpj" TEXT,
    "avatar_url" TEXT,
    "senha_hash" TEXT NOT NULL,
    "ultimo_login_em" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "email_verificado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perfil" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "codigo" "PerfilCodigo" NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "permissoes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioPerfil" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "usuario_id" TEXT NOT NULL,
    "perfil_id" TEXT NOT NULL,
    "loja_id" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "atribuido_por_id" TEXT,
    "atribuido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "UsuarioPerfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loja" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "dominio_customizado" TEXT,
    "logo_url" TEXT,
    "cores_tema" JSONB NOT NULL DEFAULT '{}',
    "configuracoes_seo" JSONB NOT NULL DEFAULT '{}',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "plano_id" TEXT,
    "trial_ate" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "imagem_url" TEXT,
    "pai_id" TEXT,
    "ordem_exibicao" INTEGER NOT NULL DEFAULT 0,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endereco" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "usuario_id" TEXT NOT NULL,
    "tipo" "EnderecoTipo" NOT NULL,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "pais" TEXT NOT NULL DEFAULT 'BRA',
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "apelido" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao_curta" TEXT,
    "descricao_completa" TEXT,
    "sku" TEXT NOT NULL,
    "codigo_barras" TEXT,
    "ncm" TEXT,
    "cest" TEXT,
    "origem_mercadoria" INTEGER,
    "peso_bruto_kg" DECIMAL(10,3),
    "peso_liquido_kg" DECIMAL(10,3),
    "dimensoes_cm" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "permite_avaliacao" BOOLEAN NOT NULL DEFAULT true,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "publicado_em" TIMESTAMP(3),
    "status" "ProductStatus" NOT NULL DEFAULT 'RASCUNHO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoVariacao" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "produto_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo_barras" TEXT,
    "preco_cents" INTEGER,
    "custo_cents" INTEGER,
    "peso_bruto_kg" DECIMAL(10,3),
    "peso_liquido_kg" DECIMAL(10,3),
    "dimensoes_cm" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem_exibicao" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ProdutoVariacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoAtributo" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "ProdutoAtributoTipo" NOT NULL,
    "valores" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ProdutoAtributo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoVariacaoAtributo" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "variacao_id" TEXT NOT NULL,
    "atributo_id" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProdutoVariacaoAtributo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoImagem" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "produto_id" TEXT NOT NULL,
    "variacao_id" TEXT,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProdutoImagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "numero_sequencial" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CRIADO',
    "subtotal_cents" INTEGER NOT NULL,
    "desconto_cents" INTEGER NOT NULL DEFAULT 0,
    "frete_cents" INTEGER NOT NULL DEFAULT 0,
    "total_cents" INTEGER NOT NULL,
    "cupom_id" TEXT,
    "endereco_entrega_id" TEXT NOT NULL,
    "endereco_cobranca_id" TEXT NOT NULL,
    "observacoes_cliente" TEXT,
    "observacoes_internas" TEXT,
    "pago_em" TIMESTAMP(3),
    "enviado_em" TIMESTAMP(3),
    "entregue_em" TIMESTAMP(3),
    "cancelado_em" TIMESTAMP(3),
    "cancelamento_motivo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "pedido_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "variacao_id" TEXT NOT NULL,
    "nome_produto" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario_cents" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "pedido_id" TEXT NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "metodo" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INICIADO',
    "valor_cents" INTEGER NOT NULL,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "juros_cents" INTEGER NOT NULL DEFAULT 0,
    "idempotency_key" TEXT NOT NULL,
    "gateway_transaction_id" TEXT,
    "gateway_response" JSONB,
    "webhook_received_at" TIMESTAMP(3),
    "aprovado_em" TIMESTAMP(3),
    "estornado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagamentoEvento" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "pagamento_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "gateway_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagamentoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cupom" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "CupomType" NOT NULL,
    "valor" INTEGER NOT NULL,
    "valor_minimo_pedido_cents" INTEGER,
    "uso_maximo_total" INTEGER,
    "uso_maximo_por_cliente" INTEGER,
    "uso_atual" INTEGER NOT NULL DEFAULT 0,
    "valido_de" TIMESTAMP(3) NOT NULL,
    "valido_ate" TIMESTAMP(3) NOT NULL,
    "categorias_aplicaveis" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "produtos_aplicaveis" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primeira_compra_only" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "status" "CupomStatus" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Cupom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estoque" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "variacao_id" TEXT NOT NULL,
    "deposito_id" TEXT NOT NULL,
    "quantidade_fisica" INTEGER NOT NULL DEFAULT 0,
    "quantidade_reservada" INTEGER NOT NULL DEFAULT 0,
    "quantidade_minima" INTEGER NOT NULL DEFAULT 0,
    "quantidade_maxima" INTEGER,
    "custo_medio_cents" INTEGER NOT NULL DEFAULT 0,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposito" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "endereco_completo" TEXT NOT NULL,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Deposito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstoqueMovimento" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "variacao_id" TEXT NOT NULL,
    "deposito_id" TEXT NOT NULL,
    "tipo" "EstoqueMovimentoTipo" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "custo_unitario_cents" INTEGER,
    "referencia_tipo" "EstoqueReferenciaTipo" NOT NULL,
    "referencia_id" TEXT,
    "usuario_id" TEXT,
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstoqueMovimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "titulo" TEXT,
    "comentario" TEXT,
    "imagens_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verificada" BOOLEAN NOT NULL DEFAULT false,
    "aprovada" BOOLEAN NOT NULL DEFAULT false,
    "publicada_em" TIMESTAMP(3),
    "status" "AvaliacaoStatus" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "cliente_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "variacao_id" TEXT,
    "loja_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrinho" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "cliente_id" TEXT,
    "sessao_id" TEXT,
    "loja_id" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrinho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCarrinho" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "carrinho_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "variacao_id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario_cents" INTEGER NOT NULL,
    "adicionado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCarrinho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoFrete" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "FreteTipo" NOT NULL,
    "configuracao" JSONB NOT NULL,
    "prioridade" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ConfiguracaoFrete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoPagamento" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "credenciais_criptografadas" TEXT NOT NULL,
    "parcelamento_max" INTEGER NOT NULL DEFAULT 12,
    "juros_parcela" JSONB NOT NULL DEFAULT '{}',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "modo_teste" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ConfiguracaoPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportadoraRastreamento" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "pedido_id" TEXT NOT NULL,
    "transportadora" "Transportadora" NOT NULL,
    "codigo_rastreamento" TEXT NOT NULL,
    "url_rastreamento" TEXT,
    "status_transportadora" "RastreamentoStatus" NOT NULL,
    "eventos" JSONB NOT NULL DEFAULT '[]',
    "ultima_atualizacao" TIMESTAMP(3),
    "webhook_recebido_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportadoraRastreamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoEvento" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "pedido_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "usuario_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaFiscal" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "pedido_id" TEXT NOT NULL,
    "numero" TEXT,
    "serie" TEXT,
    "chave_acesso" TEXT,
    "xml_url" TEXT,
    "pdf_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "emitida_em" TIMESTAMP(3),
    "autorizada_em" TIMESTAMP(3),
    "cancelada_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotaFiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "event_type" "WebhookEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "scope" "IdempotencyKeyScope" NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "usuario_id" TEXT,
    "loja_id" TEXT,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDlq" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "event_type" "WebhookEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "scope" "IdempotencyKeyScope" NOT NULL,
    "error" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "last_attempt_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDlq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "usuario_id" TEXT,
    "loja_id" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT,
    "antes" JSONB,
    "depois" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cpf_cnpj_key" ON "Usuario"("cpf_cnpj");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_cpf_cnpj_idx" ON "Usuario"("cpf_cnpj");

-- CreateIndex
CREATE INDEX "Usuario_ativo_idx" ON "Usuario"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_codigo_key" ON "Perfil"("codigo");

-- CreateIndex
CREATE INDEX "Perfil_codigo_idx" ON "Perfil"("codigo");

-- CreateIndex
CREATE INDEX "UsuarioPerfil_usuario_id_idx" ON "UsuarioPerfil"("usuario_id");

-- CreateIndex
CREATE INDEX "UsuarioPerfil_loja_id_idx" ON "UsuarioPerfil"("loja_id");

-- CreateIndex
CREATE INDEX "UsuarioPerfil_perfil_id_idx" ON "UsuarioPerfil"("perfil_id");

-- CreateIndex
CREATE INDEX "UsuarioPerfil_ativo_idx" ON "UsuarioPerfil"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioPerfil_usuario_id_perfil_id_loja_id_key" ON "UsuarioPerfil"("usuario_id", "perfil_id", "loja_id");

-- CreateIndex
CREATE UNIQUE INDEX "Loja_slug_key" ON "Loja"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Loja_dominio_customizado_key" ON "Loja"("dominio_customizado");

-- CreateIndex
CREATE INDEX "Loja_slug_idx" ON "Loja"("slug");

-- CreateIndex
CREATE INDEX "Loja_ativa_idx" ON "Loja"("ativa");

-- CreateIndex
CREATE INDEX "Categoria_loja_id_idx" ON "Categoria"("loja_id");

-- CreateIndex
CREATE INDEX "Categoria_pai_id_idx" ON "Categoria"("pai_id");

-- CreateIndex
CREATE INDEX "Categoria_ativa_idx" ON "Categoria"("ativa");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_loja_id_slug_key" ON "Categoria"("loja_id", "slug");

-- CreateIndex
CREATE INDEX "Endereco_usuario_id_idx" ON "Endereco"("usuario_id");

-- CreateIndex
CREATE INDEX "Endereco_cep_idx" ON "Endereco"("cep");

-- CreateIndex
CREATE INDEX "Endereco_tipo_idx" ON "Endereco"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_codigo_barras_key" ON "Produto"("codigo_barras");

-- CreateIndex
CREATE INDEX "Produto_loja_id_idx" ON "Produto"("loja_id");

-- CreateIndex
CREATE INDEX "Produto_categoria_id_idx" ON "Produto"("categoria_id");

-- CreateIndex
CREATE INDEX "Produto_ativo_idx" ON "Produto"("ativo");

-- CreateIndex
CREATE INDEX "Produto_status_idx" ON "Produto"("status");

-- CreateIndex
CREATE INDEX "Produto_destaque_idx" ON "Produto"("destaque");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_loja_id_sku_key" ON "Produto"("loja_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_loja_id_slug_key" ON "Produto"("loja_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProdutoVariacao_codigo_barras_key" ON "ProdutoVariacao"("codigo_barras");

-- CreateIndex
CREATE INDEX "ProdutoVariacao_produto_id_idx" ON "ProdutoVariacao"("produto_id");

-- CreateIndex
CREATE INDEX "ProdutoVariacao_sku_idx" ON "ProdutoVariacao"("sku");

-- CreateIndex
CREATE INDEX "ProdutoVariacao_ativo_idx" ON "ProdutoVariacao"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "ProdutoVariacao_produto_id_sku_key" ON "ProdutoVariacao"("produto_id", "sku");

-- CreateIndex
CREATE INDEX "ProdutoAtributo_loja_id_idx" ON "ProdutoAtributo"("loja_id");

-- CreateIndex
CREATE INDEX "ProdutoVariacaoAtributo_variacao_id_idx" ON "ProdutoVariacaoAtributo"("variacao_id");

-- CreateIndex
CREATE INDEX "ProdutoVariacaoAtributo_atributo_id_idx" ON "ProdutoVariacaoAtributo"("atributo_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProdutoVariacaoAtributo_variacao_id_atributo_id_key" ON "ProdutoVariacaoAtributo"("variacao_id", "atributo_id");

-- CreateIndex
CREATE INDEX "ProdutoImagem_produto_id_idx" ON "ProdutoImagem"("produto_id");

-- CreateIndex
CREATE INDEX "ProdutoImagem_variacao_id_idx" ON "ProdutoImagem"("variacao_id");

-- CreateIndex
CREATE INDEX "ProdutoImagem_principal_idx" ON "ProdutoImagem"("principal");

-- CreateIndex
CREATE INDEX "Pedido_loja_id_idx" ON "Pedido"("loja_id");

-- CreateIndex
CREATE INDEX "Pedido_cliente_id_idx" ON "Pedido"("cliente_id");

-- CreateIndex
CREATE INDEX "Pedido_status_idx" ON "Pedido"("status");

-- CreateIndex
CREATE INDEX "Pedido_created_at_idx" ON "Pedido"("created_at");

-- CreateIndex
CREATE INDEX "Pedido_cupom_id_idx" ON "Pedido"("cupom_id");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_loja_id_numero_sequencial_key" ON "Pedido"("loja_id", "numero_sequencial");

-- CreateIndex
CREATE INDEX "ItemPedido_pedido_id_idx" ON "ItemPedido"("pedido_id");

-- CreateIndex
CREATE INDEX "ItemPedido_produto_id_idx" ON "ItemPedido"("produto_id");

-- CreateIndex
CREATE INDEX "ItemPedido_variacao_id_idx" ON "ItemPedido"("variacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_idempotency_key_key" ON "Pagamento"("idempotency_key");

-- CreateIndex
CREATE INDEX "Pagamento_pedido_id_idx" ON "Pagamento"("pedido_id");

-- CreateIndex
CREATE INDEX "Pagamento_status_idx" ON "Pagamento"("status");

-- CreateIndex
CREATE INDEX "Pagamento_gateway_idx" ON "Pagamento"("gateway");

-- CreateIndex
CREATE INDEX "Pagamento_idempotency_key_idx" ON "Pagamento"("idempotency_key");

-- CreateIndex
CREATE INDEX "Pagamento_created_at_idx" ON "Pagamento"("created_at");

-- CreateIndex
CREATE INDEX "PagamentoEvento_pagamento_id_idx" ON "PagamentoEvento"("pagamento_id");

-- CreateIndex
CREATE INDEX "PagamentoEvento_tipo_idx" ON "PagamentoEvento"("tipo");

-- CreateIndex
CREATE INDEX "Cupom_loja_id_idx" ON "Cupom"("loja_id");

-- CreateIndex
CREATE INDEX "Cupom_codigo_idx" ON "Cupom"("codigo");

-- CreateIndex
CREATE INDEX "Cupom_ativo_idx" ON "Cupom"("ativo");

-- CreateIndex
CREATE INDEX "Cupom_status_idx" ON "Cupom"("status");

-- CreateIndex
CREATE INDEX "Cupom_valido_de_valido_ate_idx" ON "Cupom"("valido_de", "valido_ate");

-- CreateIndex
CREATE UNIQUE INDEX "Cupom_loja_id_codigo_key" ON "Cupom"("loja_id", "codigo");

-- CreateIndex
CREATE INDEX "Estoque_loja_id_idx" ON "Estoque"("loja_id");

-- CreateIndex
CREATE INDEX "Estoque_variacao_id_idx" ON "Estoque"("variacao_id");

-- CreateIndex
CREATE INDEX "Estoque_deposito_id_idx" ON "Estoque"("deposito_id");

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_variacao_id_deposito_id_key" ON "Estoque"("variacao_id", "deposito_id");

-- CreateIndex
CREATE INDEX "Deposito_loja_id_idx" ON "Deposito"("loja_id");

-- CreateIndex
CREATE INDEX "Deposito_padrao_idx" ON "Deposito"("padrao");

-- CreateIndex
CREATE INDEX "Deposito_ativo_idx" ON "Deposito"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Deposito_loja_id_codigo_key" ON "Deposito"("loja_id", "codigo");

-- CreateIndex
CREATE INDEX "EstoqueMovimento_loja_id_idx" ON "EstoqueMovimento"("loja_id");

-- CreateIndex
CREATE INDEX "EstoqueMovimento_variacao_id_idx" ON "EstoqueMovimento"("variacao_id");

-- CreateIndex
CREATE INDEX "EstoqueMovimento_deposito_id_idx" ON "EstoqueMovimento"("deposito_id");

-- CreateIndex
CREATE INDEX "EstoqueMovimento_tipo_idx" ON "EstoqueMovimento"("tipo");

-- CreateIndex
CREATE INDEX "EstoqueMovimento_referencia_tipo_referencia_id_idx" ON "EstoqueMovimento"("referencia_tipo", "referencia_id");

-- CreateIndex
CREATE INDEX "EstoqueMovimento_created_at_idx" ON "EstoqueMovimento"("created_at");

-- CreateIndex
CREATE INDEX "EstoqueMovimento_usuario_id_idx" ON "EstoqueMovimento"("usuario_id");

-- CreateIndex
CREATE INDEX "Avaliacao_loja_id_idx" ON "Avaliacao"("loja_id");

-- CreateIndex
CREATE INDEX "Avaliacao_produto_id_idx" ON "Avaliacao"("produto_id");

-- CreateIndex
CREATE INDEX "Avaliacao_cliente_id_idx" ON "Avaliacao"("cliente_id");

-- CreateIndex
CREATE INDEX "Avaliacao_status_idx" ON "Avaliacao"("status");

-- CreateIndex
CREATE INDEX "Avaliacao_verificada_idx" ON "Avaliacao"("verificada");

-- CreateIndex
CREATE INDEX "Avaliacao_aprovada_idx" ON "Avaliacao"("aprovada");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_cliente_id_produto_id_pedido_id_key" ON "Avaliacao"("cliente_id", "produto_id", "pedido_id");

-- CreateIndex
CREATE INDEX "Favorito_cliente_id_idx" ON "Favorito"("cliente_id");

-- CreateIndex
CREATE INDEX "Favorito_produto_id_idx" ON "Favorito"("produto_id");

-- CreateIndex
CREATE INDEX "Favorito_loja_id_idx" ON "Favorito"("loja_id");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_cliente_id_produto_id_variacao_id_key" ON "Favorito"("cliente_id", "produto_id", "variacao_id");

-- CreateIndex
CREATE INDEX "Carrinho_cliente_id_idx" ON "Carrinho"("cliente_id");

-- CreateIndex
CREATE INDEX "Carrinho_sessao_id_idx" ON "Carrinho"("sessao_id");

-- CreateIndex
CREATE INDEX "Carrinho_loja_id_idx" ON "Carrinho"("loja_id");

-- CreateIndex
CREATE INDEX "ItemCarrinho_carrinho_id_idx" ON "ItemCarrinho"("carrinho_id");

-- CreateIndex
CREATE INDEX "ItemCarrinho_produto_id_idx" ON "ItemCarrinho"("produto_id");

-- CreateIndex
CREATE INDEX "ItemCarrinho_variacao_id_idx" ON "ItemCarrinho"("variacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCarrinho_carrinho_id_produto_id_variacao_id_key" ON "ItemCarrinho"("carrinho_id", "produto_id", "variacao_id");

-- CreateIndex
CREATE INDEX "ConfiguracaoFrete_loja_id_idx" ON "ConfiguracaoFrete"("loja_id");

-- CreateIndex
CREATE INDEX "ConfiguracaoFrete_prioridade_idx" ON "ConfiguracaoFrete"("prioridade");

-- CreateIndex
CREATE INDEX "ConfiguracaoFrete_ativo_idx" ON "ConfiguracaoFrete"("ativo");

-- CreateIndex
CREATE INDEX "ConfiguracaoPagamento_loja_id_idx" ON "ConfiguracaoPagamento"("loja_id");

-- CreateIndex
CREATE INDEX "ConfiguracaoPagamento_gateway_idx" ON "ConfiguracaoPagamento"("gateway");

-- CreateIndex
CREATE INDEX "ConfiguracaoPagamento_ativo_idx" ON "ConfiguracaoPagamento"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoPagamento_loja_id_gateway_key" ON "ConfiguracaoPagamento"("loja_id", "gateway");

-- CreateIndex
CREATE UNIQUE INDEX "TransportadoraRastreamento_pedido_id_key" ON "TransportadoraRastreamento"("pedido_id");

-- CreateIndex
CREATE INDEX "TransportadoraRastreamento_transportadora_idx" ON "TransportadoraRastreamento"("transportadora");

-- CreateIndex
CREATE INDEX "TransportadoraRastreamento_codigo_rastreamento_idx" ON "TransportadoraRastreamento"("codigo_rastreamento");

-- CreateIndex
CREATE INDEX "TransportadoraRastreamento_status_transportadora_idx" ON "TransportadoraRastreamento"("status_transportadora");

-- CreateIndex
CREATE INDEX "PedidoEvento_pedido_id_idx" ON "PedidoEvento"("pedido_id");

-- CreateIndex
CREATE INDEX "PedidoEvento_tipo_idx" ON "PedidoEvento"("tipo");

-- CreateIndex
CREATE INDEX "PedidoEvento_created_at_idx" ON "PedidoEvento"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "NotaFiscal_pedido_id_key" ON "NotaFiscal"("pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "NotaFiscal_chave_acesso_key" ON "NotaFiscal"("chave_acesso");

-- CreateIndex
CREATE INDEX "NotaFiscal_pedido_id_idx" ON "NotaFiscal"("pedido_id");

-- CreateIndex
CREATE INDEX "NotaFiscal_chave_acesso_idx" ON "NotaFiscal"("chave_acesso");

-- CreateIndex
CREATE INDEX "NotaFiscal_status_idx" ON "NotaFiscal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_idempotency_key_key" ON "WebhookEvent"("idempotency_key");

-- CreateIndex
CREATE INDEX "WebhookEvent_event_type_idx" ON "WebhookEvent"("event_type");

-- CreateIndex
CREATE INDEX "WebhookEvent_scope_idx" ON "WebhookEvent"("scope");

-- CreateIndex
CREATE INDEX "WebhookEvent_processed_idx" ON "WebhookEvent"("processed");

-- CreateIndex
CREATE INDEX "WebhookEvent_idempotency_key_idx" ON "WebhookEvent"("idempotency_key");

-- CreateIndex
CREATE INDEX "WebhookEvent_created_at_idx" ON "WebhookEvent"("created_at");

-- CreateIndex
CREATE INDEX "WebhookEvent_usuario_id_idx" ON "WebhookEvent"("usuario_id");

-- CreateIndex
CREATE INDEX "WebhookEvent_loja_id_idx" ON "WebhookEvent"("loja_id");

-- CreateIndex
CREATE INDEX "WebhookDlq_event_type_idx" ON "WebhookDlq"("event_type");

-- CreateIndex
CREATE INDEX "WebhookDlq_scope_idx" ON "WebhookDlq"("scope");

-- CreateIndex
CREATE INDEX "WebhookDlq_created_at_idx" ON "WebhookDlq"("created_at");

-- CreateIndex
CREATE INDEX "AuditLog_usuario_id_idx" ON "AuditLog"("usuario_id");

-- CreateIndex
CREATE INDEX "AuditLog_loja_id_idx" ON "AuditLog"("loja_id");

-- CreateIndex
CREATE INDEX "AuditLog_acao_idx" ON "AuditLog"("acao");

-- CreateIndex
CREATE INDEX "AuditLog_entidade_idx" ON "AuditLog"("entidade");

-- CreateIndex
CREATE INDEX "AuditLog_entidade_id_idx" ON "AuditLog"("entidade_id");

-- CreateIndex
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");

-- AddForeignKey
ALTER TABLE "UsuarioPerfil" ADD CONSTRAINT "UsuarioPerfil_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPerfil" ADD CONSTRAINT "UsuarioPerfil_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "Perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPerfil" ADD CONSTRAINT "UsuarioPerfil_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPerfil" ADD CONSTRAINT "UsuarioPerfil_atribuido_por_id_fkey" FOREIGN KEY ("atribuido_por_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_pai_id_fkey" FOREIGN KEY ("pai_id") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoVariacao" ADD CONSTRAINT "ProdutoVariacao_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoAtributo" ADD CONSTRAINT "ProdutoAtributo_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoVariacaoAtributo" ADD CONSTRAINT "ProdutoVariacaoAtributo_variacao_id_fkey" FOREIGN KEY ("variacao_id") REFERENCES "ProdutoVariacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoVariacaoAtributo" ADD CONSTRAINT "ProdutoVariacaoAtributo_atributo_id_fkey" FOREIGN KEY ("atributo_id") REFERENCES "ProdutoAtributo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoImagem" ADD CONSTRAINT "ProdutoImagem_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoImagem" ADD CONSTRAINT "ProdutoImagem_variacao_id_fkey" FOREIGN KEY ("variacao_id") REFERENCES "ProdutoVariacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_cupom_id_fkey" FOREIGN KEY ("cupom_id") REFERENCES "Cupom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_endereco_entrega_id_fkey" FOREIGN KEY ("endereco_entrega_id") REFERENCES "Endereco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_endereco_cobranca_id_fkey" FOREIGN KEY ("endereco_cobranca_id") REFERENCES "Endereco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_variacao_id_fkey" FOREIGN KEY ("variacao_id") REFERENCES "ProdutoVariacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoEvento" ADD CONSTRAINT "PagamentoEvento_pagamento_id_fkey" FOREIGN KEY ("pagamento_id") REFERENCES "Pagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cupom" ADD CONSTRAINT "Cupom_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_variacao_id_fkey" FOREIGN KEY ("variacao_id") REFERENCES "ProdutoVariacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_deposito_id_fkey" FOREIGN KEY ("deposito_id") REFERENCES "Deposito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposito" ADD CONSTRAINT "Deposito_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_loja_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_variacao_fkey" FOREIGN KEY ("variacao_id") REFERENCES "ProdutoVariacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_deposito_fkey" FOREIGN KEY ("deposito_id") REFERENCES "Deposito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_estoque_fkey" FOREIGN KEY ("variacao_id", "deposito_id") REFERENCES "Estoque"("variacao_id", "deposito_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_deposito_origem_fkey" FOREIGN KEY ("deposito_id") REFERENCES "Deposito"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_deposito_destino_fkey" FOREIGN KEY ("deposito_id") REFERENCES "Deposito"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_produto_fkey" FOREIGN KEY ("variacao_id") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimento" ADD CONSTRAINT "EstoqueMovimento_usuario_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_variacao_id_fkey" FOREIGN KEY ("variacao_id") REFERENCES "ProdutoVariacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carrinho" ADD CONSTRAINT "Carrinho_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carrinho" ADD CONSTRAINT "Carrinho_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCarrinho" ADD CONSTRAINT "ItemCarrinho_carrinho_id_fkey" FOREIGN KEY ("carrinho_id") REFERENCES "Carrinho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCarrinho" ADD CONSTRAINT "ItemCarrinho_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCarrinho" ADD CONSTRAINT "ItemCarrinho_variacao_id_fkey" FOREIGN KEY ("variacao_id") REFERENCES "ProdutoVariacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoFrete" ADD CONSTRAINT "ConfiguracaoFrete_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoPagamento" ADD CONSTRAINT "ConfiguracaoPagamento_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportadoraRastreamento" ADD CONSTRAINT "TransportadoraRastreamento_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoEvento" ADD CONSTRAINT "PedidoEvento_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoEvento" ADD CONSTRAINT "PedidoEvento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscal" ADD CONSTRAINT "NotaFiscal_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

