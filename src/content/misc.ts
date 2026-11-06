/** Contenido de impostor, ruleta y Basta. */

/** [palabra del grupo, palabra parecida para el impostor] */
export const IMPOSTOR_WORDS: Record<string, [string, string][]> = {
  Comida: [
    ['Pizza', 'Hamburguesa'], ['Ceviche', 'Sushi'], ['Helado', 'Yogur'], ['Tacos', 'Burritos'], ['Pollo a la brasa', 'Pollo frito'],
    ['Chocolate', 'Caramelo'], ['Lomo saltado', 'Arroz chaufa'], ['Empanada', 'Tamal'], ['Sopa', 'Guiso'], ['Panqueques', 'Waffles'],
    ['Manzana', 'Pera'], ['Café', 'Té'], ['Palomitas', 'Papas fritas'], ['Mango', 'Papaya'], ['Queso', 'Mantequilla'],
  ],
  Lugares: [
    ['Playa', 'Piscina'], ['Hospital', 'Farmacia'], ['Aeropuerto', 'Estación de buses'], ['Cine', 'Teatro'], ['Biblioteca', 'Librería'],
    ['Gimnasio', 'Estadio'], ['Supermercado', 'Mercado'], ['Escuela', 'Universidad'], ['Discoteca', 'Karaoke'], ['Zoológico', 'Acuario'],
    ['Iglesia', 'Museo'], ['Montaña', 'Volcán'], ['Hotel', 'Hostal'], ['Restaurante', 'Cafetería'], ['Parque', 'Jardín botánico'],
  ],
  Animales: [
    ['Perro', 'Lobo'], ['Gato', 'Tigre'], ['Llama', 'Alpaca'], ['Delfín', 'Tiburón'], ['Águila', 'Halcón'],
    ['Caballo', 'Burro'], ['Rana', 'Sapo'], ['Abeja', 'Avispa'], ['Pingüino', 'Pato'], ['Cóndor', 'Buitre'],
    ['Conejo', 'Liebre'], ['Mariposa', 'Polilla'], ['Ratón', 'Hámster'], ['Oso', 'Panda'], ['Cocodrilo', 'Lagarto'],
  ],
  Objetos: [
    ['Celular', 'Tablet'], ['Reloj', 'Pulsera'], ['Silla', 'Sofá'], ['Lápiz', 'Bolígrafo'], ['Mochila', 'Maleta'],
    ['Cuchara', 'Tenedor'], ['Almohada', 'Cojín'], ['Gafas', 'Lentes de sol'], ['Paraguas', 'Impermeable'], ['Televisor', 'Computadora'],
    ['Zapatillas', 'Sandalias'], ['Vela', 'Linterna'], ['Espejo', 'Ventana'], ['Guitarra', 'Ukelele'], ['Llave', 'Candado'],
  ],
  Profesiones: [
    ['Doctor', 'Enfermero'], ['Profesor', 'Director'], ['Cocinero', 'Panadero'], ['Piloto', 'Azafata'], ['Policía', 'Detective'],
    ['Bombero', 'Rescatista'], ['Cantante', 'Actor'], ['Abogado', 'Juez'], ['Ingeniero', 'Arquitecto'], ['Periodista', 'Escritor'],
    ['Peluquero', 'Maquillador'], ['Futbolista', 'Entrenador'], ['Dentista', 'Cirujano'], ['Fotógrafo', 'Camarógrafo'], ['Mesero', 'Barman'],
  ],
  Deportes: [
    ['Fútbol', 'Rugby'], ['Tenis', 'Pádel'], ['Natación', 'Waterpolo'], ['Básquet', 'Vóley'], ['Ciclismo', 'Motociclismo'],
    ['Boxeo', 'Karate'], ['Surf', 'Skate'], ['Golf', 'Minigolf'], ['Esquí', 'Snowboard'], ['Atletismo', 'Maratón'],
    ['Béisbol', 'Críquet'], ['Ajedrez', 'Damas'], ['Escalada', 'Senderismo'], ['Ping-pong', 'Bádminton'], ['Remo', 'Kayak'],
  ],
};

export const DEFAULT_WHEEL: string[] = [
  'Responde una pregunta',
  'Haz una mímica',
  'Reto creativo',
  'Duelo entre jugadores',
  'Pregunta de trivia',
  'Elige a un compañero',
  'Todos participan',
  'Ronda sorpresa',
  'Gana 50 puntos',
];

export const STOP_CATEGORIES: string[] = [
  'Nombre', 'Apellido', 'Ciudad o país', 'Animal', 'Fruta o verdura', 'Color', 'Cosa', 'Profesión', 'Marca', 'Película o serie',
];

export const SPEED_CATEGORIES: string[] = [
  'Algo que llevas a la playa', 'Una comida', 'Un famoso', 'Algo que hay en una cocina', 'Un deporte', 'Un instrumento',
  'Algo de color rojo', 'Una palabra en inglés', 'Algo que vuela', 'Un superhéroe',
];

/** Letras válidas para Basta (se omiten las muy difíciles). */
export const STOP_LETTERS = 'ABCDEFGHIJLMNOPRSTUV'.split('');
