import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './paleta.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Moda con Steph · Cursos y talleres de maquillaje y colorimetría en Belgrano',
    template: '%s · Moda con Steph',
  },
  description:
    'Talleres y cursos de automaquillaje y colorimetría en grupos de hasta 4 alumnas, en el estudio de Belgrano o en vivo por Zoom. Mirá las fechas y reservá tu lugar online.',
  openGraph: { siteName: 'Moda con Steph', locale: 'es_AR', type: 'website', images: ['/img/steph.jpg'] },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-AR" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
