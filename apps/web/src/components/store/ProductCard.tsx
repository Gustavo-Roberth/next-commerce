'use client';

import { StaggerContainer, StaggerItem } from '@/components/shared/motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ApiError, api } from '@/lib/api/client';
import type { Produto, ProdutoDestaque } from '@/lib/api/types';
import { notify } from '@/lib/notify';
import { formatCurrency } from '@/lib/utils';
import { motion, useReducedMotion } from 'motion/react';
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
  const reduce = useReducedMotion();

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
      notify.success('Adicionado aos favoritos');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = '/login';
        return;
      }
      notify.error('Não foi possível favoritar o produto');
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <StaggerItem>
      <div className="relative" data-testid="product-card">
        <motion.button
          type="button"
          aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          onClick={toggleFavorite}
          disabled={favLoading}
          {...(reduce ? {} : { whileTap: { scale: 0.85 } })}
          className="absolute top-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white disabled:opacity-60"
        >
          <motion.span
            key={favorited ? 'on' : 'off'}
            initial={reduce ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            aria-hidden
            className={favorited ? 'text-red-500' : 'text-gray-500'}
          >
            {favorited ? '♥' : '♡'}
          </motion.span>
        </motion.button>
        <Link href={`/produtos/${product.slug}`} className="block">
          <Card className="group overflow-hidden transition-all duration-motion-base ease-motion-standard hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
            <div className="relative aspect-square bg-muted overflow-hidden">
              {mainImage ? (
                <Image
                  src={mainImage.url}
                  alt={mainImage.alt_text || product.nome}
                  fill
                  className="object-cover transition-transform duration-motion-slow ease-motion-standard group-hover:scale-105"
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
    </StaggerItem>
  );
}

export function ProductGrid({ products }: { products: (Produto | ProdutoDestaque)[] }) {
  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </StaggerContainer>
  );
}
