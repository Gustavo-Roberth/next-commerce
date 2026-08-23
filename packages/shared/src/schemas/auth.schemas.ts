import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  nome_completo: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(255),
  telefone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido (E.164)')
    .optional(),
  cpf_cnpj: z
    .string()
    .regex(/^\d{11}$|^\d{14}$/, 'CPF/CNPJ inválido')
    .optional(),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token obrigatório'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().uuid('Token inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const verifyEmailSchema = z.object({
  token: z.string().uuid('Token inválido'),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Senha atual obrigatória'),
  new_password: z.string().min(8, 'Nova senha deve ter no mínimo 8 caracteres'),
});

export const loginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().int().positive(),
  token_type: z.literal('Bearer'),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    nome_completo: z.string(),
    loja_id: z.string().uuid(),
    perfis: z.array(
      z.object({
        codigo: z.string(),
        nome: z.string(),
      })
    ),
    permissoes: z.array(z.string()),
  }),
});

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  nome_completo: z.string(),
  telefone: z.string().nullable(),
  cpf_cnpj: z.string().nullable(),
  avatar_url: z.string().nullable(),
  ativo: z.boolean(),
  email_verificado_em: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
