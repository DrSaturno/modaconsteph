import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Consulta enviada', robots: { index: false, follow: false } };

export default function ConsultaEnviada() {
  return (
    <main className="pagina">
      <div className="wrap estado">
        <h1>¡Consulta enviada!</h1>
        <p className="lead">Steph la lee y te escribe en los próximos días para coordinar la entrevista inicial. Te mandamos una copia a tu mail.</p>
        <p style={{ marginTop: 28 }}><Link className="btn dark" href="/">Volver al inicio</Link></p>
      </div>
    </main>
  );
}
