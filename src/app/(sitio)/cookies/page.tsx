import type { Metadata } from 'next';
import Link from 'next/link';
import { CONTACTO_EMAIL, PaginaLegal } from '@/components/sitio/Legal';

export const metadata: Metadata = {
  title: 'Política de cookies',
  description: 'Qué cookies usa el sitio de Moda con Steph, para qué sirven y cómo desactivarlas.',
  alternates: { canonical: '/cookies' },
};

export default function Cookies() {
  return (
    <PaginaLegal
      titulo="Política de cookies"
      intro="Una cookie es un archivo pequeño que el sitio guarda en tu navegador. Usamos pocas, y casi todas sirven para medir las visitas y el resultado de los anuncios."
    >
      <h2>Qué usamos</h2>
      <div className="legal-tabla">
        <table>
          <thead><tr><th>Nombre</th><th>De quién</th><th>Para qué sirve</th><th>Cuánto dura</th></tr></thead>
          <tbody>
            <tr><td><code>_ga</code></td><td>Google Analytics</td><td>Distingue a un visitante de otro para las estadísticas.</td><td>Hasta 2 años</td></tr>
            <tr><td><code>_ga_8FPSLDRG5B</code></td><td>Google Analytics</td><td>Guarda el estado de tu visita actual.</td><td>Hasta 2 años</td></tr>
            <tr><td><code>_fbp</code></td><td>Meta</td><td>Identifica tu navegador para medir los anuncios de Facebook e Instagram.</td><td>3 meses</td></tr>
            <tr><td><code>_fbc</code></td><td>Meta</td><td>Solo si llegás desde un anuncio de Meta: recuerda cuál fue.</td><td>3 meses</td></tr>
            <tr><td><code>mcs_origen</code></td><td>Moda con Steph</td><td>Recuerda el anuncio o enlace por el que llegaste, para saber de dónde salió tu reserva. Se guarda en el almacenamiento del navegador, no en una cookie.</td><td>Hasta que borres los datos del navegador</td></tr>
          </tbody>
        </table>
      </div>
      <p>Cuando pagás con Mercado Pago pasás a su sitio, que usa sus propias cookies. Se rigen por la política de Mercado Pago. El panel de administración que usa el equipo tiene una cookie de sesión propia y ahí no se carga ninguna herramienta de medición.</p>

      <h2>Cómo desactivarlas</h2>
      <ul>
        <li><b>Desde tu navegador:</b> en Chrome, Safari, Firefox o Edge, entrá a la configuración de privacidad y borrá o bloqueá las cookies. El sitio sigue funcionando sin ellas.</li>
        <li><b>Google Analytics:</b> instalá el <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">complemento oficial de inhabilitación</a>.</li>
        <li><b>Meta:</b> ajustá tus <a href="https://www.facebook.com/adpreferences" target="_blank" rel="noopener">preferencias de anuncios</a>.</li>
      </ul>
      <p>Al seguir navegando el sitio aceptás el uso de estas cookies. Podés cambiar de idea cuando quieras con las opciones de arriba.</p>

      <h2>Más información</h2>
      <p>Para saber qué hacemos con tus datos personales, leé la <Link href="/privacidad">política de privacidad</Link>. Si tenés dudas, escribinos a <a href={`mailto:${CONTACTO_EMAIL}`}>{CONTACTO_EMAIL}</a>.</p>
    </PaginaLegal>
  );
}
