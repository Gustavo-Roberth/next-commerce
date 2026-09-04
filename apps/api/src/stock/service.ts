import {
  EstoqueMovimentoTipo,
  type EstoqueReferenciaTipo,
  type Prisma,
} from '@/generated/prisma/client';
import { AuditAction, AuditEntity } from '@shared/types';
import { logAudit } from '../audit/service.js';
import { prisma } from '../lib/prisma.js';

type Tx = Prisma.TransactionClient;

const ENTRADAS = new Set<string>([
  EstoqueMovimentoTipo.ENTRADA_COMPRA,
  EstoqueMovimentoTipo.ENTRADA_DEVOLUCAO,
  EstoqueMovimentoTipo.ENTRADA_AJUSTE,
]);

async function obterOuCriarEstoque(tx: Tx, lojaId: string, variacaoId: string, depositoId: string) {
  const existente = await tx.estoque.findUnique({
    where: { variacao_id_deposito_id: { variacao_id: variacaoId, deposito_id: depositoId } },
  });
  if (existente) return existente;

  return tx.estoque.create({
    data: {
      loja_id: lojaId,
      variacao_id: variacaoId,
      deposito_id: depositoId,
      quantidade_fisica: 0,
      quantidade_reservada: 0,
      quantidade_minima: 0,
    },
  });
}

export async function registrarMovimento(
  tx: Tx,
  lojaId: string,
  input: {
    variacao_id: string;
    deposito_id: string;
    tipo: EstoqueMovimentoTipo;
    quantidade: number;
    custo_unitario_cents?: number;
    referencia_tipo: EstoqueReferenciaTipo;
    referencia_id?: string;
    observacao?: string;
    usuario_id?: string;
  }
) {
  const estoque = await obterOuCriarEstoque(tx, lojaId, input.variacao_id, input.deposito_id);
  const { tipo, quantidade } = input;

  if (tipo === EstoqueMovimentoTipo.RESERVA) {
    const disponivel = estoque.quantidade_fisica - estoque.quantidade_reservada;
    if (disponivel < quantidade) {
      throw new Error('Estoque insuficiente para reserva');
    }
    await tx.estoque.update({
      where: { id: estoque.id },
      data: { quantidade_reservada: { increment: quantidade } },
    });
  } else if (tipo === EstoqueMovimentoTipo.LIBERACAO_RESERVA) {
    const liberar = Math.min(quantidade, estoque.quantidade_reservada);
    await tx.estoque.update({
      where: { id: estoque.id },
      data: { quantidade_reservada: { decrement: liberar } },
    });
  } else if (ENTRADAS.has(tipo)) {
    const data: Prisma.EstoqueUpdateInput = {
      quantidade_fisica: { increment: quantidade },
    };
    if (
      tipo === EstoqueMovimentoTipo.ENTRADA_COMPRA &&
      typeof input.custo_unitario_cents === 'number'
    ) {
      const totalAtual = estoque.quantidade_fisica * estoque.custo_medio_cents;
      const totalNovo = quantidade * input.custo_unitario_cents;
      const novaQtd = estoque.quantidade_fisica + quantidade;
      data.custo_medio_cents = novaQtd > 0 ? Math.round((totalAtual + totalNovo) / novaQtd) : 0;
    }
    await tx.estoque.update({ where: { id: estoque.id }, data });
  } else if (tipo === EstoqueMovimentoTipo.SAIDA_VENDA) {
    await tx.estoque.update({
      where: { id: estoque.id },
      data: {
        quantidade_fisica: { decrement: quantidade },
        quantidade_reservada: { decrement: Math.min(quantidade, estoque.quantidade_reservada) },
      },
    });
  } else {
    if (estoque.quantidade_fisica < quantidade) {
      throw new Error('Estoque físico insuficiente para a saída');
    }
    await tx.estoque.update({
      where: { id: estoque.id },
      data: { quantidade_fisica: { decrement: quantidade } },
    });
  }

  return tx.estoqueMovimento
    .create({
      data: {
        loja_id: lojaId,
        variacao_id: input.variacao_id,
        deposito_id: input.deposito_id,
        tipo,
        quantidade,
        custo_unitario_cents: input.custo_unitario_cents ?? null,
        referencia_tipo: input.referencia_tipo,
        referencia_id: input.referencia_id ?? null,
        observacao: input.observacao ?? null,
        usuario_id: input.usuario_id ?? null,
      },
    })
    .then(async (movimento) => {
      await logAudit({
        usuarioId: input.usuario_id ?? null,
        lojaId,
        acao: AuditAction.ESTOQUE_MOVIMENTADO,
        entidade: AuditEntity.ESTOQUE_MOVIMENTO,
        entidadeId: movimento.id,
        depois: {
          tipo,
          quantidade,
          variacao_id: input.variacao_id,
          deposito_id: input.deposito_id,
          custo_unitario_cents: input.custo_unitario_cents ?? null,
          referencia_tipo: input.referencia_tipo,
          referencia_id: input.referencia_id ?? null,
          observacao: input.observacao ?? null,
        },
      });
      return movimento;
    });
}

