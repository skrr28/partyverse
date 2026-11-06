/**
 * Preguntas de trivia. Solo datos estables y bien establecidos.
 * `answer` es el índice de la opción correcta.
 */
import type { QuizQuestion } from '../catalog/types.ts';

const q = (question: string, options: string[], answer: number, difficulty: 1 | 2 | 3 = 1, explain?: string): QuizQuestion => ({
  q: question,
  options,
  answer,
  difficulty,
  explain,
});

export const GENERAL: QuizQuestion[] = [
  q('¿Cuántos planetas tiene el sistema solar?', ['7', '8', '9', '10'], 1, 1, 'Desde 2006 Plutón se clasifica como planeta enano.'),
  q('¿Cuántos días tiene un año bisiesto?', ['364', '365', '366', '367'], 2),
  q('¿Qué color se obtiene al mezclar azul y amarillo?', ['Verde', 'Morado', 'Naranja', 'Marrón'], 0),
  q('¿Cuántos lados tiene un hexágono?', ['5', '6', '7', '8'], 1),
  q('¿Qué instrumento tiene teclas blancas y negras?', ['Violín', 'Piano', 'Flauta', 'Batería'], 1),
  q('¿Cuál es el idioma con más hablantes nativos del mundo?', ['Inglés', 'Español', 'Chino mandarín', 'Hindi'], 2, 2),
  q('¿Cuántos minutos tiene un día?', ['1 240', '1 440', '1 600', '2 400'], 1, 2, '24 horas × 60 minutos = 1 440.'),
  q('¿Qué animal es conocido como «el rey de la selva»?', ['Tigre', 'Elefante', 'León', 'Gorila'], 2),
  q('¿En qué país se encuentra la Torre de Pisa?', ['Francia', 'Italia', 'España', 'Grecia'], 1),
  q('¿Qué se celebra el 1 de mayo en muchos países?', ['Día de la Madre', 'Día del Trabajo', 'Año Nuevo', 'Día del Niño'], 1),
  q('¿Cuántos jugadores tiene un equipo de fútbol en el campo?', ['9', '10', '11', '12'], 2),
  q('¿Qué número romano representa el 50?', ['L', 'C', 'D', 'X'], 0, 2),
];

export const MUSIC: QuizQuestion[] = [
  q('¿De qué país es Shakira?', ['México', 'Colombia', 'España', 'Argentina'], 1),
  q('¿Cuántas cuerdas tiene una guitarra clásica?', ['4', '5', '6', '7'], 2),
  q('¿Qué banda británica grabó el álbum «Abbey Road»?', ['The Rolling Stones', 'Queen', 'The Beatles', 'Oasis'], 2),
  q('¿Qué cantante es conocido como «el Rey del Pop»?', ['Elvis Presley', 'Michael Jackson', 'Prince', 'Freddie Mercury'], 1),
  q('¿Cuál de estos es un instrumento de viento?', ['Violonchelo', 'Trompeta', 'Arpa', 'Xilófono'], 1),
  q('¿De qué país es originario el tango?', ['Cuba', 'Argentina y Uruguay', 'Brasil', 'España'], 1, 2, 'Nació en la región del Río de la Plata, entre Buenos Aires y Montevideo.'),
  q('¿Qué compositor quedó sordo y siguió componiendo?', ['Mozart', 'Bach', 'Beethoven', 'Vivaldi'], 2, 2),
  q('¿Cuántas notas musicales básicas hay en la escala (do, re, mi…)?', ['5', '6', '7', '8'], 2),
  q('¿Qué ritmo es típico de República Dominicana?', ['Merengue', 'Cumbia', 'Samba', 'Tango'], 0),
  q('¿Quién era el vocalista de Queen?', ['Mick Jagger', 'Freddie Mercury', 'Bono', 'Sting'], 1),
  q('¿Qué instrumento andino se toca soplando tubos de caña de distintos tamaños?', ['Charango', 'Zampoña', 'Cajón', 'Quena'], 1, 2, 'La zampoña o siku está formada por varios tubos de caña.'),
  q('¿Qué instrumento de percusión es de origen afroperuano?', ['Bongó', 'Cajón', 'Timbal', 'Güiro'], 1, 2),
];

