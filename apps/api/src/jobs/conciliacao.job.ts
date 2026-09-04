import { prisma } from '../lib/prisma.js';
import { refreshRelatorios } from '../reports/repository.js';
import { registerJob } from './index.js';

interface ConciliacaoDivergencia {
  data: Date;
  loja_id: string;
  gateway: string;
  metodo: string;
  divergente_count: number;
  valor_divergente_cents: number;
}

async function buscarDivergencias(): Promise<ConciliacaoDivergencia[]> {
  const resultado = await prisma.$queryRawUnsafe<ConciliacaoDivergencia[]>(`
    SELECT
      "data",
      "loja_id",
      "gateway",
      "metodo",
      "divergente_count",
      ("valor_esperado_cents" - "valor_confirmado_cents")::bigint AS "valor_divergente_cents"
    FROM "mv_conciliacao_financeira"
    WHERE "divergente_count" > 0
    ORDER BY "data" DESC, "loja_id"
  `);

  return resultado.map((row) => ({
    ...row,
    valor_divergente_cents: Number(row.valor_divergente_cents),
  }));
}

async function registrarAlertaConciliacao(divergencias: ConciliacaoDivergencia[]): Promise<void> {
  if (divergencias.length === 0) return;

  for (const div of divergencias) {
    await prisma.pedidoEvento.create({
      data: {
        pedido_id: `conciliacao-${div.loja_id}-${div.data.toISOString().slice(0, 10)}`,
        tipo: 'ALERTA_CONCILIACAO',
        descricao: `Divergência em conciliação: ${div.divergente_count} pagamento(s) divergente(s) no gateway ${div.gateway}/${div.metodo} (R$ ${(div.valor_divergente_cents / 100).toFixed(2)})`,
        metadata: {
          gateway: div.gateway,
          metodo: div.metodo,
          divergente_count: div.divergente_count,
          valor_divergente_cents: div.valor_divergente_cents,
          data: div.data.toISOString().slice(0, 10),
        },
      },
    });
  }
}

async function executarConciliacaoDiaria(): Promise<void> {
  console.log('[Job:conciliacao-diaria] Iniciando conciliação diária...');

  await refreshRelatorios();
  console.log('[Job:conciliacao-diaria] Materialized views atualizadas');

  const divergencias = await buscarDivergencias();

  if (divergencias.length > 0) {
    console.log(`[Job:conciliacao-diaria] ${divergencias.length} divergência(s) encontrada(s)`);
    await registrarAlertaConciliacao(divergencias);
  } else {
    console.log('[Job:conciliacao-diaria] Nenhuma divergência encontrada');
  }

  console.log('[Job:conciliacao-diaria] Concluído');
}

registerJob({
  name: 'conciliacao-diaria',
  schedule: '0 2 * * *',
  handler: executarConciliacaoDiaria,
  enabledEnv: 'CONCILIACAO_JOB_ENABLED',
  timezone: 'America/Sao_Paulo',
});
