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
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/api';
import type { EmailTemplate, EmailTemplateTipo } from '@/lib/api';
import { useEffect, useState } from 'react';

const TIPOS: EmailTemplateTipo[] = [
  'BOAS_VINDAS',
  'CONFIRMACAO_PEDIDO',
  'ENVIADO',
  'ENTREGUE',
  'TROCA_SENHA',
  'CUPOM',
  'OUTRO',
];

export default function EmailsTab() {
  const [lista, setLista] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [assunto, setAssunto] = useState('');
  const [tipo, setTipo] = useState<EmailTemplateTipo>('BOAS_VINDAS');
  const [corpo, setCorpo] = useState('<mjml><mj-body></mj-body></mjml>');
  const [variaveis, setVariaveis] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const carregar = () => {
    setLoading(true);
    adminApi.configuracoes.emails
      .list()
      .then(setLista)
      .catch(() => setErro('Erro ao carregar templates'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const criar = async () => {
    setErro(null);
    try {
      await adminApi.configuracoes.emails.create({
        codigo,
        nome,
        assunto,
        tipo,
        corpo_mjml: corpo,
        variaveis: variaveis
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      });
      setCodigo('');
      setNome('');
      setAssunto('');
      carregar();
    } catch {
      setErro('Erro ao criar template');
    }
  };

  const previewTemplate = async (t: EmailTemplate) => {
    try {
      const r = await adminApi.configuracoes.emails.preview(t.id, {});
      setPreview(r.html);
    } catch {
      setErro('Erro ao gerar pré-visualização');
    }
  };

  const remover = (t: EmailTemplate) => {
    if (!confirm(`Remover "${t.nome}"?`)) return;
    adminApi.configuracoes.emails
      .remove(t.id)
      .then(carregar)
      .catch(() => setErro('Erro ao remover'));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Novo template de e-mail (MJML)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Código</Label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as EmailTemplateTipo)}>
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
            <Label>Assunto</Label>
            <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Variáveis (separadas por vírgula)</Label>
            <Input
              value={variaveis}
              onChange={(e) => setVariaveis(e.target.value)}
              placeholder="nome_cliente, pedido_id"
            />
          </div>
          <div className="space-y-1">
            <Label>Corpo MJML</Label>
            <Textarea rows={8} value={corpo} onChange={(e) => setCorpo(e.target.value)} />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <Button onClick={criar}>Adicionar template</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Nome</th>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((t) => (
                  <tr key={t.id} className="border-b">
                    <td className="py-2">{t.nome}</td>
                    <td>{t.codigo}</td>
                    <td>{t.tipo}</td>
                    <td className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => previewTemplate(t)}>
                        Pré-visualizar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => remover(t)}>
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-muted-foreground">
                      Nenhum template cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {preview && (
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between">
                <Label>Pré-visualização</Label>
                <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
                  Fechar
                </Button>
              </div>
              <iframe title="preview" className="h-96 w-full rounded border" srcDoc={preview} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