export const SCREEN: QuizQuestion[] = [
  q('¿Cómo se llama el muñeco vaquero de «Toy Story»?', ['Buzz', 'Woody', 'Rex', 'Slinky'], 1),
  q('¿En qué ciudad vive la familia Simpson?', ['Springfield', 'Shelbyville', 'Quahog', 'South Park'], 0),
  q('¿En qué saga se dice «Que la Fuerza te acompañe»?', ['Star Trek', 'Star Wars', 'Harry Potter', 'Matrix'], 1),
  q('¿Cómo se llama el pez payaso protagonista de «Buscando a Nemo»?', ['Dory', 'Marlin', 'Nemo', 'Bruce'], 2),
  q('¿Qué superhéroe es Peter Parker?', ['Batman', 'Superman', 'Spider-Man', 'Iron Man'], 2),
  q('¿En qué colegio estudia Harry Potter?', ['Hogwarts', 'Durmstrang', 'Beauxbatons', 'Xavier'], 0),
  q('¿Cómo se llama el ogro verde de DreamWorks?', ['Fiona', 'Shrek', 'Burro', 'Grinch'], 1),
  q('¿Qué serie gira en torno al pueblo de Hawkins?', ['Dark', 'Stranger Things', 'Lost', 'Merlina'], 1, 2),
  q('¿Qué película animada se ambienta en el Día de Muertos de México?', ['Encanto', 'Coco', 'Luca', 'Up'], 1),
  q('¿Cómo se llama la reina de hielo de «Frozen»?', ['Anna', 'Elsa', 'Moana', 'Rapunzel'], 1),
  q('¿En qué serie aparece «el Profesor»?', ['Narcos', 'La casa de papel', 'Élite', 'Breaking Bad'], 1, 2),
  q('¿Qué personaje vive en una piña debajo del mar?', ['Patricio', 'Calamardo', 'Bob Esponja', 'Don Cangrejo'], 2),
];

export const SPORTS: QuizQuestion[] = [
  q('¿Cada cuántos años se celebra el Mundial de fútbol masculino?', ['2', '3', '4', '5'], 2),
  q('¿En qué deporte se usa un «tee»?', ['Tenis', 'Golf', 'Béisbol', 'Hockey'], 1, 2),
  q('¿Cuántos jugadores por equipo hay en una cancha de básquet?', ['4', '5', '6', '7'], 1),
  q('¿En qué deporte se habla de «set» y «tie-break»?', ['Fútbol', 'Tenis', 'Natación', 'Boxeo'], 1),
  q('¿Cuántos anillos tiene la bandera olímpica?', ['4', '5', '6', '7'], 1),
  q('¿Qué país ha ganado más Mundiales de fútbol masculino?', ['Alemania', 'Argentina', 'Brasil', 'Italia'], 2, 2, 'Brasil tiene cinco títulos.'),
  q('¿En qué deporte destaca la selección femenina de Perú, subcampeona olímpica en Seúl 1988?', ['Fútbol', 'Vóley', 'Básquet', 'Atletismo'], 1, 2),
  q('¿Cuánto mide una maratón?', ['21,1 km', '30 km', '42,195 km', '50 km'], 2, 2),
  q('¿Qué deporte se juega en Wimbledon?', ['Golf', 'Tenis', 'Críquet', 'Rugby'], 1),
  q('¿Cuántos puntos vale un triple en básquet?', ['1', '2', '3', '4'], 2),
  q('¿En qué deporte se usa un disco llamado «puck»?', ['Hockey sobre hielo', 'Curling', 'Polo', 'Bádminton'], 0, 2),
  q('¿Cuántos tiempos tiene un partido de fútbol?', ['2', '3', '4', '1'], 0),
];

