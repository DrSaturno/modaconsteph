import { Suspense, type ReactNode } from 'react';
import { requerirAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { salir } from '../actions';
import { NavPanel } from './NavPanel';

// Siempre datos del momento: ver admin/layout.tsx
export const instant = false;

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p style={{ padding: 28 }}>Cargando tu panel…</p>}><Marco>{children}</Marco></Suspense>;
}

async function Marco({ children }: { children: ReactNode }) {
  const a = await requerirAdmin();
  const c = (await query<{ pendientes: number; nuevas: number }>(
    `select (select count(*)::int from reservas where estado = 'pendiente' and metodo <> 'mp') as pendientes,
            (select count(*)::int from consultas where estado = 'nueva') as nuevas`))[0];
  const items = [
    { href: '/admin', texto: 'Resumen de hoy' },
    { href: '/admin/cursos', texto: 'Cursos y fechas' },
    ...(a.rol === 'admin' ? [{ href: '/admin/cursos/nuevo', texto: 'Cargar un curso' }] : []),
    { href: '/admin/reservas', texto: 'Reservas', n: c.pendientes },
    { href: '/admin/consultas', texto: 'Consultas', n: c.nuevas },
    ...(a.rol === 'admin' ? [{ href: '/admin/mails', texto: 'Mails automáticos' }, { href: '/admin/ajustes', texto: 'Ajustes' }] : []),
  ];
  return (
    <div className="adm-app">
      <aside className="adm-side">
        <div className="adm-brand">Moda con Steph<small>Panel</small></div>
        <NavPanel items={items} />
        <div className="adm-side-foot">
          <span>{a.nombre || a.email}{a.rol === 'asistente' ? ' · solo ver' : ''}</span>
          <a href="/">Ver la web</a>
          <form action={salir}><button type="submit">Salir</button></form>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
