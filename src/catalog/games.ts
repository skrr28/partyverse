/** Catálogo de PARTYVERSE: ambientes, categorías y juegos. */
import * as P from '../content/prompts.ts';
import * as G from '../content/guess.ts';
import * as Q from '../content/quiz.ts';
import { DEFAULT_WHEEL, IMPOSTOR_WORDS, SPEED_CATEGORIES, STOP_CATEGORIES } from '../content/misc.ts';
import type { AmbienteId, CategoryId, GameDef, UpcomingGame } from './types.ts';

export const AMBIENTES: { id: AmbienteId; emoji: string; label: string; hint: string }[] = [
  { id: 'fiesta', emoji: '🎉', label: 'Fiesta', hint: 'Energía, retos y risas' },
  { id: 'risa', emoji: '😂', label: 'Pura risa', hint: 'Lo más gracioso' },
  { id: 'creatividad', emoji: '🎭', label: 'Creatividad y charadas', hint: 'Actuar, dibujar, inventar' },
  { id: 'mente', emoji: '🧠', label: 'Inteligencia y deducción', hint: 'Trivia, lógica, impostores' },
  { id: 'competencia', emoji: '🏆', label: 'Competencia', hint: 'Puntos y duelos' },
  { id: 'conocerse', emoji: '💬', label: 'Para conocerse', hint: 'Romper el hielo' },
  { id: 'parejas', emoji: '❤️', label: 'Parejas', hint: 'Conexión y complicidad' },
  { id: 'familiar', emoji: '👨‍👩‍👧', label: 'Familiar', hint: 'Para todas las edades' },
  { id: 'adultos', emoji: '🌶️', label: 'Adultos +18', hint: 'Atrevido, nunca obligatorio' },
];

export const CATEGORIES: { id: CategoryId; emoji: string; label: string }[] = [
  { id: 'charadas', emoji: '🎭', label: 'Charadas y mímica' },
  { id: 'verdad-reto', emoji: '🔥', label: 'Verdad o reto' },
  { id: 'mas-probable', emoji: '👉', label: '¿Quién es más probable?' },
  { id: 'trivia', emoji: '🧠', label: 'Trivia' },
  { id: 'impostor', emoji: '🕵️', label: 'Impostor y deducción' },
  { id: 'palabras', emoji: '🔤', label: 'Palabras y velocidad' },
  { id: 'ruleta', emoji: '🎡', label: 'Ruleta' },
  { id: 'minijuegos', emoji: '🎮', label: 'Minijuegos' },
  { id: 'conocerse', emoji: '💬', label: 'Para conocerse' },
  { id: 'parejas-familia', emoji: '❤️', label: 'Parejas y familia' },
];

/** Une paquetes eliminando entradas repetidas. */
function uniqueBy<T>(items: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((x) => (seen.has(key(x)) ? false : (seen.add(key(x)), true)));
}

const guessRules = (extra: string) => [
  'Pasa el móvil a quien le toca actuar; nadie más debe mirar.',
  extra,
  'Pulsa «Acertado» cuando alguien adivine y «Pasar» para saltar.',
  'Cada acierto suma 100 puntos al actor (o a su equipo).',
];

const promptRules = (extra: string) => [
  'Por turnos, cada jugador recibe una tarjeta.',
  extra,
  'Siempre puedes pasar sin penalización.',
];

