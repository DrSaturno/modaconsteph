import { Suspense } from 'react';
import { connection } from 'next/server';
import { requerirAdmin } from '@/lib/auth';
import { Titulo } from '../../../componentes';
import { FormCurso } from '../FormCurso';

export const metadata = { title: 'Cargar un curso' };

export default function NuevoCurso() {
  return <Suspense fallback={<p className="empty">Cargando…</p>}><Contenido /></Suspense>;
}

async function Contenido() {
  await connection();
  await requerirAdmin({ soloAdmin: true });
  return (
    <>
      <Titulo titulo="Cargar un curso" sub="Un taller, un curso de varias clases, una capacitación, una asesoría o una gift card. Mientras escribís, ves cómo queda a la derecha." />
      <FormCurso />
    </>
  );
}
