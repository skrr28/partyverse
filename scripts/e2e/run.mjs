// Uso: npm run test:web  (requiere google-chrome). Capturas en .e2e-shots/
// Recorrido real de la versión web: portada → ambiente → participantes → catálogo → juegos.
import * as d from './driver.mjs';

const log = (...a) => console.log('•', ...a);
const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push(['OK', name]);
    log('OK', name);
  } catch (e) {
    results.push(['FALLO', name, e.message]);
    log('FALLO', name, e.message);
    await d.shot(`fail-${name.replace(/\W+/g, '_')}`);
  }
}
const expect = async (text) => {
  if (!(await d.has(text))) throw new Error(`no aparece «${text}»`);
};

/** Pulsa el primero de los textos que aparezca. */
async function clickAny(...texts) {
  for (const t of texts) if (await d.has(t)) return d.click(t);
  throw new Error(`ninguno visible: ${texts.join(' | ')}`);
}

await step('portada', async () => {
  await d.go('/');
  await expect('¡EMPEZAR A JUGAR!');
  await expect('Elige el ambiente');
  await d.fullShot('01-portada');
});

await step('ambiente y participantes', async () => {
  await d.click('Empezar a jugar');
  await expect('¿Qué ambiente hay hoy?');
  await d.shot('02-ambiente');
  await d.click('Fiesta: Energía, retos y risas');
  await expect('¿Quiénes juegan?');
  for (const n of ['Ana', 'Beto', 'Caro', 'Dani']) {
    await d.type('Nombre del participante', n);
    await d.click('Añadir');
  }
  await d.type('Nombre del participante', 'ana');
  await d.click('Añadir');
  await expect('Ese nombre ya está en el grupo.');
  await expect('4/20 participantes');
  await d.shot('03-participantes');
});

await step('catálogo filtrado', async () => {
  await d.click('Elegir juego (4)');
  await expect('Elige un juego');
  await expect('Solo juegos para 4 participantes');
  await d.shot('04-catalogo');
});

await step('verdad o reto completo', async () => {
  await d.click('Verdad o reto.', { prefix: true });
  await expect('Cómo se juega');
  await d.shot('05-verdad-reto-intro');
  await d.click('¡Empezar!');
  await expect('Intensidad');
  await d.click('😏 Picante');
  await d.click('1');
  await d.click('¡Empezar!');
  for (let i = 0; i < 4; i++) {
    await clickAny(i % 2 ? '🔥 Reto' : '🗣️ Verdad');
    if (i === 0) await d.shot('06-verdad-reto-tarjeta');
    await clickAny(i === 3 ? 'Paso' : 'Cumplido +100');
  }
  await expect('¡FIN DE LA PARTIDA!');
  await expect('Reconocimientos');
  await d.fullShot('07-resultados');
});

await step('ruleta gira y se detiene', async () => {
  await d.go('/game/ruleta');
  await d.click('¡Empezar!');
  await d.click('¡Girar!');
  await d.sleep(1200);
  await d.shot('08-ruleta-girando');
  await d.sleep(3200);
  await expect('¡TE TOCA!');
  await d.shot('09-ruleta-resultado');
});

await step('impostor de principio a fin', async () => {
  await d.go('/game/impostor');
  await d.click('¡Empezar!');
  await d.click('Repartir roles');
  for (let i = 0; i < 4; i++) {
    await clickAny('Soy Ana, ¡listo!', 'Soy Beto, ¡listo!', 'Soy Caro, ¡listo!', 'Soy Dani, ¡listo!');
    if (i === 0) {
      const release = await d.press('Mantén pulsado para ver tu rol');
      await d.shot('10-impostor-rol');
      await release();
    }
    await d.click('Ya lo vi, ocultar y pasar');
  }
  await expect('RONDA DE PISTAS');
  await d.shot('11-impostor-discusion');
  await d.click('Votar ya');
  // Todos votan a Ana salvo Ana, que vota a Beto.
  for (let i = 0; i < 4; i++) {
    await clickAny('Soy Ana, ¡listo!', 'Soy Beto, ¡listo!', 'Soy Caro, ¡listo!', 'Soy Dani, ¡listo!');
    await d.click('Votar a Ana').catch(() => d.click('Votar a Beto'));
  }
  if (await d.has('Última oportunidad')) await d.click('Falló');
  await expect('Palabra:');
  await d.shot('12-impostor-revelacion');
});

