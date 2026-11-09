# Seguimiento: Google Analytics 4, Tag Manager y Pixel de Meta

Qué está conectado y cómo se prueba. Los identificadores públicos están en `src/lib/tracking/ids.ts`.

| Pieza | Identificador | Dónde vive |
|---|---|---|
| Google Tag Manager | `GTM-KC6FGSH8` | Se carga desde `src/app/layout.tsx` (nunca en `/admin`) |
| Google Analytics 4 | `G-8FPSLDRG5B` | Etiqueta dentro del contenedor de Tag Manager |
| Pixel de Meta | `421894017597792` | Etiqueta dentro del contenedor de Tag Manager |

El Pixel y Analytics son los mismos de la web anterior (Tiendup): así no se pierde el historial ni las audiencias.
El seguimiento solo corre en la web publicada (producción en Vercel). En local: `MCS_TRACKING=1` en `.env.local`.

## 1. Instalar las etiquetas en Tag Manager (una sola vez)

1. En [tagmanager.google.com](https://tagmanager.google.com) abrir el contenedor `GTM-KC6FGSH8`.
2. **Administrar > Importar contenedor**, elegir `tracking/gtm-contenedor-modaconsteph.json`, espacio de trabajo "Default Workspace" y la opción **Combinar > Cambiar el nombre de las etiquetas, activadores y variables en conflicto**.
3. **Enviar > Publicar**.

Queda cargado: la etiqueta de Google (Analytics 4), el Pixel (base + PageView + cambios de página) y los eventos del embudo.

Para **actualizar** un contenedor ya instalado (por ejemplo, cuando se suman eventos), se importa el archivo nuevo con **Combinar > Sobrescribir las etiquetas, activadores y variables en conflicto**, se revisa en Vista previa y se publica. El archivo se genera con `python tracking/generar-contenedor.py tracking/gtm-contenedor-modaconsteph.json`: ahí se cambian los eventos y la correspondencia con los eventos estándar de Meta.

## 2. Eventos que manda la web

| Qué hace la alumna | Evento (Tag Manager) | Analytics 4 | Meta |
|---|---|---|---|
| Entra a una página | carga del contenedor | `page_view` | `PageView` |
| Cambia de página sin recargar | `mcs_route_change` | `page_view` (medición mejorada) | `PageView` |
| Mira la ficha de un curso | `view_item` | `view_item` | `ViewContent` |
| Abre la ventana de reserva | `begin_checkout` | `begin_checkout` | `InitiateCheckout` |
| Termina de reservar (elige medio de pago) | `add_payment_info` | `add_payment_info` | `AddPaymentInfo` |
| Reserva creada (pendiente o con pago en curso) | `reserva_creada` | `reserva_creada` | `Schedule` |
| Consulta o lista de espera | `generate_lead` | `generate_lead` | `Lead` |
| Boletín o aviso de próxima fecha | `generate_lead` (`lead_type`) | `generate_lead` | `Subscribe` / `Lead` |
| Toca el botón de WhatsApp (pie, barra del celular, ficha, reserva) | `click_whatsapp` (`ubicacion`) | `click_whatsapp` | `Contact` |
| Toca el enlace a Instagram | `click_instagram` (`ubicacion`) | `click_instagram` | no se manda |
| **Pago confirmado** | desde el servidor | `purchase` | `Purchase` |

La compra no la cuenta el navegador: la transferencia la confirma Steph a mano en el panel, a veces horas después, y Mercado Pago avisa por su cuenta. Por eso `src/lib/tracking/servidor.ts` manda `Purchase` a Meta (API de Conversiones) y `purchase` a Analytics (Measurement Protocol) cuando el pago se confirma (`confirmarPago`). Para atribuirla a la persona y al anuncio correcto, al reservar se guarda en la reserva (`reservas.tracking`): cookies `_fbp`/`_fbc`/`_ga`, campaña (`utm_*`, `fbclid`, `gclid`), sitio de origen, IP y navegador. El panel muestra "Llegó desde" en cada reserva. Meta evita contar dos veces con el `event_id` `compra-<código>`; Analytics, con `transaction_id`.

Requisito en la base: la columna `reservas.tracking` (`alter table reservas add column if not exists tracking jsonb;`, ya está en `db/schema.sql`). Sin la columna las reservas funcionan igual, pero no se guarda el origen ni se envían las compras.

**Mails:** los links a la web pública que salen en los mails automáticos llevan `utm_source=brevo&utm_medium=email&utm_campaign=<plantilla>` (por ejemplo `confirmacion` o `recordatorio_48h`), así Analytics los cuenta como "Email". No se marcan los links al panel (`/admin`), ni los que ya traen su propia marca, ni los externos (`conOrigen` en `src/lib/mail/plantillas.ts`). Las campañas que se manden desde Brevo se marcan desde Brevo.

## 3. Claves del servidor (variables en Vercel, las carga una persona)

| Variable | De dónde sale | Para qué |
|---|---|---|
| `META_CAPI_TOKEN` | Administrador de eventos de Meta > Píxel `421894017597792` > Configuración > API de Conversiones > Generar token de acceso | Contar compras en Meta |
| `GA4_API_SECRET` | Analytics > Administrar > Flujos de datos > el flujo web > Secretos de la API de Measurement Protocol > Crear | Contar compras en Analytics |
| `META_TEST_EVENT_CODE` (opcional) | Administrador de eventos > Probar eventos | Probar sin ensuciar los datos reales. Sacarla al terminar |

Sin estas claves la reserva funciona igual: el envío se omite y queda anotado en `reservas.tracking.servidor`.

## 4. Cómo verificar

- **Tag Manager**: botón «Vista previa», pegar la dirección de la web. Tiene que aparecer "Connected" y las etiquetas disparándose.
- **Analytics 4**: «Informes > Tiempo real»: entrás a la web y aparecés. «Administrar > DebugView» muestra cada evento al detalle.
- **Pixel de Meta**: extensión de Chrome "Meta Pixel Helper" y, en el Administrador de eventos, «Probar eventos» y «Diagnóstico».
- **Compra desde el servidor**: con `META_TEST_EVENT_CODE` cargada, confirmar una reserva de prueba y mirar «Probar eventos» de Meta. En Analytics, el evento `purchase` aparece en «Tiempo real» y en DebugView.
- En la base: `select codigo, tracking->'servidor' from reservas order by created_at desc limit 5;` dice si cada envío salió bien.

## 5. Pendientes del lado de Meta y Google

- Verificar el dominio en Meta (Business Manager > Seguridad de la marca > Dominios). Con la etiqueta HTML: pegar el código en `META_VERIFICACION_DOMINIO` de `ids.ts`. La verificación por DNS necesita acceso al DNS del dominio.
- Asignar el Pixel a la cuenta publicitaria `1224262638867048` (Business Manager > Orígenes de datos > Píxeles > Agregar activos).
- En Analytics, marcar `purchase` y `generate_lead` como eventos clave (Administrar > Eventos).
- Páginas de privacidad y cookies (`/privacidad` y `/cookies`, enlazadas en el pie): publicadas el 2026-11-09. Falta que Steph las lea y confirme los datos (mail de contacto, proveedores) y que consulte con su contador o abogada si debe inscribir la base de datos en el Registro Nacional de Bases de Datos de la AAIP. Si se suma otra herramienta que usa cookies (por ejemplo Clarity), hay que agregarla a `/cookies` y actualizar la fecha en `src/components/sitio/Legal.tsx`.
- Antes de apuntar el dominio a la web nueva, comprobar todo lo anterior: cuando cambia el dominio, el seguimiento de Tiendup se corta.

## 6. Pendientes (anotado el 2026-11-09)

**Analytics (configuración, la hace Nicolás desde la cuenta de la propiedad):**
- Filtro de tráfico interno: regla con la IP de Nicolás y de Steph, y pasar el filtro "Internal Traffic" de Prueba a Activo.
- Referencias no deseadas: `mercadopago.com.ar` y `mercadopago.com`.
- Dimensiones personalizadas de evento: `ubicacion` y `lead_type`.
- Vincular Search Console (Administrar > Vinculación de productos).
- Cambiar la dirección del flujo web a `modaconsteph.com` (solo etiqueta).

**Meta:** autorizar `modaconsteph.com` y `modaconsteph.com.ar` en Diagnóstico del píxel (sin restringir otros dominios); revisar la calidad de coincidencia de `Purchase` tras las primeras ventas reales.

**Cobro y lanzamiento:** claves de Mercado Pago (`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`) y pago de prueba real el 2026-11-10 (valida también la compra desde el aviso automático); CBU de Steph en el panel; plan Pro de Vercel o cuenta de Steph (Hobby no permite uso comercial); cargar fechas de diciembre en el panel.

**Dominio viejo:** apuntar el DNS de `modaconsteph.com.ar` (Route 53, acceso por confirmar) a Vercel; las redirecciones ya están hechas. Antes, Steph exporta de Tiendup clientas, suscriptores, pedidos y blog.

**Después de lanzar:** cambiar los links de Instagram y de la ficha de Google a `modaconsteph.com` con los parámetros de origen; revisar en el panel de Meta que el precio de los anuncios coincida con el de la web.
