import type { Session, Tenant } from "./types";
import type { Course, Lesson } from "./lesson";
import { DEFAULT_TENANT_SLUG } from "./constants";

export const DEMO_TENANT: Tenant = {
  id: "demo-tenant-aguas-vivas",
  slug: DEFAULT_TENANT_SLUG,
  name: "Aguas Vivas",
  country: "Perú",
  city: null,
  address: null,
  description:
    "Comunidad cristiana que proclama el evangelio, discipula por niveles y camina en comunión.",
  logo_url: null,
  brand_color: null,
  contact_email: null,
  contact_phone: null,
  whatsapp: null,
  facebook: null,
  instagram: null,
  youtube: null,
  service_schedule: "Dom 10:00 am · Mié 7:00 pm",
  donation_info: null,
  plan: "free",
  status: "active",
};

export const DEMO_COURSE: Course = {
  id: "demo-course-nivel-1",
  slug: "nivel-1",
  level: 1,
  title: "Nivel 1 — Fundamentos",
  tagline: "Verdades básicas y bautismo",
  description:
    "El primer paso en la fe: doctrinas esenciales y preparación para el bautismo en agua.",
  sort_order: 1,
};

interface DemoLessonSeed {
  slug: string;
  title: string;
  module_label: string;
  verse_ref: string;
  body: string;
  sort_order: number;
}

function toLesson(seed: DemoLessonSeed): Lesson {
  return {
    id: `demo-${seed.slug}`,
    course_id: DEMO_COURSE.id,
    slug: seed.slug,
    title: seed.title,
    module_label: seed.module_label,
    verse_ref: seed.verse_ref,
    body: seed.body,
    duration_min: 15,
    sort_order: seed.sort_order,
  };
}

