-- ============================================================
-- AGUAS VIVAS · SCRIPT ÚNICO DE INSTALACIÓN
-- Ejecuta TODO este archivo de una sola vez en el SQL Editor
-- (incluye la corrección RLS con av_role()/av_tenant())
-- ============================================================

-- ============================================================
-- AGUAS VIVAS · Fase 1 — Base del sistema
-- Ejecutar en: Supabase Dashboard → SQL Editor (PRIMERO)
-- ============================================================

-- ------------------------------------------------------------
-- 1. IGLESIAS (tenants)
-- ------------------------------------------------------------
create table if not exists public.tenants (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  name             text not null,
  country          text,
  city             text,
  address          text,
  description      text,
  logo_url         text,
  brand_color      text default '#0a3b5c',
  contact_email    text,
  contact_phone    text,
  whatsapp         text,
  facebook         text,
  instagram        text,
  youtube          text,
  service_schedule text,
  plan             text not null default 'free' check (plan in ('free','premium')),
  status           text not null default 'active' check (status in ('pending','active','suspended')),
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. PERFILES DE USUARIO (vinculados a Supabase Auth)
--    roles: super_admin, pastor, mantenimiento, tesoreria, maestro, miembro
-- ------------------------------------------------------------
do $$ begin
  create type public.app_role as enum
    ('super_admin','pastor','mantenimiento','tesoreria','maestro','miembro');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  tenant_id  uuid references public.tenants(id) on delete set null,
  full_name  text,
  role       public.app_role not null default 'miembro',
  created_at timestamptz not null default now()
);

