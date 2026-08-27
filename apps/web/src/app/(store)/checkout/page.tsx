'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface FreteOpcao {
  nome: string;
  tipo: string;
  prazo_dias: number;
  valor_cents: number;
  transportadora?: string;
}

interface Endereco {
  id: string;
  tipo: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [enderecoEntrega, _setEnderecoEntrega] = useState<Endereco | null>(null);
  const [_enderecoCobranca, _setEnderecoCobranca] = useState<Endereco | null>(null);
  const [mesmoEndereco, setMesmoEndereco] = useState(true);
  const [freteSelecionado, setFreteSelecionado] = useState<FreteOpcao | null>(null);
  const [freteOpcoes, _setFreteOpcoes] = useState<FreteOpcao[]>([]);
  const [pagamentoGateway, setPagamentoGateway] = useState('MERCADO_PAGO');
  const [pagamentoMetodo, setPagamentoMetodo] = useState('PIX');
  const [pagamentoParcelas, setPagamentoParcelas] = useState(1);
  const [_cupom, _setCupom] = useState('');
  const [loading, _setLoading] = useState(false);
  const [subtotal, _setSubtotal] = useState(0);
  const [freteValor, _setFreteValor] = useState(0);
  const [desconto, _setDesconto] = useState(0);

  const _total = subtotal - desconto + freteValor;

