import { ProductCard, ProductGrid } from '@/components/store/ProductCard';
import { categoriasApi, produtosApi } from '@/lib/api/services';
import type {
  CategoriasListResponse,
  ProdutoDestaque,
  ProdutosListResponse,
} from '@/lib/api/types';
import { Suspense } from 'react';

interface Props {
  searchParams: Promise<{
    search?: string;
    categoria?: string;
    page?: string;
    sort?: string;
  }>;
}

async function getProdutos(searchParams: {
  search?: string;
  categoria?: string;
  page?: string;
  sort?: string;
}): Promise<ProdutosListResponse> {
  const params: Record<string, string> = {};
  if (searchParams.search) params.search = searchParams.search;
  if (searchParams.categoria) params.categoria_id = searchParams.categoria;
  if (searchParams.page) params.cursor = searchParams.page;
  if (searchParams.sort) params.sort = searchParams.sort;

  return produtosApi.list(params);
}

async function getCategorias(): Promise<CategoriasListResponse> {
  return categoriasApi.list({ ativa: true, limit: 50 });
}

async function getDestaques(): Promise<ProdutoDestaque[]> {
  const loja_id = 'default-loja-id'; // TODO: get from context
  const response = await produtosApi.getDestaques(loja_id, 8);
  return response.data;
}

function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCard
          key={i}
          product={{
            id: `skeleton-${i}`,
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

export default async function ProdutosPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const [produtos, categorias, destaques] = await Promise.all([
    getProdutos(resolvedSearchParams),
    getCategorias(),
    getDestaques(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <p className="text-muted-foreground mt-1">
          {produtos.total} produto{produtos.total !== 1 ? 's' : ''} encontrado
          {produtos.total !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Categorias</h3>
              <nav className="space-y-2">
                {categorias.data
                  .filter((c) => !c.pai_id)
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
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                onChange={(e) => {
                  const params = new URLSearchParams(window.location.search);
                  if (e.target.value) {
                    params.set('sort', e.target.value);
                  } else {
                    params.delete('sort');
                  }
                  window.location.search = params.toString();
                }}
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
          {destaques.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Em Destaque</h2>
              <ProductGrid products={destaques} />
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Todos os Produtos</h2>
            </div>
            <Suspense fallback={<ProductListSkeleton />}>
              <ProductGrid products={produtos.data} />
            </Suspense>

            {produtos.nextCursor && (
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
