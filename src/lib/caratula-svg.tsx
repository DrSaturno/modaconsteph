import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { PALETAS, type Motivo, type Paleta } from './caratula';
import { Escena, coloresEscena } from '@/components/caratula-objetos';

/*
 * La ilustración de una carátula como texto SVG, para usarla en la imagen que se ve al compartir el link
 * (ahí no hay navegador: la imagen se dibuja en el servidor). Reusa los mismos dibujos de la web.
 */

const SIN_CAMBIOS = new Set(['viewBox', 'preserveAspectRatio', 'gradientUnits', 'gradientTransform', 'clipPathUnits', 'stdDeviation']);
const atributo = (k: string) => (SIN_CAMBIOS.has(k) ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));
const esc = (v: unknown) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function aTexto(nodo: ReactNode): string {
  if (nodo == null || typeof nodo === 'boolean') return '';
  if (typeof nodo === 'string' || typeof nodo === 'number') return esc(nodo);
  if (Array.isArray(nodo)) return nodo.map(aTexto).join('');
  if (!isValidElement(nodo)) return '';
  const { type, props } = nodo as ReactElement<Record<string, unknown>>;
  if (typeof type === 'function') return aTexto((type as (p: unknown) => ReactNode)(props));
  const { children, ...resto } = props;
  const attrs = Object.entries(resto)
    .filter(([k, v]) => v != null && v !== false && k !== 'key' && k !== 'className')
    .map(([k, v]) => ` ${atributo(k)}="${esc(v)}"`)
    .join('');
  return `<${String(type)}${attrs}>${aTexto(children as ReactNode)}</${String(type)}>`;
}

/** SVG completo (400 x 300) de la ilustración para la imagen de compartir: sin fondo, con el objeto a la derecha. */
export function ilustracionSvg(motivo: Motivo, paleta: Paleta): string {
  const P = PALETAS[paleta] ?? PALETAS.ciruela;
  const dibujo = aTexto(<Escena uid="og" motivo={motivo} C={coloresEscena(P)} modo="compartir" />);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">${dibujo}</svg>`;
}
