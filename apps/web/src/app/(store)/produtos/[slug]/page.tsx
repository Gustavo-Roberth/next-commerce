'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiError } from '@/lib/api/client';
import { carrinhoApi, produtosApi } from '@/lib/api/services';
import type { Produto, ProdutoImagem, ProdutoVariacao } from '@/lib/api/types';
import { notify } from '@/lib/notify';
import { formatCurrency } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ShoppingCart } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { useState } from 'react';

interface Props {
  params: Promise<{ slug: string }>;
}

function ImageGallery({ images }: { images: ProdutoImagem[] }) {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<ProdutoImagem | null>(
    images.find((img) => img.principal) ?? images[0] ?? null
  );
  const mainImage = selected ?? images[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mainImage?.id ?? 'empty'}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            {...(reduce ? {} : { exit: { opacity: 0 } })}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={mainImage.alt_text || 'Produto'}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Sem imagem
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img) => (
            <button
              type="button"
              key={img.id}
              onClick={() => setSelected(img)}
              aria-label={`Ver imagem: ${img.alt_text || `imagem ${img.id}`}`}
              className={`relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                mainImage?.id === img.id
                  ? 'border-primary'
                  : 'border-transparent hover:border-muted'
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt_text || ''}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductInfo({
  product,
  selected,
}: {
  product: Produto;
  selected: ProdutoVariacao | undefined;
}) {
  const reduce = useReducedMotion();
  const [adding, setAdding] = useState(false);
  const price = selected?.preco_cents ? selected.preco_cents / 100 : 0;

  async function handleAddToCart() {
    if (!selected) {
      notify.error('Selecione uma variação');
      return;
    }
    setAdding(true);
    try {
      await carrinhoApi.addItem({ variacao_id: selected.id, quantidade: 1 });
      notify.success('Adicionado ao carrinho');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = '/login';
        return;
      }
      notify.error('Não foi possível adicionar ao carrinho');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{product.categoria?.nome}</Badge>
        <Badge variant={product.destaque ? 'default' : 'secondary'}>
          {product.destaque ? 'Destaque' : 'Normal'}
        </Badge>
      </div>

      <h1 className="text-3xl font-bold">{product.nome}</h1>

      <motion.div
        key={price}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="text-3xl font-bold text-primary"
      >
        {formatCurrency(price)}
      </motion.div>

      {product.descricao_curta && (
        <p className="text-muted-foreground">{product.descricao_curta}</p>
      )}

      {selected && (
        <p className="text-sm text-muted-foreground">
          Variação selecionada: <span className="font-medium text-foreground">{selected.nome}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button className="w-full sm:w-auto" size="lg" onClick={handleAddToCart} disabled={adding}>
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          Adicionar ao Carrinho
        </Button>
        <Button variant="outline" className="w-full sm:w-auto">
          Comprar agora
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium">SKU:</span>
          <span>{product.sku}</span>
        </div>
        {product.codigo_barras && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Cód. Barras:</span>
            <span>{product.codigo_barras}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <Badge variant="secondary">{product.status}</Badge>
        </div>
      </div>
    </div>
  );
}

function ProductVariations({
  variacoes,
  selectedId,
  onSelect,
}: {
  variacoes: ProdutoVariacao[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Variações disponíveis</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {variacoes
          .filter((v) => v.ativo)
          .map((variacao) => (
            <div
              key={variacao.id}
              className={`border rounded-lg p-4 transition-colors ${
                selectedId === variacao.id
                  ? 'border-primary ring-1 ring-primary'
                  : 'hover:border-primary/50'
              }`}
            >
              <h4 className="font-medium">{variacao.nome}</h4>
              <p className="text-sm text-muted-foreground">{variacao.sku}</p>
              {variacao.preco_cents !== null && (
                <p className="text-lg font-bold text-primary mt-2">
                  {formatCurrency(variacao.preco_cents / 100)}
                </p>
              )}
              {variacao.atributos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {variacao.atributos.map((attr) => (
                    <span
                      key={attr.atributo_id}
                      className="px-2 py-1 text-xs bg-muted rounded-full"
                    >
                      {attr.nome}: {attr.valor}
                    </span>
                  ))}
                </div>
              )}
              <Button
                variant={selectedId === variacao.id ? 'default' : 'outline'}
                className="mt-4 w-full"
                size="sm"
                onClick={() => onSelect(variacao.id)}
              >
                {selectedId === variacao.id ? 'Selecionado' : 'Selecionar'}
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
}

function ProductDescription({ product }: { product: Produto }) {
  return (
    <div className="prose prose-muted max-w-none">
      {product.descricao_completa ? (
        <div
          /* biome-ignore lint/security/noDangerouslySetInnerHtml: conteúdo HTML confiável (rich text do admin) */
          dangerouslySetInnerHTML={{ __html: product.descricao_completa }}
        />
      ) : (
        <p className="text-muted-foreground">Descrição completa não disponível.</p>
      )}
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="grid lg:grid-cols-2 gap-8">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ProdutoDetalhePage({ params }: Props) {
  const { slug } = await params;

  const { data, isLoading, error } = useQuery({
    queryKey: ['produto', slug, 'default-loja-id'],
    queryFn: async () => {
      try {
        return await produtosApi.getBySlug(slug, 'default-loja-id');
      } catch {
        return null;
      }
    },
  });

  const initialVariationId = data?.variacoes.find((v) => v.ativo)?.id;
  const [selectedId, setSelectedId] = useState<string | undefined>(initialVariationId);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !data) {
    notFound();
  }

  const product = data;
  const selected = product.variacoes.find((v) => v.id === selectedId) ?? product.variacoes[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <a href="/" className="hover:text-primary">
              Home
            </a>
          </li>
          <li className="text-muted-foreground">/</li>
          <li>
            <a href="/produtos" className="hover:text-primary">
              Produtos
            </a>
          </li>
          <li className="text-muted-foreground">/</li>
          <li className="font-medium text-foreground">{product.nome}</li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        <ImageGallery images={product.imagens} />
        <ProductInfo product={product} selected={selected} />
      </div>

      <div className="mt-12">
        <Tabs defaultValue="descricao" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="descricao">Descrição</TabsTrigger>
            <TabsTrigger value="variacoes">Variações</TabsTrigger>
            <TabsTrigger value="especificacoes">Especificações</TabsTrigger>
          </TabsList>
          <TabsContent value="descricao" className="mt-4">
            <ProductDescription product={product} />
          </TabsContent>
          <TabsContent value="variacoes" className="mt-4">
            <ProductVariations
              variacoes={product.variacoes}
              {...(selectedId !== undefined ? { selectedId } : {})}
              onSelect={setSelectedId}
            />
          </TabsContent>
          <TabsContent value="especificacoes" className="mt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {product.peso_bruto_kg && (
                <div>
                  <dt className="font-medium">Peso Bruto</dt>
                  <dd className="text-muted-foreground">{product.peso_bruto_kg} kg</dd>
                </div>
              )}
              {product.peso_liquido_kg && (
                <div>
                  <dt className="font-medium">Peso Líquido</dt>
                  <dd className="text-muted-foreground">{product.peso_liquido_kg} kg</dd>
                </div>
              )}
              {product.dimensoes_cm && (
                <div>
                  <dt className="font-medium">Dimensões</dt>
                  <dd className="text-muted-foreground">
                    {Object.entries(product.dimensoes_cm)
                      .map(([k, v]) => `${k}: ${v}cm`)
                      .join(' x ')}
                  </dd>
                </div>
              )}
              {product.ncm && (
                <div>
                  <dt className="font-medium">NCM</dt>
                  <dd className="text-muted-foreground">{product.ncm}</dd>
                </div>
              )}
              {product.cest && (
                <div>
                  <dt className="font-medium">CEST</dt>
                  <dd className="text-muted-foreground">{product.cest}</dd>
                </div>
              )}
              {product.origem_mercadoria && (
                <div>
                  <dt className="font-medium">Origem</dt>
                  <dd className="text-muted-foreground">{product.origem_mercadoria}</dd>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