export const GAMES: GameDef[] = [
  // ───────────── A. Charadas y mímica ─────────────
  {
    id: 'charadas', title: 'Charadas clásicas', emoji: '🎭', category: 'charadas', popular: true,
    description: 'Actúa sin hablar y que tu equipo adivine antes de que acabe el tiempo.',
    rules: guessRules('Solo gestos: sin palabras ni sonidos.'),
    ambientes: ['fiesta', 'risa', 'creatividad', 'familiar'], minPlayers: 3, maxPlayers: 20, minutes: 15, mode: 'local',
    config: { engine: 'guess', data: { pack: G.CLASSIC_CHARADES, style: 'perform', howTo: 'Actúa sin hablar', defaultSeconds: 60, allowTeams: true } },
  },
  {
    id: 'peliculas', title: 'Adivina la película', emoji: '🎬', category: 'charadas', popular: true,
    description: 'Mímica de películas famosas.',
    rules: guessRules('Puedes indicar el número de palabras con los dedos.'),
    ambientes: ['fiesta', 'creatividad', 'familiar'], minPlayers: 3, maxPlayers: 20, minutes: 15, mode: 'local',
    config: { engine: 'guess', data: { pack: G.MOVIES, style: 'perform', howTo: 'Actúa la película sin hablar', defaultSeconds: 60, allowTeams: true } },
  },
  {
    id: 'series', title: 'Adivina la serie', emoji: '📺', category: 'charadas',
    description: 'De dibujos animados a series de culto.',
    rules: guessRules('Sin hablar; puedes señalar objetos.'),
    ambientes: ['fiesta', 'creatividad'], minPlayers: 3, maxPlayers: 20, minutes: 15, mode: 'local',
    config: { engine: 'guess', data: { pack: G.SERIES, style: 'perform', howTo: 'Actúa la serie sin hablar', defaultSeconds: 60, allowTeams: true } },
  },
  {
    id: 'personajes', title: 'Personajes famosos', emoji: '🦸', category: 'charadas',
    description: 'Héroes, villanos, artistas y figuras históricas.',
    rules: guessRules('Imita gestos, poses y frases (sin decir el nombre).'),
    ambientes: ['fiesta', 'risa', 'creatividad', 'familiar'], minPlayers: 3, maxPlayers: 20, minutes: 15, mode: 'local',
    config: { engine: 'guess', data: { pack: G.CHARACTERS, style: 'perform', howTo: 'Imita al personaje sin decir su nombre', defaultSeconds: 60, allowTeams: true } },
  },
  {
    id: 'animales-objetos', title: 'Animales y objetos', emoji: '🐘', category: 'charadas',
    description: 'Ideal para niños y familias.',
    rules: guessRules('Puedes hacer sonidos, pero no decir palabras.'),
    ambientes: ['familiar', 'risa', 'creatividad'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'guess', data: { pack: G.ANIMALS_OBJECTS, style: 'perform', howTo: 'Imítalo con gestos y sonidos', defaultSeconds: 45, allowTeams: true } },
  },
  {
    id: 'profesiones', title: 'Profesiones', emoji: '👩‍🚒', category: 'charadas',
    description: '¿Quién eres? ¿Qué haces todo el día?',
    rules: guessRules('Actúa un día de trabajo.'),
    ambientes: ['familiar', 'creatividad'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'guess', data: { pack: G.PROFESSIONS, style: 'perform', howTo: 'Actúa la profesión sin hablar', defaultSeconds: 45, allowTeams: true } },
  },
  {
    id: 'acciones-imposibles', title: 'Acciones imposibles', emoji: '🦖', category: 'charadas', isNew: true,
    description: 'Peinar a un león, montar un dinosaurio… ¡actúalo!',
    rules: guessRules('Cuanto más exagerado, mejor.'),
    ambientes: ['risa', 'fiesta', 'creatividad'], minPlayers: 3, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'guess', data: { pack: G.IMPOSSIBLE_ACTIONS, style: 'perform', howTo: 'Actúa la escena sin hablar', defaultSeconds: 60, allowTeams: true } },
  },
  {
    id: 'palabras-prohibidas', title: 'Palabras prohibidas', emoji: '🚫', category: 'charadas', popular: true,
    description: 'Describe la palabra sin usar las prohibidas.',
    rules: guessRules('Puedes hablar, pero no decir la palabra ni las prohibidas. Si se te escapa, pulsa «Pasar».'),
    ambientes: ['fiesta', 'competencia', 'mente'], minPlayers: 3, maxPlayers: 20, minutes: 15, mode: 'local',
    config: { engine: 'guess', data: { pack: G.TABOO, style: 'perform', howTo: 'Descríbela sin usar las palabras prohibidas', defaultSeconds: 60, allowTeams: true } },
  },
  {
    id: 'mimica-equipos', title: 'Mímica por equipos', emoji: '👯', category: 'charadas',
    description: 'Dos equipos, turnos alternos y marcador.',
    rules: guessRules('Los equipos se alternan; gana quien sume más aciertos.'),
    ambientes: ['fiesta', 'competencia', 'familiar'], minPlayers: 4, maxPlayers: 20, minutes: 20, mode: 'local',
    config: { engine: 'guess', data: { pack: uniqueBy([...G.CLASSIC_CHARADES, ...G.MOVIES, ...G.CHARACTERS], (x) => x.word), style: 'perform', howTo: 'Actúa sin hablar', defaultSeconds: 60, allowTeams: true } },
  },
  {
    id: 'dibujar', title: 'Dibujar y adivinar', emoji: '🎨', category: 'charadas',
    description: 'Dibuja en papel lo que te toque; sin letras ni números.',
    rules: guessRules('Dibuja en papel o en otro dispositivo, sin escribir letras.'),
    ambientes: ['creatividad', 'familiar', 'risa'], minPlayers: 3, maxPlayers: 20, minutes: 15, mode: 'local',
    config: { engine: 'guess', data: { pack: G.DRAWING, style: 'perform', howTo: 'Dibújalo sin letras ni números', defaultSeconds: 75, allowTeams: true } },
  },
  {
    id: 'adivinanzas', title: 'Adivinanzas con pistas', emoji: '❓', category: 'charadas',
    description: 'Adivinanzas tradicionales para todo el grupo.',
    rules: ['La adivinanza se muestra a todos.', 'Quien adivine primero gana 100 puntos.', 'Pulsa «Ver respuesta» si nadie la saca.'],
    ambientes: ['familiar', 'mente'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'guess', data: { pack: G.RIDDLES, style: 'clue', howTo: 'Lee la adivinanza en voz alta', defaultSeconds: 45, allowTeams: false } },
  },
  {
    id: 'emojis', title: 'Adivina con emojis', emoji: '😎', category: 'charadas', popular: true, isNew: true,
    description: '¿Qué película se esconde detrás de estos emojis?',
    rules: ['Los emojis se muestran a todos.', 'Quien adivine primero gana 100 puntos.', 'Pulsa «Ver respuesta» si nadie la saca.'],
    ambientes: ['risa', 'fiesta', 'familiar', 'mente'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'guess', data: { pack: G.EMOJI_CLUES, style: 'clue', howTo: 'Muestra los emojis a todos', defaultSeconds: 30, allowTeams: false } },
  },
  {
    id: 'contrarreloj', title: 'Adivina la palabra', emoji: '⏱️', category: 'charadas',
    description: 'Describe con palabras tantas como puedas antes de que acabe el tiempo.',
    rules: guessRules('Puedes hablar, pero no decir la palabra ni partes de ella.'),
    ambientes: ['competencia', 'fiesta'], minPlayers: 3, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'guess', data: { pack: G.QUICK_WORDS, style: 'perform', howTo: 'Descríbela sin decirla', defaultSeconds: 45, allowTeams: true } },
  },

  // ───────────── B. Verdad o reto ─────────────
  {
    id: 'verdad-reto', title: 'Verdad o reto', emoji: '🔥', category: 'verdad-reto', popular: true,
    description: 'Elige verdad o reto. Tres niveles de intensidad.',
    rules: promptRules('Antes de tu tarjeta eliges «Verdad» o «Reto». Cumplir suma 100 puntos.'),
    ambientes: ['fiesta', 'risa', 'conocerse'], minPlayers: 2, maxPlayers: 20, minutes: 20, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.TRUTH_DARE, truthOrDare: true, points: 100, allowCustom: true, levels: [1, 2], doneLabel: 'Cumplido' } },
  },
  {
    id: 'verdad-reto-adultos', title: 'Verdad o reto +18', emoji: '🌶️', category: 'verdad-reto', adult: true,
    description: 'Versión atrevida para adultos. Nadie está obligado a nada.',
    rules: promptRules('Contenido para mayores de 18 años. Respeta los límites de cada persona.'),
    ambientes: ['adultos', 'parejas'], minPlayers: 2, maxPlayers: 20, minutes: 20, mode: 'local',
    config: { engine: 'prompts', data: { pack: [...P.TRUTH_DARE.filter((x) => x.level === 2), ...P.TRUTH_DARE_ADULT], truthOrDare: true, points: 100, allowCustom: true, levels: [2, 3], doneLabel: 'Cumplido' } },
  },
  {
    id: 'retos-creativos', title: 'Retos creativos', emoji: '💡', category: 'verdad-reto',
    description: 'Inventa, actúa y sorprende.',
    rules: promptRules('El grupo decide si el reto se cumplió. Suma 100 puntos.'),
    ambientes: ['creatividad', 'fiesta', 'risa'], minPlayers: 2, maxPlayers: 20, minutes: 15, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.CREATIVE_DARES, points: 100, allowCustom: true, doneLabel: 'Cumplido' } },
  },

  // ───────────── C. ¿Quién es más probable? ─────────────
  {
    id: 'mas-probable-online', title: '¿Quién es más probable…? (en línea)', emoji: '👉', category: 'mas-probable', popular: true,
    description: 'Cada uno vota en secreto desde su móvil. Revelación simultánea.',
    rules: ['Crea una sala con contraseña y comparte el código.', 'Vota en secreto; nadie ve los votos hasta el cierre.', '100 por voto válido, +50 si eliges a la persona más votada.'],
    ambientes: ['fiesta', 'risa', 'conocerse', 'competencia'], minPlayers: 3, maxPlayers: 12, minutes: 10, mode: 'online',
    config: { engine: 'online', data: { mode: 'most_likely' } },
  },

  // ───────────── D. Trivia ─────────────
  ...([
    ['trivia-general', 'Cultura general', '🌍', Q.GENERAL, true],
    ['trivia-musica', 'Trivia de música', '🎵', Q.MUSIC, false],
    ['trivia-pantalla', 'Películas y series', '🍿', Q.SCREEN, true],
    ['trivia-deportes', 'Deportes', '⚽', Q.SPORTS, false],
    ['trivia-historia', 'Historia', '🏛️', Q.HISTORY, false],
    ['trivia-geografia', 'Geografía', '🗺️', Q.GEOGRAPHY, false],
    ['trivia-ciencia', 'Ciencia', '🔬', Q.SCIENCE, false],
    ['trivia-absurda', 'Preguntas absurdas', '🤪', Q.ABSURD, false],
    ['trivia-peru', 'Perú y Latinoamérica', '🇵🇪', Q.PERU_LATAM, true],
  ] as const).map(([id, title, emoji, pack, popular]): GameDef => ({
    id, title, emoji, category: 'trivia', popular,
    isNew: id === 'trivia-peru',
    description: `Preguntas de ${title.toLowerCase()} con temporizador y explicación.`,
    rules: ['Por turnos: pasa el móvil al jugador que responde.', '20 segundos por pregunta.', 'Acierto: 100 puntos + hasta 50 por rapidez.'],
    ambientes: ['mente', 'competencia', 'familiar'], minPlayers: 1, maxPlayers: 12, minutes: 10, mode: 'local',
    config: { engine: 'quiz', data: { pack: [...pack] } },
  })),
  {
    id: 'trivia-mix', title: 'Trivia mezclada', emoji: '🧩', category: 'trivia', popular: true,
    description: 'Preguntas de todas las categorías.',
    rules: ['Por turnos: pasa el móvil al jugador que responde.', '20 segundos por pregunta.', 'Acierto: 100 puntos + hasta 50 por rapidez.'],
    ambientes: ['mente', 'competencia', 'fiesta'], minPlayers: 1, maxPlayers: 12, minutes: 15, mode: 'local',
    config: { engine: 'quiz', data: { pack: uniqueBy([...Q.GENERAL, ...Q.MUSIC, ...Q.SCREEN, ...Q.SPORTS, ...Q.HISTORY, ...Q.GEOGRAPHY, ...Q.SCIENCE, ...Q.ABSURD, ...Q.PERU_LATAM], (x) => x.q) } },
  },

  // ───────────── E. Impostor ─────────────
  {
    id: 'impostor', title: 'El impostor', emoji: '🕵️', category: 'impostor', popular: true, isNew: true,
    description: 'Todos comparten una palabra… menos el impostor. ¡Descúbrelo!',
    rules: [
      'Cada jugador ve su rol en privado, pasándose el móvil.',
      'Por turnos digan una palabra relacionada sin revelarla.',
      'Voten en secreto a quien crean impostor.',
      'Si lo descubren, el grupo gana. Si escapa, gana el impostor.',
    ],
    ambientes: ['mente', 'fiesta', 'competencia'], minPlayers: 3, maxPlayers: 15, minutes: 10, mode: 'local',
    config: { engine: 'impostor', data: { packs: IMPOSTOR_WORDS } },
  },

  // ───────────── F. Palabras y velocidad ─────────────
  {
    id: 'basta', title: 'Basta / Stop', emoji: '✋', category: 'palabras', popular: true,
    description: 'Letra al azar y categorías contra reloj. Papel y lápiz.',
    rules: ['Sale una letra al azar.', 'Escriban en papel una palabra por categoría que empiece con esa letra.', 'Al terminar el tiempo, sumen 10 por respuesta única y 5 si se repite.'],
    ambientes: ['mente', 'competencia', 'familiar'], minPlayers: 2, maxPlayers: 20, minutes: 15, mode: 'local',
    config: { engine: 'letter', data: { categories: STOP_CATEGORIES, defaultSeconds: 90 } },
  },
  {
    id: 'categorias-reloj', title: 'Categorías contra reloj', emoji: '⏳', category: 'palabras',
    description: 'Una letra, categorías rápidas, ¡30 segundos!',
    rules: ['Sale una letra y las categorías.', 'Respondan en voz alta o en papel antes de que acabe el tiempo.', 'Anoten los puntos de cada uno.'],
    ambientes: ['competencia', 'mente', 'fiesta'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'letter', data: { categories: SPEED_CATEGORIES, defaultSeconds: 30 } },
  },
  {
    id: 'encadenadas', title: 'Palabras encadenadas', emoji: '🔗', category: 'palabras',
    description: 'Encadenen palabras siguiendo la regla. Quien se traba, pierde el turno.',
    rules: promptRules('Sigan la cadena en voz alta. Quien no falle en su ronda suma 50 puntos.'),
    ambientes: ['mente', 'familiar', 'competencia'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.WORD_CHAIN, points: 50, doneLabel: 'Lo logró' } },
  },
  {
    id: 'no-digas', title: 'No digas esa palabra', emoji: '🤐', category: 'palabras', isNew: true,
    description: 'Habla 30 segundos sin decir la palabra prohibida.',
    rules: promptRules('El grupo vigila. Si lo logras, sumas 100.'),
    ambientes: ['risa', 'fiesta', 'competencia'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.NO_SAY, points: 100, doneLabel: 'Lo logró' } },
  },
  {
    id: 'rimas', title: 'Rimas rápidas', emoji: '🎤', category: 'palabras',
    description: 'Tres rimas en diez segundos.',
    rules: promptRules('Si consigues tres rimas a tiempo, sumas 100.'),
    ambientes: ['creatividad', 'risa', 'competencia'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.RHYMES, points: 100, doneLabel: 'Lo logró' } },
  },
  {
    id: 'completa-frase', title: 'Completa la frase', emoji: '✍️', category: 'palabras',
    description: 'Las respuestas más ingeniosas ganan.',
    rules: promptRules('El grupo decide si la respuesta merece los 100 puntos.'),
    ambientes: ['risa', 'creatividad', 'conocerse'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.COMPLETE_PHRASE, points: 100, doneLabel: '¡Genial!' } },
  },
  {
    id: 'trabalenguas', title: 'Batalla de trabalenguas', emoji: '👅', category: 'palabras',
    description: 'Dilo rápido y sin trabarte.',
    rules: promptRules('Léelo en voz alta tres veces seguidas. Sin errores: 100 puntos.'),
    ambientes: ['risa', 'familiar', 'competencia'], minPlayers: 1, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.TONGUE_TWISTERS, points: 100, doneLabel: 'Sin trabarse' } },
  },
  {
    id: 'memoria-palabras', title: 'Memoria de palabras', emoji: '🧠', category: 'palabras',
    description: 'La lista crece en cada turno. ¿Quién la recuerda entera?',
    rules: promptRules('Repite la lista completa y añade una palabra. Si lo logras, sumas 50.'),
    ambientes: ['mente', 'familiar'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.WORD_MEMORY, points: 50, doneLabel: 'La recordó' } },
  },

  // ───────────── G. Ruleta ─────────────
  {
    id: 'ruleta', title: 'Ruleta PARTYVERSE', emoji: '🎡', category: 'ruleta', popular: true,
    description: 'Gira la ruleta y cumple lo que salga. Crea tus propias ruletas.',
    rules: ['Gira la ruleta en tu turno.', 'Cumple lo que salga.', 'Puedes editar las opciones y guardar tus ruletas favoritas.'],
    ambientes: ['fiesta', 'risa', 'familiar', 'competencia', 'creatividad'], minPlayers: 1, maxPlayers: 20, minutes: 15, mode: 'local',
    config: { engine: 'wheel', data: { options: DEFAULT_WHEEL } },
  },

  // ───────────── H. Minijuegos ─────────────
  {
    id: 'ppt', title: 'Piedra, papel o tijera', emoji: '✊', category: 'minijuegos',
    description: 'Duelo al mejor de tres, eligiendo en secreto.',
    rules: ['Elige dos jugadores.', 'Cada uno elige en secreto pasándose el móvil.', 'Gana el primero en llegar a 2 victorias (+100 puntos).'],
    ambientes: ['competencia', 'familiar'], minPlayers: 2, maxPlayers: 20, minutes: 5, mode: 'local',
    config: { engine: 'rps' },
  },
  {
    id: 'adivina-numero', title: 'Adivina el número', emoji: '🔢', category: 'minijuegos',
    description: 'Número secreto del 1 al 100. Pistas de mayor o menor.',
    rules: ['Por turnos, cada jugador propone un número.', 'La app dice si el secreto es mayor o menor.', 'Quien lo adivina gana 100 puntos.'],
    ambientes: ['mente', 'familiar', 'competencia'], minPlayers: 1, maxPlayers: 20, minutes: 5, mode: 'local',
    config: { engine: 'number' },
  },
  {
    id: 'cara-cruz', title: 'Cara o cruz', emoji: '🪙', category: 'minijuegos',
    description: 'Apuesta cara o cruz y lanza la moneda.',
    rules: ['Cada jugador apuesta cara o cruz.', 'Se lanza la moneda (aleatoria de verdad).', 'Quien acierta suma 50 puntos.'],
    ambientes: ['competencia', 'familiar', 'fiesta'], minPlayers: 1, maxPlayers: 20, minutes: 5, mode: 'local',
    config: { engine: 'coin' },
  },
  {
    id: 'mayor-menor', title: 'Mayor o menor', emoji: '🃏', category: 'minijuegos', isNew: true,
    description: '¿La próxima carta será mayor o menor? Racha de aciertos.',
    rules: ['En tu turno, adivina si la próxima carta es mayor o menor.', 'Cada acierto suma 20 × tu racha.', 'Un fallo termina tu turno.'],
    ambientes: ['competencia', 'familiar'], minPlayers: 1, maxPlayers: 20, minutes: 5, mode: 'local',
    config: { engine: 'highlow' },
  },
  {
    id: 'reflejos', title: 'Reflejos rápidos', emoji: '⚡', category: 'minijuegos', popular: true,
    description: 'Toca cuando la pantalla se ponga verde. ¡Sin adelantarte!',
    rules: ['Por turnos, espera a que la pantalla cambie a verde.', 'Toca lo más rápido posible.', 'Si tocas antes, pierdes el intento.', 'El más rápido gana 150 puntos.'],
    ambientes: ['competencia', 'fiesta', 'familiar'], minPlayers: 1, maxPlayers: 20, minutes: 5, mode: 'local',
    config: { engine: 'reflex' },
  },
  {
    id: 'memoria-visual', title: 'Memoria visual', emoji: '🟣', category: 'minijuegos',
    description: 'Repite la secuencia de colores. Cada vez es más larga.',
    rules: ['Observa la secuencia de colores.', 'Repítela tocando los botones.', '10 puntos por cada paso que recuerdes.'],
    ambientes: ['mente', 'competencia', 'familiar'], minPlayers: 1, maxPlayers: 20, minutes: 5, mode: 'local',
    config: { engine: 'memory' },
  },
  {
    id: 'predice-grupo', title: 'Predice al grupo', emoji: '🔮', category: 'minijuegos',
    description: '¿Conoces a tu grupo? Predice y comprueben.',
    rules: promptRules('Predice en voz alta y luego voten. Si aciertas, sumas 100.'),
    ambientes: ['conocerse', 'fiesta', 'mente'], minPlayers: 3, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.GROUP_PREDICT, points: 100, doneLabel: 'Acertó' } },
  },

  // ───────────── I. Para conocerse ─────────────
  {
    id: 'dos-verdades', title: 'Dos verdades y una mentira', emoji: '🤥', category: 'conocerse', popular: true,
    description: 'Di tres cosas sobre ti. ¿Cuál es mentira?',
    rules: promptRules('Si nadie descubre tu mentira, sumas 100.'),
    ambientes: ['conocerse', 'fiesta', 'parejas'], minPlayers: 3, maxPlayers: 20, minutes: 15, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.TWO_TRUTHS_TOPICS, points: 100, doneLabel: 'Engañó a todos' } },
  },
  {
    id: 'rompehielo', title: 'Preguntas rompehielo', emoji: '🧊', category: 'conocerse',
    description: 'Preguntas ligeras para empezar a conversar.',
    rules: promptRules('Responde a tu tarjeta y, si quieres, pregunta lo mismo a otro.'),
    ambientes: ['conocerse', 'familiar'], minPlayers: 2, maxPlayers: 20, minutes: 15, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.ICEBREAKERS, points: 0, allowCustom: true, doneLabel: 'Respondida' } },
  },
  {
    id: 'que-prefieres', title: '¿Qué prefieres?', emoji: '⚖️', category: 'conocerse', popular: true,
    description: 'Dilemas imposibles para debatir.',
    rules: promptRules('Elige y defiende tu respuesta. El resto vota si convenciste.'),
    ambientes: ['conocerse', 'risa', 'familiar', 'fiesta'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.WOULD_YOU_RATHER, points: 0, allowCustom: true, doneLabel: 'Siguiente' } },
  },
  {
    id: 'inesperadas', title: 'Preguntas inesperadas', emoji: '🌀', category: 'conocerse', isNew: true,
    description: 'Preguntas raras que dan respuestas geniales.',
    rules: promptRules('Responde sin pensarlo demasiado.'),
    ambientes: ['conocerse', 'risa', 'creatividad'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.UNEXPECTED, points: 0, doneLabel: 'Respondida' } },
  },
  {
    id: 'algo-en-comun', title: 'Encuentra algo en común', emoji: '🤝', category: 'conocerse',
    description: 'Retos para descubrir lo que comparten.',
    rules: promptRules('Si el grupo lo consigue, quien sacó la tarjeta suma 50.'),
    ambientes: ['conocerse', 'familiar'], minPlayers: 3, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.COMMON_GROUND, points: 50, doneLabel: '¡Lo encontraron!' } },
  },
  {
    id: 'historias', title: 'Historias improvisadas', emoji: '📖', category: 'conocerse',
    description: 'Una historia colectiva, frase por frase.',
    rules: promptRules('Quien saca la tarjeta empieza y cada uno añade una frase.'),
    ambientes: ['creatividad', 'risa', 'familiar'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.STORY_STARTS, points: 0, doneLabel: 'Fin de la historia' } },
  },
  {
    id: 'presentaciones', title: 'Rondas de presentación', emoji: '👋', category: 'conocerse',
    description: 'Formas divertidas de presentarse.',
    rules: promptRules('Cada uno se presenta siguiendo la tarjeta.'),
    ambientes: ['conocerse'], minPlayers: 2, maxPlayers: 20, minutes: 10, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.INTRO_ROUNDS, points: 0, doneLabel: 'Siguiente' } },
  },

  // ───────────── J. Parejas y familia ─────────────
  {
    id: 'pareja-conexion', title: 'Conexión en pareja', emoji: '💞', category: 'parejas-familia',
    description: 'Preguntas para conversar y conocerse más.',
    rules: promptRules('Respondan con calma y escuchen al otro.'),
    ambientes: ['parejas'], minPlayers: 2, maxPlayers: 2, minutes: 20, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.COUPLES_CONNECTION, points: 0, allowCustom: true, doneLabel: 'Siguiente' } },
  },
  {
    id: 'pareja-compatibilidad', title: 'Compatibilidad', emoji: '💘', category: 'parejas-familia',
    description: '¿Responden lo mismo? Cuenten a la vez: 3, 2, 1…',
    rules: promptRules('Respondan a la vez. Si coinciden, ambos suman 100.'),
    ambientes: ['parejas'], minPlayers: 2, maxPlayers: 2, minutes: 15, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.COUPLES_COMPAT, points: 100, doneLabel: '¡Coincidimos!' } },
  },
  {
    id: 'familia', title: 'Noche en familia', emoji: '👨‍👩‍👧', category: 'parejas-familia',
    description: 'Anécdotas, tradiciones y risas para todas las edades.',
    rules: promptRules('Respondan o realicen la tarjeta entre todos.'),
    ambientes: ['familiar'], minPlayers: 2, maxPlayers: 20, minutes: 20, mode: 'local',
    config: { engine: 'prompts', data: { pack: P.FAMILY, points: 0, allowCustom: true, doneLabel: 'Siguiente' } },
  },
];

