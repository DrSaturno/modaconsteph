# Moda con Steph · web con reservas

Web de Moda con Steph (diseño "Camerino" aprobado por Steph): fechas con lugares, reserva y pago online,
mails automáticos y un panel para cargar cursos. Next.js 16 (Cache Components) + PostgreSQL.

## Probarla en esta computadora (sin crear ninguna cuenta)

```bash
npm install
npm run dev -- -p 3210
```

Abrir <http://localhost:3210>. `npm run dev` levanta dos cosas: una base de prueba propia (guarda todo en `.data/`, con el
catálogo actual de Steph y alumnas de ejemplo) y la web conectada a esa base, igual que lo estará a la de producción.
Se frena con Ctrl+C (así la base se cierra bien). Con `.env.local` (ya incluido en esta máquina):

- `MCS_SIMULAR_PAGOS=1` → el botón "Ir a pagar" abre un pago de prueba en vez de Mercado Pago.
- `MCS_MAILS_A_CARPETA=1` → los mails no se envían: quedan como archivos en `.data/mails/` para verlos.
- Panel: <http://localhost:3210/admin>. El usuario de prueba está en `src/lib/base-data.ts` (`ADMIN_DEMO`) y solo existe en local.

Para empezar de cero: parar el servidor y borrar la carpeta `.data/`.

## Qué hace

| Parte | Dónde |
|---|---|
| Portada, agenda, cursos, gift card, preguntas | `src/app/(sitio)/page.tsx`, `src/components/sitio/` |
| Ficha de cada curso (SEO propio) | `src/app/(sitio)/cursos/[slug]` |
| Carátula de cada curso (ilustración + colores + título, editable en el panel) | `src/lib/caratula.ts`, `src/components/Caratula.tsx`, `src/components/caratula-motivos.tsx` |
| Imagen que se ve al compartir el link de un curso | `src/app/(sitio)/cursos/[slug]/compartir/route.tsx` |
| Ventana de reserva (fecha, datos, pago, lista de espera) | `src/components/sitio/Reservas.tsx` |
| Reserva con cupo garantizado, seña, retención del lugar | `src/lib/reservas.ts` |
| Mercado Pago (checkout, aviso y vuelta) | `src/lib/mp.ts`, `src/app/api/mp/*` |
| Mails programados (confirmación, 48 h, día de clase, reseña…) | `src/lib/mail/`, `src/app/api/cron/mails` |
| Panel de Steph (6 pestañas + ajustes) | `src/app/admin/` |
| Base de datos | `db/schema.sql`, `src/lib/db.ts`, `src/lib/base-data.ts` |
| Seguimiento (Tag Manager, Analytics 4, Pixel de Meta, compras desde el servidor) | `src/lib/tracking/`, `tracking/LEEME.md` |

Reglas de negocio importantes:

- El cupo se cuenta con reservas confirmadas + pendientes cuyo plazo no venció. Se controla dentro de una transacción
  con la fecha bloqueada, así dos personas no se llevan el mismo último lugar.
- Cuando una reserva deja una fecha con un solo lugar libre, Steph recibe un mail aparte (plantilla `steph_ultimo_lugar`, editable y
  apagable en el panel). Se manda al crear la reserva, con transferencia o con Mercado Pago, y no se repite al completarse la fecha.
- Pago con Mercado Pago: el lugar se guarda `mp_hold_min` minutos. Transferencia: `hold_horas` horas (Ajustes).
- Un pago se confirma consultándolo a Mercado Pago con el token de Steph (nunca por lo que diga el aviso) y verificando el monto.
- Seguimiento: la web avisa a Google Tag Manager (`GTM-KC6FGSH8`) cada paso del recorrido y las etiquetas mandan eso a Analytics 4 y al Pixel
  de Meta. La compra se cuenta desde el servidor cuando el pago se confirma (Meta API de Conversiones y Analytics Measurement Protocol)
  y cada reserva guarda de qué campaña llegó. Solo corre en la web publicada, nunca en el panel. Detalle y pasos en `tracking/LEEME.md`.
- Los mails programados salen a las 8:00 de Buenos Aires; la tarea `/api/cron/mails` corre todos los días a esa hora.

Carátulas de los cursos:

- Cada curso guarda `caratula` (jsonb): `motivo` (7 ilustraciones), `paleta` (5 colores), `titulo` y `detalle`. Lo que falte se
  completa solo (`normalizarCaratula`), así un curso nuevo ya sale con una carátula prolija. Se elige en el panel, con vista previa.
