import type { ReactNode } from 'react';

export function Insignia({ tono, children }: { tono: 'good' | 'warn' | 'bad' | 'neutral'; children: ReactNode }) {
  return <span className={`badge ${tono}`}>{children}</span>;
}

export function Titulo({ titulo, sub, children }: { titulo: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="adm-top">
      <div><h1>{titulo}</h1>{sub && <p>{sub}</p>}</div>
      {children && <div className="tools">{children}</div>}
    </div>
  );
}

export function Aviso({ ok }: { ok?: string }) {
  const textos: Record<string, string> = { creado: 'Curso creado. Si dejaste la fecha abierta, ya se ve en la web.', '1': 'Cambios guardados.', duplicada: 'Fecha duplicada como borrador. Revisala y publicala cuando esté lista.', sin_permiso: 'Tu usuario solo puede ver. Pedile a Steph que haga ese cambio.' };
  return ok && textos[ok] ? <p className={`msg ${ok === 'sin_permiso' ? 'err' : 'ok'}`} role="status">{textos[ok]}</p> : null;
}
