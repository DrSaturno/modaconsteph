'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import { reservar } from '@/app/(sitio)/actions';
import { cuposTexto, etiquetaFecha, esEmail, peso } from '@/lib/format';
import type { AjustesPublicos, Curso, Fecha } from '@/lib/tipos';

type Abrir = (slug: string, fechaId?: string | null) => void;
const Ctx = createContext<Abrir>(() => undefined);
export const useReservar = () => useContext(Ctx);

/** Botón que abre la ventana de reserva de un curso (y de una fecha, si se la indica). */
export function ReservarBtn({ slug, fechaId, className = 'btn', children }: { slug: string; fechaId?: string | null; className?: string; children: ReactNode }) {
  const abrir = useReservar();
  return <button type="button" className={className} onClick={() => abrir(slug, fechaId)}>{children}</button>;
}

export function Lugares({ total, libres, className = 'seats' }: { total: number; libres: number; className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => <i key={i} className={'seat' + (i >= total - libres ? ' on' : '')} />)}
    </span>
  );
}

type Paso = 'elegir' | 'datos' | 'pago';
type Form = {
  fechaId: string | null; motivo: string;
  regalo: { para: string; paraEmail: string; mensaje: string; envio: string };
  nombre: string; email: string; tel: string; primera: 'si' | 'no'; novedades: boolean;
  modo: 'total' | 'sena'; metodo: 'mp' | 'transferencia' | 'exterior';
};
const VACIO: Form = {
  fechaId: null, motivo: '', regalo: { para: '', paraEmail: '', mensaje: '', envio: '' },
  nombre: '', email: '', tel: '', primera: 'si', novedades: false, modo: 'total', metodo: 'mp',
};

