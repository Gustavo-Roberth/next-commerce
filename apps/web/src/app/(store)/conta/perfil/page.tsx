'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PerfilPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome_completo: '', telefone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    api
      .get<{ nome_completo: string; telefone: string | null }>('/auth/me')
      .then((me) => setForm({ nome_completo: me.nome_completo, telefone: me.telefone || '' }))
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/client/perfil', form);
      setMessage('Perfil atualizado');
    } catch {
      setMessage('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Carregando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Meu Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Editar dados</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome completo</Label>
              <Input
                id="nome_completo"
                name="nome_completo"
                value={form.nome_completo}
                onChange={handleChange('nome_completo')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                value={form.telefone}
                onChange={handleChange('telefone')}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
