'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Store,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<{ pedidosPendentes: number; vendasHoje: number } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    setIsAuthenticated(true);
    fetchStats();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const data = await api.get<{ pedidosPendentes: number; vendasHoje: number }>('/admin/stats');
      setStats(data);
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/admin/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Produtos', href: '/admin/produtos', icon: Package },
    { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
    { name: 'Estoque', href: '/admin/estoque', icon: Boxes },
    { name: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 },
    { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-muted">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="flex h-16 items-center justify-between border-b px-4 lg:justify-center">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">Admin</span>
          </Link>
          <button
            type="button"
            className="lg:hidden p-2"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Navegação principal">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4 lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Usuário Admin</span>
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link
                  href="/admin/dashboard"
                  className="flex w-full items-center px-2 py-1.5 text-sm"
                >
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 shadow-sm lg:px-8">
          <button
            type="button"
            className="lg:hidden p-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 flex items-center gap-4">
            <div className="relative w-full max-w-md hidden sm:block">
              <Input
                type="search"
                placeholder="Buscar produtos, pedidos..."
                className="pl-10"
                aria-label="Buscar"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              {stats && (
                <>
                  <span>
                    Vendas hoje: <strong>{formatCurrency(stats.vendasHoje)}</strong>
                  </span>
                  <span className="text-orange-600">
                    Pedidos pendentes: <strong>{stats.pedidosPendentes}</strong>
                  </span>
                </>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/dashboard"
                    className="flex w-full items-center px-2 py-1.5 text-sm"
                  >
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
