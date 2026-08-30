import { beforeAll, describe, expect, it } from 'vitest';
import { criptografar, descriptografar } from './crypto.js';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
});

describe('crypto (AES-256-GCM por loja)', () => {
  it('faz round-trip de um objeto de credenciais', () => {
    const lojaId = 'loja-1';
    const segredo = { apiKey: 'abc-123', token: 'xyz-987' };
    const texto = criptografar(lojaId, segredo);
    expect(texto).not.toContain('abc-123');
    expect(descriptografar<typeof segredo>(lojaId, texto)).toEqual(segredo);
  });

  it('gera ciphertext diferente por loja (chave derivada)', () => {
    const a = criptografar('loja-a', { x: 1 });
    const b = criptografar('loja-b', { x: 1 });
    expect(a).not.toEqual(b);
    expect(descriptografar('loja-a', a)).toEqual({ x: 1 });
  });

  it('falha ao descriptografar com loja errada', () => {
    const texto = criptografar('loja-a', { x: 1 });
    expect(() => descriptografar('loja-b', texto)).toThrow();
  });
});