const SEEDS: DemoLessonSeed[] = [
  {
    slug: "nueva-vida-en-cristo",
    title: "Lección 1 · El amor de Dios y tu nueva vida",
    module_label: "Módulo A · Nueva vida en Cristo",
    verse_ref: "Juan 3:16",
    sort_order: 1,
    body: `## El punto de partida

Toda historia de fe comienza con un hecho inqueible: Dios te ama. No es un amor distante ni condicional; es el amor de un Padre que entregó a su Hijo para recuperarte.

> Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna. — Juan 3:16

Si oraste recibiendo a Jesús como Señor y Salvador, la Biblia declara que eres una **nueva criatura**: las cosas viejas pasaron y Dios hizo algo completamente nuevo en ti (2 Corintios 5:17).

## Qué cambió en ti

- Fuiste perdonado: Dios ya no recuerda tus pecados (Hebreos 8:12).
- Fuiste adoptado: ahora Dios es tu Padre y tú su hijo (Juan 1:12).
- Recibiste vida eterna: tu destino ya no es la muerte sino la vida con Él (Juan 5:24).

## Tu nueva identidad

Antes de Cristo, tu identidad era tu pasado. Ahora, tu identidad es lo que Dios dice de ti: hijo amado, perdonado, elegido. Cuando la mente te recuerde quién eras, responde con lo que Dios dice que eres hoy.

## Para reflexionar

- ¿Qué significó para ti descubrir que Dios te ama personalmente?
- Escribe en una libreta tres cosas nuevas que recibiste al entregar tu vida a Jesús.
- Comparte tu decisión con alguien cercano esta semana.`,
  },
  {
    slug: "seguro-de-tu-salvacion",
    title: "Lección 2 · Seguro de tu salvación",
    module_label: "Módulo A · Nueva vida en Cristo",
    verse_ref: "1 Juan 5:13",
    sort_order: 2,
    body: `## ¿Puedo saber si soy salvo?

Muchos creyentes nuevos viven inseguros, sintiendo que la salvación depende de sus emociones o de su desempeño. Pero Juan escribió su carta con un propósito claro:

> Estas cosas os he escrito a vosotros que creéis en el nombre del Hijo de Dios, para que sepáis que tenéis vida eterna. — 1 Juan 5:13

Nota las palabras: **para que sepáis**. La salvación no se siente: se sabe, porque está fundada en la promesa de Dios y en la obra terminada de Jesucristo, no en tus méritos.

## Las bases de tu seguridad

- La promesa de Dios: Él no miente (Tito 1:2). Si Él dijo que todo aquel que invoca será salvo (Romanos 10:13), eso incluye a quien invocó con fe: tú.
- La obra de Cristo: en la cruz Él exclamó: Consumado es (Juan 19:30). Nada falta por pagar.
- El testimonio interno: el Espíritu Santo da testimonio con nuestro espíritu de que somos hijos de Dios (Romanos 8:16).

## ¿Y cuando peco?

Pecar después de creer no rompe tu filiación; rompe tu comunión. Por eso existe la confesión diaria:

> Si confesamos nuestros pecados, él es fiel y justo para perdonar nuestros pecados, y limpiarnos de toda maldad. — 1 Juan 1:9

Un hijo que se equivoca sigue siendo hijo; pero necesita volver al Padre para restaurar la dulzura de la relación.

## Para reflexionar

- En qué fundas hoy tu seguridad: en tus sentimientos o en la Palabra de Dios?
- Memoriza 1 Juan 5:13 esta semana.
- Escribe una oración agradeciendo que tu salvación descansa en Dios.`,
  },
  {
    slug: "arrepentimiento-y-fe",
    title: "Lección 3 · Arrepentimiento y fe",
    module_label: "Módulo A · Nueva vida en Cristo",
    verse_ref: "Hechos 20:21",
    sort_order: 3,
    body: `## Dos manos de la conversión

El evangelio que Pablo predicaba contenía dos elementos inseparables: arrepentimiento para con Dios y fe en nuestro Señor Jesucristo (Hechos 20:21). Son las dos manos con las que abrazamos la salvación.

## Qué es el arrepentimiento

Arrepentirse no es solo sentir tristeza. Judas sintió remordimiento y se perdió; Pedro lloró amargamente y fue restaurado. La diferencia es la dirección:

> Porque la tristeza que es según Dios produce arrepentimiento para salvación, de que no hay que arrepentirse; pero la tristeza del mundo produce muerte. — 2 Corintios 7:10

Arrepentirse es cambiar de mentalidad y de dirección: dejar el pecado, odiarlo como Dios lo odia, y volverse hacia Él.

## Qué es la fe salvadora

La fe no es optimismo ni fuerza de voluntad. Es confiar plenamente en la persona y obra de Jesucristo: que Su muerte pagó tu deuda y Su resurrección te garantiza vida.

> Sin fe es imposible agradar a Dios. — Hebreos 11:6

## Un arrepentimiento continuo

El arrepentimiento inicial se repite cada vez que el Espíritu nos muestra algo que corregir. El cristiano maduro mantiene el corazón blando: confiesa pronto, perdona pronto, corrige el rumbo rápido.

## Para reflexionar

- Hay algo en tu vida que sabes que debes abandonar todavía?
- Practica esta semana una confesión concreta y específica ante Dios.
- En qué área necesitas confiar más activamente en las promesas de Dios?`,
  },
  {
    slug: "vida-devocional",
    title: "Lección 4 · Vida devocional: oración y lectura bíblica",
    module_label: "Módulo A · Nueva vida en Cristo",
    verse_ref: "Mateo 4:4",
    sort_order: 4,
    body: `## Alimento para la nueva vida

Así como el cuerpo necesita alimento diario, tu espíritu necesita dos sustentos: la Palabra de Dios y la oración. Jesús mismo estableció el patrón:

> Escrito está: No sólo de pan vivirá el hombre, sino de toda palabra que sale de la boca de Dios. — Mateo 4:4

## Cómo empezar a leer la Biblia

- Comienza por el Evangelio de Juan: presenta a Jesús de manera clara y sencilla.
- Lee poco pero todos los días: mejor un capítulo diario que veinte una sola vez.
- Pregunta al texto: qué me enseña sobre Dios? qué me enseña sobre mí? hay algo que obedecer?
- Usa una versión comprensible como la Reina-Valera 1960 y anota lo que Dios te hable.

## Cómo orar sencillamente

La oración es conversación, no ritual. Un patrón sencillo para comenzar:

- Adoración: reconoce quién es Dios.
- Gratitud: agradece cosas concretas.
- Confesión: pide perdón por lo que el Espíritu te muestre.
- Súplica: presenta tus necesidades y las de otros.
- Sumisión: entrega el día a Su voluntad.

Jesús enseñó un modelo parecido en Mateo 6:9-13, el Padrenuestro.

## El hábito que lo cambia todo

Escoge una hora y un lugar fijos. Empieza con quince minutos: diez leyendo, cinco orando. La constancia vale más que la intensidad. Pronto ese tiempo será lo más dulce de tu día.

## Para reflexionar

- Cuándo y dónde leerás la Biblia esta semana?
- Escribe hoy tu primera lista de gratitud a Dios.
- Qué obstáculo prevés y cómo lo vencerás?`,
  },
  {
    slug: "que-es-la-biblia",
    title: "Lección 5 · Qué es la Biblia y cómo leerla",
    module_label: "Módulo B · La Biblia como fundamento",
    verse_ref: "2 Timoteo 3:16",
    sort_order: 5,
    body: `## La carta de amor más antigua

La Biblia no es un libro común: son 66 libros escritos por unos 40 autores, en tres idiomas, a lo largo de más de mil quinientos años… y con un mensaje perfectamente unido: Dios redimiendo al hombre.

> Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir en justicia. — 2 Timoteo 3:16

Inspirada significa que Dios mismo la originó: hombres escribieron, pero el Espíritu los guió (2 Pedro 1:21). Por eso la llamamos la Palabra de Dios.

## Su estructura en un mapa

- Antiguo Testamento (39 libros): preparación — la creación, la caída, Israel y las profecías del Mesías.
- Evangelios (4 libros): presentación — la vida, muerte y resurrección de Jesús.
- Hechos (1 libro): proclamación — el nacimiento de la iglesia.
- Epístolas (22 cartas): explicación — cómo vivir la nueva vida.
- Apocalipsis (1 libro): consumación — el triunfo final de Cristo.

## Cómo leerla sin perderse

- Primero los Evangelios y luego Hechos; después Romanos.
- Lee pasajes completos, no versículos sueltos fuera de contexto.
- Deja que la Biblia interprete a la Biblia: el texto clarifica al texto.
- Obedece lo que entiendas: la luz aumenta a medida que avanzas.

## Para reflexionar

- Qué parte de este mapa de la Biblia te llama más a explorar?
- Traza un plan: cuántos capítulos por semana?
- Comparte con tu maestro una verdad que hayas aprendido leyendo.`,
  },
  {
    slug: "la-cruz-de-cristo",
    title: "Lección 6 · La obra de Cristo en la cruz",
    module_label: "Módulo B · La Biblia como fundamento",
    verse_ref: "Isaías 53:5",
    sort_order: 6,
    body: `## El centro del evangelio

Sin la cruz no hay cristianismo. Setecientos años antes de que ocurriera, el profeta Isaías la describió con precisión asombrosa:

> Mas él herido fue por nuestras rebeliones, molido por nuestros pecados; el castigo de nuestra paz fue sobre él, y por su llaga hemos sido curados. — Isaías 53:5

## Qué logró Jesús en la cruz

- Expiación: pagó la pena que tú debías. La paga del pecado era muerte, y Él la cumplió (Romanos 6:23).
- Justificación: ahora puedes ser declarado justo delante de Dios, no por obras, sino por fe en Cristo (Romanos 5:1).
- Reconciliación: el muro de separación cayó. Ya tienes libre acceso al Padre (Efesios 2:18).
- Redención: fuiste comprado para Dios a precio de sangre (1 Pedro 1:18-19).

## Tres palabras para recordar

Sustituto: Él murió en tu lugar.
Cordero: Juan Bautista lo anunció: He aquí el Cordero de Dios que quita el pecado del mundo (Juan 1:29).
Victoria: por medio de la muerte destruyó al que tenía el imperio de la muerte (Hebreos 2:14).

## Nunca lo olvides

La cena del Señor existe para que recordemos la cruz hasta que Él vuelva. Un cristiano que medita en la cruz vive humilde, agradecido y valiente: nadie puede condenar a quien Cristo justificó (Romanos 8:33-34).

## Para reflexionar

- Medita en Isaías 53 esta semana: qué verso te impacta más?
- Escribe tus propias palabras de gratitud a Jesús por la cruz.
- Con quién podrías compartir esta semana lo que Él hizo por ti?`,
  },
  {
    slug: "el-espiritu-santo-en-ti",
    title: "Lección 7 · El Espíritu Santo en ti",
    module_label: "Módulo B · La Biblia como fundamento",
    verse_ref: "Juan 14:16-17",
    sort_order: 7,
    body: `## Otro Consolador

Al despedirse, Jesús prometió que no dejaría solos a los suyos:

> Y yo rogaré al Padre, y os dará otro Consolador, para que esté con vosotros para siempre: el Espíritu de verdad. — Juan 14:16-17

El Espíritu Santo no es una fuerza impersonal: es Dios presente en ti. Él convence al mundo de pecado, guía a la iglesia y habita en cada creyente, cuyo cuerpo es templo del Espíritu Santo (1 Corintios 6:19).

## Su ministerio en tu vida

- Regeneración: Él te dio vida nueva (Tito 3:5).
- Sellamiento: marcó tu salvación hasta el día de la redención (Efesios 1:13).
- Guianza: te dirige en decisiones cotidianas (Romanos 8:14).
- Fruto: va formando en ti el carácter de Cristo: amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza (Gálatas 5:22-23).
- Poder: te capacita para testificar de Jesús (Hechos 1:8).

## Cómo caminar en el Espíritu

> Andad en el Espíritu, y no satisfagáis los deseos de la carne. — Gálatas 5:16

Caminar en el Espíritu es vivir sensibles a Su voz: obedeciendo Sus impresiones conforme a la Escritura, negando la carne cuando ella reclama, cultivando la comunión mediante la oración y la Palabra.

No confundas emoción con Espíritu: el fruto se comprueba en el carácter cotidiano, no solo en experiencias intensas.

## Para reflexionar

- Qué fruto del Espíritu necesitas que crezca más en ti ahora?
- Hazte esta pregunta cada mañana: Espíritu Santo, guía mis palabras y decisiones de hoy.
- Anota una ocasión reciente en que sentiste Su guianza y la obedeciste.`,
  },
  {
    slug: "la-iglesia-tu-familia",
    title: "Lección 8 · La iglesia: tu nueva familia",
    module_label: "Módulo B · La Biblia como fundamento",
    verse_ref: "Hebreos 10:24-25",
    sort_order: 8,
    body: `## Nadie crece solo

Cuando naciste de nuevo, naciste a una familia: la casa de Dios, que es la iglesia del Dios viviente, columna y baluarte de la verdad (1 Timoteo 3:15). Los primeros cristianos entendieron esto desde el primer día y perseveraban en la doctrina de los apóstoles, en la comunión unos con otros, en el partimiento del pan y en las oraciones (Hechos 2:42).

> Y considerémonos unos a otros para estimularnos al amor y a las buenas obras; no dejando de congregarnos. — Hebreos 10:24-25

## Qué significa pertenecer

- Un cuerpo con muchos miembros: tú tienes un lugar y un don para edificar a los demás (1 Corintios 12).
- Una familia espiritual: padres en la fe, hermanos que cargan tus cargas (Gálatas 6:2).
- Un ejército: la iglesia es la que el infierno no podrá vencer (Mateo 16:18).

## Compromisos prácticos

- Congregarte fielmente cada semana, no por obligación sino por amor.
- Someterse al pastoreo: obedece a vuestros pastores (Hebreos 13:17), quienes cuidan de tu alma.
- Servir con tu don: pregunta a tu pastor dónde puedes servir.
- Perseverar en comunidad: los grupos pequeños y los estudios por nivel fortalecen la raíz.

El carbón fuera del fuego se apaga; dentro del hogar arde. Así es el creyente fuera de la comunidad.

## Para reflexionar

- Estás comprometido con una congregación local?
- Cuál es tu don natural que podrías poner al servicio de la iglesia?
- Agenda esta semana un café con un hermano para animarse mutuamente.`,
  },
  {
    slug: "significado-del-bautismo",
    title: "Lección 9 · El significado del bautismo en agua",
    module_label: "Módulo C · Preparación para el bautismo",
    verse_ref: "Romanos 6:3-4",
    sort_order: 9,
    body: `## El primer acto de obediencia

El bautismo no salva: la salvación es por gracia mediante la fe (Efesios 2:8). Pero el bautismo es el primer mandato público de todo creyente. Jesús lo ordenó:

> Id, y haced discípulos a todas las naciones, bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo. — Mateo 28:19

En Pentecostés, los que recibieron la palabra fueron bautizados el mismo día (Hechos 2:41). El nuevo creyente del Nuevo Testamento no esperaba meses: obedecía pronto.

## Qué simboliza

> Sepultados juntamente con él para muerte por el bautismo, para que como Cristo resucitó de los muertos… así también andemos nosotros en novedad de vida. — Romanos 6:4

- Descender al agua = morir con Cristo al pecado y al pasado.
- Ser sumergido = ser sepultado: el hombre viejo queda atrás.
- Salir del agua = resucitar a una vida nueva en poder.

Por eso se bautiza por inmersión: es el cuadro completo del evangelio actuando sobre ti.

## Requisitos bíblicos

- Arrepentimiento y fe personal (Hechos 8:36-37): se bautiza quien cree, no bebés sin conciencia de fe.
- Obediencia gozosa: es una declaración pública, ante la iglesia y ante el mundo: yo pertenezco a Jesucristo.

## Para reflexionar

- Entiendes por qué el bautismo es por inmersión?
- Estás dispuesto a declarar públicamente tu fe ante la congregación?
- Escribe en pocas líneas tu testimonio: quién eras, cómo conociste a Cristo, qué ha cambiado.`,
  },
  {
    slug: "la-santa-cena",
    title: "Lección 10 · La Santa Cena: mesa de memoria y esperanza",
    module_label: "Módulo C · Preparación para el bautismo",
    verse_ref: "1 Corintios 11:23-26",
    sort_order: 10,
    body: `## La ordenanza que dejó Jesús

La misma noche en que fue entregado, Jesús instituyó la Santa Cena con pan y vino:

> Esto haced todas las veces que lo bebiereis, en memoria de mí. — 1 Corintios 11:25

Es la cena del Señor: no nuestra, sino Su mesa. En ella la iglesia proclama el evangelio visible hasta que Él venga.

## Sus tres miradas

- Mirada atrás: memoria. Recordamos el cuerpo entregado y la sangre derramada en la cruz.
- Mirada adentro: examen. Que el hombre se examine a sí mismo (1 Corintios 11:28): confesión antes de participar.
- Mirada adelante: esperanza. Hasta que él venga: cada cena anuncia Su regreso inminente.

## Cómo participar dignamente

Digno no significa perfecto: significa consciente. Reconocer la solemnidad, reconciliarse con el hermano ofendido antes de la mesa (Mateo 5:23-24) y acercarse agradecido, confiando en la obra de Cristo y no en propios méritos.

La Cena une también a la iglesia: somos un solo pan y un solo cuerpo (1 Corintios 10:17). Por eso la celebramos juntos, con corazón limpio y gozoso.

## Para reflexionar

- Qué significa para ti participar de la mesa del Señor?
- Hay alguien con quien debas reconciliarte antes de la próxima Santa Cena?
- Memoriza 1 Corintios 11:26 como declaración de esperanza.`,
  },
  {
    slug: "testimonio-y-vida-vencedora",
    title: "Lección 11 · Testimonio y vida vencedora sobre el pecado",
    module_label: "Módulo C · Preparación para el bautismo",
    verse_ref: "Apocalipsis 12:11",
    sort_order: 11,
    body: `## Tu historia tiene poder

El testimonio es la herramienta que todo creyente lleva consigo desde el primer día:

> Y ellos le han vencido por medio de la sangre del Cordero y de la palabra del testimonio de ellos. — Apocalipsis 12:11

Tu testimonio no necesita sermones elaborados: necesita honestidad. Tiene tres partes sencillas:

- Antes: cómo era tu vida sin Cristo.
- Entonces: cómo llegaste a Él (quién te invitó, qué entendiste, tu decisión).
- Ahora: qué ha cambiado desde entonces.

Practícalo en dos minutos y en diez: tendrás versiones cortas para conversaciones y largas para ocasiones especiales. Pablo lo predicaba así ante reyes y multitudes (Hechos 26).

## Venciendo la tentación

La nueva vida enfrenta batallas. Dios provee la estrategia:

- Vigila y ora para no entrar en tentación (Mateo 26:41).
- Huye de las ocasiones: José huyó y venció (Génesis 39:12).
- Usa la Escritura como Jesús en el desierto: está escrito… (Mateo 4).
- Confiesa y levántate pronto: no hay condenación para los que están en Cristo Jesús (Romanos 8:1).

> No os ha sobrevenido tentación que no sea humana; pero Dios es fiel, y no permitirá que seáis tentados más de lo que podéis resistir. — 1 Corintios 10:13

## Para reflexionar

- Escribe tu testimonio en tres párrafos: antes, entonces, ahora.
- Ensúchalo con tu maestro esta semana y compártelo con alguien.
- Cuál es tu tentación principal y qué paso concreto darás para vencerla?`,
  },
  {
    slug: "preparacion-final-bautismo",
    title: "Lección 12 · Tu preparación final para el bautismo",
    module_label: "Módulo C · Preparación para el bautismo",
    verse_ref: "Hechos 8:36-38",
    sort_order: 12,
    body: `## Listo para el gran día

Has recorrido once verdades fundamentales. Esta lección reúne todo y te prepara para declarar públicamente tu fe, como el eunuco de Etiopía que exclamó: ¿Qué impide que yo sea bautizado? (Hechos 8:36).

## Repaso de tu camino

- Módulo A: nueva vida, seguridad de salvación, arrepentimiento y fe, vida devocional.
- Módulo B: la Biblia, la cruz, el Espíritu Santo, la iglesia.
- Módulo C: bautismo, Santa Cena, testimonio y victoria.

## Antes de tu bautismo

- Confirma tu decisión: no te bautices por presión ni costumbre, sino por convicción personal de fe en Cristo.
- Completa tu testimonio escrito: lo compartirás brevemente en el servicio.
- Habla con tu pastor o maestro: resuelve cualquier duda doctrinal pendiente.
- Invita a tu familia y amigos: tu bautismo es una gran oportunidad evangelística.
- Prepara tu corazón con oración y ayuno parcial si lo deseas.

## Después del bautismo

El bautismo es comienzo, no meta. Continúa:

- Avanzando hacia el Nivel 2: crecimiento doctrinal en Romanos, Hechos y las epístolas.
- Integrándote a servir en algún ministerio de la iglesia.
- Discipulando a otros: pronto podrás acompañar a un nuevo creyente con estas mismas lecciones.

## Oración de consagración

Señor Jesús, gracias por tu amor que me alcanzó. Me entrego a Ti de todo corazón. Prepárame para honrarte en mi bautismo, y úsame para llevar tu luz a otros. Amén.

## Para reflexionar

- Fecha tentativa: conversa con tu pastor para agendar tu bautismo.
- Termina de pulir tu testimonio y ensáyalo en voz alta.
- A quién invitarás a presenciar tu obediencia pública?`,
  },
];

