import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'crypto';

const ALGORITMO = 'aes-256-gcm';
const IV_BYTES = 12;
const SEPARADOR = ':';

function obterChaveMestre(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('ENCRYPTION_KEY não configurada (necessária para criptografar credenciais)');
  }
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) {
    throw new Error('ENCRYPTION_KEY deve ter 32 bytes em base64');
  }
  return buf;
}

function derivarChaveLoja(lojaId: string): Buffer {
  return Buffer.from(
    hkdfSync(
      'sha256',
      obterChaveMestre(),
      Buffer.from(lojaId, 'utf8'),
      Buffer.from('nextcommerce-credenciais'),
      32
    )
  );
}

export function criptografar(lojaId: string, valor: unknown): string {
  const chave = derivarChaveLoja(lojaId);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITMO, chave, iv);
  const plaintext = Buffer.from(JSON.stringify(valor), 'utf8');
  const criptografado = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), criptografado.toString('base64')].join(
    SEPARADOR
  );
}

export function descriptografar<T = unknown>(lojaId: string, texto: string): T {
  const partes = texto.split(SEPARADOR);
  if (partes.length !== 3) {
    throw new Error('Formato de credencial criptografada inválido');
  }
  const [ivB64, tagB64, ctB64] = partes as [string, string, string];
  const chave = derivarChaveLoja(lojaId);
  const decipher = createDecipheriv(ALGORITMO, chave, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const descriptografado = Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64')),
    decipher.final(),
  ]);
  return JSON.parse(descriptografado.toString('utf8')) as T;
}
