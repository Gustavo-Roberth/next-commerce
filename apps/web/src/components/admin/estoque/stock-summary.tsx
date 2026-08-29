'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { EstoqueDashboard } from '@/lib/api/types';
import { AlertTriangle, Boxes, PackageX, Warehouse } from 'lucide-react';

interface StockSummaryProps {
  data?: EstoqueDashboard | undefined;
  loading: boolean;
}

export function StockSummary({ data, loading }: StockSummaryProps) {
  const cards = [
    {
      label: 'Total de itens',
      value: data?.total_itens,
      icon: Boxes,
      tone: 'text-primary',
    },
    {
      label: 'Estoque baixo',
      value: data?.quantidade_baixa,
      icon: AlertTriangle,
      tone: 'text-yellow-600',
    },
    {
      label: 'Esgotados',
      value: data?.quantidade_zerada,
      icon: PackageX,
      tone: 'text-red-600',
    },
    {
      label: 'Unidades físicas',
      value: data?.total_fisico,
      icon: Warehouse,
      tone: 'text-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-lg bg-muted p-3 ${card.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                {loading ? (
                  <Skeleton className="mt-1 h-7 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{card.value ?? 0}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