-- Crea automáticamente el perfil al registrarse (toma el nombre del signup)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, tenant_id, full_name, role)
  values (
    new.id,
    (select id from public.tenants where slug = 'aguas-vivas'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'miembro'
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3. DECISIONES DE FE (formulario Plan de Salvación)
-- ------------------------------------------------------------
create table if not exists public.salvation_decisions (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid references public.tenants(id) on delete cascade,
  full_name  text not null,
  email      text,
  phone      text,
  country    text,
  city       text,
  message    text,
  status     text not null default 'nuevo'
             check (status in ('nuevo','contactado','discipulado','integrado')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. IGLESIA SEMILLA — Aguas Vivas
-- ------------------------------------------------------------
insert into public.tenants (
  slug, name, country, city, address, description, contact_email,
  service_schedule, plan, status
)
values (
  'aguas-vivas',
  'Aguas Vivas — Casa de Fe',
  'Perú', 'Lima',
  'Av. La Fe 123, Lima',
  'Iglesia cristiana evangélica: evangelizar con el mensaje de la cruz, discipular nuevos creyentes y enviar obreros a la cosecha.',
  'contacto@aguasvivas.org',
  'Domingo 10:00 am · Miércoles 7:00 pm · Sábado 6:00 pm (Jóvenes)',
  'free', 'active'
)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- 5. SEGURIDAD (RLS)
--    Funciones auxiliares SECURITY DEFINER: leen rol e iglesia
--    del usuario SIN disparar las políticas de la tabla profiles
--    (evita "infinite recursion detected in policy").
-- ------------------------------------------------------------
create or replace function public.av_role() returns text
language sql stable security definer set search_path = public as $$
  select role::text from public.profiles where id = auth.uid()
$$;

create or replace function public.av_tenant() returns uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.salvation_decisions enable row level security;

-- Tenants: lectura pública (datos de contacto), escritura solo equipo pastoral
drop policy if exists tenants_public_read on public.tenants;
create policy tenants_public_read on public.tenants for select using (true);

drop policy if exists tenants_team_write on public.tenants;
create policy tenants_team_write on public.tenants for update using (
  public.av_role() in ('super_admin','pastor','mantenimiento')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = tenants.id
  )
);

-- Perfiles: cada quien ve su perfil; pastorado ve los de su iglesia
drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_read on public.profiles for select using (
  id = auth.uid()
  or (
    public.av_role() in ('super_admin','pastor')
    and (
      public.av_role() = 'super_admin'
      or public.av_tenant() = profiles.tenant_id
    )
  )
);

create policy profiles_self_update on public.profiles
  for update
  using (
    id = auth.uid()
    or public.av_role() = 'super_admin'
  )
  -- Un miembro solo puede editar su perfil conservando su propio rol;
  -- únicamente un super_admin puede asignar roles.
  with check (
    public.av_role() = 'super_admin'
    or (id = auth.uid() and role::text = public.av_role())
  );

-- Decisiones de fe: cualquiera puede escribir (evangelismo);
-- solo pastorado/súper admin las lee y gestiona
drop policy if exists decisions_public_insert on public.salvation_decisions;
create policy decisions_public_insert on public.salvation_decisions
  for insert with check (true);

drop policy if exists decisions_team_read on public.salvation_decisions;
drop policy if exists decisions_team_update on public.salvation_decisions;
create policy decisions_team_read on public.salvation_decisions for select using (
  public.av_role() in ('super_admin','pastor','maestro')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = salvation_decisions.tenant_id
  )
);

create policy decisions_team_update on public.salvation_decisions for update using (
  public.av_role() in ('super_admin','pastor','maestro')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = salvation_decisions.tenant_id
  )
);

-- ============================================================
-- AGUAS VIVAS · Fase 2 — Discipulado por niveles
-- Ejecutar en: Supabase Dashboard → SQL Editor (después de schema.sql)
-- ============================================================

-- ------------------------------------------------------------
-- 1. CURSOS (niveles de estudio)
-- ------------------------------------------------------------
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  slug        text unique not null,
  level       int not null,
  title       text not null,
  tagline     text,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. LECCIONES
-- ------------------------------------------------------------
create table if not exists public.lessons (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references public.courses(id) on delete cascade,
  slug         text not null,
  title        text not null,
  module_label text,
  verse_ref    text,
  body         text not null,
  duration_min int default 15,
  sort_order   int not null,
  created_at   timestamptz not null default now(),
  unique (course_id, slug)
);

-- ------------------------------------------------------------
-- 3. PROGRESO DEL ESTUDIANTE
-- ------------------------------------------------------------
create table if not exists public.lesson_progress (
  user_id      uuid references auth.users(id) on delete cascade,
  lesson_id    uuid references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ------------------------------------------------------------
-- 4. SEGURIDAD (RLS) — usa av_role()/av_tenant() de schema.sql
-- ------------------------------------------------------------
alter table public.courses         enable row level security;
alter table public.lessons         enable row level security;
alter table public.lesson_progress enable row level security;

drop policy if exists courses_public_read on public.courses;
create policy courses_public_read on public.courses for select using (true);

drop policy if exists courses_team_write on public.courses;
create policy courses_team_write on public.courses for all using (
  public.av_role() in ('super_admin','pastor','maestro')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = courses.tenant_id
  )
);

drop policy if exists lessons_public_read on public.lessons;
create policy lessons_public_read on public.lessons for select using (true);

drop policy if exists lessons_team_write on public.lessons;
create policy lessons_team_write on public.lessons for all using (
  public.av_role() in ('super_admin','pastor','maestro')
  and (
    public.av_role() = 'super_admin'
    or exists (
      select 1 from public.courses c
      where c.id = lessons.course_id
        and c.tenant_id = public.av_tenant()
    )
  )
);

drop policy if exists progress_own_write on public.lesson_progress;
create policy progress_own_write on public.lesson_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists progress_team_read on public.lesson_progress;
create policy progress_team_read on public.lesson_progress for select using (
  public.av_role() in ('super_admin','pastor','maestro')
  and (
    public.av_role() = 'super_admin'
    or exists (
      select 1 from public.profiles student
      where student.id = lesson_progress.user_id
        and student.tenant_id = public.av_tenant()
    )
  )
);

-- ============================================================
-- AGUAS VIVAS · Semilla de contenido — Nivel 1: Fundamentos
-- Ejecutar después de schema-fase2.sql
-- ============================================================

insert into public.courses (tenant_id, slug, level, title, tagline, description, sort_order)
select t.id, 'nivel-1', 1,
  'Nivel 1 — Fundamentos',
  'Verdades básicas y bautismo',
  'El primer paso en la fe: doctrinas esenciales y preparación para el bautismo en agua.',
  1
from public.tenants t
where t.slug = 'aguas-vivas'
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- MÓDULO A · NUEVA VIDA EN CRISTO
-- ------------------------------------------------------------

insert into public.lessons (course_id, slug, title, module_label, verse_ref, body, duration_min, sort_order)
select c.id, v.slug, v.title, v.module_label, v.verse_ref, v.body, 15, v.so
from public.courses c,
(values
('nueva-vida-en-cristo', 'Lección 1 · El amor de Dios y tu nueva vida', 'Módulo A · Nueva vida en Cristo', 'Juan 3:16',
E'## El punto de partida\n\nToda historia de fe comienza con un hecho inqueible: Dios te ama. No es un amor distante ni condicional; es el amor de un Padre que entregó a su Hijo para recuperarte.\n\n> Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna. — Juan 3:16\n\nSi oraste recibiendo a Jesús como Señor y Salvador, la Biblia declara que eres una **nueva criatura**: las cosas viejas pasaron y Dios hizo algo completamente nuevo en ti (2 Corintios 5:17).\n\n## Qué cambió en ti\n\n- Fuiste perdonado: Dios ya no recuerda tus pecados (Hebreos 8:12).\n- Fuiste adoptado: ahora Dios es tu Padre y tú su hijo (Juan 1:12).\n- Recibiste vida eterna: tu destino ya no es la muerte sino la vida con Él (Juan 5:24).\n\n## Tu nueva identidad\n\nAntes de Cristo, tu identidad era tu pasado. Ahora, tu identidad es lo que Dios dice de ti: hijo amado, perdonado, elegido. Cuando la mente te recuerde quién eras, responde con lo que Dios dice que eres hoy.\n\n## Para reflexionar\n\n- ¿Qué significó para ti descubrir que Dios te ama personalmente?\n- Escribe en una libreta tres cosas nuevas que recibiste al entregar tu vida a Jesús.\n- Comparte tu decisión con alguien cercano esta semana.', 15, 1),
('seguro-de-tu-salvacion', 'Lección 2 · Seguro de tu salvación', 'Módulo A · Nueva vida en Cristo', '1 Juan 5:13',
E'## ¿Puedo saber si soy salvo?\n\nMuchos creyentes nuevos viven inseguros, sintiendo que la salvación depende de sus emociones o de su desempeño. Pero Juan escribió su carta con un propósito claro:\n\n> Estas cosas os he escrito a vosotros que creéis en el nombre del Hijo de Dios, para que sepáis que tenéis vida eterna. — 1 Juan 5:13\n\nNota las palabras: **para que sepáis**. La salvación no se siente: se sabe, porque está fundada en la promesa de Dios y en la obra terminada de Jesucristo, no en tus méritos.\n\n## Las bases de tu seguridad\n\n- La promesa de Dios: Él no miente (Tito 1:2). Si Él dijo que todo aquel que invoca será salvo (Romanos 10:13), eso incluye a quien invocó con fe: tú.\n- La obra de Cristo: en la cruz Él exclamó: Consumado es (Juan 19:30). Nada falta por pagar.\n- El testimonio interno: el Espíritu Santo da testimonio con nuestro espíritu de que somos hijos de Dios (Romanos 8:16).\n\n## ¿Y cuando peco?\n\nPecar después de creer no rompe tu filiación; rompe tu comunión. Por eso existe la confesión diaria:\n\n> Si confesamos nuestros pecados, él es fiel y justo para perdonar nuestros pecados, y limpiarnos de toda maldad. — 1 Juan 1:9\n\nUn hijo que se equivoca sigue siendo hijo; pero necesita volver al Padre para restaurar la dulzura de la relación.\n\n## Para reflexionar\n\n- En qué fundas hoy tu seguridad: en tus sentimientos o en la Palabra de Dios?\n- Memoriza 1 Juan 5:13 esta semana.\n- Escribe una oración agradeciendo que tu salvación descansa en Dios.', 15, 2),
('arrepentimiento-y-fe', 'Lección 3 · Arrepentimiento y fe', 'Módulo A · Nueva vida en Cristo', 'Hechos 20:21',
E'## Dos manos de la conversión\n\nEl evangelio que Pablo predicaba contenía dos elementos inseparables: arrepentimiento para con Dios y fe en nuestro Señor Jesucristo (Hechos 20:21). Son las dos manos con las que abrazamos la salvación.\n\n## Qué es el arrepentimiento\n\nArrepentirse no es solo sentir tristeza. Judas sintió remordimiento y se perdió; Pedro lloró amargamente y fue restaurado. La diferencia es la dirección:\n\n> Porque la tristeza que es según Dios produce arrepentimiento para salvación, de que no hay que arrepentirse; pero la tristeza del mundo produce muerte. — 2 Corintios 7:10\n\nArrepentirse es cambiar de mentalidad y de dirección: dejar el pecado, odiarlo como Dios lo odia, y volverse hacia Él.\n\n## Qué es la fe salvadora\n\nLa fe no es optimismo ni fuerza de voluntad. Es confiar plenamente en la persona y obra de Jesucristo: que Su muerte pagó tu deuda y Su resurrección te garantiza vida.\n\n> Sin fe es imposible agradar a Dios. — Hebreos 11:6\n\n## Un arrepentimiento continuo\n\nEl arrepentimiento inicial se repite cada vez que el Espíritu nos muestra algo que corregir. El cristiano maduro mantiene el corazón blando: confiesa pronto, perdona pronto, corrige el rumbo rápido.\n\n## Para reflexionar\n\n- Hay algo en tu vida que sabes que debes abandonar todavía?\n- Practica esta semana una confesión concreta y específica ante Dios.\n- En qué área necesitas confiar más activamente en las promesas de Dios?', 15, 3),
('vida-devocional', 'Lección 4 · Vida devocional: oración y lectura bíblica', 'Módulo A · Nueva vida en Cristo', 'Mateo 4:4',
E'## Alimento para la nueva vida\n\nAsí como el cuerpo necesita alimento diario, tu espíritu necesita dos sustentos: la Palabra de Dios y la oración. Jesús mismo estableció el patrón:\n\n> Escrito está: No sólo de pan vivirá el hombre, sino de toda palabra que sale de la boca de Dios. — Mateo 4:4\n\n## Cómo empezar a leer la Biblia\n\n- Comienza por el Evangelio de Juan: presenta a Jesús de manera clara y sencilla.\n- Lee poco pero todos los días: mejor un capítulo diario que veinte una sola vez.\n- Pregunta al texto: qué me enseña sobre Dios? qué me enseña sobre mí? hay algo que obedecer?\n- Usa una versión comprensible como la Reina-Valera 1960 y anota lo que Dios te hable.\n\n## Cómo orar sencillamente\n\nLa oración es conversación, no ritual. Un patrón sencillo para comenzar:\n\n- Adoración: reconoce quién es Dios.\n- Gratitud: agradece cosas concretas.\n- Confesión: pide perdón por lo que el Espíritu te muestre.\n- Súplica: presenta tus necesidades y las de otros.\n- Sumisión: entrega el día a Su voluntad.\n\nJesús enseñó un modelo parecido en Mateo 6:9-13, el Padrenuestro.\n\n## El hábito que lo cambia todo\n\nEscoge una hora y un lugar fijos. Empieza con quince minutos: diez leyendo, cinco orando. La constancia vale más que la intensidad. Pronto ese tiempo será lo más dulce de tu día.\n\n## Para reflexionar\n\n- Cuándo y dónde leerás la Biblia esta semana?\n- Escribe hoy tu primera lista de gratitud a Dios.\n- Qué obstáculo prevés y cómo lo vencerás?', 15, 4),

-- ------------------------------------------------------------
-- MÓDULO B · LA BIBLIA COMO FUNDAMENTO
-- ------------------------------------------------------------

('que-es-la-biblia', 'Lección 5 · Qué es la Biblia y cómo leerla', 'Módulo B · La Biblia como fundamento', '2 Timoteo 3:16',
E'## La carta de amor más antigua\n\nLa Biblia no es un libro común: son 66 libros escritos por unos 40 autores, en tres idiomas, a lo largo de más de mil quinientos años… y con un mensaje perfectamente unido: Dios redimiendo al hombre.\n\n> Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir en justicia. — 2 Timoteo 3:16\n\nInspira­da significa que Dios mismo la originó: hombres escribieron, pero el Espíritu los guió (2 Pedro 1:21). Por eso la llamamos la Palabra de Dios.\n\n## Su estructura en un mapa\n\n- Antiguo Testamento (39 libros): preparación — la creación, la caída, Israel y las profecías del Mesías.\n- Evangelios (4 libros): presentación — la vida, muerte y resurrección de Jesús.\n- Hechos (1 libro): proclamación — el nacimiento de la iglesia.\n- Epístolas (22 cartas): explicación — cómo vivir la nueva vida.\n- Apocalipsis (1 libro): consumación — el triunfo final de Cristo.\n\n## Cómo leerla sin perderse\n\n- Primero los Evangelios y luego Hechos; después Romanos.\n- Lee pasajes completos, no versículos sueltos fuera de contexto.\n- Deja que la Biblia interprete a la Biblia: el texto clarifica al texto.\n- Obedece lo que entiendas: la luz aumenta a medida que avanzas.\n\n## Para reflexionar\n\n- Qué parte de este mapa de la Biblia te llama más a explorar?\n- Traza un plan: cuántos capítulos por semana?\n- Comparte con tu maestro una verdad que hayas aprendido leyendo.', 15, 5),
('la-cruz-de-cristo', 'Lección 6 · La obra de Cristo en la cruz', 'Módulo B · La Biblia como fundamento', 'Isaías 53:5',
E'## El centro del evangelio\n\nSin la cruz no hay cristianismo. Setecientos años antes de que ocurriera, el profeta Isaías la describió con precisión asombrosa:\n\n> Mas él herido fue por nuestras rebeliones, molido por nuestros pecados; el castigo de nuestra paz fue sobre él, y por su llaga hemos sido curados. — Isaías 53:5\n\n## Qué logró Jesús en la cruz\n\n- Expiación: pagó la pena que tú debías. La paga del pecado era muerte, y Él la cumplió (Romanos 6:23).\n- Justificación: ahora puedes ser declarado justo delante de Dios, no por obras, sino por fe en Cristo (Romanos 5:1).\n- Reconciliación: el muro de separación cayó. Ya tienes libre acceso al Padre (Efesios 2:18).\n- Redención: fuiste comprado para Dios a precio de sangre (1 Pedro 1:18-19).\n\n## Tres palabras para recordar\n\nSustituto: Él murió en tu lugar.\nCordero: Juan Bautista lo anunció: He aquí el Cordero de Dios que quita el pecado del mundo (Juan 1:29).\nVictoria: por medio de la muerte destruyó al que tenía el imperio de la muerte (Hebreos 2:14).\n\n## Nunca lo olvides\n\nLa cena del Señor existe para que recordemos la cruz hasta que Él vuelva. Un cristiano que medita en la cruz vive humilde, agradecido y valiente: nadie puede condenar a quien Cristo justificó (Romanos 8:33-34).\n\n## Para reflexionar\n\n- Medita en Isaías 53 esta semana: qué verso te impacta más?\n- Escribe tus propias palabras de gratitud a Jesús por la cruz.\n- Con quién podrías compartir esta semana lo que Él hizo por ti?', 15, 6),
('el-espiritu-santo-en-ti', 'Lección 7 · El Espíritu Santo en ti', 'Módulo B · La Biblia como fundamento', 'Juan 14:16-17',
E'## Otro Consolador\n\nAl despedirse, Jesús prometió que no dejaría solos a los suyos:\n\n> Y yo rogaré al Padre, y os dará otro Consolador, para que esté con vosotros para siempre: el Espíritu de verdad. — Juan 14:16-17\n\nEl Espíritu Santo no es una fuerza impersonal: es Dios presente en ti. Él convence al mundo de pecado, guía a la iglesia y habita en cada creyente, cuyo cuerpo es templo del Espíritu Santo (1 Corintios 6:19).\n\n## Su ministerio en tu vida\n\n- Regeneración: Él te dio vida nueva (Tito 3:5).\n- Sellamiento: marcó tu salvación hasta el día de la redención (Efesios 1:13).\n- Guianza: te dirige en decisiones cotidianas (Romanos 8:14).\n- Fruto: va formando en ti el carácter de Cristo: amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza (Gálatas 5:22-23).\n- Poder: te capacita para testificar de Jesús (Hechos 1:8).\n\n## Cómo caminar en el Espíritu\n\n> Andad en el Espíritu, y no satisfagáis los deseos de la carne. — Gálatas 5:16\n\nCaminar en el Espíritu es vivir sensibles a Su voz: obedeciendo Sus impresiones conforme a la Escritura, negando la carne cuando ella reclama, cultivando la comunión mediante la oración y la Palabra.\n\nNo confundas emoción con Espíritu: el fruto se comprueba en el carácter cotidiano, no solo en experiencias intensas.\n\n## Para reflexionar\n\n- Qué fruto del Espíritu necesitas que crezca más en ti ahora?\n- Hazte esta pregunta cada mañana: Espíritu Santo, guía mis palabras y decisiones de hoy.\n- Anota una ocasión reciente en que sentiste Su guianza y la obedeciste.', 15, 7),
('la-iglesia-tu-familia', 'Lección 8 · La iglesia: tu nueva familia', 'Módulo B · La Biblia como fundamento', 'Hebreos 10:24-25',
E'## Nadie crece solo\n\nCuando naciste de nuevo, naciste a una familia: la casa de Dios, que es la iglesia del Dios viviente, columna y baluarte de la verdad (1 Timoteo 3:15). Los primeros cristianos entendieron esto desde el primer día y perseveraban en la doctrina de los apóstoles, en la comunión unos con otros, en el partimiento del pan y en las oraciones (Hechos 2:42).\n\n> Y considerémonos unos a otros para estimularnos al amor y a las buenas obras; no dejando de congregarnos. — Hebreos 10:24-25\n\n## Qué significa pertenecer\n\n- Un cuerpo con muchos miembros: tú tienes un lugar y un don para edificar a los demás (1 Corintios 12).\n- Una familia espiritual: padres en la fe, hermanos que cargan tus cargas (Gálatas 6:2).\n- Un ejército: la iglesia es la que el infierno no podrá vencer (Mateo 16:18).\n\n## Compromisos prácticos\n\n- Congregarte fielmente cada semana, no por obligación sino por amor.\n- Someterse al pastoreo: obedece a vuestros pastores (Hebreos 13:17), quienes cuidan de tu alma.\n- Servir con tu don: pregunta a tu pastor dónde puedes servir.\n- Perseverar en comunidad: los grupos pequeños y los estudios por nivel fortalecen la raíz.\n\nEl carbón fuera del fuego se apaga; dentro del hogar arde. Así es el creyente fuera de la comunidad.\n\n## Para reflexionar\n\n- Estás comprometido con una congregación local?\n- Cuál es tu don natural que podrías poner al servicio de la iglesia?\n- Agenda esta semana un café con un hermano para animarse mutuamente.', 15, 8),

-- ------------------------------------------------------------
-- MÓDULO C · PREPARACIÓN PARA EL BAUTISMO
-- ------------------------------------------------------------

('significado-del-bautismo', 'Lección 9 · El significado del bautismo en agua', 'Módulo C · Preparación para el bautismo', 'Romanos 6:3-4',
E'## El primer acto de obediencia\n\nEl bautismo no salva: la salvación es por gracia mediante la fe (Efesios 2:8). Pero el bautismo es el primer mandato público de todo creyente. Jesús lo ordenó:\n\n> Id, y haced discípulos a todas las naciones, bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo. — Mateo 28:19\n\nEn Pentecostés, los que recibieron la palabra fueron bautizados el mismo día (Hechos 2:41). El nuevo creyente del Nuevo Testamento no esperaba meses: obedecía pronto.\n\n## Qué simboliza\n\n> Sepultados juntamente con él para muerte por el bautismo, para que como Cristo resucitó de los muertos… así también andemos nosotros en novedad de vida. — Romanos 6:4\n\n- Descender al agua = morir con Cristo al pecado y al pasado.\n- Ser sumergido = ser sepultado: el hombre viejo queda atrás.\n- Salir del agua = resucitar a una vida nueva en poder.\n\nPor eso se bautiza por inmersión: es el cuadro completo del evangelio actuando sobre ti.\n\n## Requisitos bíblicos\n\n- Arrepentimiento y fe personal (Hechos 8:36-37): se bautiza quien cree, no bebés sin conciencia de fe.\n- Obediencia gozosa: es una declaración pública, ante la iglesia y ante el mundo: yo pertenezco a Jesucristo.\n\n## Para reflexionar\n\n- Entiendes por qué el bautismo es por inmersión?\n- Estás dispuesto a declarar públicamente tu fe ante la congregación?\n- Escribe en pocas líneas tu testimonio: quién eras, cómo conociste a Cristo, qué ha cambiado.', 15, 9),
('la-santa-cena', 'Lección 10 · La Santa Cena: mesa de memoria y esperanza', 'Módulo C · Preparación para el bautismo', '1 Corintios 11:23-26',
E'## La ordenanza que dejó Jesús\n\nLa misma noche en que fue entregado, Jesús instituyó la Santa Cena con pan y vino:\n\n> Esto haced todas las veces que lo bebiereis, en memoria de mí. — 1 Corintios 11:25\n\nEs la cena del Señor: no nuestra, sino Su mesa. En ella la iglesia proclama el evangelio visible hasta que Él venga.\n\n## Sus tres miradas\n\n- Mirada atrás: memoria. Recordamos el cuerpo entregado y la sangre derramada en la cruz.\n- Mirada adentro: examen. Que el hombre se examine a sí mismo (1 Corintios 11:28): confesión antes de participar.\n- Mirada adelante: esperanza. Hasta que él venga: cada cena anuncia Su regreso inminente.\n\n## Cómo participar dignamente\n\nDigno no significa perfecto: significa consciente. Reconocer la solemnidad, reconciliarse con el hermano ofendido antes de la mesa (Mateo 5:23-24) y acercarse agradecido, confiando en la obra de Cristo y no en propios méritos.\n\nLa Cena une también a la iglesia: somos un solo pan y un solo cuerpo (1 Corintios 10:17). Por eso la celebramos juntos, con corazón limpio y gozoso.\n\n## Para reflexionar\n\n- Qué significa para ti participar de la mesa del Señor?\n- Hay alguien con quien debas reconciliarte antes de la próxima Santa Cena?\n- Memoriza 1 Corintios 11:26 como declaración de esperanza.', 15, 10),
('testimonio-y-vida-vencedora', 'Lección 11 · Testimonio y vida vencedora sobre el pecado', 'Módulo C · Preparación para el bautismo', 'Apocalipsis 12:11',
E'## Tu historia tiene poder\n\nEl testimonio es la herramienta que todo creyente lleva consigo desde el primer día:\n\n> Y ellos le han vencido por medio de la sangre del Cordero y de la palabra del testimonio de ellos. — Apocalipsis 12:11\n\nTu testimonio no necesita sermones elaborados: necesita honestidad. Tiene tres partes sencillas:\n\n- Antes: cómo era tu vida sin Cristo.\n- Entonces: cómo llegaste a Él (quién te invitó, qué entendiste, tu decisión).\n- Ahora: qué ha cambiado desde entonces.\n\nPractícalo en dos minutos y en diez: tendrás versiones cortas para conversaciones y largas para ocasiones especiales. Pablo lo predicaba así ante reyes y multitudes (Hechos 26).\n\n## Venciendo la tentación\n\nLa nueva vida enfrenta batallas. Dios provee la estrategia:\n\n- Vigila y ora para no entrar en tentación (Mateo 26:41).\n- Huye de las ocasiones: José huyó y venció (Génesis 39:12).\n- Usa la Escritura como Jesús en el desierto: está escrito… (Mateo 4).\n- Confiesa y levántate pronto: no hay condenación para los que están en Cristo Jesús (Romanos 8:1).\n\n> No os ha sobrevenido tentación que no sea humana; pero Dios es fiel, y no permitirá que seáis tentados más de lo que podéis resistir. — 1 Corintios 10:13\n\n## Para reflexionar\n\n- Escribe tu testimonio en tres párrafos: antes, entonces, ahora.\n- Ensúchalo con tu maestro esta semana y compártelo con alguien.\n- Cuál es tu tentación principal y qué paso concreto darás para vencerla?', 15, 11),
('preparacion-final-bautismo', 'Lección 12 · Tu preparación final para el bautismo', 'Módulo C · Preparación para el bautismo', 'Hechos 8:36-38',
E'## Listo para el gran día\n\nHas recorrido once verdades fundamentales. Esta lección reúne todo y te prepara para declarar públicamente tu fe, como el eunuco de Etiopía que exclamó: ¿Qué impide que yo sea bautizado? (Hechos 8:36).\n\n## Repaso de tu camino\n\n- Módulo A: nueva vida, seguridad de salvación, arrepentimiento y fe, vida devocional.\n- Módulo B: la Biblia, la cruz, el Espíritu Santo, la iglesia.\n- Módulo C: bautismo, Santa Cena, testimonio y victoria.\n\n## Antes de tu bautismo\n\n- Confirma tu decisión: no te bautices por presión ni costumbre, sino por convicción personal de fe en Cristo.\n- Completa tu testimonio escrito: lo compartirás brevemente en el servicio.\n- Habla con tu pastor o maestro: resuelve cualquier duda doctrinal pendiente.\n- Invita a tu familia y amigos: tu bautismo es una gran oportunidad evangelística.\n- Prepara tu corazón con oración y ayuno parcial si lo deseas.\n\n## Después del bautismo\n\nEl bautismo es comienzo, no meta. Continúa:\n\n- Avanzando hacia el Nivel 2: crecimiento doctrinal en Romanos, Hechos y las epístolas.\n- Integrándote a servir en algún ministerio de la iglesia.\n- Discipulando a otros: pronto podrás acompañar a un nuevo creyente con estas mismas lecciones.\n\n## Oración de consagración\n\nSeñor Jesús, gracias por tu amor que me alcanzó. Me entrego a Ti de todo corazón. Prepárame para honrarte en mi bautismo, y úsame para llevar tu luz a otros. Amén.\n\n## Para reflexionar\n\n- Fecha tentativa: conversa con tu pastor para agendar tu bautismo.\n- Termina de pulir tu testimonio y ensáyalo en voz alta.\n- A quién invitarás a presenciar tu obediencia pública?', 15, 12)
) as v(slug,title,module_label,verse_ref,body,so)
where c.slug = 'nivel-1'
on conflict (course_id, slug) do nothing;

-- ============================================================
-- AGUAS VIVAS · Fase 3 — Videoconferencias / En vivo
-- Ejecutar en: Supabase Dashboard → SQL Editor (después de fase 2)
-- ============================================================

-- ------------------------------------------------------------
-- 1. SESIONES (predicación dominical, clases por nivel, anuncios)
-- ------------------------------------------------------------
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  title       text not null,
  type        text not null default 'predicacion' check (type in ('predicacion','clase','anuncio')),
  course_id   uuid references public.courses(id) on delete set null,
  host_name   text,
  starts_at   timestamptz,
  duration_min int default 60,
  video_url   text,
  notes       text,
  status      text not null default 'programada' check (status in ('programada','en_vivo','finalizada')),
  created_at  timestamptz not null default now()
);

