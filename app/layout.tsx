import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TideME API',
  description: 'API Backend pour TideME - Marées et surf en temps réel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
