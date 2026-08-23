export const PERFIS_SISTEMA = {
  ADMIN: {
    codigo: 'ADMIN',
    nome: 'Administrador',
    descricao: 'Acesso total ao sistema (configurações, usuários, integrações, tudo)',
    permissoes: {
      'loja:read': true,
      'loja:write': true,
      'loja:delete': true,
      'usuario:read': true,
      'usuario:write': true,
      'usuario:delete': true,
      'perfil:read': true,
      'perfil:write': true,
      'perfil:delete': true,
      'produto:read': true,
      'produto:write': true,
      'produto:delete': true,
      'categoria:read': true,
      'categoria:write': true,
      'categoria:delete': true,
      'pedido:read': true,
      'pedido:write': true,
      'pedido:delete': true,
      'estoque:read': true,
      'estoque:write': true,
      'estoque:delete': true,
      'financeiro:read': true,
      'financeiro:write': true,
      'relatorio:read': true,
      'relatorio:write': true,
      'configuracao:read': true,
      'configuracao:write': true,
      'integracao:read': true,
      'integracao:write': true,
      'auditoria:read': true,
    },
  },
  GESTOR: {
    codigo: 'GESTOR',
    nome: 'Gestor',
    descricao: 'Leitura total + relatórios + dashboards (sem escrita em cadastros)',
    permissoes: {
      'loja:read': true,
      'usuario:read': true,
      'perfil:read': true,
      'produto:read': true,
      'categoria:read': true,
      'pedido:read': true,
      'estoque:read': true,
      'financeiro:read': true,
      'relatorio:read': true,
      'relatorio:write': true,
      'configuracao:read': true,
      'auditoria:read': true,
    },
  },
  OPERADOR: {
    codigo: 'OPERADOR',
    nome: 'Operador',
    descricao: 'Pedidos (leitura/escrita), catálogo (leitura/escrita), clientes (leitura)',
    permissoes: {
      'loja:read': true,
      'usuario:read': true,
      'produto:read': true,
      'produto:write': true,
      'categoria:read': true,
      'categoria:write': true,
      'pedido:read': true,
      'pedido:write': true,
      'cliente:read': true,
      'relatorio:read': true,
    },
  },
  ESTOQUISTA: {
    codigo: 'ESTOQUISTA',
    nome: 'Estoquista',
    descricao: 'Estoque (leitura/escrita), separação de pedidos, inventário',
    permissoes: {
      'loja:read': true,
      'produto:read': true,
      'categoria:read': true,
      'pedido:read': true,
      'estoque:read': true,
      'estoque:write': true,
      'inventario:write': true,
    },
  },
  CLIENTE: {
    codigo: 'CLIENTE',
    nome: 'Cliente',
    descricao: 'Próprio perfil, endereços, pedidos, carrinho, favoritos, avaliações',
    permissoes: {
      'perfil:read': true,
      'perfil:write': true,
      'endereco:read': true,
      'endereco:write': true,
      'endereco:delete': true,
      'pedido:read': true,
      'carrinho:read': true,
      'carrinho:write': true,
      'carrinho:delete': true,
      'favorito:read': true,
      'favorito:write': true,
      'favorito:delete': true,
      'avaliacao:read': true,
      'avaliacao:write': true,
    },
  },
} as const;

import type { PerfilCodigo } from '../types/enums';

export const PERFIS_ORDEM = ['ADMIN', 'GESTOR', 'OPERADOR', 'ESTOQUISTA', 'CLIENTE'] as const;

type Permissoes = Record<string, boolean>;

export function temPermissao(perfil: PerfilCodigo, permissao: string): boolean {
  return (PERFIS_SISTEMA[perfil].permissoes as Permissoes)[permissao] === true;
}

export function getPermissoesPerfil(perfil: PerfilCodigo): Record<string, boolean> {
  return PERFIS_SISTEMA[perfil].permissoes;
}

export function isAdmin(perfil: PerfilCodigo): boolean {
  return perfil === 'ADMIN';
}

export function isGestorOuAdmin(perfil: PerfilCodigo): boolean {
  return perfil === 'ADMIN' || perfil === 'GESTOR';
}

export function canManageUsers(perfil: PerfilCodigo): boolean {
  return perfil === 'ADMIN';
}

export function canManageSettings(perfil: PerfilCodigo): boolean {
  return perfil === 'ADMIN';
}
