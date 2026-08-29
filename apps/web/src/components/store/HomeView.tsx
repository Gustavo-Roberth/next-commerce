'use client';

import { FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/motion';
import { ProductGrid } from '@/components/store/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { categoriasApi, produtosApi } from '@/lib/api/services';
import type { Categoria, ProdutoDestaque } from '@/lib/api/types';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';

const LOJA_ID = 'default-loja-id';

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="container relative mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <span className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              Sua loja online completa
            </span>
          </FadeIn>
          <FadeIn transition={{ duration: 0.4, delay: 0.08 }}>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl">
              Tudo o que você ama, <span className="text-primary">em um só lugar</span>
            </h1>
          </FadeIn>
          <FadeIn transition={{ duration: 0.4, delay: 0.16 }}>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Descubra produtos selecionados, preços justos e uma experiência de compra simples e
              segura.
            </p>
          </FadeIn>
          <FadeIn transition={{ duration: 0.4, delay: 0.24 }}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/produtos">Explorar produtos</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/carrinho">Ver carrinho</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ categoria }: { categoria: Categoria }) {
  const firstLetter = categoria.nome.charAt(0);
  return (
    <StaggerItem>
      <Link
        href={`/produtos?categoria=${categoria.id}`}
        className="group block overflow-hidden rounded-lg border bg-card transition-all duration-motion-base ease-motion-standard hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="relative aspect-[4/3] bg-muted">
          {categoria.imagem_url ? (
            <Image
              src={categoria.imagem_url}
              alt={categoria.nome}
              fill
              className="object-cover transition-transform duration-motion-slow ease-motion-standard group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl font-bold text-muted-foreground/40">
              {firstLetter}
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="truncate text-sm font-semibold">{categoria.nome}</h3>
        </div>
      </Link>
    </StaggerItem>
  );
}

const CATEGORY_SKELETON_IDS = Array.from({ length: 5 }, (_, i) => `cat-skeleton-${i}`);

function CategorySkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {CATEGORY_SKELETON_IDS.map((id) => (
        <div key={id} className="overflow-hidden rounded-lg border">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="p-3">
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategorySection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['home', 'categorias', { ativa: true, limit: 12 }],
    queryFn: () => categoriasApi.list({ ativa: true, limit: 12 }),
  });

  const categorias = data?.data ?? [];

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <FadeIn>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Compre por categoria</h2>
            <p className="mt-1 text-muted-foreground">Encontre exatamente o que você procura</p>
          </div>
          <Link
            href="/produtos"
            className="hidden text-sm font-medium text-primary hover:underline sm:inline-flex"
          >
            Ver todas
          </Link>
        </div>
      </FadeIn>

      {isError ? (
        <p className="text-sm text-muted-foreground">Não foi possível carregar as categorias.</p>
      ) : isLoading ? (
        <CategorySkeletonGrid />
      ) : categorias.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma categoria disponível no momento.</p>
      ) : (
        <StaggerContainer className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categorias.map((categoria) => (
            <CategoryCard key={categoria.id} categoria={categoria} />
          ))}
        </StaggerContainer>
      )}
    </section>
  );
}

const PRODUCT_SKELETON_IDS = Array.from({ length: 8 }, (_, i) => `prod-skeleton-${i}`);

function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {PRODUCT_SKELETON_IDS.map((id) => (
        <div key={id} className="overflow-hidden rounded-lg border">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DestaquesSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['home', 'destaques', LOJA_ID, 8],
    queryFn: async (): Promise<ProdutoDestaque[]> => {
      const response = await produtosApi.getDestaques(LOJA_ID, 8);
      return response.data;
    },
  });

  const produtos = data ?? [];

  return (
    <section className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <FadeIn>
          <div className="mb-8">
            <h2 className="text-2xl font-bold md:text-3xl">Destaques da loja</h2>
            <p className="mt-1 text-muted-foreground">
              Seleção especial com os produtos mais amados
            </p>
          </div>
        </FadeIn>

        {isError ? (
          <p className="text-sm text-muted-foreground">Não foi possível carregar os destaques.</p>
        ) : isLoading ? (
          <ProductSkeletonGrid />
        ) : produtos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum destaque no momento.</p>
        ) : (
          <ProductGrid products={produtos} />
        )}
      </div>
    </section>
  );
}

export function HomeView() {
  return (
    <>
      <Hero />
      <CategorySection />
      <DestaquesSection />
    </>
  );
}
