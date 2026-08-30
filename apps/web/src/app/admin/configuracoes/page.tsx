'use client';

import CuponsTab from '@/components/admin/configuracoes/CuponsTab';
import EmailsTab from '@/components/admin/configuracoes/EmailsTab';
import FreteTab from '@/components/admin/configuracoes/FreteTab';
import IntegracoesTab from '@/components/admin/configuracoes/IntegracoesTab';
import LojaTab from '@/components/admin/configuracoes/LojaTab';
import PagamentosTab from '@/components/admin/configuracoes/PagamentosTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os dados da loja, frete, pagamentos, cupons, e-mails e integrações.
        </p>
      </div>

      <Tabs defaultValue="loja">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="loja">Loja</TabsTrigger>
          <TabsTrigger value="frete">Frete</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="cupons">Cupons</TabsTrigger>
          <TabsTrigger value="emails">E-mails</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="loja">
          <LojaTab />
        </TabsContent>
        <TabsContent value="frete">
          <FreteTab />
        </TabsContent>
        <TabsContent value="pagamentos">
          <PagamentosTab />
        </TabsContent>
        <TabsContent value="cupons">
          <CuponsTab />
        </TabsContent>
        <TabsContent value="emails">
          <EmailsTab />
        </TabsContent>
        <TabsContent value="integracoes">
          <IntegracoesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
