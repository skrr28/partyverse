/**
 * Tarjetas para el motor «prompts». Contenido original de PARTYVERSE.
 * Normas: nada peligroso, ilegal, humillante ni que presione a nadie; siempre
 * se puede pasar sin penalización.
 */
import type { Prompt } from '../catalog/types.ts';

const v = (text: string, level: 1 | 2 | 3 = 1): Prompt => ({ text, kind: 'verdad', level });
const r = (text: string, level: 1 | 2 | 3 = 1): Prompt => ({ text, kind: 'reto', level });
const p = (text: string): Prompt => ({ text });

export const TRUTH_DARE: Prompt[] = [
  // Verdades · suave
  v('¿Cuál es la canción que cantas a escondidas aunque te dé vergüenza?'),
  v('¿Qué es lo más raro que has comido?'),
  v('¿Cuál fue tu apodo de infancia?'),
  v('¿Qué serie dejaste a medias y nunca terminaste?'),
  v('¿Cuál es tu mayor manía?'),
  v('¿Qué superpoder elegirías y para qué lo usarías primero?'),
  v('¿A qué famoso te gustaría invitar a cenar?'),
  v('¿Qué es lo más inútil que has comprado?'),
  v('¿Cuál fue tu peor corte de pelo?'),
  v('¿Qué harías con un día libre sin celular?'),
  v('¿Qué miedo tienes que nadie aquí conoce?'),
  v('¿Cuál es el mejor consejo que te han dado?'),
  v('¿Qué app abres más veces al día?'),
  v('¿Qué talento oculto tienes?'),
  v('Si pudieras vivir en cualquier época, ¿cuál elegirías?'),
  // Verdades · picante
  v('¿Cuál es la excusa más creativa que has inventado para no ir a un plan?', 2),
  v('¿Has leído un mensaje y fingido que no lo viste? ¿De quién?', 2),
  v('¿Cuál fue tu momento más vergonzoso en público?', 2),
  v('¿A quién de este grupo llamarías para esconder una sorpresa?', 2),
  v('¿Qué opinión impopular defiendes?', 2),
  v('¿Cuál es la mentira piadosa que más repites?', 2),
  v('¿Qué búsqueda rara hiciste últimamente en internet?', 2),
  v('¿Has stalkeado a alguien en redes hasta fotos de hace años?', 2),
  v('¿Quién de aquí crees que guarda más secretos?', 2),
  v('¿Qué es lo más impulsivo que has hecho?', 2),
  // Retos · suave
  r('Imita a un presentador de noticias anunciando lo que comiste hoy.'),
  r('Habla con acento extranjero hasta tu próximo turno.'),
  r('Haz tu mejor paso de baile durante 15 segundos.'),
  r('Cuenta un chiste. Si nadie se ríe, cuenta otro.'),
  r('Di el abecedario lo más rápido que puedas.'),
  r('Haz una pose de estatua y no te muevas hasta que alguien se ría.'),
  r('Inventa un eslogan publicitario para la persona de tu derecha.'),
  r('Canta el estribillo de una canción infantil como si fuera ópera.'),
  r('Describe tu día como si fuera el tráiler de una película de acción.'),
  r('Dibuja a alguien del grupo con los ojos cerrados.'),
  r('Haz 10 sentadillas mientras dices nombres de frutas.'),
  r('Habla como un robot durante un minuto.'),
  r('Inventa un saludo secreto con la persona de tu izquierda.'),
  r('Imita a alguien del grupo y que los demás adivinen quién es.'),
  r('Narra lo que hace el grupo como un documental de naturaleza.'),
  // Retos · picante
  r('Deja que el grupo elija tu foto de perfil durante una hora (puedes negarte).', 2),
  r('Lee en voz alta el último mensaje que enviaste (puedes elegir otro chat).', 2),
  r('Manda un audio cantando «feliz cumpleaños» a alguien cuyo cumpleaños no es hoy.', 2),
  r('Haz una declaración dramática de amor… a una planta o un objeto.', 2),
  r('Deja que el grupo te haga una pregunta y responde solo con sí o no.', 2),
  r('Escribe un poema de cuatro versos sobre la persona que tienes enfrente.', 2),
  r('Muestra la foto número 15 de tu galería (si quieres).', 2),
  r('Imita a tu cantante favorito durante 20 segundos.', 2),
];

