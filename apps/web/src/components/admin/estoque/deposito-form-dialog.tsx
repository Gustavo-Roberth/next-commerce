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
import { Switch } from '@/components/ui/switch';
import { adminApi } from '@/lib/api';
import type { Deposito } from '@/lib/api/types';
import { notify } from '@/lib/notify';
import { useEffect, useState } from 'react';

interface DepositoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deposito?: Deposito | null;
  onSaved: () => void;
}

export function DepositoFormDialog({
  open,
  onOpenChange,
  deposito,
  onSaved,
}: DepositoFormDialogProps) {
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [endereco, setEndereco] = useState('');
  const [padrao, setPadrao] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = !!deposito;

  useEffect(() => {
    if (open) {
      setNome(deposito?.nome ?? '');
      setCodigo(deposito?.codigo ?? '');
      setEndereco(deposito?.endereco_completo ?? '');
      setPadrao(deposito?.padrao ?? false);
      setSaving(false);
    }
  }, [open, deposito]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nome,
        codigo: codigo.toUpperCase(),
        endereco_completo: endereco,
        padrao,
      };
      if (isEdit && deposito) {
        await adminApi.depositos.update(deposito.id, payload);
        notify.success('Depósito atualizado com sucesso');
      } else {
        await adminApi.depositos.create(payload);
        notify.success('Depósito criado com sucesso');
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Erro ao salvar depósito');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar depósito' : 'Novo depósito'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Altere os dados do depósito.'
              : 'Cadastre um depósito para armazenar estoque.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Depósito Principal"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="DP01"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço completo</Label>
            <Input
              id="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua Exemplo, 123 - Cidade/UF"
              required
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Depósito padrão</p>
              <p className="text-xs text-muted-foreground">
                Apenas um depósito por loja pode ser padrão.
              </p>
            </div>
            <Switch checked={padrao} onCheckedChange={setPadrao} disabled={saving} />
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
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
