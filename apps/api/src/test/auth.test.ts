import type { Perfil, UsuarioPerfil } from '@/generated/prisma/client';
import { describe, expect, it } from 'vitest';
import {
  buildPermissions,
  generateAuthTokens,
  generateRefreshToken,
  hashPassword,
  verifyPassword,
  verifyRefreshToken,
} from '../auth/service.js';

describe('Auth Service', () => {
  describe('Password hashing', () => {
    it('should hash and verify password', async () => {
      const password = 'minhasenha123';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(await verifyPassword(password, hash)).toBe(true);
      expect(await verifyPassword('wrong', hash)).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'minhasenha123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Token generation', () => {
    it('should generate and verify access token', async () => {
      const tokens = await generateAuthTokens(
        {
          id: 'user-1',
          email: 'test@test.com',
          nome_completo: 'Test User',
          senha_hash: 'hash',
          ativo: true,
          telefone: null,
          cpf_cnpj: null,
          avatar_url: null,
          ultimo_login_em: null,
          email_verificado_em: null,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        },
        [
          {
            id: 'up-1',
            perfil_id: 'perfil-1',
            usuario_id: 'user-1',
            loja_id: 'loja-1',
            ativo: true,
            atribuido_por_id: null,
            atribuido_em: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
            perfil: {
              id: 'perfil-1',
              codigo: 'CLIENTE',
              nome: 'Cliente',
              descricao: null,
              permissoes: { 'produto:read': true } as Record<string, boolean>,
              created_at: new Date(),
              updated_at: new Date(),
              deleted_at: null,
            },
          },
        ]
      );
      expect(tokens.access_token).toBeDefined();
      expect(tokens.refresh_token).toBeDefined();
      expect(tokens.expires_in).toBe(900);
    });

    it('should verify valid refresh token', async () => {
      const refreshToken = await generateRefreshToken('user-1');
      const payload = await verifyRefreshToken(refreshToken);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-1');
    });

    it('should reject invalid refresh token', async () => {
      const payload = await verifyRefreshToken('invalid-token');
      expect(payload).toBeNull();
    });
  });

  describe('buildPermissions', () => {
    it('should build permissions from usuarioPerfis', () => {
      const usuarioPerfis: (UsuarioPerfil & { perfil: Perfil })[] = [
        {
          id: 'up-1',
          perfil_id: 'perfil-1',
          usuario_id: 'user-1',
          loja_id: 'loja-1',
          ativo: true,
          atribuido_por_id: null,
          atribuido_em: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          perfil: {
            id: 'perfil-1',
            codigo: 'ADMIN',
            nome: 'Admin',
            descricao: null,
            permissoes: { 'loja:read': true, 'loja:write': true, 'produto:read': false } as Record<
              string,
              boolean
            >,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
          },
        },
      ];

      const permissions = buildPermissions(usuarioPerfis);
      expect(permissions).toContain('loja:read');
      expect(permissions).toContain('loja:write');
      expect(permissions).not.toContain('produto:read');
    });

    it('should skip inactive perfis', () => {
      const usuarioPerfis: (UsuarioPerfil & { perfil: Perfil })[] = [
        {
          id: 'up-2',
          perfil_id: 'perfil-1',
          usuario_id: 'user-1',
          loja_id: 'loja-1',
          ativo: false,
          atribuido_por_id: null,
          atribuido_em: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          perfil: {
            id: 'perfil-1',
            codigo: 'ADMIN',
            nome: 'Admin',
            descricao: null,
            permissoes: { 'loja:read': true } as Record<string, boolean>,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
          },
        },
      ];

      const permissions = buildPermissions(usuarioPerfis);
      expect(permissions).toHaveLength(0);
    });

    it('should merge permissions from multiple perfis', () => {
      const usuarioPerfis: (UsuarioPerfil & { perfil: Perfil })[] = [
        {
          id: 'up-3',
          perfil_id: 'perfil-1',
          usuario_id: 'user-1',
          loja_id: 'loja-1',
          ativo: true,
          atribuido_por_id: null,
          atribuido_em: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          perfil: {
            id: 'perfil-1',
            codigo: 'GESTOR',
            nome: 'Gestor',
            descricao: null,
            permissoes: { 'loja:read': true } as Record<string, boolean>,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
          },
        },
        {
          id: 'up-4',
          perfil_id: 'perfil-2',
          usuario_id: 'user-1',
          loja_id: 'loja-1',
          ativo: true,
          atribuido_por_id: null,
          atribuido_em: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          perfil: {
            id: 'perfil-2',
            codigo: 'OPERADOR',
            nome: 'Operador',
            descricao: null,
            permissoes: { 'produto:read': true, 'pedido:read': true } as Record<string, boolean>,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
          },
        },
      ];

      const permissions = buildPermissions(usuarioPerfis);
      expect(permissions).toContain('loja:read');
      expect(permissions).toContain('produto:read');
      expect(permissions).toContain('pedido:read');
      expect(permissions).toHaveLength(3);
    });
  });
});
