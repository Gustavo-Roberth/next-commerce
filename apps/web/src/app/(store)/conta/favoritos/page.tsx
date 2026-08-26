'use client';

import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Favorito {
  id: string;
  produto: { id: string; nome: string; slug: string };
}

export default function FavoritosPage() {
  const router = useRouter();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    api
      .get<{ data: Favorito[] }>('/client/favoritos')
      .then((res) => setFavoritos(res.data))
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Meus Favoritos</h1>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : favoritos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Você ainda não tem favoritos.
            <div className="mt-4">
              <Link href="/produtos" className="text-primary hover:underline">
                Explorar produtos
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favoritos.map((favorito) => (
            <div key={favorito.id} data-testid="favorite-item">
              <Link href={`/produtos/${favorito.produto.slug}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <p className="font-medium">{favorito.produto.nome}</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
