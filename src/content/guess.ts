/** Palabras para charadas, mímica, dibujo y adivinanzas. */
import type { GuessWord } from '../catalog/types.ts';

const w = (list: string[], difficulty: 1 | 2 | 3 = 1): GuessWord[] => list.map((word) => ({ word, difficulty }));

export const CLASSIC_CHARADES: GuessWord[] = [
  ...w(['Lavarse los dientes', 'Conducir un auto', 'Pescar', 'Tocar la guitarra', 'Nadar', 'Cocinar huevos', 'Montar bicicleta', 'Bailar salsa', 'Tomarse una selfie', 'Cambiar un pañal', 'Jugar fútbol', 'Hacer surf', 'Pintar una pared', 'Abrir un paraguas', 'Patinar sobre hielo']),
  ...w(['Perder el bus', 'Pisar un chicle', 'Buscar señal de wifi', 'Ser picado por un mosquito', 'Despertar tarde para un examen', 'Hacer una tarta', 'Esquiar', 'Pasear a un perro desobediente', 'Desenredar audífonos', 'Atrapar una mosca'], 2),
  ...w(['Ser un astronauta en gravedad cero', 'Armar un mueble sin instrucciones', 'Domar un león', 'Hacer malabares con huevos', 'Escapar de un laberinto', 'Ganar un Óscar y llorar'], 3),
];

export const MOVIES: GuessWord[] = [
  ...w(['Titanic', 'El Rey León', 'Toy Story', 'Shrek', 'Harry Potter', 'Spider-Man', 'Buscando a Nemo', 'Frozen', 'Jurassic Park', 'Coco', 'Avatar', 'Batman', 'Cenicienta', 'Superman', 'Up', 'Cars', 'Ratatouille', 'Tiburón']),
  ...w(['Volver al futuro', 'El señor de los anillos', 'Piratas del Caribe', 'Matrix', 'Rápidos y furiosos', 'Mamma Mia', 'Mi pobre angelito', 'E.T.', 'Rocky', 'Intensamente', 'Barbie', 'Los Increíbles', 'Indiana Jones'], 2),
  ...w(['El origen', 'Forrest Gump', 'La La Land', 'Encanto', 'El Padrino', 'Interestelar', 'Titanes del Pacífico', 'Gravedad'], 3),
];

export const SERIES: GuessWord[] = [
  ...w(['Los Simpson', 'Friends', 'Bob Esponja', 'Stranger Things', 'El Chavo del 8', 'La casa de papel', 'Merlina', 'Pokémon', 'Dragon Ball', 'Peppa Pig', 'The Office', 'Los Picapiedra']),
  ...w(['Juego de tronos', 'Breaking Bad', 'Grey’s Anatomy', 'The Walking Dead', 'Narcos', 'Bridgerton', 'El juego del calamar', 'Lost', 'Dark', 'Élite'], 2),
  ...w(['The Crown', 'Black Mirror', 'Succession', 'The Mandalorian', 'Severance', 'The Last of Us'], 3),
];

export const CHARACTERS: GuessWord[] = [
  ...w(['Mickey Mouse', 'Mario Bros', 'Pikachu', 'Superman', 'La Mujer Maravilla', 'Batman', 'Goku', 'Elsa', 'Pinocho', 'Caperucita Roja', 'Drácula', 'Papá Noel', 'Sherlock Holmes', 'Robin Hood', 'Cleopatra']),
  ...w(['Napoleón', 'Einstein', 'Shakira', 'Messi', 'Frida Kahlo', 'Michael Jackson', 'Darth Vader', 'Hulk', 'Yoda', 'Don Quijote', 'Tarzán', 'El Principito'], 2),
  ...w(['Mozart', 'Gandhi', 'Marie Curie', 'Leonardo da Vinci', 'Charles Chaplin', 'Julio César', 'Atahualpa', 'Simón Bolívar'], 3),
];

export const ANIMALS_OBJECTS: GuessWord[] = [
  ...w(['Elefante', 'Canguro', 'Pingüino', 'Mono', 'Serpiente', 'Gallina', 'Pulpo', 'Jirafa', 'Llama', 'Cangrejo', 'Paraguas', 'Tijeras', 'Escoba', 'Lavadora', 'Reloj', 'Linterna', 'Martillo', 'Guitarra']),
  ...w(['Cóndor', 'Pez globo', 'Camaleón', 'Murciélago', 'Tortuga', 'Licuadora', 'Ascensor', 'Montaña rusa', 'Aspiradora', 'Semáforo', 'Hamaca', 'Trampolín'], 2),
  ...w(['Ornitorrinco', 'Pez espada', 'Molino de viento', 'Telescopio', 'Submarino', 'Cohete espacial'], 3),
];