export const HISTORY: QuizQuestion[] = [
  q('¿En qué año llegó Cristóbal Colón a América?', ['1392', '1492', '1592', '1692'], 1),
  q('¿Qué civilización construyó Machu Picchu?', ['Maya', 'Azteca', 'Inca', 'Olmeca'], 2),
  q('¿Quién fue el primer ser humano en pisar la Luna?', ['Yuri Gagarin', 'Neil Armstrong', 'Buzz Aldrin', 'John Glenn'], 1),
  q('¿En qué año terminó la Segunda Guerra Mundial?', ['1918', '1939', '1945', '1950'], 2),
  q('¿Qué muro cayó en 1989?', ['La Gran Muralla', 'El Muro de Berlín', 'El Muro de Adriano', 'El Muro de los Lamentos'], 1),
  q('¿En qué país se construyeron las pirámides de Guiza?', ['México', 'Egipto', 'Sudán', 'Perú'], 1),
  q('¿Quién proclamó la independencia del Perú en 1821?', ['Simón Bolívar', 'José de San Martín', 'Túpac Amaru II', 'Ramón Castilla'], 1, 2, 'José de San Martín la proclamó en Lima el 28 de julio de 1821.'),
  q('¿Cómo se llamaba la capital del Imperio inca?', ['Quito', 'Cusco', 'Lima', 'Cajamarca'], 1),
  q('¿Qué imperio tenía su capital en Tenochtitlan?', ['Inca', 'Maya', 'Mexica (azteca)', 'Chimú'], 2, 2),
  q('¿Quién pintó «La Gioconda»?', ['Miguel Ángel', 'Leonardo da Vinci', 'Rafael', 'Picasso'], 1),
  q('¿En qué ciudad se encuentra el Coliseo romano?', ['Atenas', 'Roma', 'Florencia', 'Estambul'], 1),
  q('¿Qué cultura preinca dejó las famosas líneas en el desierto de Ica?', ['Mochica', 'Nazca', 'Chavín', 'Paracas'], 1, 2),
];

export const GEOGRAPHY: QuizQuestion[] = [
  q('¿Cuál es el océano más grande del planeta?', ['Atlántico', 'Índico', 'Pacífico', 'Ártico'], 2),
  q('¿Cuál es la capital de Japón?', ['Seúl', 'Pekín', 'Tokio', 'Osaka'], 2),
  q('¿En qué continente está Egipto?', ['Asia', 'África', 'Europa', 'Oceanía'], 1),
  q('¿Cuál es el río más caudaloso del mundo?', ['Nilo', 'Amazonas', 'Misisipi', 'Yangtsé'], 1, 2),
  q('¿Cuál es la montaña más alta del mundo sobre el nivel del mar?', ['K2', 'Aconcagua', 'Everest', 'Kilimanjaro'], 2),
  q('¿Cuál es la capital de Canadá?', ['Toronto', 'Ottawa', 'Montreal', 'Vancouver'], 1, 2),
  q('¿Qué país tiene forma de bota?', ['Grecia', 'Italia', 'Portugal', 'Chile'], 1),
  q('¿Cuál es el país más grande del mundo por superficie?', ['Canadá', 'China', 'Estados Unidos', 'Rusia'], 3),
  q('¿Cuál es el desierto cálido más grande del mundo?', ['Atacama', 'Gobi', 'Sahara', 'Kalahari'], 2, 2),
  q('¿Cuál es la capital de Australia?', ['Sídney', 'Melbourne', 'Canberra', 'Perth'], 2, 3),
  q('¿Qué cordillera recorre el oeste de Sudamérica?', ['Alpes', 'Andes', 'Himalaya', 'Rocosas'], 1),
  q('¿En qué país están las cataratas del Niágara (compartidas)?', ['Estados Unidos y Canadá', 'Brasil y Argentina', 'México y EE. UU.', 'Noruega y Suecia'], 0, 2),
];

export const SCIENCE: QuizQuestion[] = [
  q('¿Cuál es el planeta más cercano al Sol?', ['Venus', 'Marte', 'Mercurio', 'Tierra'], 2),
  q('¿Qué gas necesitan las plantas para hacer la fotosíntesis?', ['Oxígeno', 'Dióxido de carbono', 'Nitrógeno', 'Helio'], 1),
  q('¿Cuál es la fórmula química del agua?', ['CO₂', 'H₂O', 'O₂', 'NaCl'], 1),
  q('¿Cuántos huesos tiene aproximadamente un adulto humano?', ['106', '206', '306', '406'], 1, 2),
  q('¿Cuál es el planeta más grande del sistema solar?', ['Saturno', 'Júpiter', 'Neptuno', 'Urano'], 1),
  q('¿A qué temperatura hierve el agua al nivel del mar?', ['90 °C', '100 °C', '110 °C', '120 °C'], 1),
  q('¿Qué órgano bombea la sangre?', ['Pulmón', 'Hígado', 'Corazón', 'Riñón'], 2),
  q('¿Qué científico formuló la teoría de la relatividad?', ['Newton', 'Einstein', 'Galileo', 'Darwin'], 1),
  q('¿Cuál es el símbolo químico del oro?', ['Ag', 'Au', 'Fe', 'Or'], 1, 2),
  q('¿Qué planeta es conocido como el planeta rojo?', ['Júpiter', 'Venus', 'Marte', 'Saturno'], 2),
  q('¿Qué tipo de animal es la ballena?', ['Pez', 'Mamífero', 'Reptil', 'Anfibio'], 1),
  q('¿Cuál es el estado del agua cuando se congela?', ['Líquido', 'Gaseoso', 'Sólido', 'Plasma'], 2),
];

