import { Suspense } from 'react';
import './site.css';
import './booking.css';
import { getAjustesPublicos, getCatalogo } from '@/lib/catalogo';
import { BookingProvider } from '@/components/sitio/Reservas';
import { ClicsContacto, RastreoRutas } from '@/components/sitio/Rastreo';
import { BarraCelular, BurbujaWhatsApp, Cabecera, Pie } from '@/components/sitio/secciones';

export default async function SitioLayout({ children }: LayoutProps<'/'>) {
  const [catalogo, aj] = await Promise.all([getCatalogo(), getAjustesPublicos()]);
  return (
    <BookingProvider catalogo={catalogo} ajustes={aj}>
      <i className="sitio-root" hidden />
      <Cabecera />
      {children}
      <Pie aj={aj} />
      <BarraCelular catalogo={catalogo} />
      <BurbujaWhatsApp aj={aj} />
      <Suspense fallback={null}><RastreoRutas /></Suspense>
      <ClicsContacto />
    </BookingProvider>
  );
}
