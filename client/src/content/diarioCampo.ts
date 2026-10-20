/*
 * Contenido del diario de campo creativo (página /diario).
 *
 * Está separado del diseño para poder editar el texto sin tocar el código de la
 * página. Los datos salen de las 9 entradas reales que había en MongoDB el
 * 20 de octubre de 2026; las entradas de ejemplo ficticias no forman parte del
 * análisis. Los recuentos («7 de 9») están hechos a mano a partir de esas entradas.
 */

/** Entradas analizadas (la página muestra sus fotos en el collage si siguen publicadas). */
export const ENTRADAS_ANALIZADAS = [
  'entrada-c6604591', // Elantisocial
  'entrada-d168167e', // Sarvente
  'entrada-51f2b5ad', // Amelia (mi propia entrada)
  'entrada-85f2c900', // Matu
  'entrada-9680a12b', // Christian
  'entrada-556e4a1b', // Ordinal
  'entrada-6be68eb1', // Ceci
  'entrada-4ab1baf6', // Val
  'entrada-c1ffab82', // J
];

export const AUTORA = 'Amelia';

export const FICHA = [
  { etiqueta: 'Fecha de la escena', valor: 'Lunes 19 de octubre de 2026' },
  { etiqueta: 'Hora', valor: 'De 20:19 a 23:26 (hora de Ecuador), mientras llegaban las entradas' },
  { etiqueta: 'Registro y análisis', valor: 'Martes 20 de octubre de 2026' },
  { etiqueta: 'Espacio', valor: 'Escena virtual: el diario colectivo «we are not so different»' },
  { etiqueta: 'Participantes', valor: '9 personas (incluida yo), de 19 a 55 años, con seudónimos elegidos por ellas' },
  { etiqueta: 'Tipo de observación', valor: 'Participante' },
];

/** Hora local (Ecuador) a la que se publicó cada entrada el 19 de octubre. */
export const LLEGADAS = [
  { hora: '20:19', nombre: 'Elantisocial' },
  { hora: '20:21', nombre: 'Sarvente' },
  { hora: '20:21', nombre: 'Amelia' },
  { hora: '20:24', nombre: 'Matu' },
  { hora: '20:25', nombre: 'Christian' },
  { hora: '20:29', nombre: 'Ordinal' },
  { hora: '20:36', nombre: 'Ceci' },
  { hora: '21:18', nombre: 'Val' },
  { hora: '23:26', nombre: 'J' },
];

export const INTERESES = [
  'cosplay',
  'anime',
  'manga',
  'k-pop',
  'vocaloid',
  'BL',
  'Undertale',
  'juegos gacha',
  'Valorant',
  'FNAFHS',
  'creepypastas',
  'musicales',
  'Batman, Superman, Spider-Man',
  'Star Wars',
  'cómics',
  'historia',
  'ciencia',
  'Harry Potter',
];

export const PREGUNTA =
  '¿Cómo es la escena cultural que se forma en «we are not so different»? En concreto: ¿qué papel cumplen los intereses frikis en las experiencias de rechazo y de pertenencia de quienes escribieron en el diario?';

export const OBJETIVOS = [
  'Identificar en qué espacios y etapas de la vida aparecen las experiencias negativas: el colegio, la familia, los eventos o la calle.',
  'Describir qué les han dado sus intereses: amistades, comunidad, identidad o creatividad.',
  'Analizar cómo nombran su diferencia («raro», «extraño», «cringe», «único») y si esa forma de nombrarla cambia con el tiempo.',
];

export const POSICION = [
  'Soy Amelia, tengo 20 años y hago cosplay. No miro esta escena desde fuera: también escribí mi propia página en el diario. En el colegio viví un bullying muy fuerte por este tipo de intereses, y también he recibido acoso callejero y comentarios feos. Esa historia me acerca al tema y me ayuda a leer con empatía lo que cuentan las demás personas, pero también es un riesgo: puedo buscar en las entradas mi propia experiencia y darle más peso a lo que se parece a lo que yo viví.',
  'Además, yo diseñé el sitio y elegí las preguntas del formulario, así que la forma de las respuestas también depende de mí. Por ejemplo, la pregunta «¿Te consideras extraño o diferente al resto?» invita a usar palabras como «raro». Quienes escribieron son amistades y conocidos a quienes les compartí el enlace: es posible que escribieran pensando en mí como lectora, con más confianza para contar cosas íntimas, pero también desde un círculo parecido al mío. De hecho, siete de las nueve personas tienen 19 o 20 años.',
  'Mi nivel de participación es de observación participante: formo parte de la escena, comparto sus gustos y escribí mi entrada. Aun así, durante la observación no intervine en las páginas de nadie (el sitio no tiene comentarios ni mensajes): me limité a leer, registrar y analizar lo que cada persona decidió publicar.',
];

export const ENTRADA_TITULO = 'Entrada n.º 1 · La noche en que se llenó el diario';

