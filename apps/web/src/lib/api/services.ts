import { api } from './client';
import type {
  AddItemToCartInput,
  AdminCategoriaListResponse,
  AdminPedidoListResponse,
  AdminProdutoListResponse,
  AdminStats,
  ApplyCupomInput,
  ApplyCupomResponse,
  CalcularFreteResponse,
  CarrinhoItem,
  CarrinhoResponse,
  Categoria,
  CategoriasListResponse,
  CheckoutInput,
  CheckoutResponse,
  CreateCategoriaInput,
  CreateProdutoInput,
  Pedido,
  PedidosListResponse,
  Produto,
  ProdutoDestaqueResponse,
  ProdutosListResponse,
  UpdateCartItemInput,
  UpdateCategoriaInput,
  UpdatePedidoStatusInput,
  UpdateProdutoInput,
} from './types';

export const produtosApi = {
  list: (params?: {
    cursor?: string;
    limit?: number;
    search?: string;
    categoria_id?: string;
    status?: string;
    destaque?: boolean;
    preco_min?: number;
    preco_max?: number;
    apenas_disponiveis?: boolean;
    sort?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<ProdutosListResponse>(`/produtos${query ? `?${query}` : ''}`);
  },

  getDestaques: (loja_id: string, limit = 10) =>
    api.get<ProdutoDestaqueResponse>(`/produtos/destaques?loja_id=${loja_id}&limit=${limit}`),

  getById: (id: string) => api.get<Produto>(`/produtos/${id}`),

  getBySlug: (slug: string, loja_id: string) =>
    api.get<Produto>(`/produtos/slug/${slug}?loja_id=${loja_id}`),
};

export const categoriasApi = {
  list: (params?: {
    loja_id?: string;
    ativa?: boolean;
    pai_id?: string;
    cursor?: string;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<CategoriasListResponse>(`/categorias${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => api.get<Categoria>(`/categorias/${id}`),
};

export const carrinhoApi = {
  get: () => api.get<CarrinhoResponse>('/carrinho'),

  addItem: (input: AddItemToCartInput) => api.post<CarrinhoItem>('/carrinho/itens', input),

  updateItem: (itemId: string, input: UpdateCartItemInput) =>
    api.put<CarrinhoItem>(`/carrinho/itens/${itemId}`, input),

  removeItem: (itemId: string) => api.delete<{ message: string }>(`/carrinho/itens/${itemId}`),

  clear: () => api.delete<{ message: string }>('/carrinho'),
};

export const checkoutApi = {
  calcularFrete: (cep_destino: string, itens: { variacao_id: string; quantidade: number }[]) =>
    api.post<CalcularFreteResponse>('/checkout/calcular-frete', { cep_destino, itens }),

  aplicarCupom: (input: ApplyCupomInput) =>
    api.post<ApplyCupomResponse>('/checkout/aplicar-cupom', input),

  finalizar: (input: CheckoutInput) => api.post<CheckoutResponse>('/checkout', input),
};

export const pedidosApi = {
  list: (params?: {
    cursor?: string;
    limit?: number;
    status?: string;
    data_inicio?: string;
    data_fim?: string;
    cliente_id?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<PedidosListResponse>(`/pedidos${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => api.get<Pedido>(`/pedidos/${id}`),

  cancelar: (id: string) => api.post<{ id: string; status: string }>(`/pedidos/${id}/cancelar`, {}),

  atualizarStatus: (id: string, status: string, observacoes_internas?: string) =>
    api.put<{ id: string; status: string }>(`/pedidos/${id}/status`, {
      status,
      observacoes_internas,
    }),
};

export const adminApi = {
  getStats: () => api.get<AdminStats>('/admin/stats'),

  categorias: {
    list: (params?: {
      cursor?: string;
      limit?: number;
      ativa?: boolean;
      pai_id?: string;
      search?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
          }
        });
      }
      const query = searchParams.toString();
      return api.get<AdminCategoriaListResponse>(`/admin/categorias${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => api.get<Categoria>(`/admin/categorias/${id}`),

    create: (input: CreateCategoriaInput) => api.post<Categoria>('/admin/categorias', input),

    update: (id: string, input: UpdateCategoriaInput) =>
      api.put<Categoria>(`/admin/categorias/${id}`, input),

    delete: (id: string) => api.delete<{ message: string }>(`/admin/categorias/${id}`),
  },

  produtos: {
    list: (params?: {
      cursor?: string;
      limit?: number;
      search?: string;
      categoria_id?: string;
      status?: string;
      destaque?: boolean;
      preco_min?: number;
      preco_max?: number;
      apenas_disponiveis?: boolean;
      sort?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
          }
        });
      }
      const query = searchParams.toString();
      return api.get<AdminProdutoListResponse>(`/admin/produtos${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => api.get<Produto>(`/admin/produtos/${id}`),

    create: (input: CreateProdutoInput) => api.post<Produto>('/admin/produtos', input),

    update: (id: string, input: UpdateProdutoInput) =>
      api.put<Produto>(`/admin/produtos/${id}`, input),

    delete: (id: string) => api.delete<{ message: string }>(`/admin/produtos/${id}`),
  },

  pedidos: {
    list: (params?: {
      cursor?: string;
      limit?: number;
      status?: string;
      data_inicio?: string;
      data_fim?: string;
      cliente_id?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
          }
        });
      }
      const query = searchParams.toString();
      return api.get<AdminPedidoListResponse>(`/admin/pedidos${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => api.get<Pedido>(`/admin/pedidos/${id}`),

    atualizarStatus: (id: string, input: UpdatePedidoStatusInput) =>
      api.put<{ id: string; status: string }>(`/admin/pedidos/${id}/status`, input),
  },
};