await step('trivia Perú con explicación', async () => {
  await d.go('/game/trivia-peru');
  await d.click('¡Empezar!');
  await d.click('3');
  await d.click('¡Empezar!');
  for (let i = 0; i < 12; i++) {
    await clickAny('Soy Ana, ¡listo!', 'Soy Beto, ¡listo!', 'Soy Caro, ¡listo!', 'Soy Dani, ¡listo!');
    if (i === 0) await d.shot('13-trivia-pregunta');
    const t = await d.bodyText();
    const opt = t.split('\n').find((l) => /^[ABCD]$/.test(l.trim()));
    await d.evaluate(`(() => { const b=[...document.querySelectorAll('[role=button]')].find(e=>/^A/.test(e.innerText.trim())); b && b.scrollIntoView({block:'center'}); })()`);
    await d.click(await d.evaluate(`[...document.querySelectorAll('[role=button]')].find(e=>/^A\\n/.test(e.innerText))?.getAttribute('aria-label')`));
    if (i === 0) await d.shot('14-trivia-respuesta');
    await clickAny('Siguiente', 'Ver resultados');
    void opt;
  }
  await expect('¡FIN DE LA PARTIDA!');
});

await step('reflejos', async () => {
  await d.go('/game/reflejos');
  await d.click('¡Empezar!');
  await d.click('1');
  await d.click('¡Empezar!');
  await d.click('Preparado');
  await d.click('Zona de reflejos'); // demasiado pronto
  await expect('¡Demasiado pronto!');
  await d.click('Reintentar');
  await d.sleep(4300);
  await d.click('Zona de reflejos');
  await expect(' ms');
  await d.shot('15-reflejos');
});

await step('charadas por equipos', async () => {
  await d.go('/game/charadas');
  await d.click('¡Empezar!');
  await d.click('30s');
  await d.click('👥 Dos equipos');
  await d.click('¡Empezar!');
  await d.click('Empezar el turno');
  await d.click('Acertado +100');
  await d.click('Acertado +100');
  await d.click('Pasar');
  await d.shot('16-charadas');
});

await step('memoria visual y piedra papel tijera', async () => {
  await d.go('/game/ppt');
  await d.click('¡Empezar!');
  await d.click('¡Al mejor de 3!');
  await d.click('Soy Ana, ¡listo!');
  await d.click('piedra');
  await d.click('Soy Ana, ¡listo!').catch(() => d.click('Soy Beto, ¡listo!'));
  await clickAny('tijera');
  await expect('Gana Ana');
  await d.shot('17-ppt');
});

await step('memoria visual', async () => {
  await d.go('/game/memoria-visual');
  await d.click('¡Empezar!');
  await d.click('¡Empezar!');
  await d.click('¡Empezar!');
  await expect('MEMORIZA');
  await d.shot('17b-memoria');
  await d.sleep(2600);
  await expect('TU TURNO');
  await d.click('Color 1'); await d.click('Color 2'); await d.click('Color 3'); await d.click('Color 4');
  if (!(await d.has('¡FALLASTE!')) && !(await d.has('MEMORIZA')) && !(await d.has('TU TURNO'))) throw new Error('estado inesperado');
});

await step('zona +18 protegida', async () => {
  await d.go('/play/games?ambiente=adultos');
  await expect('Zona para adultos');
  await d.shot('18-age-gate');
  await d.click('Todos somos mayores de 18');
  await expect('Verdad o reto +18');
});

await step('favoritos y recientes en portada', async () => {
  await d.go('/game/emojis');
  await d.click('☆ Guardar');
  await d.go('/');
  await expect('Partidas recientes');
  await expect('Tus favoritos');
  await expect('Recomendados para 4 participantes');
  await d.fullShot('19-portada-con-datos');
});

await step('sección en línea sin red', async () => {
  await d.go('/online');
  await expect('Jugar en línea');
  await d.shot('20-online');
});

console.log('\nRESUMEN');
for (const r of results) console.log(r.join(' · '));
const uniqueErrors = [...new Set(d.errors)].filter((e) => !/supabase|fetch|Failed to load|ERR_|net::|WebSocket|realtime/i.test(e ?? ''));
console.log('\nErrores de consola de la app:', uniqueErrors.length ? uniqueErrors.slice(0, 8) : 'ninguno');
d.close();
process.exit(results.some((r) => r[0] === 'FALLO') ? 1 : 0);
