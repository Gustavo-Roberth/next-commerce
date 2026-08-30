-- CreateEnum
CREATE TYPE "IntegracaoTipo" AS ENUM ('CORREIOS', 'MERCADO_LIVRE', 'MELHOR_ENVIO', 'CUSTOM');

-- CreateTable EmailTemplate
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo_mjml" TEXT NOT NULL,
    "variaveis" JSONB NOT NULL DEFAULT '[]',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable Integracao
CREATE TABLE "Integracao" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "tipo" "IntegracaoTipo" NOT NULL,
    "nome" TEXT NOT NULL,
    "credenciais_criptografadas" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Integracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_loja_id_codigo_key" ON "EmailTemplate"("loja_id","codigo");
CREATE INDEX "EmailTemplate_loja_id_idx" ON "EmailTemplate"("loja_id");
CREATE INDEX "EmailTemplate_codigo_idx" ON "EmailTemplate"("codigo");
CREATE INDEX "EmailTemplate_ativo_idx" ON "EmailTemplate"("ativo");
CREATE INDEX "Integracao_loja_id_idx" ON "Integracao"("loja_id");
CREATE INDEX "Integracao_tipo_idx" ON "Integracao"("tipo");
CREATE INDEX "Integracao_ativo_idx" ON "Integracao"("ativo");

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Integracao" ADD CONSTRAINT "Integracao_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
