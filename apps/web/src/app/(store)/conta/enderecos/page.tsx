'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6', 'sk-7', 'sk-8'];

interface Endereco {
  id: string;
  tipo: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  principal: boolean;
}

export default function EnderecosPage() {
  const router = useRouter();
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
  });

  const load = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const res = await api.get<{ data: Endereco[] }>('/client/enderecos');
      setEnderecos(res.data);
    } catch {
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/client/enderecos', form);
      setForm({ cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '' });
      setShowForm(false);
      await load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Meus Endereços</h1>
        <Button onClick={() => setShowForm((v) => !v)}>Adicionar Endereço</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Novo endereço</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  name="cep"
                  value={form.cep}
                  onChange={handleChange('cep')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  name="logradouro"
                  value={form.logradouro}
                  onChange={handleChange('logradouro')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  name="numero"
                  value={form.numero}
                  onChange={handleChange('numero')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  name="bairro"
                  value={form.bairro}
                  onChange={handleChange('bairro')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  value={form.cidade}
                  onChange={handleChange('cidade')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">UF</Label>
                <Input id="uf" name="uf" value={form.uf} onChange={handleChange('uf')} required />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {SKELETON_KEYS.slice(0, 3).map((key) => (
            <Card key={key}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : enderecos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum endereço cadastrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {enderecos.map((endereco) => (
            <Card key={endereco.id}>
              <CardContent className="p-4">
                <p className="font-medium">
                  {endereco.logradouro}, {endereco.numero}
                </p>
                <p className="text-sm text-muted-foreground">
                  {endereco.bairro} · {endereco.cidade} - {endereco.uf}
                </p>
                <p className="text-sm text-muted-foreground">CEP: {endereco.cep}</p>
                {endereco.principal && (
                  <span className="mt-2 inline-block rounded bg-primary/10 px-2 py-1 text-xs text-primary">
                    Principal
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
