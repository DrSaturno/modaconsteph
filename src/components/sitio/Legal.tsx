import Link from 'next/link';
import type { ReactNode } from 'react';

/** Datos que se repiten en las páginas legales. Si cambia el mail de contacto, se cambia acá. */
export const CONTACTO_EMAIL = 'hola@modaconsteph.com';
export const ACTUALIZADO = '9 de noviembre de 2026';

/** Marco común de las páginas legales: título, fecha de actualización y texto con lectura cómoda. */
export function PaginaLegal({ titulo, intro, children }: { titulo: string; intro: string; children: ReactNode }) {
  return (
    <main className="pagina">
      <div className="wrap legal">
        <nav className="legal-nav" aria-label="Páginas legales">
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/cookies">Cookies</Link>
        </nav>
        <h1>{titulo}</h1>
        <p className="legal-fecha">Última actualización: {ACTUALIZADO}</p>
        <p className="lead">{intro}</p>
        {children}
        <p className="legal-volver"><Link className="btn dark" href="/">Volver al inicio</Link></p>
      </div>
    </main>
  );
}
