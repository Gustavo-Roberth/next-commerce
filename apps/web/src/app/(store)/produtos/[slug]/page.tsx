import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { produtosApi } from '@/lib/api/services';
import type { Produto, ProdutoImagem, ProdutoVariacao } from '@/lib/api/types';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduto(slug: string): Promise<Produto | null> {
  try {
    return await produtosApi.getBySlug(slug, 'default-loja-id');
  } catch {
    return null;
  }
}

function ImageGallery({
  images,
  selectedImage,
  onSelectImage,
}: {
  images: ProdutoImagem[];
  selectedImage: ProdutoImagem | null;
  onSelectImage: (img: ProdutoImagem) => void;
}) {
  const mainImage = selectedImage || images.find((img) => img.principal) || images[0];

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
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
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => onSelectImage(img)}
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

function ProductInfo({ product }: { product: Produto }) {
  const price = product.variacoes[0]?.preco_cents ? product.variacoes[0].preco_cents / 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{product.categoria?.nome}</Badge>
        <Badge variant={product.destaque ? 'default' : 'secondary'}>
          {product.destaque ? 'Destaque' : 'Normal'}
        </Badge>
      </div>

      <h1 className="text-3xl font-bold">{product.nome}</h1>

      <div className="text-3xl font-bold text-primary">{formatCurrency(price)}</div>

      {product.descricao_curta && (
        <p className="text-muted-foreground">{product.descricao_curta}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button className="w-full sm:w-auto" size="lg">
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

function ProductVariations({ variacoes }: { variacoes: ProdutoVariacao[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Variações disponíveis</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {variacoes
          .filter((v) => v.ativo)
          .map((variacao) => (
            <div
              key={variacao.id}
              className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <h4 className="font-medium">{variacao.nome}</h4>
              <p className="text-sm text-muted-foreground">{variacao.sku}</p>
              {variacao.preco_cents !== null && (
                <p className="text-lg font-bold text-primary mt-2">
                  {(variacao.preco_cents / 100) | 0},
                  {String((variacao.preco_cents / 100) % 1).slice(2, 4)}
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
              <Button variant="outline" className="mt-4 w-full" size="sm">
                Selecionar
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
        <div dangerouslySetInnerHTML={{ __html: product.descricao_completa }} />
      ) : (
        <p className="text-muted-foreground">Descrição completa não disponível.</p>
      )}
    </div>
  );
}

export default async function ProdutoDetalhePage({ params }: Props) {
  const resolvedParams = await params;
  const product = await getProduto(resolvedParams.slug);

  if (!product) {
    notFound();
  }

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
        <div className="space-y-6">
          <ImageGallery images={product.imagens} selectedImage={null} onSelectImage={() => {}} />
        </div>

        <div className="space-y-6">
          <ProductInfo product={product} />
        </div>
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
            <ProductVariations variacoes={product.variacoes} />
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
