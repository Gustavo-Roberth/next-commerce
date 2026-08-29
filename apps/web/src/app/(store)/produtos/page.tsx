'use client';

import { ProductCard, ProductGrid } from '@/components/store/ProductCard';
import { categoriasApi, produtosApi } from '@/lib/api/services';
import { useQuery } from '@tanstack/react-query';
import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

const SKELETON_IDS = Array.from({ length: 8 }, (_, i) => `skeleton-${i}`);

function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {SKELETON_IDS.map((id) => (
        <ProductCard
          key={id}
          product={{
            id,
            nome: 'Carregando...',
            slug: 'carregando',
            sku: 'SKU000',
            preco_cents: 0,
            imagens: [],
            descricao_curta: null,
          }}
        />
      ))}
    </div>
  );
}

function ProdutosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get('search') || '';
  const categoria = searchParams.get('categoria') || '';
  const sort = searchParams.get('sort') || '';
  const cursor = searchParams.get('page') || '';
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    router.push(`/produtos?${params.toString()}`);
  };

  const { data: produtos, isLoading: produtosLoading } = useQuery({
    queryKey: ['produtos', search, categoria, sort, cursor],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoria) params.categoria_id = categoria;
      if (cursor) params.cursor = cursor;
      if (sort) params.sort = sort;
      return produtosApi.list(params);
    },
    placeholderData: (previousData) => previousData,
  });

  const { data: categorias, isLoading: _categoriasLoading } = useQuery({
    queryKey: ['categorias', { ativa: true, limit: 50 }],
    queryFn: () => categoriasApi.list({ ativa: true, limit: 50 }),
  });

  const { data: destaquesData, isLoading: destaquesLoading } = useQuery({
    queryKey: ['destaques', 'default-loja-id', 8],
    queryFn: async () => {
      const response = await produtosApi.getDestaques('default-loja-id', 8);
      return response.data;
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <p className="text-muted-foreground mt-1">
          {produtos?.total ?? 0} produto{produtos?.total !== 1 ? 's' : ''} encontrado
          {produtos?.total !== 1 ? 's' : ''}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setFiltersOpen((open) => !open)}
        aria-expanded={filtersOpen}
        aria-controls="filtros-produtos"
        className="lg:hidden mb-4 inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        Filtros
      </button>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside
          id="filtros-produtos"
          className={`lg:col-span-1 space-y-6 ${filtersOpen ? 'block' : 'hidden'} lg:block`}
        >
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Categorias</h3>
              <nav className="space-y-2">
                {categorias?.data
                  ?.filter((c) => !c.pai_id)
                  .map((categoria) => (
                    <a
                      key={categoria.id}
                      href={`/produtos?categoria=${categoria.id}`}
                      className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {categoria.nome} ({categoria._count?.produtos || 0})
                    </a>
                  ))}
              </nav>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Ordenar</h3>
              <label htmlFor="sort" className="sr-only">
                Ordenar produtos
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">Relevância</option>
                <option value="preco_asc">Menor preço</option>
                <option value="preco_desc">Maior preço</option>
                <option value="nome_asc">A-Z</option>
                <option value="nome_desc">Z-A</option>
                <option value="created_desc">Mais recentes</option>
              </select>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-3 space-y-8">
          {!destaquesLoading && (destaquesData?.length ?? 0) > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Em Destaque</h2>
              <ProductGrid products={destaquesData ?? []} />
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Todos os Produtos</h2>
            </div>
            {produtosLoading ? (
              <ProductListSkeleton />
            ) : (produtos?.data?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 border rounded-lg bg-muted/30">
                <SearchX className="h-16 w-16 text-muted-foreground mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold">Nenhum produto encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Não encontramos produtos para os filtros ou busca atuais. Tente ajustar os termos
                  ou limpar os filtros.
                </p>
                <Link
                  href="/produtos"
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Limpar filtros
                </Link>
              </div>
            ) : (
              <ProductGrid products={produtos?.data ?? []} />
            )}

            {produtos?.nextCursor && !produtosLoading && (produtos?.data?.length ?? 0) > 0 && (
              <div className="mt-8 text-center">
                <a
                  href={`/produtos?page=${produtos.nextCursor}`}
                  className="inline-flex items-center gap-2 px-6 py-3 border rounded-md hover:bg-muted transition-colors"
                >
                  Carregar mais
                </a>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProdutosContent />
    </Suspense>
  );
}
