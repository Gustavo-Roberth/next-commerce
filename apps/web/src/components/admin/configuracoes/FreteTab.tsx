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
import type { ConfiguracaoFrete, CriarFreteInput, FreteTipo } from '@/lib/api';
import { useEffect, useState } from 'react';

const TIPOS: FreteTipo[] = [
  'GRATIS_VALOR',
  'GRATIS_REGIAO',
  'TABELA_PRECO',
  'CORREIOS',
  'TRANSPORTADORA',
];

const EXEMPLO: Record<FreteTipo, string> = {
  GRATIS_VALOR: '{\n  "valor_minimo_cents": 10000\n}',
  GRATIS_REGIAO: '{\n  "regioes": [{ "cep_inicio": "01000000", "cep_fim": "05999999" }]\n}',
  TABELA_PRECO: '{\n  "faixas": [{ "ate_kg": 5, "valor_cents": 1500, "prazo_dias": 3 }]\n}',
  CORREIOS: '{\n  "valor_cents": 2000,\n  "prazo_dias": 5\n}',
  TRANSPORTADORA: '{\n  "valor_cents": 1800,\n  "prazo_dias": 4\n}',
};

export default function FreteTab() {
  const [lista, setLista] = useState<ConfiguracaoFrete[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<FreteTipo>('CORREIOS');
  const [prioridade, setPrioridade] = useState(1);
  const [ativo, setAtivo] = useState(true);
  const [configJson, setConfigJson] = useState(EXEMPLO.CORREIOS);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = () => {
    setLoading(true);
    adminApi.configuracoes.frete
      .list()
      .then(setLista)
      .catch(() => setErro('Erro ao carregar fretes'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const criar = async () => {
    setErro(null);
    try {
      const configuracao = JSON.parse(configJson);
      const input: CriarFreteInput = { nome, tipo, prioridade, ativo, configuracao };
      await adminApi.configuracoes.frete.create(input);
      setNome('');
      carregar();
    } catch {
      setErro('JSON de configuração inválido');
    }
  };

  const alternar = (f: ConfiguracaoFrete) =>
    adminApi.configuracoes.frete
      .alternar(f.id, !f.ativo)
      .then(carregar)
      .catch(() => setErro('Erro ao alterar status'));

  const remover = (f: ConfiguracaoFrete) => {
    if (!confirm(`Remover "${f.nome}"?`)) return;
    adminApi.configuracoes.frete
      .remove(f.id)
      .then(carregar)
      .catch(() => setErro('Erro ao remover'));
  };

  const aoTrocarTipo = (t: FreteTipo) => {
    setTipo(t);
    setConfigJson(EXEMPLO[t]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nova regra de frete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => aoTrocarTipo(v as FreteTipo)}>
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
            <div className="space-y-1">
              <Label>Prioridade</Label>
              <Input
                type="number"
                value={prioridade}
                onChange={(e) => setPrioridade(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={ativo} onCheckedChange={setAtivo} />
              <Label>Ativo</Label>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Configuração (JSON)</Label>
            <textarea
              className="w-full rounded-md border bg-background p-2 font-mono text-xs"
              rows={5}
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
            />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <Button onClick={criar}>Adicionar regra</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras configuradas</CardTitle>
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
                  <th>Prioridade</th>
                  <th>Ativo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((f) => (
                  <tr key={f.id} className="border-b">
                    <td className="py-2">{f.nome}</td>
                    <td>{f.tipo}</td>
                    <td>{f.prioridade}</td>
                    <td>{f.ativo ? 'Sim' : 'Não'}</td>
                    <td className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => alternar(f)}>
                        {f.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => remover(f)}>
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-muted-foreground">
                      Nenhuma regra cadastrada.
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
