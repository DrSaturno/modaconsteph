import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { adminActual } from '@/lib/auth';
import { FormularioLogin } from './FormularioLogin';

export default function Login() {
  return (
    <main className="login">
      <Suspense fallback={null}><YaAdentro /></Suspense>
      <FormularioLogin />
    </main>
  );
}

/** Si ya hay una sesión válida, no tiene sentido mostrar el formulario. */
async function YaAdentro() {
  if (await adminActual()) redirect('/admin');
  return null;
}
