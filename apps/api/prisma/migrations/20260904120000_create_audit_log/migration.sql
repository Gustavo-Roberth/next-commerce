-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM (
    'PRECO_ALTERADO',
    'ESTOQUE_MOVIMENTADO',
    'PEDIDO_STATUS_ALTERADO',
    'USUARIO_ALTERADO',
    'PERFIL_ATRIBUIDO',
    'PERFIL_REMOVIDO',
    'PERFIL_ATUALIZADO'
);

-- CreateEnum
CREATE TYPE "AuditEntity" AS ENUM (
    'Produto',
    'ProdutoVariacao',
    'EstoqueMovimento',
    'Pedido',
    'Usuario',
    'UsuarioPerfil'
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID,
    "loja_id" UUID,
    "acao" "AuditAction" NOT NULL,
    "entidade" "AuditEntity" NOT NULL,
    "entidade_id" UUID,
    "antes" JSONB,
    "depois" JSONB,
    "ip" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_usuario_id_idx" ON "AuditLog"("usuario_id");
CREATE INDEX "AuditLog_loja_id_idx" ON "AuditLog"("loja_id");
CREATE INDEX "AuditLog_acao_idx" ON "AuditLog"("acao");
CREATE INDEX "AuditLog_entidade_idx" ON "AuditLog"("entidade");
CREATE INDEX "AuditLog_entidade_id_idx" ON "AuditLog"("entidade_id");
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE SET NULL ON UPDATE CASCADE;