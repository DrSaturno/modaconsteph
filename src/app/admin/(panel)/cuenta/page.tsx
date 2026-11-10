import { Suspense } from 'react';
import { connection } from 'next/server';
import { requerirAdmin } from '@/lib/auth';
import { Titulo } from '../../componentes';
import { FormClave } from './FormClave';

export const metadata = { title: 'Mi cuenta' };

export default function MiCuenta() {
  return <Suspense fallback={<p className="empty">Cargando…</p>}><Contenido /></Suspense>;
}

async function Contenido() {
  await connection();
  const a = await requerirAdmin(); // cualquiera que haya entrado puede cambiar su propia clave, también quien solo mira
  return (
    <>
      <Titulo titulo="Mi cuenta" sub={`Entrás como ${a.email}${a.rol === 'asistente' ? ' (solo ver)' : ''}.`} />
      <FormClave />
    </>
  );
}
