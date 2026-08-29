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
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { VariacaoOption } from './movimento-dialog';

interface InventarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositos: Deposito[];
  variacoes: VariacaoOption[];
  onSaved: () => void;
}

interface ItemLinha {
  id: string;
  variacaoId: string;
  quantidade: string;
}

export function InventarioDialog({
  open,
  onOpenChange,
  depositos,
  variacoes,
  onSaved,
}: InventarioDialogProps) {
  const [depositoId, setDepositoId] = useState('');
  const [itens, setItens] = useState<ItemLinha[]>([
    { id: crypto.randomUUID(), variacaoId: '', quantidade: '' },
  ]);
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDepositoId('');
      setItens([{ id: crypto.randomUUID(), variacaoId: '', quantidade: '' }]);
      setObservacao('');
      setSaving(false);
    }
  }, [open]);

  const updateItem = (index: number, patch: Partial<ItemLinha>) => {
    setItens((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addItem = () =>
    setItens((prev) => [...prev, { id: crypto.randomUUID(), variacaoId: '', quantidade: '' }]);
  const removeItem = (index: number) =>
    setItens((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositoId) {
      notify.error('Selecione o depósito');
      return;
    }
    const linhasValidas = itens.filter(
      (item) => item.variacaoId && Number.parseInt(item.quantidade, 10) >= 0
    );
    if (linhasValidas.length === 0) {
      notify.error('Adicione ao menos uma variação com quantidade contada');
      return;
    }
    setSaving(true);
    try {
      await adminApi.estoque.inventario({
        deposito_id: depositoId,
        itens: linhasValidas.map((item) => ({
          variacao_id: item.variacaoId,
          quantidade_contada: Number.parseInt(item.quantidade, 10),
        })),
        ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
      });
      notify.success('Inventário aplicado com sucesso');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Erro ao aplicar inventário');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inventário físico</DialogTitle>
          <DialogDescription>
            Confira a contagem e ajuste o estoque divergente do depósito selecionado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Itens contados</Label>
            <div className="space-y-2">
              {itens.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Select
                    value={item.variacaoId}
                    onValueChange={(v) => updateItem(index, { variacaoId: v })}
                    disabled={saving}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Variação" />
                    </SelectTrigger>
                    <SelectContent>
                      {variacoes.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    value={item.quantidade}
                    onChange={(e) => updateItem(index, { quantidade: e.target.value })}
                    placeholder="Qtd"
                    className="w-24"
                    disabled={saving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={saving || itens.length === 1}
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar item
            </Button>
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
              {saving ? 'Salvando...' : 'Aplicar inventário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
