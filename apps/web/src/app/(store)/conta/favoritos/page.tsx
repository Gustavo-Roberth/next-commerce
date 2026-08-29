'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api/client';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6', 'sk-7', 'sk-8'];

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKELETON_KEYS.slice(0, 6).map((key) => (
            <div key={key} data-testid="favorite-item">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="aspect-square w-full rounded-md" />
                  <Skeleton className="h-5 w-3/4" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : favoritos.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">Você ainda não tem favoritos</h2>
            <p className="mt-1 text-muted-foreground">
              Salve os produtos que você ama para encontrá-los facilmente depois.
            </p>
            <Link href="/produtos" className="mt-6">
              <Button>Explorar produtos</Button>
            </Link>
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
