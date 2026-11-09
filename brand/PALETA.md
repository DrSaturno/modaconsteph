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

**Paleta secundaria (extensión):** Borgoña `#6D2C4D` · Lavanda `#D7B9D4` · Beige `#E6D9D2` · Gris suave `#E8E8E8`.

**Combinaciones sugeridas:** Principal (rosa + crema + grafito, moderno y claro) · Elegante (rosa claro + taupe + borgoña, más sofisticado) · Creativo (lavanda + rosa claro + grafito, ideal para cursos y talleres).

**Reglas de uso**
- Tipografía: Poppins en todo. El logo va sin modificar (`logo-rosa-original.png`, `logo-claro-original.png`).
- El rosa principal sobre crema tiene contraste ~2,8:1: sirve para títulos grandes y detalles, no para texto chico (ahí, malva `#8C5A7D` o grafito).
- Los botones rosa llevan el texto en grafito (con blanco el contraste baja a ~3:1).
- No usar verde, rojo ni azul: los estados se distinguen por relleno o contorno.

**Dónde vive en el código:** `src/app/paleta.css` (variables de la web y el panel), `src/lib/caratula.ts` (carátulas e imagen para compartir) y `src/lib/mail/plantillas.ts` (mails). Si cambia la paleta, se cambia en esos tres lugares.
