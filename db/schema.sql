-- Moda con Steph · esquema de base de datos (PostgreSQL 14 o superior)
-- Se aplica una sola vez con `npm run db:migrate`. En desarrollo local lo aplica la app sola.
-- Convenciones: precios en pesos argentinos (enteros); fechas en timestamptz (se muestran en hora de Buenos Aires).

create table if not exists cursos (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  nombre        text not null,
  corto         text not null,
  -- formato: dónde y cómo se cursa
  tipo          text not null check (tipo in ('presencial','online','1a1','regalo')),
  -- cómo se reserva: 'fecha' = grupo con fecha y cupo, 'slot' = turno individual,
  -- 'consulta' = entrevista previa (sin pago), 'regalo' = gift card
  kind          text not null check (kind in ('fecha','slot','consulta','regalo')),
  lugar         text not null default '',
  duracion      text not null default '',
  resumen       text not null default '',
  descripcion   text not null default '',
  para_quien    text not null default '',
  incluye       text[] not null default '{}',
  programa      text[] not null default '{}',
  que_traer     text not null default '',
  -- carátula: { motivo, paleta, titulo, detalle }. Lo que falte se completa solo (ver src/lib/caratula.ts)
  caratula      jsonb not null default '{}'::jsonb,
  precio        integer,
  precio_lista  integer,
  -- seña: 'ninguna' = se paga el total, 'pct' = porcentaje del precio, 'fijo' = monto fijo
  sena_modo     text not null default 'ninguna' check (sena_modo in ('ninguna','pct','fijo')),
  sena_valor    integer not null default 0,
  -- medios de pago permitidos
  medios        text not null default 'todos' check (medios in ('todos','mp','transferencia')),
  orden         integer not null default 0,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists fechas (
  id            uuid primary key default gen_random_uuid(),
  curso_id      uuid not null references cursos(id) on delete cascade,
  edicion       text not null default '',
  inicio        timestamptz not null,
  -- último día de cursada: define cuándo sale el mail para dejar la reseña
  fin           timestamptz,
  hora          text not null default '',
  otras_clases  text not null default '',
  cupo          integer not null default 1 check (cupo >= 0),
  -- precio propio de esta edición; si está vacío rige el del curso
  precio        integer,
  precio_lista  integer,
  precio_hasta  timestamptz,
  link_online   text not null default '',
  direccion     text not null default '',
  repite        text not null default 'no' check (repite in ('no','mensual','quincenal')),
  -- borrador: solo la ve Steph · abierta: se puede reservar · cerrada: completa o cerrada a mano
  estado        text not null default 'abierta' check (estado in ('borrador','abierta','cerrada')),
  -- publicación programada: una fecha en borrador con esta hora se abre sola
  publicar_en   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists fechas_curso_idx on fechas (curso_id, inicio);

create table if not exists reservas (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique,
  curso_id        uuid not null references cursos(id),
  fecha_id        uuid references fechas(id),
  nombre          text not null,
  email           text not null,
  tel             text not null default '',
  primera_vez     boolean not null default true,
  acepta_novedades boolean not null default false,
  -- pendiente: esperando el pago · confirmada: lugar asegurado · espera: lista de espera
  -- cancelada / expirada: sin lugar
  estado          text not null default 'pendiente'
                  check (estado in ('pendiente','confirmada','espera','cancelada','expirada')),
  modo            text not null default 'total' check (modo in ('total','sena')),
  metodo          text not null default 'mp' check (metodo in ('mp','transferencia','exterior')),
  monto_total     integer not null default 0,
  monto_a_pagar   integer not null default 0,
  monto_pagado    integer not null default 0,
  -- mientras está pendiente, el lugar se reserva hasta esta hora
  vence_en        timestamptz,
  mp_preferencia  text,
  mp_pago         text,
  regalo          jsonb,
  notas           text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists reservas_fecha_idx on reservas (fecha_id, estado);
create index if not exists reservas_email_idx on reservas (lower(email));

-- libreta de consultas: quién preguntó, por qué canal, en qué estado está y cuál es el próximo paso
create table if not exists consultas (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  email         text not null default '',
  tel           text not null default '',
  curso_id      uuid references cursos(id) on delete set null,
  interes       text not null default '',
  canal         text not null default 'web' check (canal in ('web','instagram','whatsapp','otro')),
  estado        text not null default 'nueva' check (estado in ('nueva','en_conversacion','reservo','no_reservo')),
  motivo_no     text not null default '',
  proximo_paso  text not null default '',
  mensaje       text not null default '',
  notas         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists plantillas_mail (
  clave       text primary key,
  nombre      text not null,
  cuando      text not null,
  destino     text not null default 'alumna' check (destino in ('alumna','steph','regalo')),
  activa      boolean not null default true,
  asunto      text not null,
  cuerpo      text not null,
  orden       integer not null default 0,
  updated_at  timestamptz not null default now()
);

-- cola de mails: cada fila se envía cuando llega `enviar_en`
create table if not exists mails (
  id           uuid primary key default gen_random_uuid(),
  reserva_id   uuid references reservas(id) on delete cascade,
  consulta_id  uuid references consultas(id) on delete cascade,
  plantilla    text not null references plantillas_mail(clave),
  para         text not null,
  vars         jsonb not null default '{}'::jsonb,
  enviar_en    timestamptz not null default now(),
  enviado_en   timestamptz,
  estado       text not null default 'pendiente' check (estado in ('pendiente','enviado','error','cancelado')),
  intentos     integer not null default 0,
  reclamado_en timestamptz,
  error        text,
  created_at   timestamptz not null default now()
);
create index if not exists mails_cola_idx on mails (estado, enviar_en);

create table if not exists suscriptores (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  origen      text not null default 'web',
  token       text not null default replace(gen_random_uuid()::text, '-', ''),
  baja_en     timestamptz,
  created_at  timestamptz not null default now()
);
create unique index if not exists suscriptores_email_idx on suscriptores (lower(email));

create table if not exists ajustes (
  clave  text primary key,
  valor  jsonb not null
);

create table if not exists admins (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  nombre         text not null default '',
  -- admin: todo · asistente: solo ve reservas y consultas
  rol            text not null default 'admin' check (rol in ('admin','asistente')),
  password_hash  text not null,
  created_at     timestamptz not null default now()
);

create table if not exists login_intentos (
  id     bigserial primary key,
  email  text not null,
  ip     text not null default '',
  ok     boolean not null default false,
  en     timestamptz not null default now()
);
create index if not exists login_intentos_idx on login_intentos (lower(email), en);

-- lugares libres por fecha: confirmadas + pendientes cuyo plazo no venció
create or replace view fechas_cupo as
select f.*,
       greatest(0, f.cupo - (
         select count(*)::int from reservas r
         where r.fecha_id = f.id
           and (r.estado = 'confirmada' or (r.estado = 'pendiente' and r.vence_en > now()))
       )) as libres
from fechas f;

-- freno básico contra reservas falsas o repetidas (ver src/lib/limites.ts)
create table if not exists limites (
  clave  text not null,
  en     timestamptz not null default now()
);
create index if not exists limites_idx on limites (clave, en);

-- Seguridad: Supabase publica las tablas de `public` por su API (con la clave anónima). Acá no hace falta:
-- la web entra directo a Postgres con el rol dueño de las tablas, que no pasa por RLS.
-- Con RLS activada y sin políticas, y sacando los permisos a los roles de la API, esa puerta queda cerrada.
-- (En un Postgres sin esos roles no cambia nada.) Se puede repetir sin riesgo.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
  end loop;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on all tables in schema public from authenticated;
  end if;
end $$;
