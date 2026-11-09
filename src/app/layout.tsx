import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import Script from 'next/script';
import { GTM_ID, META_VERIFICACION_DOMINIO } from '@/lib/tracking/ids';
import './paleta.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });

/**
 * Google Tag Manager (adentro están Google Analytics 4 y el Pixel de Meta). Solo en la web publicada: las pruebas locales y
 * las vistas previas no ensucian los números (para probarlo en local: MCS_TRACKING=1). El panel de Steph nunca lo carga.
 */
const SEGUIMIENTO = process.env.VERCEL_ENV === 'production' || process.env.MCS_TRACKING === '1';
const GTM = `(function(w,d,s,l,i){if(w.location.pathname.indexOf('/admin')===0)return;w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Moda con Steph · Cursos y talleres de maquillaje y colorimetría en Belgrano',
    template: '%s · Moda con Steph',
  },
  description:
    'Talleres y cursos de automaquillaje y colorimetría en grupos de hasta 4 alumnas, en el estudio de Belgrano o en vivo por Zoom. Mirá las fechas y reservá tu lugar online.',
  openGraph: { siteName: 'Moda con Steph', locale: 'es_AR', type: 'website', images: ['/img/steph.jpg'] },
  ...(META_VERIFICACION_DOMINIO ? { other: { 'facebook-domain-verification': META_VERIFICACION_DOMINIO } } : {}),
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-AR" className={poppins.variable}>
      <body>
        {SEGUIMIENTO && <Script id="gtm" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: GTM }} />}
        {SEGUIMIENTO && (
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} title="Google Tag Manager" />
          </noscript>
        )}
        {children}
      </body>
    </html>
  );
}