/** Contenido para adultos: coqueto y atrevido, nunca explícito ni obligatorio. */
export const TRUTH_DARE_ADULT: Prompt[] = [
  v('¿Cuál fue tu cita más desastrosa?', 3),
  v('¿Qué es lo primero que te atrae de una persona?', 3),
  v('¿Cuál es tu frase para ligar más efectiva (o más fallida)?', 3),
  v('¿Has tenido un crush con alguien de este grupo?', 3),
  v('¿Cuál fue tu primer beso y cómo fue?', 3),
  v('¿Qué canción pondrías en una cita perfecta?', 3),
  v('¿Cuál es tu tipo ideal en tres palabras?', 3),
  v('¿Qué es lo más atrevido que has hecho por amor?', 3),
  v('¿Has enviado un mensaje romántico a la persona equivocada?', 3),
  v('¿Qué opinas de las relaciones a distancia?', 3),
  v('¿Cuál es tu señal de alerta número uno en una cita?', 3),
  v('¿Qué te parece más romántico: una carta o una sorpresa?', 3),
  r('Dedica un piropo creativo y respetuoso a la persona de tu derecha.', 3),
  r('Interpreta una escena romántica de telenovela con alguien que acepte.', 3),
  r('Describe tu cita ideal como si fuera un anuncio.', 3),
  r('Baila una bachata imaginaria durante 20 segundos.', 3),
  r('Escribe en un papel un cumplido anónimo para alguien del grupo.', 3),
  r('Imita tu forma de coquetear en una fiesta.', 3),
  r('Dile a alguien qué es lo que más te gusta de su personalidad.', 3),
  r('Recrea la pose de una portada de revista romántica.', 3),
];

export const ICEBREAKERS: Prompt[] = [
  p('¿Cuál fue el mejor viaje de tu vida y por qué?'),
  p('Si tu vida fuera una película, ¿qué género sería?'),
  p('¿Qué comida podrías comer todos los días?'),
  p('¿Cuál es tu plan perfecto de domingo?'),
  p('¿Qué habilidad te gustaría aprender este año?'),
  p('¿Qué te hace reír siempre, aunque tengas un mal día?'),
  p('¿Qué lugar del mundo te gustaría conocer?'),
  p('¿Cuál es el mejor regalo que te han hecho?'),
  p('¿Qué música escuchas para motivarte?'),
  p('¿Qué harías si te ganaras la lotería mañana?'),
  p('¿Qué personaje de ficción se parece más a ti?'),
  p('¿Cuál es tu recuerdo favorito de la infancia?'),
  p('¿Mañanero o nocturno? Defiende tu bando.'),
  p('¿Qué te gustaría que la gente supiera de ti al conocerte?'),
  p('¿Cuál es el último libro, serie o película que recomendarías?'),
  p('¿Perros, gatos u otro animal?'),
  p('¿Qué trabajo tendrías en un universo paralelo?'),
  p('¿Cuál es tu mayor logro del que casi nadie sabe?'),
  p('¿Qué tradición de tu familia te encanta?'),
  p('¿Qué pregunta te gustaría que te hicieran más seguido?'),
];

export const UNEXPECTED: Prompt[] = [
  p('Si fueras un electrodoméstico, ¿cuál serías?'),
  p('¿Qué olor te transporta a tu infancia?'),
  p('¿Qué harías si fueras invisible durante una hora?'),
  p('¿Qué palabra inventarías y qué significaría?'),
  p('Si los animales hablaran, ¿cuál sería el más maleducado?'),
  p('¿Qué objeto de tu casa tiene más historias?'),
  p('¿Qué ley absurda aprobarías si fueras presidente un día?'),
  p('¿Cuál sería el título de tu autobiografía?'),
  p('¿Qué sabor de helado inventarías?'),
  p('Si pudieras hablar con tu yo de 10 años, ¿qué le dirías?'),
  p('¿Qué harías si despertaras siendo un gato?'),
  p('¿Qué emoji te representa hoy?'),
  p('¿Qué canción sonaría cuando entras a un lugar?'),
  p('¿Qué deporte olímpico ganarías sin entrenar?'),
  p('Si tu vida tuviera botón de pausa, ¿cuándo lo usarías?'),
  p('¿Cuál sería tu comida para el último día en la Tierra?'),
  p('¿Qué te gustaría que inventaran ya?'),
  p('¿En qué serie te gustaría vivir una semana?'),
];

