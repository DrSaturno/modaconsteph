import { Suspense } from 'react';
import { connection } from 'next/server';
import { requerirAdmin } from '@/lib/auth';
import { leerAjustes } from '@/lib/ajustes';
import { mpConfigurado, simulacroActivo } from '@/lib/mp';
import { Insignia, Titulo } from '../../componentes';
import { FormAjustes } from './FormAjustes';

export const metadata = { title: 'Ajustes' };

export default function Ajustes() {
  return <Suspense fallback={<p className="empty">Cargando…</p>}><Contenido /></Suspense>;
}

async function Contenido() {
  await connection();
  await requerirAdmin({ soloAdmin: true });
  const a = await leerAjustes();
  const mail = process.env.RESEND_API_KEY ? 'Resend' : process.env.BREVO_API_KEY ? 'Brevo' : null;
  return (
    <>
      <Titulo titulo="Ajustes" sub="Tus datos de contacto, de cobro y las reglas de reserva." />
      <div className="card" style={{ marginBottom: 20 }}>
        <b>Conexiones</b>
        <div className="tools" style={{ marginTop: 10 }}>
          <span>Mercado Pago <Insignia tono={mpConfigurado() ? 'good' : simulacroActivo() ? 'warn' : 'bad'}>{mpConfigurado() ? 'Conectado' : simulacroActivo() ? 'Modo de prueba' : 'Sin conectar'}</Insignia></span>
          <span>Envío de mails <Insignia tono={mail ? 'good' : 'bad'}>{mail ? `Conectado (${mail})` : 'Sin conectar'}</Insignia></span>
        </div>
        <small style={{ display: 'block', marginTop: 8, color: 'var(--muted)' }}>Las claves de Mercado Pago y del envío de mails las carga quien administra la web; no se escriben acá.</small>
      </div>
      <FormAjustes a={a} />
    </>
  );
}
