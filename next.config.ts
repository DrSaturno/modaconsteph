import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // base embebida para desarrollo local: carga archivos propios, no se debe empaquetar
  serverExternalPackages: ['@electric-sql/pglite'],
  // las tipografías de la imagen para compartir se leen del disco: hay que incluirlas en lo que se sube
  outputFileTracingIncludes: { '/cursos/**': ['./src/assets/fonts/**/*'] },
  // La tienda vieja vivía en modaconsteph.com.ar (Tiendup). Cuando ese dominio apunta a esta web, cada dirección vieja
  // lleva a lo más parecido que hay hoy y todo lo demás va a la portada. Solo actúa con el dominio .com.ar: en
  // modaconsteph.com no cambia nada. Permanente (308), para que Google traslade lo que tenía indexado.
  async redirects() {
    const viejo = [{ type: 'host' as const, value: '(www\\.)?modaconsteph\\.com\\.ar' }];
    const nuevo = 'https://modaconsteph.com';
    const a = (source: string, destination: string) => ({ source, has: viejo, destination: `${nuevo}${destination}`, permanent: true });
    return [
      a('/p/colorimetria-avanzada-noviembre', '/cursos/colorimetria-avanzada'),
      a('/p/taller-de-automaquillaje-color-noviembre', '/cursos/taller-automaquillaje-colorimetria'),
      a('/p/sesion-de-automaquillaje-presencial', '/cursos/sesion-automaquillaje'),
      a('/p/automaquillaje-estilismo-y-colorimetria-1-1-presencial', '/cursos/sesion-integral'),
      a('/s/asesoria-de-imagen-integral-entrevista-inicial', '/cursos/asesoria-imagen'),
      a('/p/gift-card', '/cursos/gift-card'),
      a('/p/giftcard-regala-experiencias', '/cursos/gift-card'),
      a('/c/gift-card', '/cursos/gift-card'),
      a('/page/sobre-mi', '/#steph'),
      a('/c/:resto*', '/#cursos'),
      a('/page/:resto*', '/#faq'),
      a('/:resto*', '/'), // lo demás (productos que ya no se venden, blog, carrito) va a la portada
    ];
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
