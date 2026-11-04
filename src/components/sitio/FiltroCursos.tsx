'use client';

import { useState, type ReactNode } from 'react';

const OPCIONES = [
  { f: 'todo', t: 'Todo' }, { f: 'presencial', t: 'Presencial' }, { f: 'online', t: 'Online' }, { f: '1a1', t: '1 a 1' },
] as const;

/** Filtros de formato. Las tarjetas se dibujan en el servidor; acá solo se esconden con CSS según el filtro. */
export function FiltroCursos({ children }: { children: ReactNode }) {
  const [f, setF] = useState<string>('todo');
  return (
    <>
      <div className="filters" role="group" aria-label="Filtrar por formato">
        {OPCIONES.map((o) => <button key={o.f} type="button" aria-pressed={f === o.f} onClick={() => setF(o.f)}>{o.t}</button>)}
      </div>
      <div className="grid" data-filtro={f}>{children}</div>
    </>
  );
}
