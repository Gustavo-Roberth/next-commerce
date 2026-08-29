'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/api';
import type {
  Deposito,
  EstoqueMovimentoTipoValue,
  EstoqueReferenciaTipoValue,
} from '@/lib/api/types';
import { notify } from '@/lib/notify';
import { useEffect, useState } from 'react';

export interface VariacaoOption {
  id: string;
  label: string;
}

interface MovimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modo: 'entrada' | 'saida';
  depositos: Deposito[];
  variacoes: VariacaoOption[];
  onSaved: () => void;
}

const TIPOS_ENTRADA: EstoqueMovimentoTipoValue[] = [
  'ENTRADA_COMPRA',
  'ENTRADA_DEVOLUCAO',
  'ENTRADA_AJUSTE',
];
const TIPOS_SAIDA: EstoqueMovimentoTipoValue[] = [
  'SAIDA_VENDA',
  'SAIDA_PERDA',
  'SAIDA_DOACAO',
  'SAIDA_AJUSTE',
];

const TIPO_LABELS: Record<EstoqueMovimentoTipoValue, string> = {
  ENTRADA_COMPRA: 'Entrada de compra (NF)',
  ENTRADA_DEVOLUCAO: 'Devolução de cliente',
  ENTRADA_AJUSTE: 'Ajuste de entrada',
  SAIDA_VENDA: 'Saída por venda',
  SAIDA_PERDA: 'Perda/Avaria',
  SAIDA_DOACAO: 'Doação',
  SAIDA_AJUSTE: 'Ajuste de saída',
};

function referenciaParaTipo(tipo: EstoqueMovimentoTipoValue): EstoqueReferenciaTipoValue {
  if (tipo === 'ENTRADA_AJUSTE' || tipo === 'SAIDA_AJUSTE') return 'AJUSTE';
  if (tipo === 'ENTRADA_COMPRA' || tipo === 'ENTRADA_DEVOLUCAO') return 'NOTA_COMPRA';
  return 'PEDIDO';
}

export function MovimentoDialog({
  open,
  onOpenChange,
  modo,
  depositos,
  variacoes,
  onSaved,
}: MovimentoDialogProps) {
  const tipos = modo === 'entrada' ? TIPOS_ENTRADA : TIPOS_SAIDA;
  const [variacaoId, setVariacaoId] = useState('');
  const [depositoId, setDepositoId] = useState('');
  const [tipo, setTipo] = useState<EstoqueMovimentoTipoValue>(
    modo === 'entrada' ? 'ENTRADA_COMPRA' : 'SAIDA_VENDA'
  );
  const [quantidade, setQuantidade] = useState('');
  const [custoReais, setCustoReais] = useState('');
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setVariacaoId('');
      setDepositoId('');
      setTipo(modo === 'entrada' ? 'ENTRADA_COMPRA' : 'SAIDA_VENDA');
      setQuantidade('');
      setCustoReais('');
      setObservacao('');
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, modo]);

  const mostraCusto = modo === 'entrada' && tipo !== 'ENTRADA_AJUSTE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantidadeNum = Number.parseInt(quantidade, 10);
    if (!variacaoId || !depositoId || !tipo || !quantidadeNum || quantidadeNum < 1) {
      notify.error('Preencha variação, depósito e quantidade válida');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        variacao_id: variacaoId,
        deposito_id: depositoId,
        tipo,
        quantidade: quantidadeNum,
        referencia_tipo: referenciaParaTipo(tipo),
        ...(mostraCusto && custoReais
          ? { custo_unitario_cents: Math.round(Number.parseFloat(custoReais) * 100) }
          : {}),
        ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
      };
      await adminApi.estoque.movimento(payload);
      notify.success('Movimento registrado com sucesso');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Erro ao registrar movimento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {modo === 'entrada' ? 'Entrada de mercadoria' : 'Saída de mercadoria'}
          </DialogTitle>
          <DialogDescription>
            {modo === 'entrada'
              ? 'Registre o recebimento de mercadoria (ex.: nota fiscal de compra).'
              : 'Registre a saída de mercadoria do estoque.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Variação</Label>
            <Select value={variacaoId} onValueChange={setVariacaoId} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a variação" />
              </SelectTrigger>
              <SelectContent>
                {variacoes.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Depósito</Label>
            <Select value={depositoId} onValueChange={setDepositoId} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o depósito" />
              </SelectTrigger>
              <SelectContent>
                {depositos.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nome}
                    {d.padrao ? ' (padrão)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de movimento</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as EstoqueMovimentoTipoValue)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="0"
              required
              disabled={saving}
            />
          </div>

          {mostraCusto && (
            <div className="space-y-2">
              <Label htmlFor="custo">Custo unitário (R$)</Label>
              <Input
                id="custo"
                type="number"
                step="0.01"
                min={0}
                value={custoReais}
                onChange={(e) => setCustoReais(e.target.value)}
                placeholder="0,00"
                disabled={saving}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Opcional"
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
