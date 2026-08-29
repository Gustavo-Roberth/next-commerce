import {
  Facebook,
  Headphones,
  Instagram,
  Shield,
  Store,
  Truck,
  Twitter,
  Youtube,
} from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Store className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">NextCommerce</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">
              Plataforma completa de e-commerce para pequenos lojistas. Venda online com facilidade.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Navegação</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/produtos"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Todos os Produtos
              </Link>
              <Link
                href="/produtos"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Categorias
              </Link>
              <Link
                href="/produtos"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Ofertas
              </Link>
              <Link
                href="/novidades"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Novidades
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Ajuda</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/ajuda"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Central de Ajuda
              </Link>
              <Link
                href="/faq"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Perguntas Frequentes
              </Link>
              <Link
                href="/contato"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Fale Conosco
              </Link>
              <Link
                href="/rastreamento"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Rastrear Pedido
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Minha Conta</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/conta"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Meus Pedidos
              </Link>
              <Link
                href="/conta/enderecos"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Endereços
              </Link>
              <Link
                href="/conta/dados"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Dados Pessoais
              </Link>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Entrar / Cadastrar
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t pt-8 mt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NextCommerce. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span>Entrega para todo Brasil</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Compra Segura</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4" />
                <span>Suporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