create index if not exists sessions_tenant_status_idx on public.sessions (tenant_id, status, starts_at);

-- ------------------------------------------------------------
-- 2. SEGURIDAD (RLS)
-- ------------------------------------------------------------
alter table public.sessions enable row level security;

drop policy if exists sessions_public_read on public.sessions;
create policy sessions_public_read on public.sessions for select using (true);

drop policy if exists sessions_team_write on public.sessions;
create policy sessions_team_write on public.sessions for all using (
  public.av_role() in ('super_admin','pastor','maestro')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = sessions.tenant_id
  )
);

-- ------------------------------------------------------------
-- 3. SEMILLA DE EJEMPLO (se puede eliminar desde el panel)
-- ------------------------------------------------------------
insert into public.sessions (tenant_id, title, type, host_name, starts_at, duration_min, status, notes)
select t.id, 'Predicación dominical — Fundamentos de fe', 'predicacion', 'Pastorado',
       now() + interval '3 days', 60, 'programada',
       'Servicio general abierto a toda la congregación y visitantes.'
from public.tenants t
where t.slug = 'aguas-vivas'
  and not exists (select 1 from public.sessions s where s.tenant_id = t.id);

insert into public.sessions (tenant_id, title, type, host_name, starts_at, duration_min, video_url, status, notes)
select t.id, 'Anuncios de la semana', 'anuncio', 'Equipo pastoral',
       now() - interval '7 days', 20, null, 'finalizada',
       'Actividades, bautismos y avisos generales.'
