import type { ConfiguracaoFrete as ConfiguracaoFreteModel } from '@/generated/prisma/client';
import type {
  AtualizarFreteInput,
  CalcularFreteInput,
  CriarFreteInput,
} from '../schemas/config.schemas.js';
import * as repo from './repository.js';

export interface OpcaoFrete {
  id: string;
  nome: string;
  tipo: string;
  valor_cents: number;
  prazo_dias?: number;
  observacao?: string;
}

function cfg(regra: ConfiguracaoFreteModel): Record<string, unknown> {
  return (regra.configuracao ?? {}) as Record<string, unknown>;
}

function numero(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function prazo(value: unknown): number | undefined {
  return value !== undefined ? numero(value) : undefined;
}

function montarOpcao(
  regra: ConfiguracaoFreteModel,
  valor_cents: number,
  prazo_dias: number | undefined,
  observacao?: string
): OpcaoFrete {
  const opcao: OpcaoFrete = { id: regra.id, nome: regra.nome, tipo: regra.tipo, valor_cents };
  if (prazo_dias !== undefined) opcao.prazo_dias = prazo_dias;
  if (observacao !== undefined) opcao.observacao = observacao;
  return opcao;
}

function avaliarRegra(regra: ConfiguracaoFreteModel, input: CalcularFreteInput): OpcaoFrete | null {
  const c = cfg(regra);
  const prazoBase = prazo(c.prazo_dias);

  switch (regra.tipo) {
    case 'GRATIS_VALOR': {
      const minimo = numero(c.valor_minimo_cents);
      if (input.subtotal_cents >= minimo) {
        return montarOpcao(regra, 0, prazoBase, 'Frete grátis por valor mínimo');
      }
      return null;
    }
    case 'GRATIS_REGIAO': {
      const regioes = Array.isArray(c.regioes)
        ? (c.regioes as Array<{ cep_inicio: string; cep_fim: string }>)
        : [];
      const cep = Number(input.cep_destino);
      const dentro = regioes.some((r) => {
        const ini = Number(r.cep_inicio);
        const fim = Number(r.cep_fim);
        return !Number.isNaN(ini) && !Number.isNaN(fim) && cep >= ini && cep <= fim;
      });
      if (dentro) {
        return montarOpcao(regra, 0, prazoBase, 'Frete grátis por região');
      }
      return null;
    }
    case 'TABELA_PRECO': {
      const faixas = Array.isArray(c.faixas)
        ? (c.faixas as Array<{ ate_kg?: number; valor_cents: number; prazo_dias?: number }>)
        : [];
      const peso = input.peso_kg ?? 0;
      const faixa =
        faixas.find((f) => f.ate_kg === undefined || peso <= numero(f.ate_kg)) ?? faixas[0];
      if (!faixa) return null;
      return montarOpcao(regra, numero(faixa.valor_cents), prazo(faixa.prazo_dias) ?? prazoBase);
    }
    case 'CORREIOS':
    case 'TRANSPORTADORA': {
      return montarOpcao(regra, numero(c.valor_cents), prazoBase);
    }
    default:
      return null;
  }
}

export async function listarFrete(lojaId: string): Promise<ConfiguracaoFreteModel[]> {
  return repo.listarFrete(lojaId);
}

export async function buscarFretePorId(lojaId: string, id: string) {
  return repo.buscarFretePorId(lojaId, id);
}

export async function criarFrete(lojaId: string, input: CriarFreteInput) {
  return repo.criarFrete(lojaId, input);
}

export async function atualizarFrete(lojaId: string, id: string, input: AtualizarFreteInput) {
  return repo.atualizarFrete(lojaId, id, input);
}

export async function removerFrete(lojaId: string, id: string): Promise<void> {
  return repo.removerFrete(lojaId, id);
}

export async function alternarFrete(lojaId: string, id: string, ativo: boolean) {
  return repo.alternarFrete(lojaId, id, ativo);
}

export async function calcularFrete(
  lojaId: string,
  input: CalcularFreteInput
): Promise<OpcaoFrete[]> {
  const regras = await repo.listarFrete(lojaId);
  const opcoes: OpcaoFrete[] = [];
  for (const regra of regras) {
    if (!regra.ativo) continue;
    const opcao = avaliarRegra(regra, input);
    if (opcao) opcoes.push(opcao);
  }
  return opcoes;
}
