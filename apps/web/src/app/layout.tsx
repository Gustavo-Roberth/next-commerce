import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'NextCommerce',
  description: 'SaaS de e-commerce para pequenos lojistas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          <main id="conteudo">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
