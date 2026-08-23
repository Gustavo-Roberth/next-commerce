import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { carrinhoApi } from '@/lib/api/services';
import type { CarrinhoItem, CarrinhoResponse } from '@/lib/api/types';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, Minus, Plus, Trash2, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  searchParams: Promise<{}>;
}

async function getCart(): Promise<CarrinhoResponse | null> {
  try {
    return await carrinhoApi.get();
  } catch {
    return null;
  }
}

export default async function CarrinhoPage() {
  const cart = await getCart();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Carrinho de Compras</h1>
        <p className="text-muted-foreground mt-1">Revise seus itens antes de finalizar a compra</p>
      </div>

      {cart && cart.itens.length > 0 ? (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Itens do Carrinho ({cart.itens.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.itens.map((item: CarrinhoItem) => (
                  <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.variacao.imagens[0] ? (
                        <Image
                          src={item.variacao.imagens[0].url}
                          alt={item.variacao.imagens[0].alt_text || item.produto.nome}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                          Sem imagem
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/produtos/${item.produto.slug}`}
                        className="font-medium hover:text-primary"
                      >
                        {item.produto.nome}
                      </Link>
                      <p className="text-sm text-muted-foreground">{item.variacao.nome}</p>
                      <p className="font-medium text-primary mt-1">
                        {formatCurrency(item.preco_unitario_cents / 100)}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          className="p-1 rounded border hover:bg-muted"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantidade}</span>
                        <button
                          className="p-1 rounded border hover:bg-muted"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <span className="ml-auto font-medium">
                          {formatCurrency(item.total_cents / 100)}
                        </span>
                      </div>
                    </div>
                    <button
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remover item"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({cart.itens.length} itens)</span>
                  <span className="font-medium">{formatCurrency(cart.subtotal_cents / 100)}</span>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Frete</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="frete" className="h-4 w-4 text-primary" />
                      <span className="text-sm">Entrega Padrão - 5 dias úteis - Grátis</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="frete" className="h-4 w-4 text-primary" />
                      <span className="text-sm">Entrega Expressa - 2 dias úteis - R$ 15,00</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="frete" className="h-4 w-4 text-primary" />
                      <span className="text-sm">Retirar na loja - Grátis</span>
                    </label>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Cupom de desconto</h4>
                  <div className="flex gap-2">
                    <Input placeholder="Código do cupom" className="flex-1" />
                    <Button variant="outline" size="sm">
                      Aplicar
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cart.subtotal_cents / 100)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Frete</span>
                    <span>Grátis</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Desconto</span>
                    <span>- R$ 0,00</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(cart.subtotal_cents / 100)}</span>
                  </div>
                </div>

                <Button className="w-full" size="lg" asChild>
                  <Link href="/checkout">
                    <span className="flex items-center justify-center gap-2">
                      Finalizar Compra
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Frete e impostos calculados no checkout
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-4">Seu carrinho está vazio</h2>
          <p className="text-muted-foreground mb-8">Adicione produtos para começar sua compra</p>
          <Button asChild size="lg">
            <Link href="/produtos">Continuar Comprando</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
