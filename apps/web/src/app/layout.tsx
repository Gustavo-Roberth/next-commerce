import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