export const DEMO_LESSONS: Lesson[] = SEEDS.map(toLesson);

export const DEMO_LIVE_SESSION: Session = {
  id: "demo-session-en-vivo",
  tenant_id: DEMO_TENANT.id,
  title: "Predicación dominical",
  type: "predicacion",
  course_id: null,
  host_name: "Hermano Pablo",
  starts_at: new Date().toISOString(),
  duration_min: 60,
  video_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  notes: "Servicio general — abierto a toda la congregación y visitantes.",
  status: "en_vivo",
};

const futureDate = (days: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const DEMO_UPCOMING: Session[] = [
  {
    id: "demo-upcoming-1",
    tenant_id: DEMO_TENANT.id,
    title: "Predicación dominical",
    type: "predicacion",
    course_id: null,
    host_name: "Pastor Juan",
    starts_at: futureDate(1, 10),
    duration_min: 90,
    video_url: null,
    notes: "Servicio general — abierto a toda la congregación y visitantes.",
    status: "programada",
  },
  {
    id: "demo-upcoming-2",
    tenant_id: DEMO_TENANT.id,
    title: "Clase Nivel 1 — Fundamentos",
    type: "clase",
    course_id: DEMO_COURSE.id,
    host_name: "Hermana María",
    starts_at: futureDate(3, 19),
    duration_min: 60,
    video_url: null,
    notes: "Sesión en vivo para el Nivel 1 de estudios bíblicos.",
    status: "programada",
  },
  {
    id: "demo-upcoming-3",
    tenant_id: DEMO_TENANT.id,
    title: "Anuncios semanales",
    type: "anuncio",
    course_id: null,
    host_name: "Hermano Luis",
    starts_at: futureDate(5, 18),
    duration_min: 30,
    video_url: null,
    notes: "Actividades, bautismos, campañas de evangelismo y avisos generales.",
    status: "programada",
  },
];

const pastDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(11, 0, 0, 0);
  return d.toISOString();
};