export const WOULD_YOU_RATHER: Prompt[] = [
  p('¿Qué prefieres: poder volar o poder ser invisible?'),
  p('¿Qué prefieres: vivir en la playa o en la montaña?'),
  p('¿Qué prefieres: no volver a ver series o no volver a escuchar música?'),
  p('¿Qué prefieres: saber todos los idiomas o tocar todos los instrumentos?'),
  p('¿Qué prefieres: viajar al pasado o al futuro?'),
  p('¿Qué prefieres: siempre llegar 10 minutos tarde o siempre 30 minutos antes?'),
  p('¿Qué prefieres: comer solo dulce o solo salado toda la vida?'),
  p('¿Qué prefieres: tener un dragón o ser un dragón?'),
  p('¿Qué prefieres: vivir sin internet o sin aire acondicionado?'),
  p('¿Qué prefieres: hablar con animales o leer mentes?'),
  p('¿Qué prefieres: ser famoso o ser millonario en secreto?'),
  p('¿Qué prefieres: vacaciones eternas o trabajo de tus sueños?'),
  p('¿Qué prefieres: reír sin parar en un funeral o llorar en una boda?'),
  p('¿Qué prefieres: tener rebobinador o pausa para tu vida?'),
  p('¿Qué prefieres: playa sin sol o nieve sin frío?'),
  p('¿Qué prefieres: comer tu comida favorita fría o tu menos favorita caliente?'),
  p('¿Qué prefieres: un viaje sorpresa o planear cada detalle?'),
  p('¿Qué prefieres: un perro que habla o un gato que canta?'),
  p('¿Qué prefieres: vivir en una ciudad gigante o en un pueblo tranquilo?'),
  p('¿Qué prefieres: conocer a tu yo del futuro o a tus bisabuelos jóvenes?'),
];

export const TWO_TRUTHS_TOPICS: Prompt[] = [
  p('Tema: viajes. Di dos verdades y una mentira; el grupo adivina la mentira.'),
  p('Tema: comida. Dos verdades y una mentira.'),
  p('Tema: infancia. Dos verdades y una mentira.'),
  p('Tema: trabajos o estudios. Dos verdades y una mentira.'),
  p('Tema: talentos. Dos verdades y una mentira.'),
  p('Tema: miedos. Dos verdades y una mentira.'),
  p('Tema: famosos que conoces o has visto. Dos verdades y una mentira.'),
  p('Tema: accidentes graciosos. Dos verdades y una mentira.'),
  p('Tema: música. Dos verdades y una mentira.'),
  p('Tema: libre. Dos verdades y una mentira.'),
];

export const STORY_STARTS: Prompt[] = [
  p('Empieza la historia: «Esa mañana, el café empezó a hablar…» Cada jugador añade una frase.'),
  p('Empieza: «Abrí la puerta del ascensor y estaba lleno de patos…»'),
  p('Empieza: «Nadie sabía que la abuela era agente secreta…»'),
  p('Empieza: «El GPS me dijo: gira a la izquierda… hacia la Luna.»'),
  p('Empieza: «En la fiesta apareció un invitado que nadie conocía…»'),
  p('Empieza: «Gané un concurso que no recordaba haber jugado…»'),
  p('Empieza: «El perro del vecino me dejó una carta…»'),
  p('Empieza: «Cuando desperté, todos hablaban al revés…»'),
  p('Empieza: «El último tren de la noche no tenía conductor…»'),
  p('Empieza: «Encontré un mapa dentro de una papa…»'),
];

export const COMPLETE_PHRASE: Prompt[] = [
  p('Completa: «Nunca confíes en alguien que…»'),
  p('Completa: «Lo mejor de los lunes es…»'),
  p('Completa: «Mi superpoder secreto es…»'),
  p('Completa: «Si fuera presidente, lo primero que haría sería…»'),
  p('Completa: «La gente se sorprendería si supiera que…»'),
  p('Completa: «El peor regalo posible sería…»'),
  p('Completa: «Mi plan B en la vida es…»'),
  p('Completa: «Lo que nunca falta en mi mochila es…»'),
  p('Completa: «En una isla desierta me llevaría…»'),
  p('Completa: «Mi canción en la ducha es…»'),
  p('Completa: «El invento más inútil del mundo es…»'),
  p('Completa: «Una fiesta no es fiesta sin…»'),
];