- Las lucecitas de la carátula son los lugares del grupo (se toman de las fechas del curso), igual que en la agenda.
- La imagen que se ve al compartir el link es la misma carátula. Su dirección lleva una huella (`?v=…`) que cambia cuando
  Steph edita la carátula, por eso puede quedar guardada en cualquier caché.
- Para sumar una ilustración: dibujarla en `caratula-motivos.tsx` (hoja de 400 x 300, mitad derecha) y sumarla a `MOTIVOS`.

Para quien programe:

- Colores: solo los tres que pidió la clienta (fondo `#f7f6f4`, letras `#231f20`, títulos `#c67fa1`), definidos en `src/app/paleta.css`.
  Todo lo demás (líneas, tintes, sombras) es una mezcla de esos tres con `color-mix`. Las carátulas de los cursos y la imagen para
  compartir usan la misma paleta en `src/lib/caratula.ts`. Los títulos van en Poppins. El logo se usa sin modificar (originales en `brand/`).
- Los valores JSON se guardan con `$n::text::jsonb` (no `$n::jsonb`): el driver de PostgreSQL (`postgres`) y el de la base de
  prueba codifican distinto un texto con JSON, y con `::jsonb` el valor se guardaba dos veces codificado en producción.
- Con Supabase, `DATABASE_URL` tiene que ser la del **pooler en modo transacción** (puerto 6543, `…pooler.supabase.com`): la conexión
  directa es solo IPv6 y Vercel no la alcanza. La conexión usa `max_pipeline: 1` (`src/lib/db.ts`): el pooler no soporta que el driver
  encole varias consultas en la misma conexión, y sin eso el build y las páginas se cuelgan hasta el timeout de la base.
- El esquema activa RLS en todas las tablas y le quita permisos a los roles de la API de Supabase (`anon`, `authenticated`): los datos de
  alumnas no quedan expuestos por esa API. La web entra con un usuario propio con `bypassrls` (no con el administrador de Supabase).
- La base de prueba atiende de a un cliente (`MCS_DB_PRUEBA=1`, lo pone `npm run dev`): cada proceso la usa un instante y la suelta.
  No abrir `.data/pglite` desde otro programa mientras `npm run dev` está corriendo.

## Ponerla online

1. **Base de datos** PostgreSQL (Supabase, Neon…) en una cuenta de Steph o de la agencia. Copiar la `DATABASE_URL`.
2. `npm run db:migrar` (con `DATABASE_URL` en `.env.local`): crea las tablas y carga mails, ajustes y catálogo actual.
3. `npm run admin:crear -- steph@correo.com "Steph" "una-clave-larga"`: crea el usuario del panel.
4. Hosting (Vercel): cargar las variables de `.env.example` (`SITE_URL`, `DATABASE_URL`, `SESSION_SECRET`, `MP_ACCESS_TOKEN`,
   `MP_WEBHOOK_SECRET`, `RESEND_API_KEY` o `BREVO_API_KEY`, `CRON_SECRET`). **No** definir `MCS_SIMULAR_PAGOS` ni `MCS_MAILS_A_CARPETA`.
5. Mercado Pago: en el panel de desarrolladores de Steph, configurar el webhook `https://TU-DOMINIO/api/mp/webhook` (evento "Pagos").
6. Mails: verificar el dominio `modaconsteph.com.ar` en Resend o Brevo y cargar el remitente en Ajustes del panel.
7. Dominio: apuntar `modaconsteph.com.ar` y redirigir las páginas viejas de Tiendup (ver pendientes).

## Pendientes conocidos

- Pago desde el exterior: hoy es manual (instrucciones + link en Ajustes). PayPal no cobra en pesos; hace falta decidir la conversión a USD.
- Fotos: las carátulas son ilustraciones propias. Cuando haya sesión de fotos se puede sumar una foto dentro del "espejo" de la carátula
  y una galería en la ficha (hoy `public/img/` conserva las fotos de la web anterior, sin uso en los cursos).
- Migración del blog y redirecciones desde las URLs de Tiendup.
- Textos de ejemplo a confirmar con Steph: política de cambios, seña de 30 %, programa de cada curso.
- Instagram de Steph (Ajustes) y mail desde el que salen los avisos.
