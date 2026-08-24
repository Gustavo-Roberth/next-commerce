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
import { ApiError, api } from '@/lib/api/client';
import { AlertCircle, Loader2, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: {
          id: string;
          email: string;
          nome_completo: string;
          loja_id: string;
          perfis: { codigo: string; nome: string }[];
          permissoes: string[];
        };
      }>('/auth/login', { email, password });

      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      const isAdmin = response.user.perfis.some(
        (p) => p.codigo === 'ADMIN' || p.codigo === 'GESTOR' || p.codigo === 'OPERADOR'
      );

      if (!isAdmin) {
        setError('Acesso restrito a administradores, gestores e operadores');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.error || 'Credenciais inválidas');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl">Painel Administrativo</CardTitle>
          <CardDescription>Faça login para acessar o painel de gestão</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Voltar para a{' '}
            <Link href="/" className="underline hover:text-primary">
              loja
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