/** Trabalenguas tradicionales de dominio público. */
export const TONGUE_TWISTERS: Prompt[] = [
  p('Tres tristes tigres tragaban trigo en un trigal.'),
  p('Pablito clavó un clavito. ¿Qué clavito clavó Pablito?'),
  p('El perro de San Roque no tiene rabo porque Ramón Ramírez se lo ha cortado.'),
  p('Erre con erre cigarro, erre con erre barril, rápido corren los carros cargados de azúcar del ferrocarril.'),
  p('Como poco coco como, poco coco compro.'),
  p('Pancha plancha con cuatro planchas. ¿Con cuántas planchas plancha Pancha?'),
  p('El cielo está enladrillado, ¿quién lo desenladrillará? El desenladrillador que lo desenladrille buen desenladrillador será.'),
  p('Compadre, cómprame un coco. Compadre, coco no compro, que el que poco coco come, poco coco compra.'),
  p('Un tigre, dos tigres, tres tigres comían trigo en un trigal.'),
  p('Hoy ya es ayer y ayer ya es hoy, ya llegó el día, y hoy es hoy.'),
  p('Yo tengo una gallina pinta, pipiripinta, gorda, pipirigorda.'),
  p('Parra tenía una perra. Guerra tenía una parra. La perra de Parra subió a la parra de Guerra.'),
];

export const RHYMES: Prompt[] = [
  'corazón', 'ventana', 'chocolate', 'camión', 'estrella', 'mañana', 'gato', 'fiesta', 'canción', 'zapato',
  'luna', 'helado', 'amigo', 'tortuga', 'montaña', 'café', 'teléfono', 'playa', 'domingo', 'pizza',
].map((w) => p(`Di tres palabras que rimen con «${w}» en 10 segundos.`));

export const WORD_CHAIN: Prompt[] = [
  p('Palabras encadenadas: empieza con «mesa». Cada palabra empieza con la última sílaba de la anterior.'),
  p('Encadenadas por última letra. Empieza: «árbol».'),
  p('Encadenadas solo con animales. Empieza: «elefante».'),
  p('Encadenadas solo con comida. Empieza: «tomate».'),
  p('Encadenadas solo con países o ciudades. Empieza: «Perú».'),
  p('Encadenadas: palabras de tres sílabas. Empieza: «camino».'),
  p('Encadenadas: no se permite la letra E. Empieza: «gato».'),
  p('Encadenadas: nombres de persona. Empieza: «Lucía».'),
];

export const WORD_MEMORY: Prompt[] = [
  p('Memoria: di «Fui al mercado y compré…» y añade algo. El siguiente repite todo y añade otra cosa.'),
  p('Memoria: «En mi maleta llevo…» y cada jugador añade un objeto repitiendo la lista.'),
  p('Memoria: «Mi zoológico tiene…» y cada uno suma un animal.'),
  p('Memoria: «En la fiesta había…» y cada jugador añade algo sin olvidar lo anterior.'),
];

export const NO_SAY: Prompt[] = [
  'sí', 'no', 'yo', 'bueno', 'eh', 'o sea', 'como', 'nada', 'claro', 'tipo',
].map((w) => p(`Habla 30 segundos sobre tu fin de semana sin decir «${w}». El grupo vigila.`));

export const CREATIVE_DARES: Prompt[] = [
  p('Inventa un superhéroe con un poder absurdo y presenta su historia.'),
  p('Crea un anuncio de 20 segundos para un producto que no existe.'),
  p('Inventa una canción de 4 versos sobre el último plato que comiste.'),
  p('Describe un objeto de la habitación como si fuera una obra de arte.'),
  p('Inventa un baile con nombre propio y enséñaselo al grupo.'),
  p('Crea un nuevo deporte con las cosas que tienes cerca.'),
  p('Haz de guía turístico del lugar donde están.'),
  p('Interpreta a un villano de película pidiendo comida a domicilio.'),
  p('Inventa una leyenda urbana sobre alguien del grupo (amable).'),
  p('Recita las instrucciones de un microondas como si fueran poesía.'),
  p('Transforma una canción conocida en una de rock pesado (solo tarareo).'),
  p('Crea un lema para el grupo y haz que todos lo griten.'),
];

export const GROUP_PREDICT: Prompt[] = [
  p('Predice: ¿qué elegiría la mayoría, pizza o hamburguesa? Luego voten a mano alzada.'),
  p('Predice: ¿cuántos del grupo se levantan antes de las 7? Luego comprueben.'),
  p('Predice: ¿qué estación del año prefiere la mayoría?'),
  p('Predice: ¿cuántos han viajado en avión este año?'),
  p('Predice: ¿qué prefiere la mayoría, playa o montaña?'),
  p('Predice: ¿cuántos saben nadar?'),
  p('Predice: ¿café o té? ¿Qué gana en el grupo?'),
  p('Predice: ¿cuántos tienen mascota?'),
  p('Predice: ¿cuántos se saben un trabalenguas completo?'),
  p('Predice: ¿qué superpoder elegiría la mayoría: volar o teletransportarse?'),
];

