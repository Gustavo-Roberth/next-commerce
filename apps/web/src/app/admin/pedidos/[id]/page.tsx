'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import type { Pedido } from '@/lib/api/types';
import { formatCurrency } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Mail,
  MapPin,
  Package,
  Save,
  Truck,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

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
  ENTREGUE: 'bg-gray-100 text-gray-800',
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

const validTransitions: Record<string, string[]> = {
  CRIADO: ['PAGAMENTO_PENDENTE', 'CANCELADO'],
  PAGAMENTO_PENDENTE: ['PAGO', 'CANCELADO'],
  PAGO: ['SEPARANDO', 'CANCELADO'],
  SEPARANDO: ['ENVIADO', 'CANCELADO'],
  ENVIADO: ['ENTREGUE', 'CANCELADO'],
  ENTREGUE: [],
  CANCELADO: [],
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminPedidoDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const pedidoId = params.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [error, setError] = useState('');

  const fetchPedido = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Pedido>(`/admin/pedidos/${pedidoId}`);
      setPedido(data);
      setNewStatus(data.status);
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      setError('Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    fetchPedido();
  }, [fetchPedido]);

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === pedido?.status) return;
    setError('');
    setUpdating(true);

    try {
      await api.put(`/admin/pedidos/${pedidoId}/status`, {
        status: newStatus,
        observacoes_internas: observacoes,
      });
      router.refresh();
    } catch (err) {
      setError((err as { data?: { error?: string } })?.data?.error ?? 'Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {SKELETON_KEYS.slice(0, 4).map((key) => (
                    <div key={key} className="flex items-center gap-4 p-3 border rounded-lg">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full rounded-lg" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SKELETON_KEYS.slice(0, 3).map((key) => (
                    <div key={key} className="flex gap-3">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <div className="flex-1 space-y-2 pt-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!pedido || error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Pedido não encontrado</h2>
        <p className="text-muted-foreground mt-2">{error || 'O pedido solicitado não existe'}</p>
        <Link
          href="/admin/pedidos"
          className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para pedidos
        </Link>
      </div>
    );
  }

  const pagamento = pedido.pagamentos?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/pedidos" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Pedido #{pedido.numero_sequencial}
            </h1>
            <Badge className={statusColors[pedido.status] || 'bg-gray-100 text-gray-800'}>
              <span className="flex items-center gap-1">
                {statusIcons[pedido.status]}
                {statusLabels[pedido.status] || pedido.status}
              </span>
            </Badge>
          </div>
          <p className="text-muted-foreground">
            ID: {pedido.id} • {formatDate(pedido.created_at)}
          </p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-600 text-sm">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pedido.itens.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.variacao?.imagens?.[0] ? (
                        <img
                          src={item.variacao.imagens[0].url}
                          alt={item.nome_produto}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.nome_produto}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      <p className="text-sm text-muted-foreground">
                        Qtd: {item.quantidade} × {formatCurrency(item.preco_unitario_cents / 100)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.total_cents / 100)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>
                    Subtotal ({pedido.itens.reduce((acc, item) => acc + item.quantidade, 0)} itens)
                  </span>
                  <span>{formatCurrency(pedido.subtotal_cents / 100)}</span>
                </div>
                {pedido.desconto_cents > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>- {formatCurrency(pedido.desconto_cents / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>
                    {pedido.frete_cents > 0 ? formatCurrency(pedido.frete_cents / 100) : 'Grátis'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(pedido.total_cents / 100)}</span>
                </div>
              </div>

              {pedido.cupom && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Cupom aplicado:</span> {pedido.cupom.codigo} (
                    {pedido.cupom.nome})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pagamento ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Badge
                      className={
                        pagamento.status === 'APROVADO'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {pagamento.status}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {pagamento.metodo} via {pagamento.gateway}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pagamento.parcelas}x de{' '}
                        {formatCurrency(pagamento.valor_cents / pagamento.parcelas / 100)}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      {formatCurrency(pagamento.valor_cents / 100)}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Gateway</p>
                      <p className="font-medium">{pagamento.gateway}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Parcelas</p>
                      <p className="font-medium">{pagamento.parcelas}x</p>
                    </div>
                    {pagamento.juros_cents > 0 && (
                      <div>
                        <p className="text-muted-foreground">Juros</p>
                        <p className="font-medium text-red-600">
                          {formatCurrency(pagamento.juros_cents / 100)}
                        </p>
                      </div>
                    )}
                    {pagamento.aprovado_em && (
                      <div>
                        <p className="text-muted-foreground">Aprovado em</p>
                        <p className="font-medium">{formatDate(pagamento.aprovado_em)}</p>
                      </div>
                    )}
                    {pagamento.gateway_transaction_id && (
                      <div className="md:col-span-2">
                        <p className="text-muted-foreground">ID da Transação</p>
                        <p className="font-medium text-xs">{pagamento.gateway_transaction_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum pagamento registrado</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pedido.eventos?.map((evento) => (
                  <div key={evento.id} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div className="h-full w-0.5 bg-gray-200" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{evento.descricao}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(evento.created_at)}
                        </p>
                      </div>
                      {evento.metadata && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(evento.metadata)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Alterar Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Novo Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus} disabled={updating}>
                  <SelectTrigger>
                    <SelectValue placeholder={statusLabels[pedido.status]} />
                  </SelectTrigger>
                  <SelectContent>
                    {validTransitions[pedido.status]?.map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          {statusIcons[status]}
                          {statusLabels[status]}
                        </div>
                      </SelectItem>
                    ))}
                    {validTransitions[pedido.status]?.length === 0 && (
                      <SelectItem disabled value="">
                        Nenhuma transição disponível
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Internas (opcional)</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Motivo da alteração, notas internas..."
                  rows={3}
                  disabled={updating}
                />
              </div>

              <Button
                onClick={handleStatusChange}
                disabled={
                  updating ||
                  !newStatus ||
                  newStatus === pedido.status ||
                  validTransitions[pedido.status]?.length === 0
                }
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {updating ? 'Atualizando...' : 'Atualizar Status'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="font-medium">ID:</span> {pedido.cliente_id}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {pedido.endereco_entrega && (
                <>
                  <p>
                    {pedido.endereco_entrega.logradouro}, {pedido.endereco_entrega.numero}
                  </p>
                  {pedido.endereco_entrega.complemento && (
                    <p>{pedido.endereco_entrega.complemento}</p>
                  )}
                  <p>{pedido.endereco_entrega.bairro}</p>
                  <p>
                    {pedido.endereco_entrega.cidade} - {pedido.endereco_entrega.uf}
                  </p>
                  <p>CEP: {pedido.endereco_entrega.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}</p>
                </>
              )}
            </CardContent>
          </Card>

          {pedido.endereco_cobranca &&
            pedido.endereco_cobranca.id !== pedido.endereco_entrega?.id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço de Cobrança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>
                    {pedido.endereco_cobranca.logradouro}, {pedido.endereco_cobranca.numero}
                  </p>
                  {pedido.endereco_cobranca.complemento && (
                    <p>{pedido.endereco_cobranca.complemento}</p>
                  )}
                  <p>{pedido.endereco_cobranca.bairro}</p>
                  <p>
                    {pedido.endereco_cobranca.cidade} - {pedido.endereco_cobranca.uf}
                  </p>
                  <p>CEP: {pedido.endereco_cobranca.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}</p>
                </CardContent>
              </Card>
            )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Datas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{formatDate(pedido.created_at)}</span>
              </div>
              {pedido.pago_em && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pago em</span>
                  <span>{formatDate(pedido.pago_em)}</span>
                </div>
              )}
              {pedido.enviado_em && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enviado em</span>
                  <span>{formatDate(pedido.enviado_em)}</span>
                </div>
              )}
              {pedido.entregue_em && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entregue em</span>
                  <span>{formatDate(pedido.entregue_em)}</span>
                </div>
              )}
              {pedido.cancelado_em && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cancelado em</span>
                  <span>{formatDate(pedido.cancelado_em)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