  const nextStep = () => {
    if (step === 1 && !enderecoEntrega) return;
    if (step === 2 && !freteSelecionado) return;
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  function renderStep1() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              1
            </span>
            Endereço de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                maxLength={9}
                onBlur={async (e) => {
                  const cep = e.target.value.replace(/\D/g, '');
                  if (cep.length === 8) {
                    // TODO: buscar endereço via API de CEP
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input id="logradouro" placeholder="Rua, Avenida, etc." />
            </div>
            <div>
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" placeholder="123" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="complemento">Complemento (opcional)</Label>
              <Input id="complemento" placeholder="Apto, Bloco, etc." />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" placeholder="Bairro" />
            </div>
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" placeholder="Cidade" />
            </div>
            <div>
              <Label htmlFor="uf">UF</Label>
              <Input id="uf" placeholder="SP" maxLength={2} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="mesmoEndereco"
              checked={mesmoEndereco}
              onChange={(e) => setMesmoEndereco(e.target.checked)}
            />
            <Label htmlFor="mesmoEndereco">Endereço de cobrança é o mesmo</Label>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderStep2() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              2
            </span>
            Frete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {freteOpcoes.length === 0 ? (
              <p className="text-muted-foreground">
                Calcule o frete preenchendo o CEP na etapa anterior.
              </p>
            ) : (
              freteOpcoes.map((opcao) => (
                <label
                  key={opcao.nome}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${freteSelecionado?.nome === opcao.nome ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                >
                  <input
                    type="radio"
                    name="frete"
                    value={opcao.nome}
                    checked={freteSelecionado?.nome === opcao.nome}
                    onChange={() => setFreteSelecionado(opcao)}
                    className="h-4 w-4 text-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{opcao.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {opcao.tipo} - {opcao.prazo_dias} dias úteis
                      {opcao.transportadora && ` - ${opcao.transportadora}`}
                    </div>
                  </div>
                  <div className="font-medium text-primary">
                    {opcao.valor_cents === 0
                      ? 'Grátis'
                      : `R$ ${(opcao.valor_cents / 100).toFixed(2).replace('.', ',')}`}
                  </div>
                </label>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderStep3() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              3
            </span>
            Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <h4 className="font-medium">Método de Pagamento</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 p-4 border rounded-lg cursor-pointer hover:border-primary/50">
                <input
                  type="radio"
                  name="gateway"
                  value="MERCADO_PAGO"
                  checked={pagamentoGateway === 'MERCADO_PAGO'}
                  onChange={(e) => setPagamentoGateway(e.target.value)}
                  className="h-4 w-4 text-primary"
                />
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Mercado Pago</span>
                </div>
              </label>
              <label className="flex items-center gap-2 p-4 border rounded-lg cursor-pointer hover:border-primary/50">
                <input
                  type="radio"
                  name="gateway"
                  value="STRIPE"
                  checked={pagamentoGateway === 'STRIPE'}
                  onChange={(e) => setPagamentoGateway(e.target.value)}
                  className="h-4 w-4 text-primary"
                  disabled
                />
                <div className="flex items-center gap-2 opacity-50">
                  <CreditCard className="h-5 w-5" />
                  <span>Stripe (em breve)</span>
                </div>
              </label>
            </div>

            <h4 className="font-medium">Forma de Pagamento</h4>
            <div className="grid sm:grid-cols-3 gap-4">
              {['PIX', 'CARTAO_CREDITO', 'BOLETO'].map((metodo) => (
                <label
                  key={metodo}
                  className="flex items-center gap-2 p-4 border rounded-lg cursor-pointer hover:border-primary/50"
                >
                  <input
                    type="radio"
                    name="metodo"
                    value={metodo}
                    checked={pagamentoMetodo === metodo}
                    onChange={(e) => setPagamentoMetodo(e.target.value)}
                    className="h-4 w-4 text-primary"
                  />
                  <div className="flex items-center gap-2">
                    {metodo === 'PIX' && <Smartphone className="h-5 w-5" />}
                    {metodo === 'CARTAO_CREDITO' && <CreditCard className="h-5 w-5" />}
                    {metodo === 'BOLETO' && <CreditCard className="h-5 w-5" />}
                    <span>{metodo === 'CARTAO_CREDITO' ? 'Cartão de Crédito' : metodo}</span>
                  </div>
                </label>
              ))}

              {pagamentoMetodo === 'CARTAO_CREDITO' && (
                <div>
                  <Label htmlFor="parcelas">Parcelas</Label>
                  <select
                    id="parcelas"
                    value={pagamentoParcelas}
                    onChange={(e) => setPagamentoParcelas(Number(e.target.value))}
                    className="w-full sm:w-48 border rounded-md px-3 py-2"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}x {n > 1 ? 'com juros' : 'à vista'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderStep4() {
    const showPix = pagamentoMetodo === 'PIX';

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              4
            </span>
            Confirmação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Resumo do Pedido</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ 100,00</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span>Grátis</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Desconto</span>
                <span>- R$ 0,00</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>R$ 100,00</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Forma de Pagamento</h4>
            <p className="text-sm text-muted-foreground">
              {pagamentoMetodo === 'PIX'
                ? 'PIX via Mercado Pago'
                : pagamentoMetodo === 'CARTAO_CREDITO'
                  ? 'Cartão de Crédito'
                  : 'Boleto Bancário'}
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Endereço de Entrega</h4>
            <p className="text-sm text-muted-foreground">
              Rua Exemplo, 123 - Centro, São Paulo/SP - 01000-000
            </p>
          </div>

          {showPix && (
            <div className="border rounded-lg p-4" data-testid="pix-qr-code">
              <h4 className="font-medium mb-3">Pague com PIX</h4>
              <div className="text-center space-y-3">
                <div className="bg-white p-4 rounded-lg border inline-block">
                  <div className="bg-black text-white font-mono text-xs px-3 py-2 rounded">
                    00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913NextCommerce6009SAO
                    PAULO62070503***6304ABCD
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <div className="w-48 h-48 bg-white">
                      <svg
                        width="192"
                        height="192"
                        viewBox="0 0 192 192"
                        aria-label="QR Code PIX para pagamento"
                        role="img"
                      >
                        <title>QR Code PIX</title>
                        <rect width="192" height="192" fill="white" />
                        <path d="M32 32h128v128H32z" fill="none" stroke="black" strokeWidth="8" />
                        <rect x="48" y="48" width="16" height="16" fill="black" />
                        <rect x="72" y="48" width="16" height="16" fill="black" />
                        <rect x="96" y="48" width="16" height="16" fill="black" />
                        <rect x="120" y="48" width="16" height="16" fill="black" />
                        <rect x="144" y="48" width="16" height="16" fill="black" />
                        <rect x="48" y="72" width="16" height="16" fill="black" />
                        <rect x="72" y="72" width="16" height="16" fill="black" />
                        <rect x="96" y="72" width="16" height="16" fill="black" />
                        <rect x="120" y="72" width="16" height="16" fill="black" />
                        <rect x="144" y="72" width="16" height="16" fill="black" />
                        <rect x="48" y="96" width="16" height="16" fill="black" />
                        <rect x="72" y="96" width="16" height="16" fill="black" />
                        <rect x="96" y="96" width="16" height="16" fill="black" />
                        <rect x="120" y="96" width="16" height="16" fill="black" />
                        <rect x="144" y="96" width="16" height="16" fill="black" />
                        <rect x="48" y="120" width="16" height="16" fill="black" />
                        <rect x="72" y="120" width="16" height="16" fill="black" />
                        <rect x="96" y="120" width="16" height="16" fill="black" />
                        <rect x="120" y="120" width="16" height="16" fill="black" />
                        <rect x="144" y="120" width="16" height="16" fill="black" />
                        <rect x="48" y="144" width="16" height="16" fill="black" />
                        <rect x="72" y="144" width="16" height="16" fill="black" />
                        <rect x="96" y="144" width="16" height="16" fill="black" />
                        <rect x="120" y="144" width="16" height="16" fill="black" />
                        <rect x="144" y="144" width="16" height="16" fill="black" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code ou copie o código PIX
                </p>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913NextCommerce6009SAO PAULO62070503***6304ABCD'
                    )
                  }
                >
                  Copiar código PIX
                </button>
              </div>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={() => router.push('/pedido/confirmado')}>
            <Lock className="h-4 w-4 mr-2" />
            Confirmar Pedido
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Ao confirmar, você concorda com nossos{' '}
            <button type="button" className="underline">
              Termos de Uso
            </button>{' '}
            e{' '}
            <button type="button" className="underline">
              Política de Privacidade
            </button>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  function renderSidebar() {
    return (
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-primary">Resumo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal (1 item)</span>
              <span className="font-medium">R$ 100,00</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Frete</span>
              <span>Grátis</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto</span>
              <span>- R$ 0,00</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>R$ 100,00</span>
            </div>

            <div className="border-t pt-3 space-y-2">
              <h4 className="font-medium">Pagamento</h4>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" />
                <span>PIX - Mercado Pago</span>
              </div>
              <p className="text-xs text-muted-foreground">À vista</p>
            </div>

            <div className="border-t pt-3 space-y-2">
              <h4 className="font-medium">Entrega</h4>
              <p className="text-sm text-muted-foreground">
                Rua Exemplo, 123 - Centro, São Paulo/SP
              </p>
              <p className="text-xs text-muted-foreground">Entrega Padrão - 5 dias úteis</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Finalizar Compra</h1>
        <p className="text-muted-foreground mt-1">
          Complete as informações para finalizar seu pedido
        </p>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          <div className="flex justify-between pt-4 border-t">
            {step > 1 && (
              <Button variant="outline" onClick={prevStep}>
                Voltar
              </Button>
            )}
            <Button onClick={nextStep} disabled={loading}>
              {step === 4 ? 'Confirmar Pedido' : 'Continuar'}
            </Button>
          </div>
        </div>

        {renderSidebar()}
      </div>
    </div>
  );
}