export const UPCOMING: UpcomingGame[] = [
  { title: 'Batalla relámpago (en línea)', emoji: '⚡', category: 'minijuegos' },
  { title: '¿Cuánto me conoces? (en línea)', emoji: '🫶', category: 'conocerse' },
  { title: 'Impostor en línea', emoji: '🕵️', category: 'impostor' },
  { title: 'Trivia en línea con ranking', emoji: '🏆', category: 'trivia' },
  { title: 'Adivina quién lo dijo', emoji: '🗨️', category: 'conocerse' },
  { title: 'Duelo de emojis', emoji: '😜', category: 'minijuegos' },
];

const BY_ID = new Map(GAMES.map((g) => [g.id, g]));
export const gameById = (id: string) => BY_ID.get(id);

export interface GameFilter {
  ambiente?: AmbienteId | null;
  category?: CategoryId | null;
  players?: number | null;
  query?: string;
  includeAdult?: boolean;
}

/** Filtra el catálogo. El contenido +18 solo aparece si se pide explícitamente. */
export function filterGames(games: readonly GameDef[], f: GameFilter): GameDef[] {
  const query = (f.query ?? '').trim().toLowerCase();
  return games.filter((g) => {
    if (g.adult && !f.includeAdult) return false;
    if (f.ambiente && !g.ambientes.includes(f.ambiente)) return false;
    if (f.category && g.category !== f.category) return false;
    if (f.players && (f.players < g.minPlayers || f.players > g.maxPlayers)) return false;
    if (query && !`${g.title} ${g.description}`.toLowerCase().includes(query)) return false;
    return true;
  });
}

/** Recomendados: encajan con el grupo y el ambiente; populares primero. */
export function recommend(games: readonly GameDef[], ambiente: AmbienteId | null, players: number, includeAdult: boolean): GameDef[] {
  return filterGames(games, { ambiente, players, includeAdult })
    .slice()
    .sort((a, b) => Number(!!b.popular) - Number(!!a.popular) || Number(!!b.isNew) - Number(!!a.isNew))
    .slice(0, 6);
}
