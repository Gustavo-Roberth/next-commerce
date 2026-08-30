'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/api';
import type { AtualizarLojaInput, LojaConfig } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function LojaTab() {
  const [loja, setLoja] = useState<LojaConfig | null>(null);
  const [form, setForm] = useState<AtualizarLojaInput>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    adminApi.configuracoes.loja
      .get()
      .then((data) => {
        setLoja(data);
        setForm({
          nome: data.nome,
          email_contato: data.email_contato,
          telefone: data.telefone,
          documento: data.documento,
          moeda: data.moeda,
          dominio: data.dominio,
          tema: data.tema,
          seo: data.seo,
        });
      })
      .catch(() => setMsg('Erro ao carregar dados da loja'))
      .finally(() => setLoading(false));
  }, []);

  const set = (path: (f: AtualizarLojaInput) => void) =>
    setForm((prev: AtualizarLojaInput) => {
      const next = { ...prev };
      path(next);
      return next;
    });

  const salvar = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const atualizada = await adminApi.configuracoes.loja.update(form);
      setLoja(atualizada);
      setMsg('Configurações salvas com sucesso');
    } catch {
      setMsg('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!loja) return <p className="text-sm text-red-600">{msg}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da Loja</CardTitle>
        <CardDescription>Identidade, contato e aparência da sua loja.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={form.nome ?? ''}
              onChange={(e) =>
                set((f) => {
                  f.nome = e.target.value;
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="documento">CNPJ/CPF</Label>
            <Input
              id="documento"
              value={form.documento ?? ''}
              onChange={(e) =>
                set((f) => {
                  f.documento = e.target.value;
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email_contato">E-mail de contato</Label>
            <Input
              id="email_contato"
              value={form.email_contato ?? ''}
              onChange={(e) =>
                set((f) => {
                  f.email_contato = e.target.value;
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={form.telefone ?? ''}
              onChange={(e) =>
                set((f) => {
                  f.telefone = e.target.value;
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dominio">Domínio</Label>
            <Input
              id="dominio"
              value={form.dominio ?? ''}
              onChange={(e) =>
                set((f) => {
                  f.dominio = e.target.value;
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="moeda">Moeda</Label>
            <Input
              id="moeda"
              value={form.moeda ?? 'BRL'}
              onChange={(e) =>
                set((f) => {
                  f.moeda = e.target.value;
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cor_primaria">Cor primária (tema)</Label>
            <Input
              id="cor_primaria"
              value={form.tema?.cor_primaria ?? ''}
              onChange={(e) =>
                set((f) => {
                  f.tema = { ...f.tema, cor_primaria: e.target.value };
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="seo_title">SEO Título</Label>
            <Input
              id="seo_title"
              value={form.seo?.title ?? ''}
              onChange={(e) =>
                set((f) => {
                  f.seo = { ...f.seo, title: e.target.value };
                })
              }
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="seo_description">SEO Descrição</Label>
          <Textarea
            id="seo_description"
            value={form.seo?.description ?? ''}
            onChange={(e) =>
              set((f) => {
                f.seo = { ...f.seo, description: e.target.value };
              })
            }
          />
        </div>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </CardContent>
      <CardFooter>
        <Button onClick={salvar} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </CardFooter>
    </Card>
  );
}
