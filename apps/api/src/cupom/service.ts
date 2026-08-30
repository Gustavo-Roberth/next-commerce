import type {
  AtualizarCupomInput,
  CriarCupomInput,
  ValidarCupomInput,
} from '../schemas/config.schemas.js';
import * as repo from './repository.js';

export interface ResultadoValidacaoCupom {
  valido: boolean;
  cupom_id?: string;
  codigo?: string;
  tipo?: string;
  valor?: number;
  desconto_cents: number;
  frete_gratis: boolean;
  mensagem?: string;
}

export async function listarCupom(lojaId: string) {
  return repo.listarCupom(lojaId);
}

export async function buscarCupomPorId(lojaId: string, id: string) {
  return repo.buscarCupomPorId(lojaId, id);
}

export async function criarCupom(lojaId: string, input: CriarCupomInput) {
  return repo.criarCupom(lojaId, input);
}

export async function atualizarCupom(lojaId: string, id: string, input: AtualizarCupomInput) {
  return repo.atualizarCupom(lojaId, id, input);
}

export async function removerCupom(lojaId: string, id: string): Promise<void> {
  return repo.removerCupom(lojaId, id);
}

export async function alternarCupom(lojaId: string, id: string, ativo: boolean) {
  return repo.alternarCupom(lojaId, id, ativo);
}

export async function validarCupom(
  lojaId: string,
  input: ValidarCupomInput
): Promise<ResultadoValidacaoCupom> {
  const cupom = await repo.buscarCupomPorCodigo(lojaId, input.codigo);
  if (!cupom || !cupom.ativo || cupom.status !== 'ATIVO') {
    return {
      valido: false,
      desconto_cents: 0,
      frete_gratis: false,
      mensagem: 'Cupom inválido ou inativo',
    };
  }

  const agora = new Date();
  const validoDe = cupom.valido_de instanceof Date ? cupom.valido_de : new Date(cupom.valido_de);
  const validoAte = cupom.valido_ate instanceof Date ? cupom.valido_ate : new Date(cupom.valido_ate);
  if (agora < validoDe || agora > validoAte) {
    return {
      valido: false,
      desconto_cents: 0,
      frete_gratis: false,
      mensagem: 'Fora do período de validade',
    };
  }

  if (cupom.uso_maximo_total !== null && cupom.uso_atual >= cupom.uso_maximo_total) {
    return { valido: false, desconto_cents: 0, frete_gratis: false, mensagem: 'Cupom esgotado' };
  }

  if (
    cupom.valor_minimo_pedido_cents !== null &&
    input.subtotal_cents < cupom.valor_minimo_pedido_cents
  ) {
    return {
      valido: false,
      desconto_cents: 0,
      frete_gratis: false,
      mensagem: 'Subtotal abaixo do mínimo exigido',
    };
  }

  if (cupom.categorias_aplicaveis.length > 0 && input.categorias && input.categorias.length > 0) {
    const ok = input.categorias.some((c) => cupom.categorias_aplicaveis.includes(c));
    if (!ok) {
      return {
        valido: false,
        desconto_cents: 0,
        frete_gratis: false,
        mensagem: 'Não aplicável às categorias do carrinho',
      };
    }
  }

  if (cupom.produtos_aplicaveis.length > 0 && input.produtos && input.produtos.length > 0) {
    const ok = input.produtos.some((p) => cupom.produtos_aplicaveis.includes(p));
    if (!ok) {
      return {
        valido: false,
        desconto_cents: 0,
        frete_gratis: false,
        mensagem: 'Não aplicável aos produtos do carrinho',
      };
    }
  }

  if (cupom.primeira_compra_only && input.cliente_id) {
    const pedidos = await repo.contarPedidosCliente(lojaId, input.cliente_id);
    if (pedidos > 0) {
      return {
        valido: false,
        desconto_cents: 0,
        frete_gratis: false,
        mensagem: 'Exclusivo para primeira compra',
      };
    }
  }

  if (cupom.uso_maximo_por_cliente !== null && input.cliente_id) {
    const usos = await repo.contarUsosPorCliente(lojaId, cupom.id, input.cliente_id);
    if (usos >= cupom.uso_maximo_por_cliente) {
      return {
        valido: false,
        desconto_cents: 0,
        frete_gratis: false,
        mensagem: 'Limite de uso por cliente atingido',
      };
    }
  }

  let desconto_cents = 0;
  let frete_gratis = false;
  if (cupom.tipo === 'PERCENTUAL') {
    desconto_cents = Math.floor((input.subtotal_cents * cupom.valor) / 100);
  } else if (cupom.tipo === 'VALOR_FIXO') {
    desconto_cents = Math.min(cupom.valor, input.subtotal_cents);
  } else if (cupom.tipo === 'FRETE_GRATIS') {
    frete_gratis = true;
  }

  return {
    valido: true,
    cupom_id: cupom.id,
    codigo: cupom.codigo,
    tipo: cupom.tipo,
    valor: cupom.valor,
    desconto_cents,
    frete_gratis,
    mensagem: 'Cupom aplicado',
  };
}
