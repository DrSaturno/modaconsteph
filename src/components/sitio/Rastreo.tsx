'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { evento, itemDeCurso, registrarOrigen } from '@/lib/tracking/cliente';

/**
 * Corre en todas las páginas públicas. Anota de dónde llegó la visita (anuncio, campaña, buscador) y avisa a Tag Manager
 * cuando la alumna cambia de página sin recargar, para que el Pixel de Meta cuente cada página que mira.
 * La primera página la cuenta el propio Tag Manager al cargar.
 */
export function RastreoRutas() {
  const ruta = usePathname();
  const anterior = useRef<string | null>(null);
  useEffect(() => {
    if (anterior.current === null) registrarOrigen();
    else if (anterior.current !== ruta) {
      evento('mcs_route_change', { page_path: ruta, page_location: window.location.href, page_title: document.title });
    }
    anterior.current = ruta;
  }, [ruta]);
  return null;
}

/** Desde dónde se hizo el clic: sirve para saber qué botón de WhatsApp o Instagram funciona mejor. */
function ubicacionDe(a: Element): string {
  if (a.closest('.wa-burbuja')) return 'burbuja';
  if (a.closest('footer')) return 'pie';
  if (a.closest('.sticky')) return 'barra_celular';
  const ruta = window.location.pathname;
  if (ruta.startsWith('/cursos/')) return 'ficha_curso';
  if (ruta.startsWith('/reserva/')) return 'reserva';
  return 'portada';
}

/**
 * Cuenta los clics a WhatsApp e Instagram de cualquier enlace de las páginas públicas (pie, barra del celular, fichas, reserva).
 * click_whatsapp llega a Analytics y a Meta (evento Contact); click_instagram, solo a Analytics.
 * Los enlaces abren otra pestaña, así que no hace falta esperar nada antes de que la página cambie.
 */
export function ClicsContacto() {
  useEffect(() => {
    const alClic = (e: MouseEvent) => {
      try {
        const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
        if (!a) return;
        const host = new URL(a.href, window.location.href).hostname.replace(/^www\./, '');
        const canal = host === 'wa.me' || host === 'api.whatsapp.com' ? 'whatsapp' : host === 'instagram.com' ? 'instagram' : '';
        if (canal) evento(`click_${canal}`, { ubicacion: ubicacionDe(a) });
      } catch { /* el seguimiento nunca rompe la web */ }
    };
    // "click" cubre el clic normal y el toque; "auxclick", el clic con la rueda (abrir en otra pestaña)
    document.addEventListener('click', alClic);
    document.addEventListener('auxclick', alClic);
    return () => { document.removeEventListener('click', alClic); document.removeEventListener('auxclick', alClic); };
  }, []);
  return null;
}

/** Ficha de un curso: avisa que alguien está mirando esa propuesta (view_item en Analytics, ViewContent en Meta). */
export function VerCurso({ slug, nombre, tipo, precio }: { slug: string; nombre: string; tipo: string; precio: number | null }) {
  const enviado = useRef('');
  useEffect(() => {
    if (enviado.current === slug) return; // en desarrollo React corre los efectos dos veces: no contar dos visitas
    enviado.current = slug;
    evento('view_item', {}, { value: precio ?? undefined, items: [itemDeCurso({ slug, nombre, tipo }, precio)] });
  }, [slug, nombre, tipo, precio]);
  return null;
}
