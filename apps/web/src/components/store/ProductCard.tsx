'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ApiError, api } from '@/lib/api/client';
import type { Produto, ProdutoDestaque } from '@/lib/api/types';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ProductCardProps {
  product: Produto | ProdutoDestaque;
}

export function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.imagens.find((img) => img.principal) || product.imagens[0];
  const isDestaque = 'preco_cents' in product;
  const firstVariacao = 'variacoes' in product ? product.variacoes?.[0] : undefined;
  const price = isDestaque
    ? (product.preco_cents ?? 0) / 100
    : firstVariacao?.preco_cents
      ? firstVariacao.preco_cents / 100
      : 0;
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    try {
      await api.post('/client/favoritos', {
        produto_id: product.id,
        variacao_id: firstVariacao?.id ?? null,
      });
      setFavorited(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = '/login';
        return;
      }
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <div className="relative" data-testid="product-card">
      <button
        type="button"
        aria-label="Adicionar aos favoritos"
        onClick={toggleFavorite}
        disabled={favLoading}
        className="absolute top-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
      >
        <span aria-hidden>{favorited ? '♥' : '♡'}</span>
      </button>
      <Link href={`/produtos/${product.slug}`} className="block">
        <Card className="overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
          <div className="relative aspect-square bg-muted overflow-hidden">
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={mainImage.alt_text || product.nome}
                fill
                className="object-cover transition-transform hover:scale-105 duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Sem imagem
              </div>
            )}
            {firstVariacao?.preco_cents !== null && (
              <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground">
                {formatCurrency(price)}
              </Badge>
            )}
          </div>
          <CardContent className="p-4 flex-1 flex flex-col">
            <h3 className="font-semibold text-sm line-clamp-2 mb-2">{product.nome}</h3>
            {product.descricao_curta && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
                {product.descricao_curta}
              </p>
            )}
          </CardContent>
          <CardFooter className="p-0 px-4 pb-4">
            <Button className="w-full" variant="outline" size="sm">
              Ver detalhes
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
}

export function ProductGrid({ products }: { products: (Produto | ProdutoDestaque)[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
