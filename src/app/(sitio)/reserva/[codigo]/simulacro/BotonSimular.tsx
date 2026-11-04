'use client';

import { useTransition } from 'react';
import { simularPago } from '../../../actions';

export function BotonSimular({ codigo }: { codigo: string }) {
  const [pendiente, empezar] = useTransition();
  return (
    <button
      className="btn dark"
      type="button"
      disabled={pendiente}
      onClick={() => empezar(async () => { const r = await simularPago(codigo); if (r.ok) window.location.assign(`/reserva/${codigo}`); })}
    >
      {pendiente ? 'Un segundo…' : 'Simular pago aprobado'}
    </button>
  );
}
