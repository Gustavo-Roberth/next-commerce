'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Menu, Search, ShoppingCart, Store, User, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { CartDrawer } from './CartDrawer';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">NextCommerce</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/produtos"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Produtos
            </Link>
            <Link
              href="/categorias"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Categorias
            </Link>
            <Link
              href="/ofertas"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Ofertas
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  window.location.href = `/produtos?search=${encodeURIComponent(searchQuery.trim())}`;
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCartOpen(true)}>
              <ShoppingCart className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link
                    href="/conta"
                    className="flex w-full items-center px-2 py-1.5 text-sm"
                    onClick={() => setCartOpen(false)}
                  >
                    Minha Conta
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/conta/pedidos"
                    className="flex w-full items-center px-2 py-1.5 text-sm"
                    onClick={() => setCartOpen(false)}
                  >
                    Meus Pedidos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/conta/enderecos"
                    className="flex w-full items-center px-2 py-1.5 text-sm"
                    onClick={() => setCartOpen(false)}
                  >
                    Endereços
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/login"
                    className="flex w-full items-center px-2 py-1.5 text-sm"
                    onClick={() => setCartOpen(false)}
                  >
                    Sair
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t px-4 py-4">
          <nav className="flex flex-col gap-4">
            <Link
              href="/produtos"
              className="text-sm font-medium hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Produtos
            </Link>
            <Link
              href="/categorias"
              className="text-sm font-medium hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Categorias
            </Link>
            <Link
              href="/ofertas"
              className="text-sm font-medium hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ofertas
            </Link>
            <div className="pt-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link href="/conta">Minha Conta</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
