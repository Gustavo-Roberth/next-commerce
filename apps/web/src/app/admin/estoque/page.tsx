'use client';

import { DepositoFormDialog } from '@/components/admin/estoque/deposito-form-dialog';
import { InventarioDialog } from '@/components/admin/estoque/inventario-dialog';
import { MovimentoDialog, type VariacaoOption } from '@/components/admin/estoque/movimento-dialog';
import { StockSummary } from '@/components/admin/estoque/stock-summary';
import { TransferenciaDialog } from '@/components/admin/estoque/transferencia-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminApi } from '@/lib/api';
import type { Deposito, EstoqueDashboard, EstoqueItem, Produto } from '@/lib/api/types';
import { hasPerfil } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  ClipboardCheck,
  Edit,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function AdminEstoquePage() {
  const [summary, setSummary] = useState<EstoqueDashboard>();
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [estoques, setEstoques] = useState<EstoqueItem[]>([]);
  const [variacoes, setVariacoes] = useState<VariacaoOption[]>([]);
  const [estoqueLoading, setEstoqueLoading] = useState(true);
  const [estoqueCursor, setEstoqueCursor] = useState<string | null>(null);
  const [estoqueHasMore, setEstoqueHasMore] = useState(false);
  const [estoqueTotal, setEstoqueTotal] = useState(0);

  const [filtroDeposito, setFiltroDeposito] = useState('');
  const [apenasBaixo, setApenasBaixo] = useState(false);
  const [apenasZerado, setApenasZerado] = useState(false);
  const filtroMounted = useRef(false);

  const [depositoDialogOpen, setDepositoDialogOpen] = useState(false);
  const [depositoEditando, setDepositoEditando] = useState<Deposito | null>(null);
  const [movimentoOpen, setMovimentoOpen] = useState(false);
  const [movimentoModo, setMovimentoModo] = useState<'entrada' | 'saida'>('entrada');
  const [transferenciaOpen, setTransferenciaOpen] = useState(false);
  const [inventarioOpen, setInventarioOpen] = useState(false);

  const podeExcluirDeposito = hasPerfil('ADMIN', 'GESTOR');

  const depositoNome = useCallback(
    (id: string) => depositos.find((d) => d.id === id)?.nome ?? '—',
    [depositos]
  );

  const carregarVariacoes = useCallback(async () => {
    try {
      const data = await adminApi.produtos.list({ limit: 200 });
      const opcoes: VariacaoOption[] = [];
      for (const produto of data.data as Produto[]) {
        for (const variacao of produto.variacoes) {
          opcoes.push({
            id: variacao.id,
            label: `${produto.nome} — ${variacao.nome || variacao.sku}`,
          });
        }
      }
      setVariacoes(opcoes);
    } catch (error) {
      console.error('Erro ao carregar variações:', error);
    }
  }, []);

  const carregarEstoques = useCallback(
    async (reset = false) => {
      setEstoqueLoading(true);
      try {
        const novoCursor = reset ? null : estoqueCursor;
        const params: {
          cursor?: string;
          limit: number;
          variacao_id?: string;
          deposito_id?: string;
          apenas_baixo?: boolean;
          apenas_zerado?: boolean;
        } = { limit: 50 };
        if (novoCursor) params.cursor = novoCursor;
        if (filtroDeposito) params.deposito_id = filtroDeposito;
        if (apenasBaixo) params.apenas_baixo = true;
        if (apenasZerado) params.apenas_zerado = true;
        const data = await adminApi.estoque.list(params);
        setEstoques((prev) => (reset ? data.data : [...prev, ...data.data]));
        setEstoqueCursor(data.nextCursor);
        setEstoqueHasMore(!!data.nextCursor);
        setEstoqueTotal(data.total);
      } catch (error) {
        console.error('Erro ao carregar estoque:', error);
      } finally {
        setEstoqueLoading(false);
      }
    },
    [estoqueCursor, filtroDeposito, apenasBaixo, apenasZerado]
  );

  const carregarTudo = useCallback(async () => {
    try {
      const [dashboard, listaDepositos] = await Promise.all([
        adminApi.estoque.dashboard(),
        adminApi.depositos.list(),
      ]);
      setSummary(dashboard);
      setDepositos(listaDepositos);
    } catch (error) {
      console.error('Erro ao carregar dados de estoque:', error);
    } finally {
      setSummaryLoading(false);
    }
    await carregarVariacoes();
    await carregarEstoques(true);
  }, [carregarVariacoes, carregarEstoques]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: carrega uma vez na montagem
  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload controlado por filtroMounted
  useEffect(() => {
    if (!filtroMounted.current) {
      filtroMounted.current = true;
      return;
    }
    carregarEstoques(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroDeposito, apenasBaixo, apenasZerado]);

  const abrirNovoDeposito = () => {
    setDepositoEditando(null);
    setDepositoDialogOpen(true);
  };

  const abrirEditarDeposito = (deposito: Deposito) => {
    setDepositoEditando(deposito);
    setDepositoDialogOpen(true);
  };

  const handleExcluirDeposito = async (deposito: Deposito) => {
    if (!confirm(`Desativar o depósito "${deposito.nome}"?`)) return;
    try {
      await adminApi.depositos.remove(deposito.id);
      setDepositos((prev) => prev.filter((d) => d.id !== deposito.id));
      carregarEstoques(true);
    } catch (error) {
      console.error('Erro ao excluir depósito:', error);
      alert('Erro ao excluir depósito');
    }
  };

  const alertaEstoque = (
    item: EstoqueItem
  ): { label: string; variant: 'destructive' | 'warning' | 'outline' } => {
    if (item.disponivel <= 0) return { label: 'Esgotado', variant: 'destructive' };
    if (item.disponivel <= item.quantidade_minima) return { label: 'Baixo', variant: 'warning' };
    return { label: 'OK', variant: 'outline' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">Gerencie depósitos e movimentações de estoque</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={abrirNovoDeposito}>
            <Plus className="h-4 w-4 mr-2" />
            Novo depósito
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setMovimentoModo('entrada');
              setMovimentoOpen(true);
            }}
          >
            <ArrowDownToLine className="h-4 w-4 mr-2" />
            Entrada
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setMovimentoModo('saida');
              setMovimentoOpen(true);
            }}
          >
            <ArrowUpFromLine className="h-4 w-4 mr-2" />
            Saída
          </Button>
          <Button variant="outline" onClick={() => setTransferenciaOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Transferência
          </Button>
          <Button variant="outline" onClick={() => setInventarioOpen(true)}>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Inventário
          </Button>
        </div>
      </div>

      <StockSummary data={summary} loading={summaryLoading} />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Depósitos</h2>
            <span className="text-sm text-muted-foreground">{depositos.length} cadastrado(s)</span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="text-center">Padrão</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depositos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhum depósito cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  depositos.map((deposito) => (
                    <TableRow key={deposito.id}>
                      <TableCell className="font-medium">{deposito.nome}</TableCell>
                      <TableCell>{deposito.codigo}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {deposito.endereco_completo}
                      </TableCell>
                      <TableCell className="text-center">
                        {deposito.padrao ? (
                          <Badge variant="success">Padrão</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {deposito.ativo ? (
                          <Badge variant="outline">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirEditarDeposito(deposito)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {podeExcluirDeposito && (
                              <DropdownMenuItem
                                onClick={() => handleExcluirDeposito(deposito)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Desativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-lg font-semibold">Saldo por variação</h2>
            <div className="flex flex-wrap items-center gap-4">
              <Select value={filtroDeposito} onValueChange={setFiltroDeposito}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os depósitos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {depositos.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch
                  id="apenas-baixo"
                  checked={apenasBaixo}
                  onCheckedChange={(v) => {
                    setApenasBaixo(v);
                    setApenasZerado(false);
                  }}
                />
                <Label htmlFor="apenas-baixo">Somente baixo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="apenas-zerado"
                  checked={apenasZerado}
                  onCheckedChange={(v) => {
                    setApenasZerado(v);
                    setApenasBaixo(false);
                  }}
                />
                <Label htmlFor="apenas-zerado">Somente zerado</Label>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variação</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead className="text-right">Físico</TableHead>
                  <TableHead className="text-right">Reservado</TableHead>
                  <TableHead className="text-right">Disponível</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Custo médio</TableHead>
                  <TableHead className="text-center">Alerta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estoqueLoading && estoques.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-4">
                      <div className="space-y-3">
                        {['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'].map((key) => (
                          <Skeleton key={key} className="h-8 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : estoques.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      Nenhum item de estoque encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  estoques.map((item) => {
                    const alerta = alertaEstoque(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.variacao?.nome ?? '—'}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.variacao?.sku ?? item.variacao_id}
                          </div>
                        </TableCell>
                        <TableCell>{depositoNome(item.deposito_id)}</TableCell>
                        <TableCell className="text-right">{item.quantidade_fisica}</TableCell>
                        <TableCell className="text-right">{item.quantidade_reservada}</TableCell>
                        <TableCell className="text-right font-medium">{item.disponivel}</TableCell>
                        <TableCell className="text-right">{item.quantidade_minima}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.custo_medio_cents / 100)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={alerta.variant}>{alerta.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {estoqueHasMore && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => carregarEstoques(false)}
                disabled={estoqueLoading}
              >
                {estoqueLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Carregar mais ({estoques.length} de {estoqueTotal})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DepositoFormDialog
        open={depositoDialogOpen}
        onOpenChange={setDepositoDialogOpen}
        deposito={depositoEditando}
        onSaved={() => {
          carregarTudo();
        }}
      />
      <MovimentoDialog
        open={movimentoOpen}
        onOpenChange={setMovimentoOpen}
        modo={movimentoModo}
        depositos={depositos}
        variacoes={variacoes}
        onSaved={() => {
          carregarTudo();
        }}
      />
      <TransferenciaDialog
        open={transferenciaOpen}
        onOpenChange={setTransferenciaOpen}
        depositos={depositos}
        variacoes={variacoes}
        onSaved={() => {
          carregarTudo();
        }}
      />
      <InventarioDialog
        open={inventarioOpen}
        onOpenChange={setInventarioOpen}
        depositos={depositos}
        variacoes={variacoes}
        onSaved={() => {
          carregarTudo();
        }}
      />
    </div>
  );
}
