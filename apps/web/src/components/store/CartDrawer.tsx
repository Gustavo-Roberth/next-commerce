'use client';

import { Button } from '@/components/ui/button';
import { CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { CarrinhoItem, CarrinhoResponse } from '@/lib/api/types';
import { notify } from '@/lib/notify';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type ComponentProps, useCallback, useEffect, useState } from 'react';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const [cart, setCart] = useState<CarrinhoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const reduce = useReducedMotion();

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<CarrinhoResponse>('/carrinho');
      setCart(data);
    } catch (error) {
      console.error('Erro ao buscar carrinho:', error);
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchCart();
    }
  }, [open, fetchCart]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const updateQuantity = async (itemId: string, quantidade: number) => {
    if (quantidade < 1) return;
    try {
      const updated = await api.put<CarrinhoItem>(`/carrinho/itens/${itemId}`, { quantidade });
      setCart((prev) =>
        prev
          ? {
              ...prev,
              itens: prev.itens.map((item) => (item.id === itemId ? updated : item)),
              subtotal_cents: prev.itens.reduce(
                (acc, item) =>
                  acc +
                  (item.id === itemId
                    ? updated.preco_unitario_cents * quantidade
                    : item.preco_unitario_cents * item.quantidade),
                0
              ),
            }
          : null
      );
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      notify.error('Não foi possível atualizar a quantidade');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await api.delete(`/carrinho/itens/${itemId}`);
      setCart((prev) =>
        prev
          ? {
              ...prev,
              itens: prev.itens.filter((item) => item.id !== itemId),
              subtotal_cents: prev.itens
                .filter((item) => item.id !== itemId)
                .reduce((acc, item) => acc + item.preco_unitario_cents * item.quantidade, 0),
            }
          : null
      );
    } catch (error) {
      console.error('Erro ao remover item:', error);
      notify.error('Não foi possível remover o item');
    }
  };

  const panelMotion: ComponentProps<typeof motion.div> = reduce
    ? {}
    : {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
        transition: { type: 'tween', duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col"
          data-testid="cart-drawer"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Fechar carrinho"
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-xl flex flex-col"
            {...panelMotion}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Carrinho</CardTitle>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-md"
                aria-label="Fechar carrinho"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : !cart || cart.itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Seu carrinho está vazio</p>
                  <p className="text-sm">Adicione produtos para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.itens.map((item) => (
                    <div key={item.id} className="flex gap-3" data-testid="cart-item">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        {item.variacao.imagens[0] ? (
                          <img
                            src={item.variacao.imagens[0].url}
                            alt={item.variacao.imagens[0].alt_text || item.produto.nome}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                            Sem imagem
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.produto.nome}</h4>
                        <p className="text-sm text-muted-foreground">{item.variacao.nome}</p>
                        <p className="font-medium text-primary">
                          {formatCurrency(item.preco_unitario_cents / 100)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                            disabled={item.quantidade <= 1}
                            className="p-1 rounded border hover:bg-muted disabled:opacity-50"
                            aria-label={`Diminuir quantidade de ${item.produto.nome}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantidade}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                            className="p-1 rounded border hover:bg-muted"
                            aria-label={`Aumentar quantidade de ${item.produto.nome}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="ml-auto p-1 text-muted-foreground hover:text-destructive"
                            aria-label={`Remover ${item.produto.nome} do carrinho`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <CardFooter className="border-t p-4">
              <div className="flex justify-between text-lg font-semibold mb-4">
                <span>Subtotal</span>
                <span>{formatCurrency(cart?.subtotal_cents || 0)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                asChild
                onClick={() => {
                  onClose();
                  window.location.href = '/checkout';
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  Finalizar compra
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Frete e impostos calculados no checkout
              </p>
            </CardFooter>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
