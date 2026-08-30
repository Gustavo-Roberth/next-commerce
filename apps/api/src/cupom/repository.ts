import type { Prisma } from '@/generated/prisma/client';
import type { Cupom as CupomModel } from '@/generated/prisma/client';
import { prisma } from '../lib/prisma.js';
import type { AtualizarCupomInput, CriarCupomInput } from '../schemas/config.schemas.js';

export async function listarCupom(lojaId: string): Promise<CupomModel[]> {
  return prisma.cupom.findMany({
    where: { loja_id: lojaId, deleted_at: null },
    orderBy: { created_at: 'desc' },
  });
}

export async function buscarCupomPorId(lojaId: string, id: string): Promise<CupomModel | null> {
  return prisma.cupom.findFirst({ where: { loja_id: lojaId, id, deleted_at: null } });
}

export async function buscarCupomPorCodigo(
  lojaId: string,
  codigo: string
): Promise<CupomModel | null> {
  return prisma.cupom.findFirst({
    where: { loja_id: lojaId, codigo: codigo.toLowerCase(), deleted_at: null },
  });
}

export async function criarCupom(lojaId: string, input: CriarCupomInput): Promise<CupomModel> {
  return prisma.cupom.create({
    data: {
      loja_id: lojaId,
      codigo: input.codigo.toLowerCase(),
      nome: input.nome,
      tipo: input.tipo,
      valor: input.valor,
      valor_minimo_pedido_cents: input.valor_minimo_pedido_cents,
      uso_maximo_total: input.uso_maximo_total,
      uso_maximo_por_cliente: input.uso_maximo_por_cliente,
      valido_de: new Date(input.valido_de),
      valido_ate: new Date(input.valido_ate),
      categorias_aplicaveis: input.categorias_aplicaveis ?? [],
      produtos_aplicaveis: input.produtos_aplicaveis ?? [],
      primeira_compra_only: input.primeira_compra_only,
      ativo: input.ativo,
    } as Prisma.CupomUncheckedCreateInput,
  });
}

export async function atualizarCupom(
  lojaId: string,
  id: string,
  input: AtualizarCupomInput
): Promise<CupomModel> {
  const data: Record<string, unknown> = { loja_id: lojaId };
  if (input.codigo !== undefined) data.codigo = input.codigo.toLowerCase();
  if (input.nome !== undefined) data.nome = input.nome;
  if (input.tipo !== undefined) data.tipo = input.tipo;
  if (input.valor !== undefined) data.valor = input.valor;
  if (input.valor_minimo_pedido_cents !== undefined)
    data.valor_minimo_pedido_cents = input.valor_minimo_pedido_cents;
  if (input.uso_maximo_total !== undefined) data.uso_maximo_total = input.uso_maximo_total;
  if (input.uso_maximo_por_cliente !== undefined)
    data.uso_maximo_por_cliente = input.uso_maximo_por_cliente;
  if (input.valido_de !== undefined) data.valido_de = new Date(input.valido_de);
  if (input.valido_ate !== undefined) data.valido_ate = new Date(input.valido_ate);
  if (input.categorias_aplicaveis !== undefined)
    data.categorias_aplicaveis = input.categorias_aplicaveis;
  if (input.produtos_aplicaveis !== undefined) data.produtos_aplicaveis = input.produtos_aplicaveis;
  if (input.primeira_compra_only !== undefined)
    data.primeira_compra_only = input.primeira_compra_only;
  if (input.ativo !== undefined) data.ativo = input.ativo;
  if (input.ativo === false) data.status = 'DESATIVADO';
  if (input.ativo === true) data.status = 'ATIVO';
  return prisma.cupom.update({ where: { id }, data: data as Prisma.CupomUncheckedUpdateInput });
}

export async function removerCupom(lojaId: string, id: string): Promise<void> {
  await prisma.cupom.update({
    where: { id, loja_id: lojaId },
    data: { deleted_at: new Date(), ativo: false, status: 'DESATIVADO' },
  });
}

export async function alternarCupom(
  lojaId: string,
  id: string,
  ativo: boolean
): Promise<CupomModel> {
  return prisma.cupom.update({
    where: { id },
    data: { ativo, status: ativo ? 'ATIVO' : 'DESATIVADO', loja_id: lojaId },
  });
}

export async function contarUsosPorCliente(lojaId: string, cupomId: string, clienteId: string) {
  return prisma.pedido.count({
    where: { loja_id: lojaId, cupom_id: cupomId, cliente_id: clienteId },
  });
}

export async function contarPedidosCliente(lojaId: string, clienteId: string) {
  return prisma.pedido.count({ where: { loja_id: lojaId, cliente_id: clienteId } });
}
