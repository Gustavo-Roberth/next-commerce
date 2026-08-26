'use client';

import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
        <p className="text-muted-foreground">Carregando...</p>
      ) : pedidos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Você ainda não fez nenhum pedido.
            <div className="mt-4">
              <Link href="/produtos" className="text-primary hover:underline">
                Comece a comprar
              </Link>
            </div>
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