export const DESCRIPCION = [
  'Compartí el enlace del diario y, en poco más de tres horas, nueve personas escribieron su página. Siete llegaron casi juntas, en apenas diecisiete minutos (de 20:19 a 20:36); después llegaron Val, a las 21:18, y J, a las 23:26. Cuatro personas editaron su entrada justo después de publicarla, como quien relee una carta antes de cerrarla.',
  'Quiénes estaban: casi todas las personas tienen entre 19 y 23 años; la excepción es Ceci, con 55. Los pronombres son variados: cuatro personas usan «ella», tres «él», una «elle» y otra «ella, él». Los intereses van del cosplay al anime, el manga, el k-pop y vocaloid, los videojuegos (Undertale, juegos gacha, Valorant), FNAFHS, los creepypastas, los superhéroes, Star Wars, los musicales, la historia, la ciencia y el mundo de Harry Potter.',
  'Cómo interactuaban: en el sitio nadie puede comentar ni responder, así que la interacción es indirecta. Las páginas se responden entre sí sin saberlo: dos personas escriben sobre cosplay, dos sobre FNAFHS, y muchas repiten las mismas palabras («colegio», «amistades», «raro») sin haber leído las demás. La escena es asíncrona y silenciosa, pero tiene un tono compartido: confesión, humor y orgullo.',
];

export const SENSORIAL = [
  'En una escena virtual no hay olores ni ruido: todo pasa en una pantalla. Lo sensorial está en la textura del texto y de las imágenes. Ocho de las nueve personas subieron una fotografía y la encuadraron a su manera; solo una prefirió no mostrar imagen.',
  'Los textos tienen ritmos muy distintos: frases cortas, casi de chat («La vrd, solo en el colegio, actualmente no»), y párrafos largos como confesiones. Hay oralidad escrita: abreviaturas, alguna grosería, una carita «:]», un «ifkyk» y unos pronombres con humor: «Ella (y señorona también)».',
  'El papel crema, la cinta adhesiva y las letras manuscritas del sitio hacen que todo parezca un cuaderno que pasa de mano en mano. Si la escena tuviera sonido, sería el de teclear de noche y el silencio de releer antes de publicar.',
];

export const IMPRESIONES = [
  'Lo primero que sentí fue reconocimiento: muchas historias se parecen a la mía. Me sorprendió que casi nadie contara una burla aislada: lo que describen es un ambiente, el del colegio, donde había que esconder lo que te gustaba para encajar.',
  'Me dolió leer el acoso que Sarvente vivió en un evento de cosplay, porque se parece al acoso que yo también he recibido. Ahí entendí que los espacios donde encontramos comunidad también pueden ser peligrosos, sobre todo para quienes hacemos cosplay.',
  'Me alegró la página de Ceci, que con 55 años rompe la idea de que esto es «cosa de niños», y me pareció importante que una persona dijera que no tenía nada negativo que contar: el diario no obliga a tener una historia triste para pertenecer.',
];

export interface Cita {
  texto: string;
  autor: string;
  color: 'lavender' | 'sage' | 'blue' | 'pink';
}

export const CITAS: Cita[] = [
  { texto: 'Solo se tu mismo, to be cringe is to be free.', autor: 'Matu', color: 'lavender' },
  { texto: 'Soy muy rara para estar con los normales y a veces muy normal para encajar en los raritos.', autor: 'Ordinal', color: 'sage' },
  { texto: 'No creo que ser extraño sea malo, solo significa que eres unico.', autor: 'Sarvente', color: 'blue' },
  { texto: 'No hay edad para jugar, creer en la magia y disfrutar.', autor: 'Ceci', color: 'pink' },
  { texto: 'La gente es cruel con lo que no conoce y sobre todo los niños.', autor: 'Ordinal', color: 'lavender' },
  { texto: 'Soy más feliz yendo a la u con mis camisetas de anime.', autor: 'Matu', color: 'sage' },
  { texto: 'Creo que no encajo en todos lados, pero con las personas que quiero sí.', autor: 'Amelia', color: 'blue' },
  { texto: 'La vrd, solo en el colegio, actualmente no.', autor: 'Elantisocial', color: 'pink' },
];

export interface Categoria {
  titulo: string;
  frecuencia: string;
  descripcion: string[];
  quienes: string;
}

