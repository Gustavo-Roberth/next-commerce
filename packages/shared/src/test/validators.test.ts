import { describe, expect, it } from 'vitest';
import { slugify } from '../utils/helpers';
import {
  isValidCEP,
  isValidCNPJ,
  isValidCPF,
  isValidEmail,
  isValidUUID,
} from '../utils/validators';

describe('Validators', () => {
  describe('isValidCPF', () => {
    it('should validate correct CPF', () => {
      expect(isValidCPF('111.444.777-35')).toBe(true);
      expect(isValidCPF('11144477735')).toBe(true);
    });

    it('should reject invalid CPF', () => {
      expect(isValidCPF('111.111.111-11')).toBe(false);
      expect(isValidCPF('123')).toBe(false);
      expect(isValidCPF('')).toBe(false);
    });
  });

  describe('isValidCNPJ', () => {
    it('should validate correct CNPJ', () => {
      expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
      expect(isValidCNPJ('11222333000181')).toBe(true);
    });

    it('should reject invalid CNPJ', () => {
      expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
      expect(isValidCNPJ('123')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('isValidCEP', () => {
    it('should validate correct CEP', () => {
      expect(isValidCEP('01310-100')).toBe(true);
      expect(isValidCEP('01310100')).toBe(true);
    });

    it('should reject invalid CEP', () => {
      expect(isValidCEP('123')).toBe(false);
      expect(isValidCEP('abcdefgh')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('slugify', () => {
    it('should create valid slug', () => {
      expect(slugify('Produto Teste')).toBe('produto-teste');
      expect(slugify('Produto com Acentuação')).toBe('produto-com-acentuacao');
      expect(slugify('Produto   Espaços')).toBe('produto-espacos');
    });
  });
});
