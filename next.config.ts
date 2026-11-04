import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // base embebida para desarrollo local: carga archivos propios, no se debe empaquetar
  serverExternalPackages: ['@electric-sql/pglite'],
  // las tipografías de la imagen para compartir se leen del disco: hay que incluirlas en lo que se sube
  outputFileTracingIncludes: { '/cursos/**': ['./src/assets/fonts/**/*'] },
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
