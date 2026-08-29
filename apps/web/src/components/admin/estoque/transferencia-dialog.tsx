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
import type { Deposito } from '@/lib/api/types';
import { notify } from '@/lib/notify';
import { useEffect, useState } from 'react';
import type { VariacaoOption } from './movimento-dialog';

interface TransferenciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositos: Deposito[];
  variacoes: VariacaoOption[];
  onSaved: () => void;
}

export function TransferenciaDialog({
  open,
  onOpenChange,
  depositos,
  variacoes,
  onSaved,
}: TransferenciaDialogProps) {
  const [variacaoId, setVariacaoId] = useState('');
  const [origemId, setOrigemId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setVariacaoId('');
      setOrigemId('');
      setDestinoId('');
      setQuantidade('');
      setObservacao('');
      setSaving(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantidadeNum = Number.parseInt(quantidade, 10);
    if (!variacaoId || !origemId || !destinoId || !quantidadeNum || quantidadeNum < 1) {
      notify.error('Preencha variação, depósitos e quantidade válida');
      return;
    }
    if (origemId === destinoId) {
      notify.error('Depósito de origem e destino devem ser diferentes');
      return;
    }
    setSaving(true);
    try {
      await adminApi.estoque.transferencia({
        variacao_id: variacaoId,
        deposito_origem_id: origemId,
        deposito_destino_id: destinoId,
        quantidade: quantidadeNum,
        ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
      });
      notify.success('Transferência realizada com sucesso');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Erro ao transferir');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferência entre depósitos</DialogTitle>
          <DialogDescription>
            Movimente mercadoria de um depósito para outro na mesma transação.
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Depósito de origem</Label>
              <Select value={origemId} onValueChange={setOrigemId} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  {depositos.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Depósito de destino</Label>
              <Select value={destinoId} onValueChange={setDestinoId} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent>
                  {depositos.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {saving ? 'Salvando...' : 'Transferir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
