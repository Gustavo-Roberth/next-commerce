'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api/client';
import type { Produto } from '@/lib/api/types';
import { formatCurrency } from '@/lib/utils';
import { Edit, Loader2, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const statusLabels: Record<string, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  RASCUNHO: 'Rascunho',
  ARQUIVADO: 'Arquivado',
};

const statusColors: Record<string, string> = {
  ATIVO: 'bg-green-100 text-green-800',
  INATIVO: 'bg-gray-100 text-gray-800',
  RASCUNHO: 'bg-yellow-100 text-yellow-800',
  ARQUIVADO: 'bg-red-100 text-red-800',
};

export default function AdminProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProdutos = async (reset = false) => {
    setLoading(true);
    try {
      const newCursor = reset ? null : cursor;
      const data = await api.get<{ data: Produto[]; nextCursor: string | null; total: number }>(
        `/admin/produtos${newCursor ? `?cursor=${newCursor}` : ''}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`
      );
      if (reset) {
        setProdutos(data.data);
      } else {
        setProdutos((prev) => [...prev, ...data.data]);
      }
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      setTotal(data.total);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCursor(null);
    fetchProdutos(true);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCursor(null);
    fetchProdutos(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja arquivar este produto?')) return;

    setDeletingId(id);
    try {
      await api.delete(`/admin/produtos/${id}`);
      setProdutos((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error('Erro ao arquivar produto:', error);
      alert('Erro ao arquivar produto');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoadMore = () => {
    fetchProdutos(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o catálogo de produtos da loja</p>
        </div>
        <Link href="/admin/produtos/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
                <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </form>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && produtos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : produtos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  produtos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {produto.imagens?.[0] ? (
                              <img
                                src={produto.imagens[0].url}
                                alt={produto.nome}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-400">Sem img</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{produto.nome}</p>
                            <p className="text-sm text-muted-foreground">{produto.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{produto.sku}</TableCell>
                      <TableCell>{produto.categoria?.nome || '—'}</TableCell>
                      <TableCell>
                        {produto.variacoes?.[0]?.preco_cents
                          ? formatCurrency(produto.variacoes[0].preco_cents / 100)
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {produto.variacoes?.reduce((acc, v) => acc + (v.ativo ? 1 : 0), 0) || 0}{' '}
                        var.
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={statusColors[produto.status] || 'bg-gray-100 text-gray-800'}
                        >
                          {statusLabels[produto.status] || produto.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/produtos/${produto.id}/editar`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(produto.id)}
                              disabled={deletingId === produto.id}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {deletingId === produto.id ? 'Arquivando...' : 'Arquivar'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                Carregar mais ({produtos.length} de {total})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
