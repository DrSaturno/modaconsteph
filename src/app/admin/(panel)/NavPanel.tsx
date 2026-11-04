'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { href: string; texto: string; n?: number };

export function NavPanel({ items }: { items: Item[] }) {
  const ruta = usePathname();
  const activo = (h: string) => (h === '/admin' ? ruta === '/admin' : h === '/admin/cursos' ? ruta.startsWith('/admin/cursos') && !ruta.startsWith('/admin/cursos/nuevo') : ruta.startsWith(h));
  return (
    <nav className="adm-nav" aria-label="Panel">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={activo(i.href) ? 'page' : undefined}>
          {i.texto}{i.n ? <span className="adm-n" aria-label={`${i.n} para revisar`}>{i.n}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
