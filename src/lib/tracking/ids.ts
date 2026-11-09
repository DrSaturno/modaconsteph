/*
 * Identificadores públicos del seguimiento (no son secretos: se ven en el código de cualquier web).
 * Los que sí son secretos (token de la API de Conversiones de Meta y clave de la API de Analytics) van
 * como variables de entorno en Vercel: META_CAPI_TOKEN y GA4_API_SECRET.
 */

/** Contenedor de Google Tag Manager de Moda con Steph. Adentro están las etiquetas de Analytics y del Pixel. */
export const GTM_ID = 'GTM-KC6FGSH8';

/** Propiedad de Google Analytics 4 (la misma que usaba la web anterior, para no perder el historial). */
export const GA4_ID = 'G-8FPSLDRG5B';

/** Pixel de Meta (el mismo de la web anterior, para conservar audiencias e historial). */
export const META_PIXEL_ID = '421894017597792';

/** Código de verificación de dominio de Meta (Business Manager > Seguridad de la marca > Dominios). Vacío = no se agrega. */
export const META_VERIFICACION_DOMINIO = '';
