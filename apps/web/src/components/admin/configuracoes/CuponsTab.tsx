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
import type { CriarCupomInput, CupomConfig, CupomTipo, ValidarCupomInput } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';

const TIPOS: CupomTipo[] = ['PERCENTUAL', 'VALOR_FIXO', 'FRETE_GRATIS'];

const hoje = () => new Date().toISOString().slice(0, 16);

export default function CuponsTab() {
  const [lista, setLista] = useState<CupomConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<CupomTipo>('PERCENTUAL');
  const [valor, setValor] = useState(10);
  const [minimo, setMinimo] = useState(0);
  const [de, setDe] = useState(hoje());
  const [ate, setAte] = useState('2030-12-31T23:59');
  const [primeira, setPrimeira] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [testeSubtotal, setTesteSubtotal] = useState(10000);
  const [testeResultado, setTesteResultado] = useState<string | null>(null);

  const carregar = () => {
    setLoading(true);
    adminApi.configuracoes.cupons
      .list()
      .then(setLista)
      .catch(() => setErro('Erro ao carregar cupons'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const criar = async () => {
    setErro(null);
    try {
      const input: CriarCupomInput = {
        codigo,
        nome,
        tipo,
        valor,
        valor_minimo_pedido_cents: minimo,
        valido_de: new Date(de).toISOString(),
        valido_ate: new Date(ate).toISOString(),
        primeira_compra_only: primeira,
        ativo,
      };
      await adminApi.configuracoes.cupons.create(input);
      setCodigo('');
      setNome('');
      carregar();
    } catch {
      setErro('Erro ao criar CupomConfig');
    }
  };

  const testar = async (c: CupomConfig) => {
    const input: ValidarCupomInput = { codigo: c.codigo, subtotal_cents: testeSubtotal };
    try {
      const r = await adminApi.configuracoes.cupons.validar(input);
      setTesteResultado(
        r.valido
          ? `Válido: desconto ${formatCurrency(r.desconto_cents)}${r.frete_gratis ? ' + frete grátis' : ''}`
          : `Inválido: ${r.mensagem}`
      );
    } catch {
      setTesteResultado('Erro ao validar');
    }
  };

  const alternar = (c: CupomConfig) =>
    adminApi.configuracoes.cupons
      .alternar(c.id, !c.ativo)
      .then(carregar)
      .catch(() => setErro('Erro ao alterar status'));

  const remover = (c: CupomConfig) => {
    if (!confirm(`Remover "${c.codigo}"?`)) return;
    adminApi.configuracoes.cupons
      .remove(c.id)
      .then(carregar)
      .catch(() => setErro('Erro ao remover'));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Novo CupomConfig</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Código</Label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as CupomTipo)}>
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
              <Label>Valor {tipo === 'PERCENTUAL' ? '(%)' : '(centavos)'}</Label>
              <Input
                type="number"
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label>Mínimo (centavos)</Label>
              <Input
                type="number"
                value={minimo}
                onChange={(e) => setMinimo(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={ativo} onCheckedChange={setAtivo} />
              <Label>Ativo</Label>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Válido de</Label>
              <Input type="datetime-local" value={de} onChange={(e) => setDe(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Válido até</Label>
              <Input type="datetime-local" value={ate} onChange={(e) => setAte(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={primeira} onCheckedChange={setPrimeira} />
              <Label>Somente 1ª compra</Label>
            </div>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <Button onClick={criar}>Adicionar CupomConfig</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cupons</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Código</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Ativo</th>
                  <th>Teste (subtotal)</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-b align-top">
                    <td className="py-2">{c.codigo}</td>
                    <td>{c.tipo}</td>
                    <td>{c.valor}</td>
                    <td>{c.ativo ? 'Sim' : 'Não'}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          className="w-28"
                          value={testeSubtotal}
                          onChange={(e) => setTesteSubtotal(Number(e.target.value))}
                        />
                        <Button size="sm" variant="outline" onClick={() => testar(c)}>
                          Testar
                        </Button>
                      </div>
                    </td>
                    <td className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => alternar(c)}>
                        {c.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => remover(c)}>
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-muted-foreground">
                      Nenhum CupomConfig cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {testeResultado && <p className="mt-2 text-sm text-muted-foreground">{testeResultado}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
