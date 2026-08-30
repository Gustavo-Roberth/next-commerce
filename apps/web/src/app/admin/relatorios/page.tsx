'use client';

import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminApi } from '@/lib/api/services';
import type {
  CreateReportScheduleInput,
  RelatorioColuna,
  RelatorioConsulta,
  RelatorioFormato,
  RelatorioTipo,
  ReportSchedule,
} from '@/lib/api/types';
import { formatCurrency } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';

const TIPOS: { valor: RelatorioTipo; rotulo: string }[] = [
  { valor: 'vendas-diario', rotulo: 'Vendas Diário' },
  { valor: 'produtos-top', rotulo: 'Produtos Mais Vendidos' },
  { valor: 'estoque-baixo', rotulo: 'Estoque Baixo' },
  { valor: 'conciliacao', rotulo: 'Conciliação Financeira' },
];

const FREQUENCIAS: { valor: CreateReportScheduleInput['frequencia']; rotulo: string }[] = [
  { valor: 'DIARIO', rotulo: 'Diário' },
  { valor: 'SEMANAL', rotulo: 'Semanal' },
  { valor: 'MENSAL', rotulo: 'Mensal' },
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const formatDate = (dateStr: string | null | undefined) =>
  dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '-';

function formatarCelula(coluna: RelatorioColuna, valor: unknown): string {
  if (valor === null || valor === undefined) return '-';
  if (coluna.formato === 'cents') return formatCurrency(Number(valor) / 100);
  if (coluna.formato === 'date') return formatDate(String(valor));
  if (coluna.formato === 'numero') return new Intl.NumberFormat('pt-BR').format(Number(valor));
  return String(valor);
}

export default function RelatoriosPage() {
  const [tipo, setTipo] = useState<RelatorioTipo>('vendas-diario');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [relatorio, setRelatorio] = useState<RelatorioConsulta | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState<RelatorioFormato | null>(null);

  const [agendamentos, setAgendamentos] = useState<ReportSchedule[]>([]);
  const [formato, setFormato] = useState<RelatorioFormato>('CSV');
  const [email, setEmail] = useState('');
  const [frequencia, setFrequencia] = useState<CreateReportScheduleInput['frequencia']>('DIARIO');
  const [hora, setHora] = useState('6');
  const [diaSemana, setDiaSemana] = useState('1');
  const [diaMes, setDiaMes] = useState('1');
  const [salvando, setSalvando] = useState(false);

  const consultar = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const params: { data_inicio?: string; data_fim?: string } = {};
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;
      const resultado = await adminApi.relatorios.consultar(tipo, params);
      setRelatorio(resultado);
    } catch (e) {
      setErro((e as Error).message);
      setRelatorio(null);
    } finally {
      setCarregando(false);
    }
  };

  const exportar = async (formatoEscolhido: RelatorioFormato) => {
    setExportando(formatoEscolhido);
    try {
      const params: { data_inicio?: string; data_fim?: string } = {};
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;
      await adminApi.relatorios.exportar(tipo, formatoEscolhido, params);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setExportando(null);
    }
  };

  const carregarAgendamentos = useCallback(async () => {
    try {
      const res = await adminApi.relatorios.agendamentos();
      setAgendamentos(res.data);
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    carregarAgendamentos();
  }, [carregarAgendamentos]);

  const salvarAgendamento = async () => {
    if (!email) {
      setErro('Informe o e-mail de destino');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const input: CreateReportScheduleInput = {
        tipo,
        formato,
        email_destino: email,
        frequencia,
        hora: Number(hora),
        ...(frequencia === 'SEMANAL' ? { dia_semana: Number(diaSemana) } : {}),
        ...(frequencia === 'MENSAL' ? { dia_mes: Number(diaMes) } : {}),
      };
      await adminApi.relatorios.criarAgendamento(input);
      setEmail('');
      await carregarAgendamentos();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (id: string) => {
    try {
      await adminApi.relatorios.removerAgendamento(id);
      await carregarAgendamentos();
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  const enviarAgora = async (id: string) => {
    try {
      await adminApi.relatorios.enviarAgora(id);
      await carregarAgendamentos();
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">
          Consulte métricas gerenciais, exporte em CSV/PDF e agende envios por e-mail.
        </p>
      </div>

      {erro && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{erro}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Consulta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label>Relatório</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as RelatorioTipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.valor} value={t.valor}>
                      {t.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="data_inicio">Data início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="data_fim">Data fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={consultar} disabled={carregando}>
                {carregando ? 'Consultando...' : 'Consultar'}
              </Button>
              <Button
                variant="outline"
                onClick={() => exportar('CSV')}
                disabled={exportando !== null}
              >
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => exportar('PDF')}
                disabled={exportando !== null}
              >
                PDF
              </Button>
            </div>
          </div>

          {relatorio && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {relatorio.colunas.map((coluna) => (
                      <TableHead key={coluna.chave}>{coluna.rotulo}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorio.linhas.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={relatorio.colunas.length}
                        className="text-center text-muted-foreground"
                      >
                        Nenhum dado encontrado para o período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    relatorio.linhas.map((linha) => (
                      <TableRow key={relatorio.colunas.map((c) => linha[c.chave]).join('|')}>
                        {relatorio.colunas.map((coluna) => (
                          <TableCell key={coluna.chave}>
                            {formatarCelula(coluna, linha[coluna.chave])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agendamentos de e-mail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-1">
              <Label>Formato</Label>
              <Select value={formato} onValueChange={(v) => setFormato(v as RelatorioFormato)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>E-mail destino</Label>
              <Input
                type="email"
                placeholder="gestor@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Frequência</Label>
              <Select
                value={frequencia}
                onValueChange={(v) => setFrequencia(v as CreateReportScheduleInput['frequencia'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIAS.map((f) => (
                    <SelectItem key={f.valor} value={f.valor}>
                      {f.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="hora">Hora (0-23)</Label>
              <Input
                id="hora"
                type="number"
                min={0}
                max={23}
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
            {frequencia === 'SEMANAL' && (
              <div className="space-y-1">
                <Label>Dia da semana</Label>
                <Select value={diaSemana} onValueChange={setDiaSemana}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((d, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {frequencia === 'MENSAL' && (
              <div className="space-y-1">
                <Label htmlFor="dia_mes">Dia do mês</Label>
                <Input
                  id="dia_mes"
                  type="number"
                  min={1}
                  max={28}
                  value={diaMes}
                  onChange={(e) => setDiaMes(e.target.value)}
                />
              </div>
            )}
          </div>
          <div>
            <Button onClick={salvarAgendamento} disabled={salvando}>
              {salvando ? 'Agendando...' : 'Agendar envio'}
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Relatório</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Próximo envio</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum agendamento configurado.
                    </TableCell>
                  </TableRow>
                ) : (
                  agendamentos.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        {TIPOS.find((t) => t.valor === a.tipo)?.rotulo ?? a.tipo}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.formato}</Badge>
                      </TableCell>
                      <TableCell>{a.email_destino}</TableCell>
                      <TableCell>
                        {FREQUENCIAS.find((f) => f.valor === a.frequencia)?.rotulo}
                      </TableCell>
                      <TableCell>{formatDate(a.proximo_envio_em)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => enviarAgora(a.id)}>
                            Enviar agora
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => remover(a.id)}>
                            Remover
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
