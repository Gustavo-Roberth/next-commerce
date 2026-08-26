'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Package, ShoppingCart, TrendingUp, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';

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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, _index) => (
                <div key={day} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                    style={{ height: `${Math.random() * 100 + 20}%` }}
                  />
                  <span className="text-xs text-muted-foreground mt-2">{day}</span>
                </div>
              ))}
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
                    <div className="h-4 w-24 bg-gray-200 rounded-full overflow-hidden">
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
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Novo Produto</p>
                <p className="text-sm text-muted-foreground">Cadastrar produto no catálogo</p>
              </div>
            </a>
            <a
              href="/admin/pedidos"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Ver Pedidos</p>
                <p className="text-sm text-muted-foreground">Gerenciar pedidos pendentes</p>
              </div>
            </a>
            <a
              href="/admin/produtos"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
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
