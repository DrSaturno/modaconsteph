import { Suspense } from 'react';
import { connection } from 'next/server';
import { requerirAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { cuando } from '@/lib/format';
import { sustituir } from '@/lib/mail/plantillas';
import { Insignia, Titulo } from '../../componentes';
import { alternarPlantilla, reenviarMail } from '../../actions';
import { FormPlantilla } from './FormPlantilla';

export const metadata = { title: 'Mails automáticos' };

const EJEMPLO: Record<string, string> = {
  nombre: 'Lucía', nombre_completo: 'Lucía Fernández', email: 'lucia@ejemplo.com', tel: '11 2345 6789', curso: 'Taller de automaquillaje y colorimetría', curso_corto: 'Taller de automaquillaje',
  fecha: 'Sábado 14 de noviembre', hora: '11:00 a 13:30', lugar: 'Estudio en Belgrano, CABA', materiales: 'Tu neceser', whatsapp: '11 6462-7064', monto: '$ 75.000',
  resto_linea: 'Pagaste $ 22.500 de $ 75.000. El resto ($ 52.500) lo abonás antes de la clase.', vence: 'domingo 1 de noviembre a las 20:00',
  datos_transferencia: 'Titular: …\nAlias: …', como_llegar: 'Dirección: …', link_resena: 'https://g.page/…', link: 'https://modaconsteph.com.ar', codigo: 'MCS-7K4Q2X',
  quien_regala: 'Mariana', quien_recibe: 'Lucía', mensaje: 'Feliz cumple', cuando_envio: 'el 20 de diciembre', curso_siguiente: 'Colorimetría avanzada', fecha_siguiente: 'Martes 10 de noviembre',
  estado_pago: 'pagó el total', libres: '1', cupo: '4', panel: 'https://modaconsteph.com.ar/admin', motivo: 'Quiero renovar mi estilo',
};
const VARIABLES = ['nombre', 'curso', 'fecha', 'hora', 'lugar', 'materiales', 'whatsapp', 'monto', 'link_resena', 'curso_siguiente', 'fecha_siguiente', 'quien_regala', 'mensaje', 'codigo'];

export default function Mails() {
  return <Suspense fallback={<p className="empty">Cargando…</p>}><Contenido /></Suspense>;
}

async function Contenido() {
  await connection();
  await requerirAdmin({ soloAdmin: true });
  const plantillas = await query(`select * from plantillas_mail order by orden`);
  const envios = await query(
    `select m.id, m.para, m.estado, m.enviar_en, m.enviado_en, m.error, p.nombre from mails m join plantillas_mail p on p.clave = m.plantilla
      order by coalesce(m.enviado_en, m.enviar_en) desc limit 25`);
  const programados = (await query<{ n: number }>(`select count(*)::int as n from mails where estado = 'pendiente' and enviar_en > now()`))[0].n;
  const alumnas = plantillas.filter((p) => p.destino !== 'steph' && p.orden < 8);
  const sistema = plantillas.filter((p) => p.destino === 'steph' || p.orden >= 8);

  const bloque = (p: Record<string, any>) => (
    <section className="card" key={p.clave} aria-label={p.nombre}>
      <div className="curso-h">
        <div><h2 style={{ margin: 0, fontSize: 18 }}>{p.nombre}</h2><small style={{ color: 'var(--muted)' }}>{p.cuando} · {p.destino === 'steph' ? 'te llega a vos' : 'le llega a la alumna'}</small></div>
        <div className="tools">
          <Insignia tono={p.activa ? 'good' : 'neutral'}>{p.activa ? 'Prendido' : 'Apagado'}</Insignia>
          <form action={alternarPlantilla}><input type="hidden" name="clave" value={p.clave} /><button className="btn sec sm" type="submit">{p.activa ? 'Apagar' : 'Prender'}</button></form>
        </div>
      </div>
      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 600, minHeight: 40 }}>Ver y editar el texto</summary>
        <div style={{ paddingTop: 12 }}>
          <FormPlantilla clave={p.clave} asunto={p.asunto} cuerpo={p.cuerpo} />
          <p style={{ margin: '16px 0 6px', fontWeight: 600 }}>Así lo recibe la alumna (con datos de ejemplo)</p>
          <div className="mailbox"><b>{sustituir(p.asunto, EJEMPLO)}</b>{'\n\n'}{sustituir(p.cuerpo, EJEMPLO)}</div>
        </div>
      </details>
    </section>
  );

  return (
    <>
      <Titulo titulo="Mails automáticos" sub={`Salen solos en el momento justo. Cada uno lo podés apagar o editar. Hay ${programados} mails programados para los próximos días.`} />
      <div className="card" style={{ marginBottom: 20 }}>
        <b>Datos que se completan solos</b>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Escribilos entre corchetes dentro del texto:</p>
        <div className="vars">{VARIABLES.map((v) => <code key={v}>[{v}]</code>)}</div>
      </div>
      <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Para tus alumnas</h2>
      <div className="stack" style={{ marginBottom: 28 }}>{alumnas.map(bloque)}</div>
      <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Avisos del sistema</h2>
      <div className="stack" style={{ marginBottom: 28 }}>{sistema.map(bloque)}</div>
      <section className="card" aria-labelledby="h-envios">
        <h2 id="h-envios">Últimos envíos</h2>
        {envios.length === 0 ? <p className="empty">Todavía no se envió ningún mail.</p> : (
          <div className="tablewrap"><table>
            <thead><tr><th>Mail</th><th>Para</th><th>Estado</th><th>Cuándo</th><th /></tr></thead>
            <tbody>{envios.map((e) => (
              <tr key={e.id}>
                <td>{e.nombre}</td><td>{e.para}</td>
                <td><Insignia tono={e.estado === 'enviado' ? 'good' : e.estado === 'error' ? 'bad' : e.estado === 'pendiente' ? 'warn' : 'neutral'}>{{ enviado: 'Enviado', error: 'Falló', pendiente: 'Programado', cancelado: 'Omitido' }[e.estado as string]}</Insignia>{e.error && <small>{e.error}</small>}</td>
                <td>{cuando(e.enviado_en ?? e.enviar_en)}</td>
                <td>{['error', 'cancelado'].includes(e.estado) && <form action={reenviarMail}><input type="hidden" name="id" value={e.id} /><button className="btn sec sm" type="submit">Reenviar</button></form>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
