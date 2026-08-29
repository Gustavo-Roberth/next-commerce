interface Perfil {
  codigo: string;
  nome: string;
}

const PERFIS_STORAGE_KEY = 'user_perfis';

export function setUserPerfis(perfis: Perfil[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PERFIS_STORAGE_KEY, JSON.stringify(perfis));
}

export function getUserPerfis(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PERFIS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Perfil[];
    return parsed.map((p) => p.codigo).filter(Boolean);
  } catch {
    return [];
  }
}

export function hasPerfil(...codigos: string[]): boolean {
  const perfis = getUserPerfis();
  return codigos.some((c) => perfis.includes(c));
}
