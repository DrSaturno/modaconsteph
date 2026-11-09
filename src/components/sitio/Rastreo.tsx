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
