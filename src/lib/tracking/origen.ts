/** Texto corto para el panel: de dónde llegó la alumna (anuncio, campaña, red, buscador). Vacío si no hay datos. */
type Origen = { utm_source?: string; utm_medium?: string; utm_campaign?: string; fbclid?: string; gclid?: string; referrer?: string };

function describir(o: Origen | undefined): string {
  if (!o) return '';
  const campania = o.utm_campaign ? ` · ${o.utm_campaign}` : '';
  if (o.utm_source) return `${o.utm_source}${o.utm_medium ? ` / ${o.utm_medium}` : ''}${campania}`;
  if (o.fbclid) return 'Anuncio de Meta (Facebook o Instagram)';
  if (o.gclid) return 'Google Ads';
  const ref = (o.referrer ?? '').toLowerCase();
  if (!ref) return '';
  if (ref.includes('instagram')) return 'Instagram';
  if (ref.includes('facebook') || ref.includes('fb.')) return 'Facebook';
  if (ref.includes('google')) return 'Google (búsqueda)';
  if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'WhatsApp';
  return ref.replace(/^www\./, '');
}

export function origenLegible(tracking: unknown): string {
  const t = (tracking ?? {}) as { primero?: Origen; ultimo?: Origen };
  // la última visita con campaña manda; si no, la primera
  return describir(t.ultimo) || describir(t.primero) || (t.primero || t.ultimo ? 'Directo' : '');
}
