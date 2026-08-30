-- CreateTable
CREATE TABLE "ReportSchedule" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_uuid(),
    "loja_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "email_destino" TEXT NOT NULL,
    "frequencia" TEXT NOT NULL,
    "hora" INTEGER NOT NULL DEFAULT 6,
    "dia_semana" INTEGER,
    "dia_mes" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_envio_em" TIMESTAMP(3),
    "proximo_envio_em" TIMESTAMP(3),
    "criado_por" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportSchedule_loja_id_idx" ON "ReportSchedule"("loja_id");
CREATE INDEX "ReportSchedule_ativo_proximo_envio_em_idx" ON "ReportSchedule"("ativo","proximo_envio_em");

-- AddForeignKey
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "Loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Relatórios: materialized views (Fase 3.3)
-- Snapshot diário de vendas por loja (pedidos PAGO/ENVIADO/ENTREGUE)
CREATE MATERIALIZED VIEW "mv_vendas_diario" AS
SELECT
  date_trunc('day', p."created_at")::date AS "data",
  p."loja_id" AS "loja_id",
  COUNT(DISTINCT p."id")::int AS "pedidos_count",
  COALESCE(SUM(ip."quantidade"), 0)::int AS "itens_count",
  COALESCE(SUM(p."subtotal_cents"), 0)::bigint AS "receita_bruta_cents",
  COALESCE(SUM(p."desconto_cents"), 0)::bigint AS "desconto_cents",
  COALESCE(SUM(p."frete_cents"), 0)::bigint AS "frete_cents",
  COALESCE(SUM(p."total_cents"), 0)::bigint AS "receita_liquida_cents",
  CASE
    WHEN COUNT(DISTINCT p."id") > 0 THEN (COALESCE(SUM(p."total_cents"), 0) / COUNT(DISTINCT p."id"))::bigint
    ELSE 0
  END AS "ticket_medio_cents"
FROM "Pedido" p
LEFT JOIN "ItemPedido" ip ON ip."pedido_id" = p."id"
WHERE p."status" IN ('PAGO', 'ENVIADO', 'ENTREGUE')
GROUP BY date_trunc('day', p."created_at"), p."loja_id";

-- Snapshot diário de itens vendidos por produto/variação (permite agregar por período)
CREATE MATERIALIZED VIEW "mv_produtos_top" AS
SELECT
  date_trunc('day', p."created_at")::date AS "data",
  p."loja_id" AS "loja_id",
  ip."produto_id" AS "produto_id",
  ip."variacao_id" AS "variacao_id",
  ip."nome_produto" AS "nome",
  ip."sku" AS "sku",
  SUM(ip."quantidade")::int AS "quantidade_total",
  COALESCE(SUM(ip."total_cents"), 0)::bigint AS "receita_total_cents"
FROM "ItemPedido" ip
JOIN "Pedido" p ON p."id" = ip."pedido_id"
WHERE p."status" IN ('PAGO', 'ENVIADO', 'ENTREGUE')
GROUP BY date_trunc('day', p."created_at"), p."loja_id", ip."produto_id", ip."variacao_id", ip."nome_produto", ip."sku";

-- Alerta de estoque baixo (disponível <= mínimo)
CREATE MATERIALIZED VIEW "mv_relatorio_estoque_baixo" AS
SELECT
  e."loja_id" AS "loja_id",
  e."deposito_id" AS "deposito_id",
  e."variacao_id" AS "variacao_id",
  v."sku" AS "sku",
  v."nome" AS "nome",
  e."quantidade_fisica"::int AS "quantidade_fisica",
  e."quantidade_reservada"::int AS "quantidade_reservada",
  (e."quantidade_fisica" - e."quantidade_reservada")::int AS "disponivel",
  e."quantidade_minima"::int AS "minima"
FROM "Estoque" e
JOIN "ProdutoVariacao" v ON v."id" = e."variacao_id"
WHERE (e."quantidade_fisica" - e."quantidade_reservada") <= e."quantidade_minima";

-- Conciliação financeira por dia/gateway (aprovados)
CREATE MATERIALIZED VIEW "mv_conciliacao_financeira" AS
SELECT
  date_trunc('day', pg."aprovado_em")::date AS "data",
  p."loja_id" AS "loja_id",
  pg."gateway" AS "gateway",
  pg."metodo" AS "metodo",
  COUNT(pg."id")::int AS "esperado_count",
  COUNT(pg."id") FILTER (WHERE pg."status" = 'APROVADO')::int AS "confirmado_count",
  COUNT(pg."id") FILTER (WHERE pg."status" <> 'APROVADO')::int AS "divergente_count",
  COALESCE(SUM(pg."valor_cents"), 0)::bigint AS "valor_esperado_cents",
  COALESCE(SUM(pg."valor_cents") FILTER (WHERE pg."status" = 'APROVADO'), 0)::bigint AS "valor_confirmado_cents"
FROM "Pagamento" pg
JOIN "Pedido" p ON p."id" = pg."pedido_id"
WHERE pg."aprovado_em" IS NOT NULL
GROUP BY date_trunc('day', pg."aprovado_em"), p."loja_id", pg."gateway", pg."metodo";

CREATE OR REPLACE FUNCTION "refresh_relatorios"() RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW "mv_vendas_diario";
  REFRESH MATERIALIZED VIEW "mv_produtos_top";
  REFRESH MATERIALIZED VIEW "mv_relatorio_estoque_baixo";
  REFRESH MATERIALIZED VIEW "mv_conciliacao_financeira";
END;
$$;
