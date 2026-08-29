'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils';
import { Package, ShoppingCart, TrendingUp, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6', 'sk-7', 'sk-8'];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, icon, description, trend, trendUp }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{ pedidosPendentes: number; vendasHoje: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.get<{ pedidosPendentes: number; vendasHoje: number }>('/admin/stats');
      setStats(data);
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-40" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {SKELETON_KEYS.slice(0, 4).map((key) => (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-56" />
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-around gap-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="flex flex-col items-center flex-1">
                    <Skeleton className="w-full rounded-t" style={{ height: '60%' }} />
                    <Skeleton className="h-3 w-8 mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {SKELETON_KEYS.slice(0, 6).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da loja</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Vendas Hoje"
          value={stats ? formatCurrency(stats.vendasHoje) : 'R$ 0,00'}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Total de vendas confirmadas hoje"
        />
        <StatCard
          title="Pedidos Pendentes"
          value={stats?.pedidosPendentes ?? 0}
          icon={<ShoppingCart className="h-5 w-5" />}
          description="Pedidos aguardando processamento"
        />
        <StatCard
          title="Produtos Ativos"
          value="—"
          icon={<Package className="h-5 w-5" />}
          description="Produtos disponíveis para venda"
        />
        <StatCard
          title="Entregas em Trânsito"
          value="—"
          icon={<Truck className="h-5 w-5" />}
          description="Pedidos enviados aguardando entrega"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-around gap-2">
              {(() => {
                const demoHeights = [40, 65, 50, 80, 35, 90, 60];
                return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                  <div key={day} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{ height: `${demoHeights[index]}%` }}
                    />
                    <span className="text-xs text-muted-foreground mt-2">{day}</span>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Pagamento Pendente', value: 12, color: 'bg-yellow-500' },
                { label: 'Pago', value: 8, color: 'bg-blue-500' },
                { label: 'Separando', value: 5, color: 'bg-purple-500' },
                { label: 'Enviado', value: 3, color: 'bg-indigo-500' },
                { label: 'Entregue', value: 25, color: 'bg-green-500' },
                { label: 'Cancelado', value: 2, color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-24 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${item.value * 3}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/admin/produtos/novo"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
            >
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Novo Produto</p>
                <p className="text-sm text-muted-foreground">Cadastrar produto no catálogo</p>
              </div>
            </a>
            <a
              href="/admin/pedidos"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Ver Pedidos</p>
                <p className="text-sm text-muted-foreground">Gerenciar pedidos pendentes</p>
              </div>
            </a>
            <a
              href="/admin/produtos"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
            >
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Catálogo de Produtos</p>
                <p className="text-sm text-muted-foreground">Ver e editar produtos existentes</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