export const PROFESSIONS: GuessWord[] = [
  ...w(['Doctor', 'Bombero', 'Policía', 'Profesor', 'Chef', 'Piloto', 'Peluquero', 'Futbolista', 'Cantante', 'Mesero', 'Pintor', 'Dentista', 'Mago', 'Cartero']),
  ...w(['Astronauta', 'Fotógrafo', 'Jardinero', 'Carpintero', 'Detective', 'Payaso', 'Veterinario', 'Salvavidas', 'DJ', 'Panadero'], 2),
  ...w(['Arqueólogo', 'Escultor', 'Ventrílocuo', 'Domador de leones', 'Controlador aéreo', 'Influencer'], 3),
];

export const IMPOSSIBLE_ACTIONS: GuessWord[] = w([
  'Peinar a un león', 'Bañar a un gato que no quiere', 'Bailar en la Luna', 'Cocinar en un barco con tormenta',
  'Dormir encima de una nube', 'Pelear con una almohada gigante', 'Nadar en gelatina', 'Montar un dinosaurio',
  'Atrapar un rayo', 'Ser perseguido por abejas', 'Comer sopa con tenedor', 'Patinar sobre mantequilla',
  'Cruzar un río saltando cocodrilos', 'Abrir un frasco imposible', 'Esconderse de un oso', 'Lanzar una pizza al espacio',
  'Volar con un paraguas', 'Bailar con un pulpo', 'Ordeñar una vaca dormida', 'Correr con zapatos de hielo',
], 2);

export const DRAWING: GuessWord[] = [
  ...w(['Casa', 'Sol', 'Árbol', 'Gato', 'Barco', 'Pizza', 'Helado', 'Avión', 'Flor', 'Pez', 'Corazón', 'Bicicleta', 'Montaña', 'Luna', 'Reloj']),
  ...w(['Arcoíris', 'Volcán', 'Castillo', 'Robot', 'Sirena', 'Dragón', 'Faro', 'Pirámide', 'Tren', 'Telaraña'], 2),
  ...w(['Machu Picchu', 'Torre Eiffel', 'Agujero negro', 'Viaje en el tiempo', 'Wifi', 'Sueño'], 3),
];

export const TABOO: GuessWord[] = [
  { word: 'Playa', forbidden: ['arena', 'mar', 'sol', 'vacaciones'] },
  { word: 'Pizza', forbidden: ['queso', 'Italia', 'masa', 'horno'] },
  { word: 'Fútbol', forbidden: ['pelota', 'gol', 'Messi', 'equipo'] },
  { word: 'Celular', forbidden: ['llamar', 'teléfono', 'pantalla', 'app'] },
  { word: 'Perro', forbidden: ['ladrar', 'mascota', 'gato', 'hueso'] },
  { word: 'Cumpleaños', forbidden: ['torta', 'velas', 'regalo', 'fiesta'] },
  { word: 'Navidad', forbidden: ['Papá Noel', 'diciembre', 'árbol', 'regalos'] },
  { word: 'Escuela', forbidden: ['profesor', 'clase', 'alumno', 'estudiar'] },
  { word: 'Cine', forbidden: ['película', 'pantalla', 'palomitas', 'butaca'] },
  { word: 'Hospital', forbidden: ['doctor', 'enfermo', 'ambulancia', 'cama'] },
  { word: 'Lluvia', forbidden: ['agua', 'paraguas', 'nube', 'mojado'] },
  { word: 'Avión', forbidden: ['volar', 'aeropuerto', 'piloto', 'viaje'] },
  { word: 'Café', forbidden: ['taza', 'mañana', 'negro', 'despertar'] },
  { word: 'Guitarra', forbidden: ['cuerdas', 'tocar', 'música', 'instrumento'] },
  { word: 'Ceviche', forbidden: ['pescado', 'limón', 'Perú', 'cebolla'] },
  { word: 'Dinosaurio', forbidden: ['extinto', 'T-Rex', 'jurásico', 'fósil'] },
  { word: 'Cocina', forbidden: ['cocinar', 'comida', 'horno', 'chef'] },
  { word: 'Gimnasio', forbidden: ['pesas', 'ejercicio', 'músculo', 'entrenar'] },
  { word: 'Boda', forbidden: ['novia', 'casarse', 'anillo', 'iglesia'] },
  { word: 'Vampiro', forbidden: ['sangre', 'colmillos', 'Drácula', 'noche'] },
  { word: 'Biblioteca', forbidden: ['libros', 'leer', 'silencio', 'prestar'] },
  { word: 'Helado', forbidden: ['frío', 'cono', 'sabor', 'verano'] },
  { word: 'Televisión', forbidden: ['ver', 'canal', 'control', 'programa'] },
  { word: 'Montaña rusa', forbidden: ['parque', 'subir', 'miedo', 'vagón'] },
  { word: 'Selfie', forbidden: ['foto', 'cámara', 'celular', 'cara'] },
].map((x) => ({ ...x, difficulty: 2 as const }));

