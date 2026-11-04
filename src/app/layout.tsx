import type { Metadata } from 'next';
import { Bricolage_Grotesque, Poppins } from 'next/font/google';

const titulos = Bricolage_Grotesque({ subsets: ['latin'], axes: ['opsz', 'wdth'], variable: '--font-head', display: 'swap' });
const cuerpo = Poppins({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body', display: 'swap' });

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
    <html lang="es-AR" className={`${titulos.variable} ${cuerpo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