export const CATEGORIAS: Categoria[] = [
  {
    titulo: 'El colegio como escenario del rechazo',
    frecuencia: '7 de 9 entradas',
    descripcion: [
      'El colegio aparece en siete entradas, aunque el formulario nunca lo pregunta. Allí se concentran las burlas, la exclusión («me excluían de planes o actividades»), el robo de cuadernos y, sobre todo, la autocensura: tres personas cuentan que ocultaban o callaban sus gustos para encajar.',
      'Fuera del colegio, el rechazo cambia de forma: aparece en la familia (Val), en el acoso durante eventos o en la calle (Sarvente y yo, las dos cosplayers) y en la mirada adulta que considera infantil ciertos gustos (Ceci).',
    ],
    quienes: 'Elantisocial, Amelia, Matu, Christian, Ordinal, Val, J',
  },
  {
    titulo: 'La comunidad elegida',
    frecuencia: '7 de 9 entradas',
    descripcion: [
      'El interés funciona como puente: siete personas cuentan que gracias a él conocieron amistades, comunidades en línea, una pareja o incluso profesores con los que conectaron. La pertenencia no llega del grupo en el que «tocaba» estar, sino del grupo que se elige por afinidad.',
      'El interés también construye identidad y vocación: dibujar, cantar, animar o simplemente jugar aparecen como partes de quien cada persona es hoy. El cosplay muestra la paradoja de la escena: el mismo espacio que da amistades puede exponer al acoso.',
    ],
    quienes: 'Sarvente, Amelia, Matu, Christian, Ordinal, Val, J',
  },
  {
    titulo: 'Resignificar lo raro',
    frecuencia: '7 de 9 se sienten diferentes; 2 dicen que ya no',
    descripcion: [
      'Siete personas dicen sentirse diferentes en alguna medida, pero la palabra «raro» cambia de signo: de insulto pasa a ser algo que se dice con orgullo («solo significa que eres único», «to be cringe is to be free»). Dos personas dicen que se sentían raras antes, pero ya no.',
      'El cambio suele tener un antes y un después: el «antes» es el colegio y el «ahora» es la comunidad elegida. El humor, la jerga compartida y los nombres que cada persona elige forman un código común que vincula a quienes escriben.',
    ],
    quienes: 'Sarvente, Amelia, Christian, Ordinal, Ceci, Val, J (y Elantisocial y Matu, que dicen haber dejado de sentirse así)',
  },
];

export const TEMAS_FRECUENTES = [
  { tema: 'El colegio como lugar de rechazo', veces: 7 },
  { tema: 'Amistades y comunidad gracias al interés', veces: 7 },
  { tema: 'Sentirse diferente o «raro»', veces: 7 },
  { tema: 'El interés como identidad o vocación', veces: 5 },
  { tema: 'Ocultar los gustos para encajar', veces: 3 },
  { tema: 'Burlas o acoso fuera del colegio (eventos, calle, familia)', veces: 3 },
];

export const CONCLUSION = [
  'Encontré una escena unida por una historia con forma parecida: un interés que en la infancia o el colegio marcó a la persona como «rara» y que, con el tiempo, se convirtió en la vía para encontrar a su gente. Los dos temas más frecuentes son, a la vez, opuestos y complementarios: el colegio como lugar del rechazo (7 de 9) y la amistad o la comunidad gracias al interés (7 de 9).',
  'Respondiendo a la pregunta de investigación, los intereses frikis cumplen un doble papel: son la marca de diferencia que se castiga en el colegio y, más tarde, la llave de la pertenencia. Lo que vincula a los sujetos no es tanto un gusto concreto (los intereses son muy variados) como la experiencia compartida de haber tenido que esconderlo y la decisión de dejar de hacerlo.',
  'Es una conclusión con límites: son nueve entradas, escritas en una sola noche por personas de mi círculo cercano, la mayoría de unos 20 años, y una de ellas es la mía.',
];

export const PREGUNTAS_PENDIENTES = [
  '¿Cómo se vive el acoso en las convenciones y eventos de cosplay? ¿Hay diferencias según el género o los pronombres?',
  '¿Cambia la experiencia con la edad? La página de Ceci sugiere que el rechazo adulto es otro tipo de mirada.',
  '¿Qué cuentan personas que no son de mi círculo? Me gustaría difundir el diario más allá de mis amistades.',
  '¿Qué papel tienen las comunidades en línea frente a las presenciales?',
  '¿Por qué el colegio aparece tanto aunque nadie lo pregunte? ¿Qué cambia al salir de él?',
];

export const PROCESO = [
  'Observar una escena virtual fue distinto de lo que esperaba. No había cuerpos, gestos ni voces: solo lo que cada persona decidió escribir y mostrar. Eso me obligó a fijarme en detalles pequeños, como el ritmo de los textos, las palabras repetidas, las horas de publicación o quién eligió no subir foto.',
  'El mayor reto fue emocional. Varias personas son cercanas a mí, y leer el bullying o el acoso que vivieron fue difícil. También tuve que cuidar no leer las entradas solo desde mi propia historia y volver a ellas para ver lo que de verdad decían.',
  'Me sorprendió la rapidez con la que la gente escribió (siete entradas en diecisiete minutos), lo largas y sinceras que fueron algunas respuestas, y que el colegio apareciera tanto sin que nadie lo preguntara. No estaba preparada para la parte técnica: tuve que pensar en la privacidad, en los seudónimos y en separar las entradas de ejemplo ficticias de las reales.',
  'En una próxima observación ampliaría la muestra fuera de mi círculo, pediría consentimiento explícito para citar las entradas, añadiría preguntas sobre los lugares concretos de las experiencias y complementaría el diario virtual con una observación presencial, por ejemplo en una convención.',
];

export const NOTA_ETICA =
  'Todas las entradas citadas son públicas en el sitio y aparecen con el seudónimo que cada persona eligió. No incluyo ningún dato personal adicional. Las entradas de ejemplo del sitio eran ficticias y no forman parte de este análisis.';