export async function reservar(
  tx: Tx,
  lojaId: string,
  input: {
    variacao_id: string;
    deposito_id: string;
    quantidade: number;
    pedido_id?: string;
    usuario_id?: string;
  }
) {
  const payload = {
    variacao_id: input.variacao_id,
    deposito_id: input.deposito_id,
    tipo: EstoqueMovimentoTipo.RESERVA,
    quantidade: input.quantidade,
    referencia_tipo: 'PEDIDO' as EstoqueReferenciaTipo,
    observacao: 'Reserva de estoque no checkout',
    ...(input.pedido_id ? { referencia_id: input.pedido_id } : {}),
    ...(input.usuario_id ? { usuario_id: input.usuario_id } : {}),
  };
  return registrarMovimento(tx, lojaId, payload);
}

export async function liberarReserva(
  tx: Tx,
  lojaId: string,
  input: {
    variacao_id: string;
    deposito_id: string;
    quantidade: number;
    pedido_id?: string;
    usuario_id?: string;
  }
) {
  const payload = {
    variacao_id: input.variacao_id,
    deposito_id: input.deposito_id,
    tipo: EstoqueMovimentoTipo.LIBERACAO_RESERVA,
    quantidade: input.quantidade,
    referencia_tipo: 'PEDIDO' as EstoqueReferenciaTipo,
    observacao: 'Liberação de reserva de estoque',
    ...(input.pedido_id ? { referencia_id: input.pedido_id } : {}),
    ...(input.usuario_id ? { usuario_id: input.usuario_id } : {}),
  };
  return registrarMovimento(tx, lojaId, payload);
}

