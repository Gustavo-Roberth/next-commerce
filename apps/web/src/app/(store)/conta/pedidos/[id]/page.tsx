'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api/client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6', 'sk-7', 'sk-8'];

interface PedidoItem {
  id: string;
  nome_produto: string;
  sku: string;
  quantidade: number;
  preco_unitario_cents: number;
  total_cents: number;
}

interface PedidoEvento {
  id: string;
  tipo: string;
  descricao: string;
  created_at: string;
}

interface Pedido {
  id: string;
  numero_sequencial: number;
  status: string;
  total_cents: number;
  subtotal_cents: number;
  frete_cents: number;
  desconto_cents: number;
  created_at: string;
  itens: PedidoItem[];
  eventos: PedidoEvento[];
}

export default function PedidoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    api
      .get<Pedido>(`/pedidos/${params.id}`)
      .then(setPedido)
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent data-testid="order-items" className="space-y-3">
                {SKELETON_KEYS.slice(0, 3).map((key) => (
                  <div key={key} className="flex justify-between border-b pb-3 last:border-0">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent data-testid="order-timeline" className="space-y-3">
                {SKELETON_KEYS.slice(0, 3).map((key) => (
                  <div key={key} className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return <div className="container mx-auto px-4 py-8">Pedido não encontrado.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pedido #{pedido.numero_sequencial}</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Itens do pedido</CardTitle>
            </CardHeader>
            <CardContent data-testid="order-items" className="space-y-3">
              {pedido.itens.map((item) => (
                <div key={item.id} className="flex justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{item.nome_produto}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantidade} x{' '}
                      {(item.preco_unitario_cents / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {(item.total_cents / 100).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {(pedido.subtotal_cents / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span>
                  {(pedido.frete_cents / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total</span>
                <span>
                  {(pedido.total_cents / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent data-testid="order-timeline" className="space-y-3">
              {pedido.eventos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem eventos registrados.</p>
              ) : (
                pedido.eventos.map((evento) => (
                  <div key={evento.id} className="border-l-2 border-primary pl-3">
                    <p className="text-sm font-medium">{evento.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(evento.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
