'use client';

import { useActionState, useTransition, type FormEvent, type ReactNode } from 'react';
import type { Estado } from '../actions';

/**
 * Formulario que muestra el resultado ("Guardado" o el error) sin recargar la página.
 * Se envía a mano para que, si hay un error, NO se borre lo que Steph ya escribió (React vacía los campos si se usa `action=`).
 */
export function Formulario({ accion, boton = 'Guardar', children, className, onInput, sinBoton }: {
  accion: (prev: Estado, f: FormData) => Promise<Estado>; boton?: string; children: ReactNode; className?: string;
  onInput?: (e: FormEvent<HTMLFormElement>) => void; sinBoton?: boolean;
}) {
  const [e, enviar, pendiente] = useActionState(accion, {} as Estado);
  const [, empezar] = useTransition();
  return (
    <form
      className={className}
      onInput={onInput}
      onSubmit={(ev) => { ev.preventDefault(); const datos = new FormData(ev.currentTarget); empezar(() => enviar(datos)); }}
    >
      {e.error && <p className="msg err" role="alert">{e.error}</p>}
      {e.ok && <p className="msg ok" role="status">{e.ok}</p>}
      {children}
      {!sinBoton && <button className="btn" type="submit" disabled={pendiente}>{pendiente ? 'Guardando…' : boton}</button>}
    </form>
  );
}
