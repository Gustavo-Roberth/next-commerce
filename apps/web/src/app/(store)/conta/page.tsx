'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MeResponse {
  id: string;
  email: string;
  nome_completo: string;
  telefone: string | null;
  cpf_cnpj: string | null;
}

export default function ContaPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    api
      .get<MeResponse>('/auth/me')
      .then(setMe)
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Carregando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Minha Conta</h1>
      <p className="text-muted-foreground mb-8">
        Olá, {me?.nome_completo || me?.email}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/conta/pedidos">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Meus Pedidos</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Acompanhe suas compras
            </CardContent>
          </Card>
        </Link>
        <Link href="/conta/enderecos">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Endereços</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Gerencie seus endereços
            </CardContent>
          </Card>
        </Link>
        <Link href="/conta/favoritos">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Favoritos</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Seus produtos favoritos
            </CardContent>
          </Card>
        </Link>
        <Link href="/conta/perfil">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Perfil</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Edite seus dados
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <Button
          variant="outline"
          onClick={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            router.push('/login');
          }}
        >
          Sair
        </Button>
      </div>
    </div>
  );
}
