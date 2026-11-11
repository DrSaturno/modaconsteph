import { useId, type CSSProperties } from 'react';
import { PALETAS, type CaratulaProps, type Paleta } from '@/lib/caratula';
import { Escena, coloresEscena } from './caratula-objetos';
import './caratula.css';

/** Variables de color de una paleta: las usan los textos; la ilustración recibe los mismos colores por dentro. */
export function coloresCaratula(paleta: Paleta): CSSProperties {
  const p = PALETAS[paleta] ?? PALETAS.ciruela;
  return {
    '--cv-fondo': p.fondo, '--cv-fondo2': p.fondo2, '--cv-tinta': p.tinta, '--cv-tinta2': p.tinta2, '--cv-linea': p.linea, '--cv-luz': p.chispa,
  } as CSSProperties;
}

/**
 * Carátula de un curso. Es decorativa: el nombre del curso ya está en el título de la página o de la tarjeta,
 * así que los lectores de pantalla la saltean. Desde el estilo "escenario" la imagen va sin texto: el título y el detalle
 * (`titulo`, `detalle`, `luces`) solo se usan en la imagen que se ve al compartir el link.
 */
export function Caratula({ motivo, paleta, className }: CaratulaProps & { className?: string }) {
  const uid = useId().replace(/\W/g, '');
  const P = PALETAS[paleta] ?? PALETAS.ciruela;
  return (
    <div className={`cv${className ? ` ${className}` : ''}`} style={coloresCaratula(paleta)} aria-hidden="true">
      <svg className="cv-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" focusable="false">
        <Escena uid={uid} motivo={motivo} C={coloresEscena(P)} />
      </svg>
    </div>
  );
}

/** La ilustración sola, para elegirla en el panel. */
export function MiniMotivo({ motivo, paleta }: Pick<CaratulaProps, 'motivo' | 'paleta'>) {
  const uid = useId().replace(/\W/g, '');
  const P = PALETAS[paleta] ?? PALETAS.ciruela;
  return (
    <svg viewBox="70 30 260 240" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true" className="cv-mini">
      <Escena uid={uid} motivo={motivo} C={coloresEscena(P)} />
    </svg>
  );
}
