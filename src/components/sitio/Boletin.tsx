'use client';

import { useId, useState, useTransition } from 'react';
import { suscribir } from '@/app/(sitio)/actions';
import { evento } from '@/lib/tracking/cliente';

/** Formulario de una línea para dejar el mail: novedades o aviso de próxima fecha. */
export function Boletin({ origen, ok, boton, claro = false }: { origen: 'web' | 'espera' | 'pie'; ok: string; boton: string; claro?: boolean }) {
  const id = useId();
  const [mail, setMail] = useState('');
  const [trampa, setTrampa] = useState('');
  const [msg, setMsg] = useState('');
  const [hecho, setHecho] = useState(false);
  const [pendiente, empezar] = useTransition();

  if (hecho) return <p className="news-ok" role="status">{ok} ({mail})</p>;
  return (
    <form
      className="nform"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        empezar(async () => {
          const r = await suscribir(mail, origen, trampa);
          if (r.ok) {
            setHecho(true);
            evento('generate_lead', { lead_type: origen === 'espera' ? 'aviso_proxima_fecha' : 'boletin' });
          } else setMsg(r.mensaje);
        });
      }}
    >
      <label htmlFor={id} style={{ position: 'absolute', left: -9999 }}>Tu email</label>
      <input id={id} type="email" value={mail} onChange={(e) => { setMail(e.target.value); setMsg(''); }} placeholder="tu@email.com" autoComplete="email" inputMode="email" aria-invalid={!!msg} />
      {/* campo oculto: si alguien lo completa, es un robot */}
      <input type="text" name="web" value={trampa} onChange={(e) => setTrampa(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
      <button className={claro ? 'btn' : 'btn dark'} type="submit" disabled={pendiente}>{pendiente ? 'Un segundo…' : boton}</button>
      {msg && <p role="alert" style={{ flexBasis: '100%', margin: 0, fontSize: 14, fontWeight: 600, color: claro ? 'var(--titulo)' : 'var(--letra)' }}>{msg}</p>}
    </form>
  );
}
