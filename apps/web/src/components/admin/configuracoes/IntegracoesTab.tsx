'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { adminApi } from '@/lib/api';
import type { CriarIntegracaoInput, Integracao, IntegracaoTipo } from '@/lib/api';
import { useEffect, useState } from 'react';

const TIPOS: IntegracaoTipo[] = [
  'MARKETPLACE',
  'ERP',
  'GATEWAY',
  'LOGISTICA',
  'MARKETING',
  'OUTRO',
];

export default function IntegracoesTab() {
  const [lista, setLista] = useState<Integracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<IntegracaoTipo>('MARKETPLACE');
  const [credJson, setCredJson] = useState('{\n  \n}');
  const [confJson, setConfJson] = useState('{\n  \n}');
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [revelado, setRevelado] = useState<Record<string, string>>({});

  const carregar = () => {
    setLoading(true);
    adminApi.configuracoes.integracoes
      .list()
      .then(setLista)
      .catch(() => setErro('Erro ao carregar integrações'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const criar = async () => {
    setErro(null);
    try {
      const input: CriarIntegracaoInput = {
        nome,
        tipo,
        credenciais: JSON.parse(credJson),
        configuracao: JSON.parse(confJson),
        ativo,
      };
      await adminApi.configuracoes.integracoes.create(input);
      setNome('');
      setCredJson('{\n  \n}');
      setConfJson('{\n  \n}');
      carregar();
    } catch {
      setErro('JSON de credenciais/configuração inválido');
    }
  };

  const verCredenciais = async (id: string) => {
    try {
      const r = await adminApi.configuracoes.integracoes.credenciais(id);
      setRevelado((prev) => ({ ...prev, [id]: JSON.stringify(r.credenciais, null, 2) }));
    } catch {
      setErro('Sem permissão para ver credenciais');
    }
  };

  const alternar = (i: Integracao) =>
    adminApi.configuracoes.integracoes
      .alternar(i.id, !i.ativo)
      .then(carregar)
      .catch(() => setErro('Erro ao alterar status'));

  const remover = (i: Integracao) => {
    if (!confirm(`Remover "${i.nome}"?`)) return;
    adminApi.configuracoes.integracoes
      .remove(i.id)
      .then(carregar)
      .catch(() => setErro('Erro ao remover'));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nova integração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as IntegracaoTipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Credenciais (JSON) — criptografadas</Label>
            <textarea
              className="w-full rounded-md border bg-background p-2 font-mono text-xs"
              rows={4}
              value={credJson}
              onChange={(e) => setCredJson(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Configuração (JSON)</Label>
            <textarea
              className="w-full rounded-md border bg-background p-2 font-mono text-xs"
              rows={4}
              value={confJson}
              onChange={(e) => setConfJson(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Switch checked={ativo} onCheckedChange={setAtivo} />
            <Label>Ativo</Label>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <Button onClick={criar}>Adicionar integração</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Nome</th>
                  <th>Tipo</th>
                  <th>Ativo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((i) => (
                  <tr key={i.id} className="border-b align-top">
                    <td className="py-2">{i.nome}</td>
                    <td>{i.tipo}</td>
                    <td>{i.ativo ? 'Sim' : 'Não'}</td>
                    <td className="space-y-1">
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => verCredenciais(i.id)}>
                          Ver credenciais
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => alternar(i)}>
                          {i.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => remover(i)}>
                          Remover
                        </Button>
                      </div>
                      {revelado[i.id] && (
                        <pre className="mt-1 rounded bg-muted p-2 text-xs">{revelado[i.id]}</pre>
                      )}
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-muted-foreground">
                      Nenhuma integração cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
