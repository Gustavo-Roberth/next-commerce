'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { adminApi } from '@/lib/api/services';
import type { Categoria } from '@/lib/api/types';

const statusColors: Record<string, string> = {
  true: 'bg-green-100 text-green-800',
  false: 'bg-gray-100 text-gray-800',
};

export default function AdminCategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [ativaFilter, setAtivaFilter] = useState<boolean | ''>('');
  const [paiFilter, setPaiFilter] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCategorias = async (reset = false) => {
    setLoading(true);
    try {
      const newCursor = reset ? undefined : cursor;
      const params: {
        cursor?: string;
        limit: number;
        search?: string;
        ativa?: boolean;
        pai_id?: string;
      } = {
        limit: 20,
      };
      if (newCursor) params.cursor = newCursor;
      if (search) params.search = search;
      if (ativaFilter) params.ativa = ativaFilter;
      if (paiFilter) params.pai_id = paiFilter;

      const data = await adminApi.categorias.list(params);
      if (reset) {
        setCategorias(data.data);
      } else {
        setCategorias((prev) => [...prev, ...data.data]);
      }
      setCursor(data.nextCursor ?? undefined);
      setHasMore(!!data.nextCursor);
      setTotal(data.total);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCursor(undefined);
    fetchCategorias(true);
  };

  const handleFilterChange = () => {
    setCursor(undefined);
    fetchCategorias(true);
  };

  const handleLoadMore = () => {
    fetchCategorias(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    setDeletingId(id);
    try {
      await adminApi.categorias.delete(id);
      setCategorias((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      alert('Erro ao excluir categoria');
    } finally {
      setDeletingId(null);
    }
  };

  const buildTree = (categories: Categoria[], parentId: string | null = null, level = 0): React.ReactNode[] => {
    return categories
      .filter((c) => c.pai_id === parentId)
      .map((categoria) => (
        <TableRow key={categoria.id} style={{ paddingLeft: `${level * 20 + 16}px` }}>
          <TableCell>
            <div className="flex items-center gap-2">
              {level > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <span className="font-medium">{categoria.nome}</span>
            </div>
          </TableCell>
          <TableCell>{categoria.slug}</TableCell>
          <TableCell>{categoria.descricao || '—'}</TableCell>
          <TableCell className="text-center">
            <Badge className={statusColors[String(categoria.ativa)]}>
              {categoria.ativa ? 'Ativa' : 'Inativa'}
            </Badge>
          </TableCell>
          <TableCell>{categoria._count?.produtos || 0}</TableCell>
          <TableCell>{categoria._count?.filhos || 0}</TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/categorias/${categoria.id}/editar`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(categoria.id)}
                  disabled={deletingId === categoria.id}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deletingId === categoria.id ? 'Excluindo...' : 'Excluir'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
          {buildTree(categories, categoria.id, level + 1)}
        </TableRow>
      ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">Gerencie as categorias de produtos da loja</p>
        </div>
        <Link href="/admin/categorias/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
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
                placeholder="Buscar por nome, slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={ativaFilter === true ? 'true' : ativaFilter === false ? 'false' : ''} onValueChange={(v) => { setAtivaFilter(v === 'true' ? true : v === 'false' ? false : ''); handleFilterChange(); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="true">Ativas</SelectItem>
                <SelectItem value="false">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </form>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Produtos</TableHead>
                  <TableHead className="text-center">Subcategorias</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && categorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : categorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma categoria encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  buildTree(categorias)
                )}
              </TableBody>
            </Table>
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                Carregar mais ({categorias.length} de {total})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}