export const EMOJI_CLUES: GuessWord[] = [
  { clue: '🦁👑', word: 'El Rey León' },
  { clue: '🚢🧊💔', word: 'Titanic' },
  { clue: '🐠🔍', word: 'Buscando a Nemo' },
  { clue: '❄️👸', word: 'Frozen' },
  { clue: '🕷️🧑', word: 'Spider-Man' },
  { clue: '🦖🏝️', word: 'Jurassic Park' },
  { clue: '🧙‍♂️⚡👓', word: 'Harry Potter' },
  { clue: '🏴‍☠️🌊🚢', word: 'Piratas del Caribe' },
  { clue: '🐀👨‍🍳', word: 'Ratatouille' },
  { clue: '🎈🏠👴', word: 'Up' },
  { clue: '💀🎸🌼', word: 'Coco' },
  { clue: '👽📞🏠', word: 'E.T.' },
  { clue: '⏰🚗⚡', word: 'Volver al futuro' },
  { clue: '🦇🧑', word: 'Batman' },
  { clue: '🧸🤠🚀', word: 'Toy Story' },
  { clue: '🟢👹💚', word: 'Shrek' },
  { clue: '🍫🏭🎩', word: 'Charlie y la fábrica de chocolate' },
  { clue: '💍🌋', word: 'El señor de los anillos' },
  { clue: '🧠😀😢😡', word: 'Intensamente' },
  { clue: '🏎️⚡', word: 'Cars' },
  { clue: '🦈🏖️', word: 'Tiburón' },
  { clue: '🧜‍♀️🌊🦀', word: 'La sirenita' },
  { clue: '👸🍎😴', word: 'Blancanieves' },
  { clue: '🐼🥋', word: 'Kung Fu Panda' },
  { clue: '🌮🇲🇽🎸', word: 'El Mariachi' },
].map((x) => ({ ...x, difficulty: 1 as const }));

/** Adivinanzas tradicionales de dominio público. */
export const RIDDLES: GuessWord[] = [
  { clue: 'Oro parece, plata no es. ¿Qué es?', word: 'El plátano' },
  { clue: 'Blanca por dentro, verde por fuera. Si quieres que te lo diga, espera.', word: 'La pera' },
  { clue: 'Tiene dientes y no come, tiene barba y no es hombre.', word: 'El ajo' },
  { clue: 'Vuela sin alas, silba sin boca.', word: 'El viento' },
  { clue: 'Cuanto más le quitas, más grande es.', word: 'Un agujero' },
  { clue: 'Tiene agujas y no cose, tiene números y no es teléfono.', word: 'El reloj' },
  { clue: 'Todos me pisan a mí, pero yo no piso a nadie.', word: 'El camino' },
  { clue: 'Una cajita blanca como la cal; todos la saben abrir, nadie la sabe cerrar.', word: 'El huevo' },
  { clue: 'Tengo hojas y no soy árbol, tengo lomo y no soy caballo.', word: 'El libro' },
  { clue: 'Mientras más lavo, más sucia me pongo.', word: 'El agua' },
  { clue: 'Agua pasa por mi casa, cate de mi corazón.', word: 'El aguacate' },
  { clue: 'Sale de noche, se esconde de día; redonda o partida.', word: 'La luna' },
  { clue: 'Tiene ojos y no ve, tiene agua y no la bebe.', word: 'El coco' },
  { clue: 'Llevo mi casa a cuestas, camino sin tener patas.', word: 'El caracol' },
  { clue: 'Si me nombras, desaparezco.', word: 'El silencio' },
  { clue: 'Soy alto cuando soy joven y bajo cuando soy viejo; brillo con la vida.', word: 'La vela' },
  { clue: 'Tiene cuello y no cabeza, tiene brazos y no manos.', word: 'La camisa' },
  { clue: 'Va y viene sin moverse del sitio.', word: 'La puerta' },
].map((x) => ({ ...x, difficulty: 2 as const }));

export const QUICK_WORDS: GuessWord[] = w([
  'Mochila', 'Pantalón', 'Tormenta', 'Vacaciones', 'Hamburguesa', 'Cumpleaños', 'Mariposa', 'Piscina', 'Volcán', 'Carnaval',
  'Bicicleta', 'Pirata', 'Tesoro', 'Fantasma', 'Biblioteca', 'Caramelo', 'Escalera', 'Concierto', 'Zoológico', 'Robot',
  'Murciélago', 'Desayuno', 'Chocolate', 'Arcoíris', 'Selva', 'Castillo', 'Futbolista', 'Payaso', 'Cohete', 'Pingüino',
], 1);
