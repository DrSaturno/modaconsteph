# Paleta oficial de Moda con Steph

Fuente: `paleta-de-colores.jpg` (la envió la clienta el 2026-11-09). **Todo lo que se cree para la marca** (web, panel, mails, gift cards, piezas de redes, anuncios, PDF, presentaciones) sale con estos colores. Antes de crear algo nuevo, leer este archivo.

| Color | Hex | Dónde se usa |
|---|---|---|
| Rosa principal | `#D07AA3` | Color de marca: títulos, botones, íconos, destacados |
| Rosa claro | `#F3DCE6` | Fondos de sección, encuadres, banners |
| Crema | `#FAF6F7` | Fondo general de la web y de las piezas |
| Grafito | `#2B2B2B` | Textos, información importante, contraste |
| Taupe | `#C9B7B6` | Recuadros, bordes, divisores, elementos neutros |
| Malva profundo (acento opcional) | `#8C5A7D` | Acentos, botones secundarios, frases, colecciones o campañas especiales |
| Verde salvia (agregado por la clienta el 2026-11-11) | `#A3AC99` | Solo detalles: viñetas, bordes y separadores, chips, sellos y marcas de "listo". Nunca texto. |

**Paleta secundaria (extensión):** Borgoña `#6D2C4D` · Lavanda `#D7B9D4` · Beige `#E6D9D2` · Gris suave `#E8E8E8`.

**Combinaciones sugeridas:** Principal (rosa + crema + grafito, moderno y claro) · Elegante (rosa claro + taupe + borgoña, más sofisticado) · Creativo (lavanda + rosa claro + grafito, ideal para cursos y talleres).

**Reglas de uso**
- Tipografía: Poppins en todo. El logo va sin modificar (`logo-rosa-original.png`, `logo-claro-original.png`).
- El rosa principal sobre crema tiene contraste ~2,8:1: sirve para títulos grandes y detalles, no para texto chico (ahí, malva `#8C5A7D` o grafito).
- Los botones rosa llevan el texto en grafito (con blanco el contraste baja a ~3:1).
- El verde salvia `#A3AC99` quedó en la paleta a pedido de la clienta (2026-11-11), pero hoy no se usa en la web: ella eligió otros colores al pintarla. Contraste ~2,2:1 sobre crema: solo sirve para decorar.
- No usar otros verdes, ni rojo ni azul. Los estados se distinguen por relleno o contorno y por el texto, nunca solo por el color.
- **Colores de la web elegidos por la clienta (2026-11-11, herramienta "Pintá la web")**: página, secciones y espejo en crema `#FAF6F7`; tarjetas y adentro del espejo en blanco; bloques (Pasos, Reseñas, boletín y pie) en `#F7F6F4` con tarjetas de reseñas en rosa claro; título de portada en rosa `#D07AA3` y "para vos.", títulos de sección, números y frases en borgoña `#6D2C4D`; botones rosa con letra crema o blanca; etiquetas borgoña; luces del espejo en lavanda `#D7B9D4`; líneas `#D6B7C6`; boleto de regalo crema con letra borgoña. Todo vive en `src/app/paleta.css` (variables `--web-*`) y se aplica en `src/app/(sitio)/site.css`; solo toca la web pública, no el panel. Los dibujos de los cursos tienen sus propias paletas en `src/lib/caratula.ts` (`taller`, `espejo`, `arcos`, `perchero`, `abanico`).
- Lo que ella dejó sin pintar (precios, textos, subtítulos de tarjetas) quedó en grafito `#2B2B2B`. Sus textos de botón crema/blanco sobre rosa tienen contraste bajo (~2,8:1 a 3:1): decisión suya, anotada.

**Dónde vive en el código:** `src/app/paleta.css` (variables de la web y el panel), `src/lib/caratula.ts` (carátulas e imagen para compartir) y `src/lib/mail/plantillas.ts` (mails). Si cambia la paleta, se cambia en esos tres lugares.
