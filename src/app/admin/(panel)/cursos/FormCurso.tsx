'use client';

import { useState, type FormEvent } from 'react';
import { MOTIVOS, PALETAS, PALETAS_ORDEN, normalizarCaratula, propsCaratula, type Motivo, type Paleta } from '@/lib/caratula';
import { peso } from '@/lib/format';
import { Caratula, MiniMotivo } from '@/components/Caratula';
import { guardarCurso } from '../../actions';
import { Formulario } from '../Formulario';
import { CamposFecha, FECHA_VACIA } from './CamposFecha';

export type CursoEdit = {
  id: string; nombre: string; tipo: string; kind: string; lugar: string; duracion: string; resumen: string; descripcion: string;
  para_quien: string; incluye: string[]; programa: string[]; que_traer: string; caratula: unknown; orden: number;
  /** Lugares del grupo, tomados de las fechas que ya tiene (para las lucecitas de la carátula). */
  cupo: number | null; precio: number | null; precio_lista: number | null;
  sena_modo: string; sena_valor: number; medios: string;
};

const ROTULO: Record<string, string> = { presencial: 'Presencial', online: 'Online', '1a1': '1 a 1', regalo: 'Gift card' };

export function FormCurso({ curso }: { curso?: CursoEdit }) {
  const editando = !!curso;
  const cfg = normalizarCaratula(curso?.caratula, curso?.tipo ?? 'presencial', curso?.orden);
  const [pv, setPv] = useState({
    nombre: curso?.nombre ?? '', tipo: curso?.tipo ?? 'presencial', resumen: curso?.resumen ?? '', incluye: curso?.incluye ?? [],
    precio: curso?.precio ?? null, lista: curso?.precio_lista ?? null, lugar: curso?.lugar ?? '',
    duracion: curso?.duracion ?? '', reservaComo: curso?.kind === 'consulta' ? 'consulta' : 'slot', senaModo: curso?.sena_modo ?? 'ninguna',
    motivo: cfg.motivo as Motivo, paleta: cfg.paleta as Paleta, titulo: cfg.titulo, detalle: cfg.detalle, cupo: curso?.cupo ?? null as number | null,
  });

  function leer(e: FormEvent<HTMLFormElement>) {
    const f = new FormData(e.currentTarget);
    const n = (k: string) => { const v = String(f.get(k) ?? '').replace(/\D/g, ''); return v ? parseInt(v, 10) : null; };
    setPv((antes) => ({
      nombre: String(f.get('nombre') ?? ''), tipo: String(f.get('tipo') ?? 'presencial'), resumen: String(f.get('resumen') ?? ''),
      incluye: String(f.get('incluye') ?? '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
      precio: n('precio'), lista: n('precio_lista'), lugar: String(f.get('lugar') ?? ''), duracion: String(f.get('duracion') ?? ''),
      reservaComo: String(f.get('reserva_como') ?? 'slot'), senaModo: String(f.get('sena_modo') ?? 'ninguna'),
      motivo: String(f.get('caratula_motivo') ?? antes.motivo) as Motivo, paleta: String(f.get('caratula_paleta') ?? antes.paleta) as Paleta,
      titulo: String(f.get('caratula_titulo') ?? ''), detalle: String(f.get('caratula_detalle') ?? ''),
      // en un curso nuevo, los lugares se cargan en el mismo formulario
      cupo: f.has('cupo') ? n('cupo') : antes.cupo,
    }));
  }

  const kind = pv.tipo === 'regalo' ? 'regalo' : pv.tipo === '1a1' ? (pv.reservaComo === 'consulta' ? 'consulta' : 'slot') : 'fecha';
  const conFecha = !editando && (kind === 'fecha' || kind === 'slot');
  const datosCaratula = { nombre: pv.nombre.trim() || 'Nombre del curso', tipo: pv.tipo, kind, duracion: pv.duracion.trim() };
  const caratula = propsCaratula({ ...datosCaratula, caratula: { motivo: pv.motivo, paleta: pv.paleta, titulo: pv.titulo, detalle: pv.detalle } }, pv.cupo);
  const detalleAuto = propsCaratula({ ...datosCaratula, caratula: { motivo: pv.motivo, paleta: pv.paleta } }, pv.cupo).detalle;

  return (
    <div className="editor">
      <Formulario accion={guardarCurso} onInput={leer} boton={editando ? 'Guardar cambios' : 'Guardar curso'}>
        {curso && <input type="hidden" name="id" value={curso.id} />}
        <fieldset className="fs">
          <h3>Qué es</h3><small>El nombre y la descripción que ve la alumna.</small>
          <div className="f"><label htmlFor="nombre">Nombre</label><input id="nombre" name="nombre" defaultValue={curso?.nombre} placeholder="Ej.: Taller de automaquillaje" required /></div>
          <div className="row2">
            <div className="f"><label htmlFor="tipo">Formato</label>
              <select id="tipo" name="tipo" defaultValue={curso?.tipo ?? 'presencial'}>{Object.entries(ROTULO).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div>
            <div className="f"><label htmlFor="lugar">Dónde</label><input id="lugar" name="lugar" defaultValue={curso?.lugar ?? 'Estudio en Belgrano, CABA'} /></div>
          </div>
          {pv.tipo === '1a1' && (
            <div className="f"><label htmlFor="reserva_como">¿Cómo se reserva?</label>
              <select id="reserva_como" name="reserva_como" defaultValue={curso?.kind === 'consulta' ? 'consulta' : 'slot'}>
                <option value="slot">Turnos individuales: la alumna elige día y horario y paga</option>
                <option value="consulta">Entrevista previa: la alumna deja su consulta y vos le escribís</option></select></div>
          )}
          <div className="f"><label htmlFor="duracion">Duración</label><input id="duracion" name="duracion" defaultValue={curso?.duracion} placeholder="2 h 30" /></div>
          <div className="f"><label htmlFor="resumen">Descripción corta</label><textarea id="resumen" name="resumen" defaultValue={curso?.resumen} required /></div>
          <div className="f"><label htmlFor="incluye">Qué incluye</label><textarea id="incluye" name="incluye" defaultValue={curso?.incluye.join('\n')} placeholder={'Una cosa por línea'} /><small>Una cosa por línea.</small></div>
          <details style={{ marginBottom: 14 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, minHeight: 36 }}>Más detalle para la ficha del curso (opcional)</summary>
            <div className="f" style={{ marginTop: 10 }}><label htmlFor="descripcion">Descripción completa</label><textarea id="descripcion" name="descripcion" defaultValue={curso?.descripcion} /></div>
            <div className="f"><label htmlFor="para_quien">Para quién es</label><textarea id="para_quien" name="para_quien" defaultValue={curso?.para_quien} /></div>
            <div className="f"><label htmlFor="programa">Programa, clase por clase</label><textarea id="programa" name="programa" defaultValue={curso?.programa.join('\n')} /><small>Una línea por clase o tema.</small></div>
            <div className="f"><label htmlFor="que_traer">Qué tiene que traer</label><input id="que_traer" name="que_traer" defaultValue={curso?.que_traer} placeholder="Tu neceser" /></div>
          </details>
        </fieldset>

        <fieldset className="fs">
          <h3>Carátula</h3><small>La imagen del curso: la ve la alumna en la tarjeta y en la página del curso (sin texto), y cuando alguien comparte el link (con el título y la línea de abajo). Probá y mirá cómo queda a la derecha.</small>
          <div className="row2">
            <div className="f"><label htmlFor="caratula_titulo">Título de la carátula</label>
              <input id="caratula_titulo" name="caratula_titulo" maxLength={40} defaultValue={cfg.titulo} placeholder={pv.nombre || 'Igual al nombre del curso'} />
              <small>Solo se ve en la imagen que aparece al compartir el link. Mejor corto. Si lo dejás vacío, usa el nombre del curso.</small></div>
            <div className="f"><label htmlFor="caratula_detalle">Línea de abajo</label>
              <input id="caratula_detalle" name="caratula_detalle" maxLength={48} defaultValue={cfg.detalle} placeholder={detalleAuto} />
              <small>También solo al compartir el link. Si la dejás vacía, se arma sola con el formato y los lugares.</small></div>
          </div>
          <div className="f" role="radiogroup" aria-labelledby="lbl-motivo">
            <span id="lbl-motivo" className="lbl">Ilustración</span>
            <div className="opts">
              {MOTIVOS.map((m) => (
                <label className="opt" key={m.id}>
                  <input type="radio" name="caratula_motivo" value={m.id} defaultChecked={m.id === cfg.motivo} />
                  <span className="opt-img"><MiniMotivo motivo={m.id} paleta={pv.paleta} /></span>
                  <span className="opt-t">{m.nombre}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="f" role="radiogroup" aria-labelledby="lbl-colores">
            <span id="lbl-colores" className="lbl">Colores</span>
            <div className="opts">
              {PALETAS_ORDEN.map((p) => {
                const d = PALETAS[p];
                return (
                  <label className="opt" key={p}>
                    <input type="radio" name="caratula_paleta" value={p} defaultChecked={p === cfg.paleta} />
                    <span className="opt-sw" style={{ background: `radial-gradient(120% 100% at 85% 0%,${d.fondo2},${d.fondo})`, color: d.tinta }}>
                      <b>Aa</b><i style={{ background: d.rampa[2] }} /><i style={{ background: d.rampa[4] }} /><i style={{ background: d.rampa[6] }} />
                    </span>
                    <span className="opt-t">{d.nombre}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </fieldset>

        {conFecha && (
          <fieldset className="fs">
            <h3>Cuándo y cuántas</h3><small>La web muestra los lugares que quedan y los descuenta con cada reserva.</small>
            <CamposFecha v={FECHA_VACIA} tipo={pv.tipo} kind={kind} conPrecio={false} nuevo conPublicacion={false} />
          </fieldset>
        )}

        <fieldset className="fs">
          <h3>Precio y cobro</h3>
          {kind !== 'consulta' ? (
            <>
              <div className="row3">
                <div className="f"><label htmlFor="precio_lista">Precio de lista ($)</label><input id="precio_lista" name="precio_lista" type="number" min={0} defaultValue={curso?.precio_lista ?? ''} /></div>
                <div className="f"><label htmlFor="precio">Precio actual ($)</label><input id="precio" name="precio" type="number" min={0} defaultValue={curso?.precio ?? ''} required /></div>
                {conFecha && <div className="f"><label htmlFor="precio_hasta">Precio vigente hasta</label><input id="precio_hasta" name="precio_hasta" type="date" /></div>}
              </div>
              <div className="row3">
                <div className="f"><label htmlFor="sena_modo">Seña</label>
                  <select id="sena_modo" name="sena_modo" defaultValue={curso?.sena_modo ?? 'ninguna'}>
                    <option value="ninguna">Sin seña: se paga el total</option><option value="pct">Un porcentaje del precio</option><option value="fijo">Un monto fijo</option></select></div>
                {pv.senaModo !== 'ninguna' && <div className="f"><label htmlFor="sena_valor">{pv.senaModo === 'pct' ? 'Porcentaje (%)' : 'Monto ($)'}</label><input id="sena_valor" name="sena_valor" type="number" min={1} defaultValue={curso?.sena_valor || (pv.senaModo === 'pct' ? 30 : '')} /></div>}
                <div className="f"><label htmlFor="medios">Medios de pago</label>
                  <select id="medios" name="medios" defaultValue={curso?.medios ?? 'todos'}>
                    <option value="todos">Tarjeta, Mercado Pago y transferencia</option><option value="mp">Solo Mercado Pago</option><option value="transferencia">Solo transferencia</option></select></div>
              </div>
            </>
          ) : <p style={{ color: 'var(--muted)' }}>Las entrevistas no se pagan online: la alumna deja su consulta y vos le escribís.</p>}
        </fieldset>

        {conFecha && (
          <fieldset className="fs">
            <h3>Publicación</h3>
            <label className="chk"><input type="radio" name="publicacion" value="ahora" defaultChecked /><span>Publicar ahora: ya se puede reservar en la web</span></label>
            <label className="chk"><input type="radio" name="publicacion" value="borrador" /><span>Guardar como borrador: solo la ves vos</span></label>
            <label className="chk"><input type="radio" name="publicacion" value="programar" /><span>Programar: se publica sola el día que elijas <input name="publicar_fecha" type="date" style={{ marginLeft: 8, minHeight: 34, padding: '4px 8px', border: '1.5px solid var(--line)', borderRadius: 8 }} /></span></label>
            <label className="chk"><input type="checkbox" name="avisar_espera" value="1" /><span>Avisar a la lista de espera de este curso (si ese mail está prendido)</span></label>
          </fieldset>
        )}
      </Formulario>

      <aside className="preview" aria-label="Así se ve en la web">
        <p style={{ fontWeight: 600, margin: '0 0 8px' }}>Así se ve en la web</p>
        <div className="pv">
          <Caratula {...caratula} />
          <div className="pv-b">
            <span className="pv-tag">{ROTULO[pv.tipo]}</span>
            <h3>{pv.nombre || 'Nombre del curso'}</h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>{pv.resumen || 'Acá va la descripción corta.'}</p>
            <div className="pv-m">{[pv.duracion, pv.lugar].filter(Boolean).join(' · ')}</div>
            {pv.incluye.length > 0 && <ul>{pv.incluye.map((i) => <li key={i}>{i}</li>)}</ul>}
            <div className="pv-p">{pv.precio ? <>{pv.lista ? <s>{peso(pv.lista)}</s> : null}{peso(pv.precio)}</> : kind === 'consulta' ? 'A consultar' : '$ –'}</div>
          </div>
        </div>
      </aside>
    </div>
  );
}
