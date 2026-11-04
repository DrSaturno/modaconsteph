import './site.css';
import './booking.css';
import { getAjustesPublicos, getCatalogo } from '@/lib/catalogo';
import { BookingProvider } from '@/components/sitio/Reservas';
import { BarraCelular, Cabecera, Pie } from '@/components/sitio/secciones';

export default async function SitioLayout({ children }: LayoutProps<'/'>) {
  const [catalogo, aj] = await Promise.all([getCatalogo(), getAjustesPublicos()]);
  return (
    <BookingProvider catalogo={catalogo} ajustes={aj}>
      <Cabecera />
      {children}
      <Pie aj={aj} />
      <BarraCelular catalogo={catalogo} aj={aj} />
    </BookingProvider>
  );
}