export const DEMO_RECORDINGS: Session[] = [
  {
    id: "demo-rec-1",
    tenant_id: DEMO_TENANT.id,
    title: "Predicación — La fe que mueve montañas",
    type: "predicacion",
    course_id: null,
    host_name: "Hermano Pablo",
    starts_at: pastDate(7),
    duration_min: 95,
    video_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    notes: "Culto dominical. Tema central del servicio general.",
    status: "finalizada",
  },
  {
    id: "demo-rec-2",
    tenant_id: DEMO_TENANT.id,
    title: "Clase Nivel 1 — El plan de salvación",
    type: "clase",
    course_id: DEMO_COURSE.id,
    host_name: "Hermana María",
    starts_at: pastDate(5),
    duration_min: 60,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    notes: "Sesión de estudio para los del Nivel 1.",
    status: "finalizada",
  },
  {
    id: "demo-rec-3",
    tenant_id: DEMO_TENANT.id,
    title: "Predicación — Creciendo en la Palabra",
    type: "predicacion",
    course_id: null,
    host_name: "Pastor Juan",
    starts_at: pastDate(10),
    duration_min: 88,
    video_url: "https://www.youtube.com/watch?v=YsPN5WkBI8E",
    notes: "Culto general con invitado especial.",
    status: "finalizada",
  },
  {
    id: "demo-rec-4",
    tenant_id: DEMO_TENANT.id,
    title: "Noche de alabanza y oración",
    type: "predicacion",
    course_id: null,
    host_name: "Hermano Luis",
    starts_at: pastDate(14),
    duration_min: 120,
    video_url: "https://www.youtube.com/watch?v=0xk0tGzF-SM",
    notes: "Reunión de oración abierta a toda la congregación.",
    status: "finalizada",
  },
];