export function BookingProvider({ catalogo, ajustes, children }: { catalogo: Curso[]; ajustes: AjustesPublicos; children: ReactNode }) {
  const [curso, setCurso] = useState<Curso | null>(null);
  const [paso, setPaso] = useState(0);
  const [f, setF] = useState<Form>(VACIO);
  const [err, setErr] = useState('');
  const [pendiente, empezar] = useTransition();
  const caja = useRef<HTMLDivElement>(null);
  const foco = useRef<Element | null>(null);

  const abrir = useCallback<Abrir>((slug, fechaId) => {
    const c = catalogo.find((x) => x.slug === slug);
    if (!c) return;
    foco.current = document.activeElement;
    const unica = c.fechas.length === 1 ? c.fechas[0].id : null;
    const elegida = fechaId && c.fechas.some((x) => x.id === fechaId) ? fechaId : unica;
    setF({ ...VACIO, fechaId: elegida, metodo: c.medios === 'transferencia' ? 'transferencia' : 'mp' });
    setPaso(0); setErr(''); setCurso(c);
  }, [catalogo]);

  const cerrar = useCallback(() => {
    setCurso(null);
    (foco.current as HTMLElement | null)?.focus?.();
  }, []);

  // bloquea el scroll de fondo, cierra con Escape y mantiene el foco adentro
  useEffect(() => {
    if (!curso) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    caja.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { cerrar(); return; }
      if (e.key !== 'Tab' || !caja.current) return;
      const els = caja.current.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href]');
      if (!els.length) return;
      const primero = els[0], ultimo = els[els.length - 1];
      if (e.shiftKey && (document.activeElement === primero || document.activeElement === caja.current)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [curso, cerrar]);

  const fecha: Fecha | null = curso?.fechas.find((x) => x.id === f.fechaId) ?? null;
  const espera = !!fecha && fecha.libres <= 0;
  const conPago = !!curso && curso.kind !== 'consulta' && !espera;
  const pasos: Paso[] = conPago ? ['elegir', 'datos', 'pago'] : ['elegir', 'datos'];
  const nombres = curso?.kind === 'consulta' ? ['Tu consulta', 'Tus datos'] : conPago ? ['Elegir', 'Tus datos', 'Pago'] : ['Elegir', 'Tus datos'];
  const actual = pasos[paso];

  const precio = fecha ? fecha.precio : curso?.precio ?? null;
  const lista = fecha ? fecha.precioLista : curso?.precioLista ?? null;
  const sena = fecha ? fecha.sena : null;
  const aPagar = f.modo === 'sena' && sena ? sena : precio;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  function validar(): string {
    if (!curso) return '';
    if (actual === 'elegir') {
      if ((curso.kind === 'fecha' || curso.kind === 'slot') && !f.fechaId) return 'Elegí una fecha para continuar.';
      if (curso.kind === 'regalo' && f.regalo.para.trim().length < 2) return 'Escribí para quién es el regalo.';
      if (curso.kind === 'regalo' && f.regalo.paraEmail && !esEmail(f.regalo.paraEmail)) return 'Revisá el email de quien recibe el regalo.';
    }
    if (actual === 'datos') {
      if (f.nombre.trim().length < 3) return 'Completá tu nombre y apellido.';
      if (!esEmail(f.email.trim())) return 'Revisá el email: tiene que ser como nombre@correo.com.';
      if (f.tel.replace(/\D/g, '').length < 8) return 'Completá tu WhatsApp con código de área, por ejemplo 11 2345 6789.';
    }
    return '';
  }

  function siguiente() {
    const m = validar();
    if (m) { setErr(m); return; }
    setErr('');
    if (paso < pasos.length - 1) { setPaso(paso + 1); caja.current?.scrollTo({ top: 0 }); return; }
    if (!curso) return;
    empezar(async () => {
      const r = await reservar({
        cursoId: curso.id, fechaId: f.fechaId, nombre: f.nombre, email: f.email, tel: f.tel,
        primeraVez: f.primera === 'si', novedades: f.novedades, modo: f.modo, metodo: f.metodo, espera,
        motivo: f.motivo, regalo: curso.kind === 'regalo' ? f.regalo : null,
      });
      if (r.ok) window.location.assign(r.url);
      else setErr(r.error);
    });
  }

  const hayExterior = !!curso && ['online', 'regalo'].includes(curso.tipo);
  const hayMp = !!curso && curso.medios !== 'transferencia';
  const hayTransf = !!curso && curso.medios !== 'mp';
  const etiquetaBoton = pendiente ? 'Un segundo…'
    : paso < pasos.length - 1 ? 'Continuar'
    : curso?.kind === 'consulta' ? 'Enviar consulta'
    : espera ? 'Anotarme en la lista de espera'
    : f.metodo === 'mp' ? 'Ir a pagar' : 'Reservar mi lugar';

  const ctx = useMemo(() => abrir, [abrir]);

  return (
    <Ctx.Provider value={ctx}>
      {children}
      {curso && (
        <div id="bk">
          <div className="bk-back" onClick={cerrar} />
          <div className="bk-box" role="dialog" aria-modal="true" aria-labelledby="bk-title" tabIndex={-1} ref={caja}>
            <button className="bk-x" type="button" onClick={cerrar} aria-label="Cerrar">×</button>
            <p className="bk-eyebrow">{fecha?.edicion || (curso.tipo === '1a1' ? 'Presencial · 1 a 1' : curso.lugar)}</p>
            <h2 id="bk-title" tabIndex={-1}>{curso.nombre}</h2>
            <ol className="bk-prog">
              {nombres.map((n, i) => <li key={n} className={i === paso ? 'now' : i < paso ? 'done' : ''} aria-current={i === paso ? 'step' : undefined}>{n}</li>)}
            </ol>
            <div className="bk-body">
              {err && <p className="bk-err" role="alert">{err}</p>}

              {actual === 'elegir' && (curso.kind === 'fecha' || curso.kind === 'slot') && (
                curso.fechas.length === 0 ? (
                  <p className="bk-note">Por ahora no hay fechas abiertas para esta propuesta. Escribinos por WhatsApp y te avisamos apenas se abra la próxima.</p>
                ) : (
                  <fieldset className="bk-set">
                    <legend>{curso.kind === 'slot' ? 'Elegí día y horario' : curso.fechas.length > 1 ? 'Elegí tu fecha' : 'Tu fecha'}</legend>
                    {curso.fechas.map((x) => (
                      <label className="bk-opt" key={x.id}>
                        <input type="radio" name="bk-fecha" checked={f.fechaId === x.id} onChange={() => set('fechaId', x.id)} />
                        <span className="bk-opt-t">
                          <b>{etiquetaFecha(x)}</b>
                          <small>{x.hora} · {curso.lugar}</small>
                          {curso.kind === 'fecha' && <Lugares total={x.cupo} libres={x.libres} className="bk-seats" />}
                          {curso.kind === 'fecha' && <small>{x.libres > 0 ? cuposTexto(x.libres, x.cupo) : 'Completo: te anotamos en la lista de espera'}</small>}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                )
              )}

              {actual === 'elegir' && curso.kind === 'consulta' && (
                <div className="bk-f">
                  <label htmlFor="bk-motivo">Contanos qué te gustaría cambiar o descubrir</label>
                  <textarea id="bk-motivo" value={f.motivo} onChange={(e) => set('motivo', e.target.value)} placeholder="Por ejemplo: quiero renovar mi estilo para una etapa nueva" />
                  <small>Steph lo lee antes de escribirte, así la entrevista inicial va directo a lo importante.</small>
                </div>
              )}

              {actual === 'elegir' && curso.kind === 'regalo' && (
                <>
                  <div className="bk-f"><label htmlFor="bk-para">¿Para quién es el regalo?</label>
                    <input id="bk-para" value={f.regalo.para} onChange={(e) => set('regalo', { ...f.regalo, para: e.target.value })} placeholder="Nombre de quien lo recibe" autoComplete="off" /></div>
                  <div className="bk-f"><label htmlFor="bk-paramail">Email de quien lo recibe</label>
                    <input id="bk-paramail" type="email" value={f.regalo.paraEmail} onChange={(e) => set('regalo', { ...f.regalo, paraEmail: e.target.value })} autoComplete="off" inputMode="email" />
                    <small>Ahí le llega la gift card. Si lo dejás vacío, te llega a vos el código para que se lo des.</small></div>
                  <div className="bk-f"><label htmlFor="bk-msg">Tu mensaje</label>
                    <textarea id="bk-msg" value={f.regalo.mensaje} onChange={(e) => set('regalo', { ...f.regalo, mensaje: e.target.value })} placeholder="Escribí unas líneas para acompañar el regalo" /></div>
                  <div className="bk-f"><label htmlFor="bk-envio">¿Cuándo se lo enviamos?</label>
                    <input id="bk-envio" type="date" value={f.regalo.envio} onChange={(e) => set('regalo', { ...f.regalo, envio: e.target.value })} />
                    <small>Si lo dejás vacío, la gift card se envía apenas se confirma el pago.</small></div>
                </>
              )}

              {actual === 'datos' && (
                <>
                  <div className="bk-f"><label htmlFor="bk-nombre">Nombre y apellido</label>
                    <input id="bk-nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} autoComplete="name" /></div>
                  <div className="bk-f"><label htmlFor="bk-email">Email</label>
                    <input id="bk-email" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" inputMode="email" />
                    <small>Ahí te llega la confirmación.</small></div>
                  <div className="bk-f"><label htmlFor="bk-tel">WhatsApp</label>
                    <input id="bk-tel" type="tel" value={f.tel} onChange={(e) => set('tel', e.target.value)} autoComplete="tel" inputMode="tel" placeholder="11 2345 6789" /></div>
                  <div className="bk-f"><label htmlFor="bk-primera">¿Es tu primera vez con Steph?</label>
                    <select id="bk-primera" value={f.primera} onChange={(e) => set('primera', e.target.value as 'si' | 'no')}>
                      <option value="si">Sí, es mi primera vez</option><option value="no">No, ya fui alumna</option></select></div>
                  <label className="bk-chk"><input type="checkbox" checked={f.novedades} onChange={(e) => set('novedades', e.target.checked)} />
                    <span>Quiero recibir tips de color y novedades de nuevas fechas por mail.</span></label>
                </>
              )}

              {actual === 'pago' && (
                <>
                  <dl className="bk-sum">
                    <div><dt>Propuesta</dt><dd>{curso.corto}</dd></div>
                    {fecha && <div><dt>Fecha</dt><dd>{etiquetaFecha(fecha)}</dd></div>}
                    {fecha && <div><dt>Horario</dt><dd>{fecha.hora}</dd></div>}
                    {curso.kind === 'regalo' && f.regalo.para && <div><dt>Para</dt><dd>{f.regalo.para}</dd></div>}
                    {lista && precio && lista > precio && <div><dt>Precio de lista</dt><dd><s>{peso(lista)}</s></dd></div>}
                  </dl>
                  {sena && (
                    <fieldset className="bk-set"><legend>Cuánto pagás ahora</legend>
                      <label className="bk-opt"><input type="radio" name="bk-modo" checked={f.modo === 'total'} onChange={() => set('modo', 'total')} />
                        <span className="bk-opt-t"><b>El total · {peso(precio)}</b></span></label>
                      <label className="bk-opt"><input type="radio" name="bk-modo" checked={f.modo === 'sena'} onChange={() => set('modo', 'sena')} />
                        <span className="bk-opt-t"><b>Reservar con seña · {peso(sena)}</b><small>El resto lo abonás antes de la clase.</small></span></label>
                    </fieldset>
                  )}
                  <fieldset className="bk-set"><legend>Medio de pago</legend>
                    {hayMp && <label className="bk-opt"><input type="radio" name="bk-pago" checked={f.metodo === 'mp'} onChange={() => set('metodo', 'mp')} />
                      <span className="bk-opt-t"><b>Tarjeta o Mercado Pago</b><small>Pagás en el checkout de Mercado Pago y volvés acá con tu lugar confirmado.</small></span></label>}
                    {hayTransf && <label className="bk-opt"><input type="radio" name="bk-pago" checked={f.metodo === 'transferencia'} onChange={() => set('metodo', 'transferencia')} />
                      <span className="bk-opt-t"><b>Transferencia bancaria</b><small>Te mostramos los datos y mandás el comprobante. El lugar queda reservado 24 horas.</small></span></label>}
                    {hayExterior && <label className="bk-opt"><input type="radio" name="bk-pago" checked={f.metodo === 'exterior'} onChange={() => set('metodo', 'exterior')} />
                      <span className="bk-opt-t"><b>Pago desde el exterior</b><small>Para alumnas que viven fuera de Argentina.</small></span></label>}
                  </fieldset>
                  <dl className="bk-sum"><div className="tot"><dt>Pagás ahora</dt><dd>{peso(aPagar)}</dd></div></dl>
                  {ajustes.politicaCambios && <p className="bk-note"><b>Cambios y cancelaciones:</b> {ajustes.politicaCambios}</p>}
                </>
              )}
            </div>
            <div className="bk-foot">
              {paso > 0 ? <button className="bk-btn ghost" type="button" onClick={() => { setErr(''); setPaso(paso - 1); }}>Volver</button> : <span />}
              <button className="bk-btn" type="button" onClick={siguiente} disabled={pendiente || (curso.fechas.length === 0 && (curso.kind === 'fecha' || curso.kind === 'slot'))}>
                {etiquetaBoton}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
