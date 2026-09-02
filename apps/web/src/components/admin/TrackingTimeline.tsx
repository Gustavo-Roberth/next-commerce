'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { RastreamentoEvento, TransportadoraRastreamento } from '@/lib/api/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, CheckCircle, Clock, MapPin, Package, RotateCcw, Truck } from 'lucide-react';

const statusLabels: Record<string, string> = {
  COLETADO: 'Coletado',
  EM_TRANSITO: 'Em trânsito',
  SAIU_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  DEVOLVIDO: 'Devolvido',
};

const statusColors: Record<string, string> = {
  COLETADO: 'bg-blue-100 text-blue-800',
  EM_TRANSITO: 'bg-indigo-100 text-indigo-800',
  SAIU_ENTREGA: 'bg-purple-100 text-purple-800',
  ENTREGUE: 'bg-green-100 text-green-800',
  DEVOLVIDO: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ReactNode> = {
  COLETADO: <Package className="h-4 w-4" />,
  EM_TRANSITO: <Truck className="h-4 w-4" />,
  SAIU_ENTREGA: <RotateCcw className="h-4 w-4" />,
  ENTREGUE: <CheckCircle className="h-4 w-4" />,
  DEVOLVIDO: <AlertCircle className="h-4 w-4" />,
};

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

interface TrackingTimelineProps {
  rastreamento: TransportadoraRastreamento | null | undefined;
  isLoading?: boolean;
}

export function TrackingTimeline({ rastreamento, isLoading }: TrackingTimelineProps) {
  if (isLoading) {
    return (
      <output className="space-y-4" aria-label="Carregando rastreamento">
        {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map((key) => (
          <div key={key} className="flex gap-3 animate-pulse">
            <div className="h-2 w-2 rounded-full bg-muted mt-2 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-3 w-64 bg-muted rounded" />
            </div>
          </div>
        ))}
      </output>
    );
  }

  if (!rastreamento || !rastreamento.eventos || rastreamento.eventos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Nenhum evento de rastreamento</p>
        <p className="text-sm mt-1">Aguardando atualizações da transportadora</p>
      </div>
    );
  }

  const eventosOrdenados = [...rastreamento.eventos].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  );

  const currentStatus = rastreamento.status_transportadora;
  const isDelivered = currentStatus === 'ENTREGUE';
  const isReturned = currentStatus === 'DEVOLVIDO';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Transportadora</p>
            <p className="font-medium capitalize">{rastreamento.transportadora.toLowerCase()}</p>
          </div>
        </div>
        <Separator orientation="vertical" className="h-8 mx-2" />
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Código de rastreamento</p>
            <p className="font-mono text-sm font-medium break-all">
              {rastreamento.codigo_rastreamento}
            </p>
          </div>
        </div>
        {rastreamento.url_rastreamento && (
          <>
            <Separator orientation="vertical" className="h-8 mx-2" />
            <a
              href={rastreamento.url_rastreamento}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Truck className="h-4 w-4" />
              Rastrear no site
            </a>
          </>
        )}
        <Separator orientation="vertical" className="h-8 mx-2" />
        <div className="ml-auto">
          <Badge className={statusColors[currentStatus] || 'bg-muted text-foreground'}>
            <span className="flex items-center gap-1">
              {statusIcons[currentStatus] || <Clock className="h-3 w-3" />}
              {statusLabels[currentStatus] || currentStatus}
            </span>
          </Badge>
        </div>
      </div>

      <ol className="space-y-4" aria-label="Histórico de rastreamento">
        {eventosOrdenados.map((evento: RastreamentoEvento, index) => {
          const isLast = index === eventosOrdenados.length - 1;
          const isCurrent = evento.status === currentStatus;

          return (
            <li key={`${evento.data}-${evento.status}-${index}`} className="flex gap-3 group">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`h-2 w-2 rounded-full border-2 transition-colors ${
                    isCurrent
                      ? 'bg-primary border-primary'
                      : isDelivered || isReturned
                        ? 'bg-green-500 border-green-500'
                        : 'bg-muted border-muted'
                  }`}
                />
                {!isLast && (
                  <div
                    className={`h-full w-0.5 mt-1 transition-colors ${
                      isCurrent || isDelivered || isReturned ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pt-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className={`font-medium truncate ${isCurrent ? 'text-primary' : ''}`}>
                      {statusLabels[evento.status] || evento.status}
                    </p>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Atual
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDateTime(evento.data)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{evento.descricao}</p>
                {evento.local && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{evento.local}</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {rastreamento.ultima_atualizacao && (
        <div className="pt-2 border-t text-xs text-muted-foreground">
          Última atualização: {formatDateTime(rastreamento.ultima_atualizacao)}
        </div>
      )}
    </div>
  );
}
