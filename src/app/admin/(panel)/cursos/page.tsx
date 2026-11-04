import { Suspense } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { adminActual } from '@/lib/auth';
import { propsCaratula } from '@/lib/caratula';
import { query } from '@/lib/db';
import { etiquetaFecha, peso, TIPO_ROTULO } from '@/lib/format';
import { Caratula } from '@/components/Caratula';
import { Aviso, Insignia, Titulo } from '../../componentes';
import { activarCurso, cambiarEstadoFecha, duplicarFecha } from '../../actions';

export const metadata = { title: 'Cursos y fechas' };

export default function Cursos(props: PageProps<'/admin/cursos'>) {
  return <Suspense fallback={<p className="empty">Cargando…</p>}><Contenido {...props} /></Suspense>;
}

async function Contenido({ searchParams }: PageProps<'/admin/cursos'>) {
  await connection();
  const [sp, admin] = await Promise.all([searchParams, adminActual()]);
  const cursos = await query(`select * from cursos order by activo desc, orden, nombre`);
  const fechas = await query(`select * from fechas_cupo where inicio > now() - interval '1 day' order by inicio`);
  const puede = admin?.rol === 'admin';

  return (
    <>
      <Titulo titulo="Cursos y fechas" sub="Todo lo publicado y lo que está en borrador. Duplicá una fecha para repetirla el mes que viene.">
        {puede && <Link className="btn" href="/admin/cursos/nuevo">+ Cargar un curso</Link>}
      </Titulo>
      <Aviso ok={typeof sp.ok === 'string' ? sp.ok : undefined} />
      <div className="stack">
        {cursos.map((c) => {
          const fs = fechas.filter((f) => f.curso_id === c.id);
          return (
            <section className="card" key={c.id} aria-label={c.nombre} style={c.activo ? undefined : { opacity: 0.7 }}>
              <div className="curso-h">
                <div className="curso-id">
                  <div className="curso-th"><Caratula {...propsCaratula({ nombre: c.nombre, corto: c.corto, tipo: c.tipo, kind: c.kind, duracion: c.duracion, caratula: c.caratula, orden: c.orden, fechas: fs.map((f) => ({ cupo: f.cupo })) })} className="cv-chica" /></div>
                  <div>
                    <h2 style={{ margin: 0 }}><Link href={`/admin/cursos/${c.id}`}>{c.nombre}</Link></h2>
                    <small style={{ color: 'var(--muted)' }}>{c.precio ? `${peso(c.precio)} · ` : ''}{c.duracion}</small>
                  </div>
                </div>
                <div className="tools">
                  <Insignia tono="neutral">{TIPO_ROTULO[c.tipo as keyof typeof TIPO_ROTULO]}</Insignia>
                  {!c.activo && <Insignia tono="warn">Oculto en la web</Insignia>}
                  {puede && <Link className="btn sec sm" href={`/admin/cursos/${c.id}`}>Editar</Link>}
                  {puede && <form action={activarCurso}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="activo" value={c.activo ? '0' : '1'} /><button className="btn sec sm" type="submit">{c.activo ? 'Ocultar' : 'Mostrar en la web'}</button></form>}
                </div>
              </div>
              {c.kind === 'consulta' || c.kind === 'regalo'
                ? <p style={{ color: 'var(--muted)', margin: 0 }}>{c.kind === 'consulta' ? 'Se reserva con una consulta: no tiene fechas.' : 'Es una gift card: no tiene fechas.'}</p>
                : fs.length === 0 ? <p className="empty">Sin fechas próximas. {puede && <Link href={`/admin/cursos/${c.id}#fechas`}>Agregá una</Link>}</p> : (
                  <div className="tablewrap"><table>
                    <thead><tr><th>Fecha</th><th>Lugares</th><th>Precio</th><th>Estado</th>{puede && <th>Acciones</th>}</tr></thead>
                    <tbody>{fs.map((f) => (
                      <tr key={f.id}>
                        <td><b>{etiquetaFecha({ inicio: new Date(f.inicio).toISOString(), otrasClases: f.otras_clases })}</b><small>{f.hora}</small></td>
                        <td>{c.kind === 'slot' ? (f.libres ? 'Libre' : 'Reservado') : `${f.libres} libres de ${f.cupo}`}</td>
                        <td>{f.precio != null ? peso(f.precio) : c.precio ? peso(c.precio) : '–'}</td>
                        <td><Insignia tono={f.estado === 'abierta' ? 'good' : f.estado === 'borrador' ? 'warn' : 'neutral'}>{f.estado === 'abierta' ? 'Publicada' : f.estado === 'borrador' ? (f.publicar_en ? 'Programada' : 'Borrador') : 'Cerrada'}</Insignia></td>
                        {puede && <td><div className="tools">
                          <Link className="btn sec sm" href={`/admin/cursos/${c.id}#fecha-${f.id}`}>Editar</Link>
                          {f.estado !== 'abierta' && <form action={cambiarEstadoFecha}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="estado" value="abierta" /><button className="btn ok sm" type="submit">Publicar</button></form>}
                          {f.estado === 'abierta' && <form action={cambiarEstadoFecha}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="estado" value="cerrada" /><button className="btn bad sm" type="submit">Cerrar</button></form>}
                          <form action={duplicarFecha}><input type="hidden" name="id" value={f.id} /><button className="btn sec sm" type="submit">Duplicar</button></form>
                        </div></td>}
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
            </section>
          );
        })}
      </div>
    </>
  );
}
