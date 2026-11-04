import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { normalizarCaratula } from './caratula';
import { query, type Row } from './db';
import { calcularSena, precioEfectivo } from './format';
import type { AjustesPublicos, Curso, Fecha } from './tipos';

/*
 * Catálogo público. Se guarda en caché hasta 1 minuto y se renueva al instante cuando alguien
 * reserva o Steph edita algo (etiqueta 'catalogo'). La reserva siempre vuelve a chequear el cupo real.
 */

function mapCurso(r: Row, fechas: Fecha[]): Curso {
  return {
    id: r.id, slug: r.slug, nombre: r.nombre, corto: r.corto, tipo: r.tipo, kind: r.kind,
    lugar: r.lugar, duracion: r.duracion, resumen: r.resumen, descripcion: r.descripcion, paraQuien: r.para_quien,
    incluye: r.incluye ?? [], programa: r.programa ?? [], queTraer: r.que_traer,
    caratula: normalizarCaratula(r.caratula, r.tipo, r.orden), orden: r.orden,
    precio: r.precio, precioLista: r.precio_lista,
    senaModo: r.sena_modo, senaValor: r.sena_valor, medios: r.medios, fechas,
  };
}

async function leerCatalogo(slug?: string): Promise<Curso[]> {
  const ahora = new Date();
  const cursos = await query(
    `select * from cursos where activo ${slug ? 'and slug = $1' : ''} order by orden, nombre`,
    slug ? [slug] : [],
  );
  if (!cursos.length) return [];
  const fechas = await query(
    `select f.* from fechas_cupo f where (f.estado = 'abierta' or (f.estado = 'borrador' and f.publicar_en <= now())) and f.inicio > now() and f.curso_id = any($1::uuid[]) order by f.inicio`,
    [cursos.map((c) => c.id)],
  );
  return cursos.map((c) => {
    const fs: Fecha[] = fechas
      .filter((f) => f.curso_id === c.id)
      .map((f) => {
        const p = precioEfectivo(c as any, f as any, ahora);
        return {
          id: f.id, cursoId: f.curso_id, edicion: f.edicion,
          inicio: new Date(f.inicio).toISOString(), fin: f.fin ? new Date(f.fin).toISOString() : null,
          hora: f.hora, otrasClases: f.otras_clases, cupo: f.cupo, libres: f.libres,
          precio: p.precio, precioLista: p.lista, sena: calcularSena(c as any, p.precio),
        };
      });
    return mapCurso(c, fs);
  });
}

export async function getCatalogo(): Promise<Curso[]> {
  'use cache';
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 });
  cacheTag('catalogo');
  return leerCatalogo();
}

export async function getCurso(slug: string): Promise<Curso | null> {
  'use cache';
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 });
  cacheTag('catalogo');
  return (await leerCatalogo(slug))[0] ?? null;
}

export async function getSlugs(): Promise<string[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('catalogo');
  return (await query<{ slug: string }>(`select slug from cursos where activo order by orden`)).map((r) => r.slug);
}

export async function getAjustesPublicos(): Promise<AjustesPublicos> {
  'use cache';
  cacheLife('hours');
  cacheTag('ajustes');
  const rows = await query<{ clave: string; valor: unknown }>(
    `select clave, valor from ajustes where clave in ('whatsapp','instagram','link_resena','politica_cambios')`,
  );
  const a = Object.fromEntries(rows.map((r) => [r.clave, r.valor])) as Record<string, string>;
  return {
    whatsapp: a.whatsapp ?? '', instagram: a.instagram ?? '', linkResena: a.link_resena ?? '', politicaCambios: a.politica_cambios ?? '',
  };
}