from public.tenants t
where t.slug = 'aguas-vivas'
  and (select count(*) from public.sessions s where s.tenant_id = t.id) < 2;

-- ============================================================
-- AGUAS VIVAS · Fase 4 — Mayordomía
-- Ejecutar en: Supabase Dashboard → SQL Editor (después de fase 3)
-- ============================================================

-- ------------------------------------------------------------
-- 1. TRANSACCIONES (ingresos y egresos)
--    Ingresos:  pendiente (donación en línea sin confirmar) → confirmado (+ comprobante)
--    Egresos:   pendiente_aprobacion → aprobado | rechazado  (solo Pastor aprueba)
-- ------------------------------------------------------------
create table if not exists public.transactions (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid references public.tenants(id) on delete cascade,
  kind              text not null check (kind in ('ingreso','egreso')),
  category          text not null default 'ofrenda',
  amount            numeric(12,2) not null check (amount > 0),
  currency          text not null default 'PEN',
  description       text,
  occurred_at       timestamptz not null default now(),

  donor_name        text,
  donor_email       text,
  donor_phone       text,
  method            text,

  requested_by_name text,
  approval_status   text check (approval_status in ('pendiente_aprobacion','aprobado','rechazado')),
  approved_by_name  text,
  approved_at       timestamptz,

  status            text not null default 'confirmado'
                    check (status in ('pendiente','confirmado','pendiente_aprobacion','aprobado','rechazado')),
  receipt_code      text unique,
  created_at        timestamptz not null default now()
);

