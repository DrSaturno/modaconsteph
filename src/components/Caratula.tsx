import { useId, type CSSProperties } from 'react';
import { PALETAS, tamanoTitulo, type CaratulaProps, type Paleta } from '@/lib/caratula';
import { Ilustracion } from './caratula-motivos';
import './caratula.css';

/** Variables de color de una paleta: las usan los textos; la ilustración recibe los mismos colores por dentro. */
export function coloresCaratula(paleta: Paleta): CSSProperties {
  const p = PALETAS[paleta] ?? PALETAS.ciruela;
  return {
    '--cv-fondo': p.fondo, '--cv-fondo2': p.fondo2, '--cv-tinta': p.tinta, '--cv-tinta2': p.tinta2, '--cv-linea': p.linea,
  } as CSSProperties;
}

/**
 * Carátula de un curso. Es decorativa: el nombre del curso ya está en el título de la página o de la tarjeta,
 * así que los lectores de pantalla la saltean.
 */
export function Caratula({ motivo, paleta, titulo, detalle, luces, className }: CaratulaProps & { className?: string }) {
  const uid = useId().replace(/\W/g, '');
  const P = PALETAS[paleta] ?? PALETAS.ciruela;
  return (
    <div className={`cv${className ? ` ${className}` : ''}`} style={coloresCaratula(paleta)} aria-hidden="true">
      <svg className="cv-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" focusable="false">
        <Ilustracion motivo={motivo} P={P} uid={uid} />
      </svg>
      <div className="cv-marco" />
      <p className="cv-k"><i className="cv-foco" />Moda con Steph</p>
      <div className="cv-txt">
        <p className="cv-t" style={{ fontSize: `${tamanoTitulo(titulo)}cqw` }}>{titulo}</p>
        <p className="cv-d">
          {luces > 0 && <span className="cv-luces">{Array.from({ length: luces }, (_, i) => <i className="cv-luz" key={i} />)}</span>}
          <span>{detalle}</span>
        </p>
      </div>
    </div>
  );
}

/** La ilustración sola, para elegirla en el panel. */
export function MiniMotivo({ motivo, paleta }: Pick<CaratulaProps, 'motivo' | 'paleta'>) {
  const uid = useId().replace(/\W/g, '');
  const P = PALETAS[paleta] ?? PALETAS.ciruela;
  return (
    <svg viewBox="200 0 200 190" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true" className="cv-mini">
      <rect x="0" y="0" width="400" height="300" fill={P.fondo} />
      <Ilustracion motivo={motivo} P={P} uid={uid} />
    </svg>
  );
}
