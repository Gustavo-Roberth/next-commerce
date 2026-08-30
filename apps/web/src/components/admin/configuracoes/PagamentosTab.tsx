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
import type { ConfiguracaoPagamento, CriarPagamentoInput, PagamentoMetodo } from '@/lib/api';
import { useEffect, useState } from 'react';

const METODOS: PagamentoMetodo[] = [
  'PIX',
  'CARTAO_CREDITO',
  'CARTAO_DEBITO',
  'BOLETO',
  'TRANSFERENCIA',
  'DINHEIRO',
  'CARTAO',
  'OUTRO',
];

export default function PagamentosTab() {
  const [lista, setLista] = useState<ConfiguracaoPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [metodo, setMetodo] = useState<PagamentoMetodo>('PIX');
  const [credJson, setCredJson] = useState('{\n  \n}');
  const [instrucoes, setInstrucoes] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [revelado, setRevelado] = useState<Record<string, string>>({});

  const carregar = () => {
    setLoading(true);
    adminApi.configuracoes.pagamentos
      .list()
      .then(setLista)
      .catch(() => setErro('Erro ao carregar pagamentos'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const criar = async () => {
    setErro(null);
    try {
      const credenciais = JSON.parse(credJson);
      const input: CriarPagamentoInput = {
        nome,
        metodo,
        credenciais,
        instrucoes,
        parcelas_max: parcelas,
        ativo,
      };
      await adminApi.configuracoes.pagamentos.create(input);
      setNome('');
      setCredJson('{\n  \n}');
      carregar();
    } catch {
      setErro('JSON de credenciais inválido');
    }
  };

  const verCredenciais = async (id: string) => {
    try {
      const r = await adminApi.configuracoes.pagamentos.credenciais(id);
      setRevelado((prev) => ({ ...prev, [id]: JSON.stringify(r.credenciais, null, 2) }));
    } catch {
      setErro('Sem permissão para ver credenciais');
    }
  };

  const alternar = (p: ConfiguracaoPagamento) =>
    adminApi.configuracoes.pagamentos
      .alternar(p.id, !p.ativo)
      .then(carregar)
      .catch(() => setErro('Erro ao alterar status'));

  const remover = (p: ConfiguracaoPagamento) => {
    if (!confirm(`Remover "${p.nome}"?`)) return;
    adminApi.configuracoes.pagamentos
      .remove(p.id)
      .then(carregar)
      .catch(() => setErro('Erro ao remover'));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nova forma de pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Método</Label>
              <Select value={metodo} onValueChange={(v) => setMetodo(v as PagamentoMetodo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Parcelas máx.</Label>
              <Input
                type="number"
                value={parcelas}
                onChange={(e) => setParcelas(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={ativo} onCheckedChange={setAtivo} />
              <Label>Ativo</Label>
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
            <Label>Instruções</Label>
            <textarea
              className="w-full rounded-md border bg-background p-2 text-sm"
              rows={2}
              value={instrucoes}
              onChange={(e) => setInstrucoes(e.target.value)}
            />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <Button onClick={criar}>Adicionar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formas configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Nome</th>
                  <th>Método</th>
                  <th>Ativo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id} className="border-b align-top">
                    <td className="py-2">{p.nome}</td>
                    <td>{p.metodo}</td>
                    <td>{p.ativo ? 'Sim' : 'Não'}</td>
                    <td className="space-y-1">
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => verCredenciais(p.id)}>
                          Ver credenciais
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => alternar(p)}>
                          {p.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => remover(p)}>
                          Remover
                        </Button>
                      </div>
                      {revelado[p.id] && (
                        <pre className="mt-1 rounded bg-muted p-2 text-xs">{revelado[p.id]}</pre>
                      )}
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-muted-foreground">
                      Nenhuma forma cadastrada.
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
