'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api/client';
import { PackageOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6', 'sk-7', 'sk-8'];

interface Pedido {
  id: string;
  numero_sequencial: number;
  status: string;
  total_cents: number;
  created_at: string;
  _count?: { itens: number };
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    CRIADO: 'Criado',
    PAGAMENTO_PENDENTE: 'Pagamento pendente',
    PAGO: 'Pago',
    SEPARANDO: 'Separando',
    ENVIADO: 'Enviado',
    ENTREGUE: 'Entregue',
    CANCELADO: 'Cancelado',
  };
  return map[status] || status;
}

export default function PedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    api
      .get<{ data: Pedido[] }>('/pedidos')
      .then((res) => setPedidos(res.data))
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Meus Pedidos</h1>

      {loading ? (
        <div className="space-y-3">
          {SKELETON_KEYS.slice(0, 4).map((key) => (
            <div key={key} data-testid="order-row">
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : pedidos.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <PackageOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">Você ainda não fez nenhum pedido</h2>
            <p className="mt-1 text-muted-foreground">
              Quando você finalizar uma compra, ela aparecerá aqui.
            </p>
            <Link href="/produtos" className="mt-6">
              <Button>Comece a comprar</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido) => (
            <div key={pedido.id} data-testid="order-row">
              <Link href={`/conta/pedidos/${pedido.id}`} className="block">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold">Pedido #{pedido.numero_sequencial}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(pedido.created_at).toLocaleDateString('pt-BR')} ·{' '}
                        {pedido._count?.itens ?? 0} item(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {(pedido.total_cents / 100).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatStatus(pedido.status)}</p>
                    </div>
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
