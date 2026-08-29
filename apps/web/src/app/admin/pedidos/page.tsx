'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api/client';
import type { Pedido } from '@/lib/api/types';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, Clock, CreditCard, Eye, Package, Search, Truck, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6', 'sk-7', 'sk-8'];

const statusLabels: Record<string, string> = {
  CRIADO: 'Criado',
  PAGAMENTO_PENDENTE: 'Pagamento Pendente',
  PAGO: 'Pago',
  SEPARANDO: 'Separando',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const statusColors: Record<string, string> = {
  CRIADO: 'bg-blue-100 text-blue-800',
  PAGAMENTO_PENDENTE: 'bg-yellow-100 text-yellow-800',
  PAGO: 'bg-green-100 text-green-800',
  SEPARANDO: 'bg-purple-100 text-purple-800',
  ENVIADO: 'bg-indigo-100 text-indigo-800',
  ENTREGUE: 'bg-muted text-foreground',
  CANCELADO: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ReactNode> = {
  CRIADO: <Clock className="h-4 w-4" />,
  PAGAMENTO_PENDENTE: <CreditCard className="h-4 w-4" />,
  PAGO: <CheckCircle className="h-4 w-4" />,
  SEPARANDO: <Package className="h-4 w-4" />,
  ENVIADO: <Truck className="h-4 w-4" />,
  ENTREGUE: <CheckCircle className="h-4 w-4" />,
  CANCELADO: <XCircle className="h-4 w-4" />,
};

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const fetchPedidos = async (reset = false) => {
    setLoading(true);
    try {
      const newCursor = reset ? null : cursor;
      let url = `/admin/pedidos?limit=20${newCursor ? `&cursor=${newCursor}` : ''}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (dataInicio) url += `&data_inicio=${dataInicio}`;
      if (dataFim) url += `&data_fim=${dataFim}`;
      const data = await api.get<{ data: Pedido[]; nextCursor: string | null; total: number }>(url);
      if (reset) {
        setPedidos(data.data);
      } else {
        setPedidos((prev) => [...prev, ...data.data]);
      }
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      setTotal(data.total);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCursor(null);
    fetchPedidos(true);
  };

  const handleFilterChange = () => {
    setCursor(null);
    fetchPedidos(true);
  };

  const handleLoadMore = () => {
    fetchPedidos(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie os pedidos da loja</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por ID, cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="CRIADO">Criado</SelectItem>
                <SelectItem value="PAGAMENTO_PENDENTE">Pagamento Pendente</SelectItem>
                <SelectItem value="PAGO">Pago</SelectItem>
                <SelectItem value="SEPARANDO">Separando</SelectItem>
                <SelectItem value="ENVIADO">Enviado</SelectItem>
                <SelectItem value="ENTREGUE">Entregue</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => {
                  setDataInicio(e.target.value);
                  handleFilterChange();
                }}
                placeholder="Data início"
                className="w-[160px]"
              />
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => {
                  setDataFim(e.target.value);
                  handleFilterChange();
                }}
                placeholder="Data fim"
                className="w-[160px]"
              />
            </div>
          </form>

          <div className="overflow-x-auto">
            <Table data-testid="orders-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && pedidos.length === 0 ? (
                  <TableRow data-testid="order-row">
                    <TableCell colSpan={7} className="py-4">
                      <div className="space-y-3">
                        {SKELETON_KEYS.slice(0, 5).map((key) => (
                          <div key={key} className="flex items-center gap-4">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-28 rounded-full" />
                            <Skeleton className="h-6 w-32 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded" />
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pedidos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  pedidos.map((pedido) => (
                    <TableRow key={pedido.id} data-testid="order-row">
                      <TableCell>
                        <div>
                          <p className="font-medium">#{pedido.numero_sequencial}</p>
                          <p className="text-sm text-muted-foreground">
                            {pedido.id.slice(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{pedido.cliente_id.slice(0, 8)}...</p>
                        <p className="text-sm text-muted-foreground">
                          {pedido.endereco_entrega?.cidade}, {pedido.endereco_entrega?.uf}
                        </p>
                      </TableCell>
                      <TableCell>{formatDate(pedido.created_at)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(pedido.total_cents / 100)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={statusColors[pedido.status] || 'bg-muted text-foreground'}
                        >
                          <span className="flex items-center gap-1">
                            {statusIcons[pedido.status]}
                            {statusLabels[pedido.status] || pedido.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {pedido.pagamentos?.[0] && (
                          <Badge
                            className={
                              pedido.pagamentos[0].status === 'APROVADO'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {pedido.pagamentos[0].metodo} - {pedido.pagamentos[0].status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/pedidos/${pedido.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                Carregar mais ({pedidos.length} de {total})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