create index if not exists transactions_tenant_occurred_idx
  on public.transactions (tenant_id, occurred_at);

-- Instrucciones de donación visibles en la página pública
alter table public.tenants add column if not exists donation_info text;

-- ------------------------------------------------------------
-- 2. SEGURIDAD (RLS) — usa av_role()/av_tenant() de schema.sql
--    El rol Mantenimiento NO tiene acceso a este módulo.
-- ------------------------------------------------------------
alter table public.transactions enable row level security;

drop policy if exists tx_finance_read on public.transactions;
create policy tx_finance_read on public.transactions for select using (
  public.av_role() in ('super_admin','pastor','tesoreria')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = transactions.tenant_id
  )
);

-- Cualquier persona puede enviar una intención de donación (queda pendiente)
drop policy if exists tx_public_donate on public.transactions;
create policy tx_public_donate on public.transactions
  for insert with check (kind = 'ingreso' and status = 'pendiente');

-- Tesorería / Pastor / Súper Admin registran manualmente
drop policy if exists tx_finance_insert on public.transactions;
create policy tx_finance_insert on public.transactions for insert with check (
  public.av_role() in ('super_admin','pastor','tesoreria')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = transactions.tenant_id
  )
);

drop policy if exists tx_finance_update on public.transactions;
create policy tx_finance_update on public.transactions for update using (
  public.av_role() in ('super_admin','pastor','tesoreria')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = transactions.tenant_id
  )
);

drop policy if exists tx_pastor_delete on public.transactions;
create policy tx_pastor_delete on public.transactions for delete using (
  public.av_role() in ('super_admin','pastor')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = transactions.tenant_id
  )
);

-- ------------------------------------------------------------
-- 3. SEMILLA — instrucciones de ejemplo editables en Configuración
-- ------------------------------------------------------------
update public.tenants
set donation_info =
E'Banco de Crédito (BCP)\nCuenta corriente soles: 000-0000000-00\nCCI: 002-000-0000000000-00\n\nYape / Plin: +51 987 654 321\nTitular: Iglesia Aguas Vivas\n\nTambién puedes dar desde cualquier país vía PayPal: iglesia@correo.org'
where slug = 'aguas-vivas' and donation_info is null;
