import { api, dispararDownload, downloadBlob } from './client';
import type {
  AddItemToCartInput,
  AdminCategoriaListResponse,
  AdminPedidoListResponse,
  AdminProdutoListResponse,
  AdminStats,
  ApplyCupomInput,
  ApplyCupomResponse,
  AtualizarCupomInput,
  AtualizarEmailTemplateInput,
  AtualizarFreteInput,
  AtualizarIntegracaoInput,
  AtualizarLojaInput,
  AtualizarPagamentoInput,
  CalcularFreteInput,
  CalcularFreteResponse,
  CarrinhoItem,
  CarrinhoResponse,
  Categoria,
  CategoriasListResponse,
  CheckoutInput,
  CheckoutResponse,
  ConfiguracaoFrete,
  ConfiguracaoPagamento,
  CreateCategoriaInput,
  CreateDepositoInput,
  CreateMovimentoInput,
  CreateProdutoInput,
  CreateReportScheduleInput,
  CriarCupomInput,
  CriarEmailTemplateInput,
  CriarFreteInput,
  CriarIntegracaoInput,
  CriarPagamentoInput,
  CupomConfig,
  Deposito,
  EmailTemplate,
  EstoqueDashboard,
  EstoqueItem,
  EstoqueListResponse,
  Integracao,
  InventarioEstoqueInput,
  LojaConfig,
  OpcaoFrete,
  Pedido,
  PedidosListResponse,
  Produto,
  ProdutoDestaqueResponse,
  ProdutosListResponse,
  RelatorioConsulta,
  RelatorioFormato,
  RelatorioTipo,
  ReportSchedule,
  ReportScheduleListResponse,
  ResultadoValidacaoCupom,
  TransferenciaEstoqueInput,
  UpdateCartItemInput,
  UpdateCategoriaInput,
  UpdateDepositoInput,
  UpdatePedidoStatusInput,
  UpdateProdutoInput,
  ValidarCupomInput,
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
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      }
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
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      }
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
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      }
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
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
          }
        }
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
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
          }
        }
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
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
          }
        }
      }
      const query = searchParams.toString();
      return api.get<AdminPedidoListResponse>(`/admin/pedidos${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => api.get<Pedido>(`/admin/pedidos/${id}`),

    atualizarStatus: (id: string, input: UpdatePedidoStatusInput) =>
      api.put<{ id: string; status: string }>(`/admin/pedidos/${id}/status`, input),
  },

  depositos: {
    list: () => api.get<Deposito[]>('/admin/depositos'),

    getById: (id: string) => api.get<Deposito>(`/admin/depositos/${id}`),

    create: (input: CreateDepositoInput) => api.post<Deposito>('/admin/depositos', input),

    update: (id: string, input: UpdateDepositoInput) =>
      api.put<Deposito>(`/admin/depositos/${id}`, input),

    remove: (id: string) => api.delete<{ message: string }>(`/admin/depositos/${id}`),
  },

  estoque: {
    dashboard: () => api.get<EstoqueDashboard>('/admin/estoque/dashboard'),

    list: (params?: {
      cursor?: string;
      limit?: number;
      variacao_id?: string;
      deposito_id?: string;
      apenas_baixo?: boolean;
      apenas_zerado?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            searchParams.set(key, String(value));
          }
        }
      }
      const query = searchParams.toString();
      return api.get<EstoqueListResponse>(`/admin/estoque${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => api.get<EstoqueItem>(`/admin/estoque/${id}`),

    movimento: (input: CreateMovimentoInput) =>
      api.post<{ id: string }>('/admin/estoque/movimentos', input),

    transferencia: (input: TransferenciaEstoqueInput) =>
      api.post<{ message: string }>('/admin/estoque/transferencia', input),

    inventario: (input: InventarioEstoqueInput) =>
      api.post<{ message: string }>('/admin/estoque/inventario', input),
  },

  relatorios: {
    consultar: (tipo: RelatorioTipo, params?: { data_inicio?: string; data_fim?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.data_inicio) searchParams.set('data_inicio', params.data_inicio);
      if (params?.data_fim) searchParams.set('data_fim', params.data_fim);
      const query = searchParams.toString();
      return api.get<RelatorioConsulta>(`/admin/relatorios/${tipo}${query ? `?${query}` : ''}`);
    },

    exportar: async (
      tipo: RelatorioTipo,
      formato: RelatorioFormato,
      params?: {
        data_inicio?: string;
        data_fim?: string;
      }
    ) => {
      const searchParams = new URLSearchParams();
      searchParams.set('formato', formato);
      if (params?.data_inicio) searchParams.set('data_inicio', params.data_inicio);
      if (params?.data_fim) searchParams.set('data_fim', params.data_fim);
      const blob = await downloadBlob(
        `/admin/relatorios/${tipo}/export?${searchParams.toString()}`
      );
      const dataStr = new Date().toISOString().slice(0, 10);
      dispararDownload(blob, `${tipo}-${dataStr}.${formato.toLowerCase()}`);
    },

    agendamentos: () => api.get<ReportScheduleListResponse>('/admin/relatorios/agendamentos'),

    criarAgendamento: (input: CreateReportScheduleInput) =>
      api.post<ReportSchedule>('/admin/relatorios/agendamentos', input),

    removerAgendamento: (id: string) =>
      api.delete<{ message: string }>(`/admin/relatorios/agendamentos/${id}`),

    enviarAgora: (id: string) =>
      api.post<{ message: string }>(`/admin/relatorios/agendamentos/${id}/enviar`, {}),
  },

  configuracoes: {
    loja: {
      get: () => api.get<LojaConfig>('/admin/configuracoes/loja'),
      update: (input: AtualizarLojaInput) =>
        api.patch<LojaConfig>('/admin/configuracoes/loja', input),
    },
    frete: {
      list: () => api.get<ConfiguracaoFrete[]>('/admin/configuracoes/frete'),
      create: (input: CriarFreteInput) =>
        api.post<ConfiguracaoFrete>('/admin/configuracoes/frete', input),
      update: (id: string, input: AtualizarFreteInput) =>
        api.patch<ConfiguracaoFrete>(`/admin/configuracoes/frete/${id}`, input),
      remove: (id: string) => api.delete<{ message: string }>(`/admin/configuracoes/frete/${id}`),
      alternar: (id: string, ativo: boolean) =>
        api.post<ConfiguracaoFrete>(`/admin/configuracoes/frete/${id}/alternar`, { ativo }),
      calcular: (input: CalcularFreteInput) =>
        api.post<OpcaoFrete[]>('/admin/configuracoes/frete/calcular', input),
    },
    pagamentos: {
      list: () => api.get<ConfiguracaoPagamento[]>('/admin/configuracoes/pagamentos'),
      create: (input: CriarPagamentoInput) =>
        api.post<ConfiguracaoPagamento>('/admin/configuracoes/pagamentos', input),
      update: (id: string, input: AtualizarPagamentoInput) =>
        api.patch<ConfiguracaoPagamento>(`/admin/configuracoes/pagamentos/${id}`, input),
      remove: (id: string) =>
        api.delete<{ message: string }>(`/admin/configuracoes/pagamentos/${id}`),
      alternar: (id: string, ativo: boolean) =>
        api.post<ConfiguracaoPagamento>(`/admin/configuracoes/pagamentos/${id}/alternar`, {
          ativo,
        }),
      credenciais: (id: string) =>
        api.get<{ id: string; credenciais: Record<string, unknown> }>(
          `/admin/configuracoes/pagamentos/${id}/credenciais`
        ),
    },
    cupons: {
      list: () => api.get<CupomConfig[]>('/admin/configuracoes/cupons'),
      create: (input: CriarCupomInput) =>
        api.post<CupomConfig>('/admin/configuracoes/cupons', input),
      update: (id: string, input: AtualizarCupomInput) =>
        api.patch<CupomConfig>(`/admin/configuracoes/cupons/${id}`, input),
      remove: (id: string) => api.delete<{ message: string }>(`/admin/configuracoes/cupons/${id}`),
      alternar: (id: string, ativo: boolean) =>
        api.post<CupomConfig>(`/admin/configuracoes/cupons/${id}/alternar`, { ativo }),
      validar: (input: ValidarCupomInput) =>
        api.post<ResultadoValidacaoCupom>('/admin/configuracoes/cupons/validar', input),
    },
    emails: {
      list: () => api.get<EmailTemplate[]>('/admin/configuracoes/emails'),
      create: (input: CriarEmailTemplateInput) =>
        api.post<EmailTemplate>('/admin/configuracoes/emails', input),
      update: (id: string, input: AtualizarEmailTemplateInput) =>
        api.patch<EmailTemplate>(`/admin/configuracoes/emails/${id}`, input),
      remove: (id: string) => api.delete<{ message: string }>(`/admin/configuracoes/emails/${id}`),
      preview: (id: string, variaveis?: Record<string, string>) =>
        api.post<{ html: string; erros: string[] }>(`/admin/configuracoes/emails/${id}/preview`, {
          variaveis: variaveis ?? {},
        }),
    },
    integracoes: {
      list: () => api.get<Integracao[]>('/admin/configuracoes/integracoes'),
      create: (input: CriarIntegracaoInput) =>
        api.post<Integracao>('/admin/configuracoes/integracoes', input),
      update: (id: string, input: AtualizarIntegracaoInput) =>
        api.patch<Integracao>(`/admin/configuracoes/integracoes/${id}`, input),
      remove: (id: string) =>
        api.delete<{ message: string }>(`/admin/configuracoes/integracoes/${id}`),
      alternar: (id: string, ativo: boolean) =>
        api.post<Integracao>(`/admin/configuracoes/integracoes/${id}/alternar`, { ativo }),
      credenciais: (id: string) =>
        api.get<{ id: string; credenciais: Record<string, unknown> }>(
          `/admin/configuracoes/integracoes/${id}/credenciais`
        ),
    },
  },
};