export async function transferir(
  tx: Tx,
  lojaId: string,
  usuarioId: string | undefined,
  input: {
    variacao_id: string;
    deposito_origem_id: string;
    deposito_destino_id: string;
    quantidade: number;
    observacao?: string;
  }
) {
  if (input.deposito_origem_id === input.deposito_destino_id) {
    throw new Error('Depósito de origem e destino devem ser diferentes');
  }

  const origem = await obterOuCriarEstoque(tx, lojaId, input.variacao_id, input.deposito_origem_id);
  if (origem.quantidade_fisica - origem.quantidade_reservada < input.quantidade) {
    throw new Error('Estoque disponível insuficiente no depósito de origem');
  }

  await tx.estoque.update({
    where: { id: origem.id },
    data: { quantidade_fisica: { decrement: input.quantidade } },
  });
  await obterOuCriarEstoque(tx, lojaId, input.variacao_id, input.deposito_destino_id);
  await tx.estoque.update({
    where: {
      variacao_id_deposito_id: {
        variacao_id: input.variacao_id,
        deposito_id: input.deposito_destino_id,
      },
    },
    data: { quantidade_fisica: { increment: input.quantidade } },
  });

  await tx.estoqueMovimento
    .create({
      data: {
        loja_id: lojaId,
        variacao_id: input.variacao_id,
        deposito_id: input.deposito_origem_id,
        tipo: EstoqueMovimentoTipo.TRANSFERENCIA_SAIDA,
        quantidade: input.quantidade,
        referencia_tipo: 'TRANSFERENCIA',
        observacao: input.observacao ?? null,
        usuario_id: usuarioId ?? null,
      },
    })
    .then(async (movimento) => {
      await logAudit({
        usuarioId: usuarioId ?? null,
        lojaId,
        acao: AuditAction.ESTOQUE_MOVIMENTADO,
        entidade: AuditEntity.ESTOQUE_MOVIMENTO,
        entidadeId: movimento.id,
        depois: {
          tipo: EstoqueMovimentoTipo.TRANSFERENCIA_SAIDA,
          quantidade: input.quantidade,
          variacao_id: input.variacao_id,
          deposito_id: input.deposito_origem_id,
          referencia_tipo: 'TRANSFERENCIA',
          observacao: input.observacao ?? null,
        },
      });
    });
  await tx.estoqueMovimento
    .create({
      data: {
        loja_id: lojaId,
        variacao_id: input.variacao_id,
        deposito_id: input.deposito_destino_id,
        tipo: EstoqueMovimentoTipo.TRANSFERENCIA_ENTRADA,
        quantidade: input.quantidade,
        referencia_tipo: 'TRANSFERENCIA',
        observacao: input.observacao ?? null,
        usuario_id: usuarioId ?? null,
      },
    })
    .then(async (movimento) => {
      await logAudit({
        usuarioId: usuarioId ?? null,
        lojaId,
        acao: AuditAction.ESTOQUE_MOVIMENTADO,
        entidade: AuditEntity.ESTOQUE_MOVIMENTO,
        entidadeId: movimento.id,
        depois: {
          tipo: EstoqueMovimentoTipo.TRANSFERENCIA_ENTRADA,
          quantidade: input.quantidade,
          variacao_id: input.variacao_id,
          deposito_id: input.deposito_destino_id,
          referencia_tipo: 'TRANSFERENCIA',
          observacao: input.observacao ?? null,
        },
      });
    });
}

export async function inventariar(
  tx: Tx,
  lojaId: string,
  usuarioId: string | undefined,
  input: {
    deposito_id: string;
    itens: Array<{ variacao_id: string; quantidade_contada: number }>;
    observacao?: string;
  }
) {
  for (const item of input.itens) {
    const estoque = await obterOuCriarEstoque(tx, lojaId, item.variacao_id, input.deposito_id);
    const diferenca = item.quantidade_contada - estoque.quantidade_fisica;
    if (diferenca === 0) continue;

    await tx.estoque.update({
      where: { id: estoque.id },
      data: { quantidade_fisica: item.quantidade_contada },
    });

    await tx.estoqueMovimento
      .create({
        data: {
          loja_id: lojaId,
          variacao_id: item.variacao_id,
          deposito_id: input.deposito_id,
          tipo:
            diferenca > 0 ? EstoqueMovimentoTipo.ENTRADA_AJUSTE : EstoqueMovimentoTipo.SAIDA_AJUSTE,
          quantidade: Math.abs(diferenca),
          referencia_tipo: 'INVENTARIO',
          observacao: input.observacao ?? 'Ajuste por inventário',
          usuario_id: usuarioId ?? null,
        },
      })
      .then(async (movimento) => {
        await logAudit({
          usuarioId: usuarioId ?? null,
          lojaId,
          acao: AuditAction.ESTOQUE_MOVIMENTADO,
          entidade: AuditEntity.ESTOQUE_MOVIMENTO,
          entidadeId: movimento.id,
          depois: {
            tipo:
              diferenca > 0
                ? EstoqueMovimentoTipo.ENTRADA_AJUSTE
                : EstoqueMovimentoTipo.SAIDA_AJUSTE,
            quantidade: Math.abs(diferenca),
            variacao_id: item.variacao_id,
            deposito_id: input.deposito_id,
            referencia_tipo: 'INVENTARIO',
            observacao: input.observacao ?? 'Ajuste por inventário',
          },
        });
      });
  }
}

export { prisma };
