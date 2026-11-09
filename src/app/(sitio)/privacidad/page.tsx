import type { Metadata } from 'next';
import Link from 'next/link';
import { CONTACTO_EMAIL, PaginaLegal } from '@/components/sitio/Legal';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Qué datos personales pedimos en Moda con Steph, para qué los usamos, con quién los compartimos y cómo ejercer tus derechos.',
  alternates: { canonical: '/privacidad' },
};

export default function Privacidad() {
  return (
    <PaginaLegal
      titulo="Política de privacidad"
      intro="En Moda con Steph cuidamos tus datos. Acá te contamos qué datos te pedimos, para qué los usamos, con quién los compartimos y cómo podés corregirlos o pedir que los borremos. Vale para este sitio y para las reservas, consultas y suscripciones que se hacen desde él."
    >
      <h2>1. Quién es la responsable</h2>
      <p>Steph Induni, titular de Moda con Steph, estudio de maquillaje e imagen en Belgrano, Ciudad Autónoma de Buenos Aires, Argentina. Para cualquier tema de datos personales escribinos a <a href={`mailto:${CONTACTO_EMAIL}`}>{CONTACTO_EMAIL}</a>.</p>

      <h2>2. Qué datos recopilamos</h2>
      <ul>
        <li><b>Cuando reservás:</b> tu nombre, mail y teléfono (WhatsApp), si es tu primera vez, el curso y la fecha que elegiste, el medio de pago y el estado del pago. Si pagás con Mercado Pago, los datos de tu tarjeta los recibe Mercado Pago: nosotras no los vemos ni los guardamos.</li>
        <li><b>Si regalás una gift card:</b> el nombre y el mail de la persona que la recibe y el mensaje que escribas.</li>
        <li><b>Cuando pedís una entrevista o hacés una consulta:</b> tus datos de contacto y lo que nos cuentes.</li>
        <li><b>Cuando te suscribís a las novedades:</b> tu mail.</li>
        <li><b>Cómo llegaste al sitio:</b> el anuncio, enlace o buscador desde el que entraste, tu dirección IP y el navegador que usás. Si reservás, se guardan junto a tu reserva para saber qué anuncios funcionan.</li>
        <li><b>Cookies y tecnologías parecidas:</b> las explicamos en la <Link href="/cookies">política de cookies</Link>.</li>
      </ul>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Gestionar tu reserva y tu pago, y guardarte el lugar en la clase.</li>
        <li>Escribirte por mail o WhatsApp: confirmación, recordatorios, dirección o link de la clase y cambios de fecha.</li>
        <li>Responder tus consultas.</li>
        <li>Enviarte novedades y tips de color, solo si lo pediste. Podés darte de baja cuando quieras desde cualquiera de esos mails.</li>
        <li>Entender cómo se usa el sitio y medir si nuestros anuncios funcionan, con Google Analytics y Meta.</li>
        <li>Cumplir obligaciones legales, contables e impositivas.</li>
      </ul>

      <h2>4. Con quién los compartimos</h2>
      <p>No vendemos tus datos. Para dar el servicio usamos proveedores que los procesan por nosotras:</p>
      <div className="legal-tabla">
        <table>
          <thead><tr><th>Proveedor</th><th>Para qué</th></tr></thead>
          <tbody>
            <tr><td>Mercado Pago</td><td>Cobrar las reservas online.</td></tr>
            <tr><td>Brevo</td><td>Enviar los mails de confirmación, recordatorios y novedades.</td></tr>
            <tr><td>Supabase</td><td>Base de datos donde se guardan las reservas.</td></tr>
            <tr><td>Vercel</td><td>Alojar el sitio web.</td></tr>
            <tr><td>Google (Analytics y Tag Manager)</td><td>Estadísticas de uso del sitio.</td></tr>
            <tr><td>Meta (Facebook e Instagram)</td><td>Medir el resultado de los anuncios.</td></tr>
          </tbody>
        </table>
      </div>
      <p>Cuando se confirma un pago, le enviamos a Google y a Meta los datos de la compra (curso y monto). A Meta, además, le mandamos tu mail, tu teléfono y tu nombre convertidos en un código ilegible (un “hash”), para que pueda vincular la compra con el anuncio que la originó. Meta los trata según su propia política.</p>
      <p>Algunos de estos proveedores procesan datos en servidores fuera de la Argentina, por ejemplo en Estados Unidos y en la Unión Europea. Al reservar, consultar o suscribirte aceptás esa transferencia, necesaria para prestarte el servicio. También podemos entregar datos a una autoridad cuando la ley lo exija.</p>

      <h2>5. Cuánto tiempo los guardamos</h2>
      <ul>
        <li>Reservas y pagos: el tiempo que haga falta para darte el servicio y cumplir las normas contables e impositivas.</li>
        <li>Consultas: el tiempo necesario para responderte y coordinar la entrevista.</li>
        <li>Suscripción a novedades: hasta que te des de baja.</li>
      </ul>

      <h2>6. Tus derechos</h2>
      <p>Podés pedir acceso a tus datos, corregirlos, actualizarlos o solicitar que los eliminemos. Escribinos a <a href={`mailto:${CONTACTO_EMAIL}`}>{CONTACTO_EMAIL}</a> desde el mail con el que reservaste, así podemos confirmar que sos vos. Respondemos dentro de los plazos de la Ley 25.326: 10 días corridos para el acceso y 5 días hábiles para la corrección o la eliminación.</p>
      <p className="legal-nota">El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326. La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.</p>

      <h2>7. Seguridad</h2>
      <p>El sitio funciona con conexión cifrada (https), el panel de administración se abre solo con usuario y clave, y la base de datos tiene el acceso restringido. Ningún sistema es infalible, pero trabajamos para que tus datos estén protegidos.</p>

      <h2>8. Cambios en esta política</h2>
      <p>Si la modificamos, publicamos la nueva versión en esta página y actualizamos la fecha de arriba.</p>
    </PaginaLegal>
  );
}
