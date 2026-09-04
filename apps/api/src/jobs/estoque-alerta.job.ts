import { prisma } from '../lib/prisma.js';
import { emailProvider } from '../providers/email.provider.js';
import { refreshRelatorios } from '../reports/repository.js';
import { registerJob } from './index.js';

interface EstoqueAlertaItem {
  loja_id: string;
  deposito_id: string;
  variacao_id: string;
  sku: string | null;
  nome: string | null;
  quantidade_fisica: number;
  quantidade_reservada: number;
  disponivel: number;
  minima: number;
  nivel: 'ZERADO' | 'BAIXO';
}

interface UsuarioNotificacao {
  id: string;
  email: string;
  nome_completo: string;
}

async function buscarItensComAlerta(): Promise<EstoqueAlertaItem[]> {
  const resultado = await prisma.$queryRawUnsafe<EstoqueAlertaItem[]>(`
    SELECT
      e."loja_id",
      e."deposito_id",
      e."variacao_id",
      v."sku",
      v."nome",
      e."quantidade_fisica"::int AS "quantidade_fisica",
      e."quantidade_reservada"::int AS "quantidade_reservada",
      (e."quantidade_fisica" - e."quantidade_reservada")::int AS "disponivel",
      e."quantidade_minima"::int AS "minima",
      CASE
        WHEN (e."quantidade_fisica" - e."quantidade_reservada") <= 0 THEN 'ZERADO'
        ELSE 'BAIXO'
      END AS "nivel"
    FROM "Estoque" e
    JOIN "ProdutoVariacao" v ON v."id" = e."variacao_id"
    WHERE (e."quantidade_fisica" - e."quantidade_reservada") <= e."quantidade_minima"
      AND e."quantidade_minima" > 0
    ORDER BY e."loja_id", "disponivel" ASC
  `);

  return resultado.map((row) => ({
    ...row,
    disponivel: Number(row.disponivel),
    quantidade_fisica: Number(row.quantidade_fisica),
    quantidade_reservada: Number(row.quantidade_reservada),
    minima: Number(row.minima),
  }));
}

async function buscarUsuariosNotificacao(lojaId: string): Promise<UsuarioNotificacao[]> {
  const usuarios = await prisma.usuarioPerfil.findMany({
    where: {
      loja_id: lojaId,
      ativo: true,
      perfil: {
        codigo: { in: ['ESTOQUISTA', 'GESTOR', 'ADMIN'] },
      },
      usuario: {
        ativo: true,
        email_verificado_em: { not: null },
      },
    },
    include: {
      usuario: { select: { id: true, email: true, nome_completo: true } },
    },
    distinct: ['usuario_id'],
  });

  return usuarios.map((up) => up.usuario).filter((u): u is UsuarioNotificacao => u !== null);
}

function agruparPorLoja(itens: EstoqueAlertaItem[]): Map<string, EstoqueAlertaItem[]> {
  const mapa = new Map<string, EstoqueAlertaItem[]>();
  for (const item of itens) {
    const arr = mapa.get(item.loja_id) ?? [];
    arr.push(item);
    mapa.set(item.loja_id, arr);
  }
  return mapa;
}

async function enviarAlertaEstoque(lojaId: string, itens: EstoqueAlertaItem[]): Promise<void> {
  const usuarios = await buscarUsuariosNotificacao(lojaId);
  if (usuarios.length === 0) {
    console.log(`[Job:estoque-alerta] Loja ${lojaId}: nenhum usuário para notificar`);
    return;
  }

  const zerados = itens.filter((i) => i.nivel === 'ZERADO');
  const baixos = itens.filter((i) => i.nivel === 'BAIXO');

  const assunto = `⚠️ Alerta de Estoque: ${zerados.length} zerado(s), ${baixos.length} baixo(s)`;

  const linhasHtml = itens
    .map(
      (item) =>
        `<tr style="background:${item.nivel === 'ZERADO' ? '#fee2e2' : '#fef3c7'}">
          <td style="padding:8px;border:1px solid #e5e7eb">${item.sku ?? '-'}</td>
          <td style="padding:8px;border:1px solid #e5e7eb">${item.nome ?? '-'}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${item.quantidade_fisica}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${item.quantidade_reservada}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-weight:${item.nivel === 'ZERADO' ? 'bold' : 'normal'}">${item.disponivel}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${item.minima}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">
            <span style="background:${item.nivel === 'ZERADO' ? '#ef4444' : '#f59e0b'};color:white;padding:2px 8px;border-radius:4px;font-size:12px">${item.nivel}</span>
          </td>
        </tr>`
    )
    .join('');

  const html = `
    <h2>Alerta de Estoque — Loja ${lojaId}</h2>
    <p>Os seguintes itens estão com estoque zerado ou abaixo do mínimo:</p>
    <table style="border-collapse:collapse;width:100%;max-width:800px">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">SKU</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Produto</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:center">Físico</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:center">Reservado</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:center">Disponível</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:center">Mínimo</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:center">Nível</th>
        </tr>
      </thead>
      <tbody>${linhasHtml}</tbody>
    </table>
    <p style="margin-top:16px;font-size:14px;color:#6b7280">
      Verifique o painel de estoque para tomar as ações necessárias.
    </p>
  `;

  const emails = usuarios.map((u) => u.email);

  try {
    await emailProvider.enviar({
      to: emails.join(','),
      subject: assunto,
      html,
    });
    console.log(
      `[Job:estoque-alerta] Alerta enviado para ${emails.length} usuário(s) da loja ${lojaId}`
    );
  } catch (error) {
    console.error(`[Job:estoque-alerta] Falha ao enviar e-mail para loja ${lojaId}:`, error);
  }
}

async function executarAlertaEstoque(): Promise<void> {
  console.log('[Job:estoque-alerta] Iniciando verificação de estoque...');

  await refreshRelatorios();

  const itens = await buscarItensComAlerta();

  if (itens.length === 0) {
    console.log('[Job:estoque-alerta] Nenhum item com alerta de estoque');
    return;
  }

  const porLoja = agruparPorLoja(itens);
  console.log(`[Job:estoque-alerta] ${itens.length} item(s) com alerta em ${porLoja.size} loja(s)`);

  for (const [lojaId, itensLoja] of porLoja) {
    await enviarAlertaEstoque(lojaId, itensLoja);
  }

  console.log('[Job:estoque-alerta] Concluído');
}

registerJob({
  name: 'estoque-alerta',
  schedule: '0 * * * *',
  handler: executarAlertaEstoque,
  enabledEnv: 'ESTOQUE_ALERTA_JOB_ENABLED',
  timezone: 'America/Sao_Paulo',
});