export const ABSURD: QuizQuestion[] = [
  q('¿Qué animal puede dormir de pie?', ['El caballo', 'El pez dorado', 'La gallina sin patas', 'La piedra'], 0, 1, 'Los caballos pueden dormitar de pie gracias a un mecanismo de bloqueo en sus patas.'),
  q('¿Cuántas patas tiene una araña?', ['6', '8', '10', '12'], 1),
  q('¿Qué fruta tiene las semillas por fuera?', ['La fresa', 'El mango', 'La uva', 'La naranja'], 0),
  q('¿Qué animal tiene tres corazones?', ['El pulpo', 'La vaca', 'El delfín', 'El loro'], 0, 2),
  q('¿Qué color tiene la sangre del pulpo?', ['Roja', 'Verde', 'Azul', 'Negra'], 2, 2),
  q('¿Qué animal no puede saltar?', ['El elefante', 'El canguro', 'El gato', 'La rana'], 0, 2),
  q('¿Qué se rompe al nombrarlo?', ['Un vaso', 'El silencio', 'Un récord', 'Un huevo'], 1),
  q('¿Cuál de estos animales duerme más horas al día?', ['El perezoso', 'El caballo', 'La jirafa', 'El elefante'], 0, 2),
  q('¿Qué fruta flota en el agua?', ['La manzana', 'La piedra', 'El plomo', 'El ladrillo'], 0),
  q('¿Qué tiene cuello pero no cabeza?', ['Una botella', 'Un gato', 'Un río', 'Un zapato'], 0),
  q('¿Qué animal es famoso por cambiar de color?', ['Camaleón', 'Tortuga', 'Ardilla', 'Oveja'], 0),
  q('¿Qué pesa más: un kilo de algodón o un kilo de hierro?', ['El hierro', 'El algodón', 'Pesan lo mismo', 'Depende del día'], 2),
];

export const PERU_LATAM: QuizQuestion[] = [
  q('¿Cuál es la capital del Perú?', ['Cusco', 'Arequipa', 'Lima', 'Trujillo'], 2),
  q('¿Qué lago navegable comparten Perú y Bolivia?', ['Titicaca', 'Poopó', 'Junín', 'Maracaibo'], 0),
  q('¿Cuál es el plato bandera más conocido del Perú, hecho con pescado y limón?', ['Ají de gallina', 'Ceviche', 'Lomo saltado', 'Causa'], 1),
  q('¿Qué animal andino aparece en el escudo del Perú?', ['Llama', 'Vicuña', 'Cóndor', 'Alpaca'], 1, 2),
  q('¿Qué escritor peruano ganó el Premio Nobel de Literatura en 2010?', ['César Vallejo', 'Mario Vargas Llosa', 'Ricardo Palma', 'José María Arguedas'], 1, 2),
  q('¿Cuál es la capital de Argentina?', ['Córdoba', 'Rosario', 'Buenos Aires', 'Mendoza'], 2),
  q('¿En qué país está el desierto de Atacama?', ['Perú', 'Chile', 'Bolivia', 'Argentina'], 1),
  q('¿Qué moneda se usa en el Perú?', ['Peso', 'Sol', 'Real', 'Boliviano'], 1),
  q('¿Cuál es el país más grande de Sudamérica?', ['Argentina', 'Perú', 'Brasil', 'Colombia'], 2),
  q('¿En qué ciudad peruana se encuentra el Monasterio de Santa Catalina?', ['Arequipa', 'Lima', 'Puno', 'Piura'], 0, 3),
  q('¿Qué idioma, además del castellano, es oficial en el Perú y hablaban los incas?', ['Guaraní', 'Quechua', 'Náhuatl', 'Mapudungun'], 1),
  q('¿Qué canal une el océano Atlántico con el Pacífico?', ['Canal de Suez', 'Canal de Panamá', 'Canal de Beagle', 'Canal de la Mancha'], 1),
];