export const COMMON_GROUND: Prompt[] = [
  p('Encuentren 3 cosas que todos tengan en común en 1 minuto.'),
  p('Encuentra algo que compartas con la persona de tu derecha que nadie más tenga.'),
  p('Encuentren una comida que nadie del grupo soporte.'),
  p('Encuentren una canción que todos se sepan y cántenla.'),
  p('Encuentren un lugar que todos hayan visitado.'),
  p('Encuentren un miedo que compartan al menos tres personas.'),
  p('Encuentren una serie o película que todos hayan visto.'),
  p('Encuentren una habilidad que solo una persona del grupo tenga.'),
];

export const INTRO_ROUNDS: Prompt[] = [
  p('Preséntate con tu nombre y un dato curioso que nadie adivinaría.'),
  p('Preséntate con tres palabras que te describan.'),
  p('Preséntate diciendo qué estabas haciendo hace un año.'),
  p('Preséntate con tu comida favorita y tu peor manía.'),
  p('Preséntate como si fueras el personaje de un videojuego: nombre, poder y debilidad.'),
  p('Preséntate contando cómo conociste a alguien de este grupo.'),
  p('Preséntate con la canción que describe tu semana.'),
  p('Preséntate con un objeto de tu mochila o bolsillo y su historia.'),
];

export const COUPLES_CONNECTION: Prompt[] = [
  p('¿Qué fue lo primero que pensaste de tu pareja al conocerla?'),
  p('Cuenta un recuerdo juntos que te haga sonreír siempre.'),
  p('¿Qué pequeño detalle de tu pareja te enamora?'),
  p('¿Cuál sería el viaje soñado para los dos?'),
  p('¿Qué canción es «vuestra canción» y por qué?'),
  p('¿Qué aprendiste de tu pareja este año?'),
  p('¿Qué te gustaría hacer juntos que aún no han hecho?'),
  p('¿Qué gesto te hace sentir más querido o querida?'),
  p('Describe tu cita perfecta con tu pareja.'),
  p('¿Qué admiras de cómo tu pareja enfrenta los problemas?'),
  p('¿Qué tradición les gustaría crear juntos?'),
  p('Di tres cosas por las que agradeces a tu pareja hoy.'),
  p('¿Qué fue lo más divertido que les pasó en una cita?'),
  p('¿Qué superpoder tendría tu pareja?'),
  p('¿Dónde se imaginan en cinco años?'),
];

export const COUPLES_COMPAT: Prompt[] = [
  p('Respondan a la vez: ¿quién de los dos se duerme primero en una película?'),
  p('Respondan a la vez: ¿quién cocina mejor?'),
  p('Respondan a la vez: ¿quién pide perdón primero?'),
  p('Respondan a la vez: ¿quién se pierde más con el GPS?'),
  p('Respondan a la vez: ¿playa o montaña para las próximas vacaciones?'),
  p('Respondan a la vez: ¿cuál es la comida favorita de tu pareja?'),
  p('Respondan a la vez: ¿quién es más ordenado?'),
  p('Respondan a la vez: ¿quién manda más mensajes durante el día?'),
  p('Respondan a la vez: ¿qué haría tu pareja con un día libre?'),
  p('Respondan a la vez: ¿cuál fue su primera cita?'),
  p('Respondan a la vez: ¿quién es más competitivo en los juegos?'),
  p('Respondan a la vez: ¿qué serie verían juntos otra vez?'),
];

export const FAMILY: Prompt[] = [
  p('¿Cuál es la anécdota familiar que siempre se cuenta en las reuniones?'),
  p('¿Qué receta familiar te gustaría aprender?'),
  p('Imita a un familiar (con cariño) y que los demás adivinen quién es.'),
  p('¿Cuál fue el mejor viaje en familia?'),
  p('¿Qué consejo de tus abuelos nunca olvidas?'),
  p('¿Qué juego de la infancia les gustaría volver a jugar?'),
  p('¿Qué tradición familiar te parece más divertida?'),
  p('¿Quién de la familia cuenta los mejores chistes?'),
  p('¿Qué harían si la familia tuviera un día libre juntos?'),
  p('Cuenta algo que tus padres hacían cuando eran jóvenes.'),
  p('¿Qué te gustaría enseñarle a alguien más pequeño de la familia?'),
  p('¿Qué canción baila toda la familia en las fiestas?'),
  p('Hagan una foto grupal con la pose más ridícula posible.'),
  p('¿Qué superhéroe sería cada miembro de la familia?'),
];
