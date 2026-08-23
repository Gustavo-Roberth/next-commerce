function getArrayItem<T>(arr: readonly T[], index: number): T {
  const item = arr[index];
  if (item === undefined) throw new Error(`Index ${index} out of bounds`);
  return item;
}

export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cleaned.charAt(i), 10) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number.parseInt(cleaned.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cleaned.charAt(i), 10) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number.parseInt(cleaned.charAt(10), 10)) return false;

  return true;
}

export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(cleaned.charAt(i), 10) * getArrayItem(weights1, i);
  }
  let digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== Number.parseInt(cleaned.charAt(12), 10)) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += Number.parseInt(cleaned.charAt(i), 10) * getArrayItem(weights2, i);
  }
  digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== Number.parseInt(cleaned.charAt(13), 10)) return false;

  return true;
}

export function isValidCPForCNPJ(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 11) return isValidCPF(cleaned);
  if (cleaned.length === 14) return isValidCNPJ(cleaned);
  return false;
}

export function isValidCEP(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned);
}

export function isValidEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return (cleaned.length === 10 || cleaned.length === 11) && /^\d+$/.test(cleaned);
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isValidSKU(sku: string): boolean {
  return /^[A-Z0-9-_]+$/.test(sku.toUpperCase()) && sku.length <= 100;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length <= 255;
}

export function isValidNCM(ncm: string): boolean {
  return /^\d{8}$/.test(ncm);
}

export function isValidCEST(cest: string): boolean {
  return /^\d{7}$/.test(cest);
}

export function isValidGTIN(gtin: string): boolean {
  const cleaned = gtin.replace(/\D/g, '');
  return (
    (cleaned.length === 8 ||
      cleaned.length === 12 ||
      cleaned.length === 13 ||
      cleaned.length === 14) &&
    /^\d+$/.test(cleaned)
  );
}

export function isValidCreditCard(number: string): boolean {
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;

  let sum = 0;
  let isEven = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(cleaned.charAt(i), 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Deve conter pelo menos uma letra maiúscula');
  if (!/[a-z]/.test(password)) errors.push('Deve conter pelo menos uma letra minúscula');
  if (!/\d/.test(password)) errors.push('Deve conter pelo menos um número');
  if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password))
    errors.push('Deve conter pelo menos um caractere especial');
  return { valid: errors.length === 0, errors };
}

export function sanitizeString(input: string, maxLength = 1000): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLength);
}

export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateRequiredFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): string[] {
  const missing: string[] = [];
  for (const field of fields) {
    const value = obj[field];
    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      missing.push(String(field));
    }
  }
  return missing;
}
