/** Minijuegos competitivos: cara o cruz, piedra-papel-tijera, número, mayor o menor, reflejos y memoria. */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, Body, Card, NeonButton, NeonInput } from '@/ui/components';
import { colors, glow, radius, space } from '@/ui/theme';
import {
  CARD_LABELS,
  addPoints,
  drawCard,
  emptyStats,
  highLowCorrect,
  numberHint,
  rpsWinner,
  turnPlayer,
  zeroScores,
  type LocalPlayer,
  type Rps,
  type Scores,
} from '../logic';
import { Chips, NO_PRESS_DELAY, PassDevice, ScoreStrip, TurnHeader } from '../ui';
import type { EngineProps } from './types';

function RoundsSetup({ value, onChange, onStart, label = 'Rondas', options = [1, 3, 5], note }: { value: number; onChange: (n: number) => void; onStart: () => void; label?: string; options?: number[]; note?: string }) {
  return (
    <View style={{ gap: space.md }}>
      <Chips label={label} value={value} onChange={onChange} options={options.map((n) => ({ value: n, label: String(n) }))} />
      {note ? <Body muted>{note}</Body> : null}
      <NeonButton label="¡Empezar!" onPress={onStart} />
    </View>
  );
}

// ─────────── Cara o cruz ───────────
export function CoinEngine({ players, onFinish }: EngineProps) {
  const [rounds, setRounds] = useState(3);
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [bets, setBets] = useState<Record<string, 'cara' | 'cruz'>>({});
  const [result, setResult] = useState<'cara' | 'cruz' | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [scores, setScores] = useState(() => zeroScores(players));
  const [stats, setStats] = useState(() => emptyStats(players));
  const spin = useRef(new Animated.Value(0)).current;

  if (!started) return <RoundsSetup value={rounds} onChange={setRounds} onStart={() => setStarted(true)} />;

  const flip = () => {
    const r = Math.random() < 0.5 ? 'cara' : 'cruz';
    setFlipping(true);
    spin.setValue(0);
    Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
      setFlipping(false);
      setResult(r);
      let s = scores;
      const st = { ...stats };
      for (const p of players)
        if (bets[p.id] === r) {
          s = addPoints(s, p.id, 50);
          st[p.id] = { ...st[p.id], correct: st[p.id].correct + 1 };
        }
      setScores(s);
      setStats(st);
    });
  };

  const next = () => {
    if (round + 1 >= rounds) return onFinish({ scores, stats });
    setRound(round + 1);
    setBets({});
    setResult(null);
  };

  const allBet = players.every((p) => bets[p.id]);
  return (
    <View style={{ gap: space.md }}>
      <Text style={styles.kicker}>LANZAMIENTO {round + 1}/{rounds}</Text>
      <View style={{ alignItems: 'center' }}>
        <Animated.View
          style={[
            styles.coin,
            { transform: [{ rotateY: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1800deg'] }) }, { scale: spin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] }) }] },
          ]}
        >
          <Text style={{ fontSize: 56 }}>{result === 'cruz' ? '✖️' : '🪙'}</Text>
          <Text style={styles.coinText}>{flipping ? '…' : result ? result.toUpperCase() : '?'}</Text>
        </Animated.View>
      </View>
      {!result ? (
        <>
          {players.map((p) => (
            <View key={p.id} style={styles.betRow}>
              <Text style={styles.name} numberOfLines={1}>{p.emoji} {p.name}</Text>
              <Chips value={bets[p.id] ?? ('' as 'cara')} onChange={(v) => setBets((b) => ({ ...b, [p.id]: v }))} options={[{ value: 'cara', label: 'Cara' }, { value: 'cruz', label: 'Cruz' }]} />
            </View>
          ))}
          <NeonButton label={flipping ? 'Lanzando…' : allBet ? '¡Lanzar moneda!' : 'Todos deben apostar'} disabled={!allBet || flipping} onPress={flip} />
        </>
      ) : (
        <>
          <Body style={{ textAlign: 'center' }}>
            Acertaron: {players.filter((p) => bets[p.id] === result).map((p) => p.name).join(', ') || 'nadie'} (+50)
          </Body>
          <ScoreStrip players={players} scores={scores} />
          <NeonButton label={round + 1 >= rounds ? 'Ver resultados' : 'Siguiente lanzamiento'} onPress={next} />
        </>
      )}
    </View>
  );
}

// ─────────── Piedra, papel o tijera ───────────
const RPS: { v: Rps; e: string }[] = [
  { v: 'piedra', e: '✊' },
  { v: 'papel', e: '✋' },
  { v: 'tijera', e: '✌️' },
];

export function RpsEngine({ players, onFinish }: EngineProps) {
  const [a, setA] = useState(players[0]?.id);
  const [b, setB] = useState(players[1]?.id);
  const [phase, setPhase] = useState<'setup' | 'passA' | 'pickA' | 'passB' | 'pickB' | 'reveal' | 'won'>('setup');
  const [pickA, setPickA] = useState<Rps | null>(null);
  const [pickB, setPickB] = useState<Rps | null>(null);
  const [wins, setWins] = useState({ a: 0, b: 0 });
  const [scores, setScores] = useState(() => zeroScores(players));
  const [stats, setStats] = useState(() => emptyStats(players));
  const byId = new Map(players.map((p) => [p.id, p]));
  const pa = byId.get(a)!;
  const pb = byId.get(b)!;

  if (phase === 'setup') {
    const opts = players.map((p) => ({ value: p.id, label: `${p.emoji} ${p.name}` }));
    return (
      <View style={{ gap: space.md }}>
        <Chips label="Jugador 1" value={a} onChange={setA} options={opts} />
        <Chips label="Jugador 2" value={b} onChange={setB} options={opts} />
        {a === b ? <Banner kind="warning" text="Elige dos jugadores distintos." /> : null}
        <NeonButton label="¡Al mejor de 3!" disabled={a === b} onPress={() => setPhase('passA')} />
        <ScoreStrip players={players} scores={scores} />
        <NeonButton label="Terminar" variant="ghost" onPress={() => onFinish({ scores, stats })} />
      </View>
    );
  }
  const pick = (who: 'a' | 'b') => (
    <View style={{ gap: space.md }}>
      <TurnHeader player={who === 'a' ? pa : pb} label="ELIGE EN SECRETO" />
      <View style={styles.rpsRow}>
        {RPS.map((x) => (
          <Pressable
            key={x.v}
            style={styles.rpsBtn}
            accessibilityRole="button"
            accessibilityLabel={x.v}
            onPress={() => {
              if (who === 'a') {
                setPickA(x.v);
                setPhase('passB');
              } else {
                setPickB(x.v);
                setPhase('reveal');
              }
            }}
          >
            <Text style={{ fontSize: 44 }}>{x.e}</Text>
            <Text style={styles.rpsLabel}>{x.v}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
  if (phase === 'passA') return <PassDevice player={pa} onReady={() => setPhase('pickA')} />;
  if (phase === 'pickA') return pick('a');
  if (phase === 'passB') return <PassDevice player={pb} onReady={() => setPhase('pickB')} />;
  if (phase === 'pickB') return pick('b');

  const w = pickA && pickB ? rpsWinner(pickA, pickB) : 'empate';
  const applyRound = () => {
    const nw = { a: wins.a + (w === 'a' ? 1 : 0), b: wins.b + (w === 'b' ? 1 : 0) };
    setWins(nw);
    if (nw.a >= 2 || nw.b >= 2) {
      const winner = nw.a >= 2 ? pa : pb;
      setScores((s) => addPoints(s, winner.id, 100));
      setStats((s) => ({ ...s, [winner.id]: { ...s[winner.id], correct: s[winner.id].correct + 1 } }));
      setPhase('won');
    } else setPhase('passA');
  };
  if (phase === 'won') {
    const winner = wins.a >= 2 ? pa : pb;
    return (
      <View style={{ gap: space.md }}>
        <Card accent={colors.pink} style={{ alignItems: 'center', gap: space.sm }}>
          <Text style={styles.big}>🏆 {winner.emoji} {winner.name} gana el duelo</Text>
          <Body muted>{wins.a} – {wins.b} · +100 puntos</Body>
        </Card>
        <NeonButton
          label="Otro duelo"
          onPress={() => {
            setWins({ a: 0, b: 0 });
            setPhase('setup');
          }}
        />
        <NeonButton label="Ver resultados" variant="secondary" onPress={() => onFinish({ scores, stats })} />
      </View>
    );
  }
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.rpsRow}>
        <View style={styles.rpsReveal}>
          <Text style={{ fontSize: 56 }}>{RPS.find((x) => x.v === pickA)?.e}</Text>
          <Text style={styles.name}>{pa.name}</Text>
        </View>
        <Text style={styles.big}>VS</Text>
        <View style={styles.rpsReveal}>
          <Text style={{ fontSize: 56 }}>{RPS.find((x) => x.v === pickB)?.e}</Text>
          <Text style={styles.name}>{pb.name}</Text>
        </View>
      </View>
      <Text style={styles.big}>{w === 'empate' ? '¡Empate!' : `Gana ${w === 'a' ? pa.name : pb.name}`}</Text>
      <Body muted style={{ textAlign: 'center' }}>Marcador: {wins.a + (w === 'a' ? 1 : 0)} – {wins.b + (w === 'b' ? 1 : 0)}</Body>
      <NeonButton label="Continuar" onPress={applyRound} />
    </View>
  );
}

// ─────────── Adivina el número ───────────
export function NumberEngine({ players, onFinish }: EngineProps) {
  const [rounds, setRounds] = useState(3);
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [secret, setSecret] = useState(() => 1 + Math.floor(Math.random() * 100));
  const [turn, setTurn] = useState(0);
  const [guess, setGuess] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<LocalPlayer | null>(null);
  const [scores, setScores] = useState(() => zeroScores(players));
  const [stats, setStats] = useState(() => emptyStats(players));
  const [range, setRange] = useState<[number, number]>([1, 100]);

  if (!started) return <RoundsSetup value={rounds} onChange={setRounds} onStart={() => setStarted(true)} note="Número secreto entre 1 y 100." />;
  const player = turnPlayer(players, turn);
  const n = Number(guess);
  const valid = Number.isInteger(n) && n >= 1 && n <= 100;

  const tryIt = () => {
    if (!valid) return;
    const h = numberHint(secret, n);
    setGuess('');
    if (h === 'correcto') {
      setWinner(player);
      setScores((s) => addPoints(s, player.id, 100));
      setStats((s) => ({ ...s, [player.id]: { ...s[player.id], correct: s[player.id].correct + 1 } }));
      setLog((l) => [`${player.emoji} ${n} → ¡CORRECTO!`, ...l]);
      return;
    }
    setRange(([lo, hi]) => (h === 'mayor' ? [Math.max(lo, n + 1), hi] : [lo, Math.min(hi, n - 1)]));
    setLog((l) => [`${player.emoji} ${n} → el secreto es ${h === 'mayor' ? 'MAYOR ⬆️' : 'MENOR ⬇️'}`, ...l]);
    setTurn((t) => t + 1);
  };

  const nextRound = () => {
    if (round + 1 >= rounds) return onFinish({ scores, stats });
    setRound(round + 1);
    setSecret(1 + Math.floor(Math.random() * 100));
    setWinner(null);
    setLog([]);
    setRange([1, 100]);
    setTurn((t) => t + 1);
  };

  return (
    <View style={{ gap: space.md }}>
      <Text style={styles.kicker}>RONDA {round + 1}/{rounds} · ENTRE {range[0]} Y {range[1]}</Text>
      {winner ? (
        <>
          <Card accent={colors.success} style={{ alignItems: 'center', gap: 4 }}>
            <Text style={styles.big}>🎯 {winner.name} lo adivinó: {secret}</Text>
            <Body muted>+100 puntos</Body>
          </Card>
          <NeonButton label={round + 1 >= rounds ? 'Ver resultados' : 'Nuevo número'} onPress={nextRound} />
        </>
      ) : (
        <>
          <TurnHeader player={player} />
          <NeonInput value={guess} onChangeText={(t) => setGuess(t.replace(/[^0-9]/g, '').slice(0, 3))} keyboardType="number-pad" placeholder="Tu número" onSubmitEditing={tryIt} style={{ textAlign: 'center', fontSize: 28 }} />
          <NeonButton label="Probar" onPress={tryIt} disabled={!valid} />
        </>
      )}
      <ScoreStrip players={players} scores={scores} />
      {log.slice(0, 6).map((l, i) => (
        <Body key={i} muted>{l}</Body>
      ))}
    </View>
  );
}

// ─────────── Mayor o menor ───────────
export function HighLowEngine({ players, onFinish }: EngineProps) {
  const [rounds, setRounds] = useState(2);
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(0);
  const [card, setCard] = useState(() => drawCard());
  const [streak, setStreak] = useState(0);
  const [over, setOver] = useState<null | { next: number; ok: boolean }>(null);
  const [scores, setScores] = useState(() => zeroScores(players));
  const [stats, setStats] = useState(() => emptyStats(players));

  if (!started) return <RoundsSetup value={rounds} onChange={setRounds} options={[1, 2, 3]} label="Turnos por persona" onStart={() => setStarted(true)} />;
  const player = turnPlayer(players, turn);
  const total = rounds * players.length;

  const guess = (g: 'mayor' | 'menor') => {
    const next = drawCard();
    const ok = highLowCorrect(card, next, g);
    if (ok) {
      const s = streak + 1;
      setStreak(s);
      setScores((x) => addPoints(x, player.id, 20 * s));
      setStats((x) => ({ ...x, [player.id]: { ...x[player.id], correct: x[player.id].correct + 1, best: Math.max(x[player.id].best ?? 0, s) } }));
      setCard(next);
    } else {
      setOver({ next, ok });
    }
  };

  const nextTurn = () => {
    if (turn + 1 >= total) return onFinish({ scores, stats });
    setTurn(turn + 1);
    setStreak(0);
    setOver(null);
    setCard(drawCard());
  };

  return (
    <View style={{ gap: space.md }}>
      <TurnHeader player={player} right={<Text style={styles.streak}>🔥 {streak}</Text>} />
      <View style={styles.cards}>
        <View style={styles.playing}>
          <Text style={styles.cardValue}>{CARD_LABELS[card - 1]}</Text>
        </View>
        {over ? (
          <View style={[styles.playing, { borderColor: colors.danger }]}>
            <Text style={[styles.cardValue, { color: colors.danger }]}>{CARD_LABELS[over.next - 1]}</Text>
          </View>
        ) : null}
      </View>
      {over ? (
        <>
          <Body style={{ textAlign: 'center' }}>¡Fallaste! Racha final: {streak}</Body>
          <NeonButton label={turn + 1 >= total ? 'Ver resultados' : 'Siguiente jugador'} onPress={nextTurn} />
        </>
      ) : (
        <View style={styles.row2}>
          <NeonButton label="⬇️ Menor" variant="secondary" onPress={() => guess('menor')} style={{ flex: 1 }} />
          <NeonButton label="⬆️ Mayor" onPress={() => guess('mayor')} style={{ flex: 1 }} />
        </View>
      )}
      <ScoreStrip players={players} scores={scores} highlight={player.id} />
    </View>
  );
}

// ─────────── Reflejos ───────────
export function ReflexEngine({ players, onFinish }: EngineProps) {
  const [tries, setTries] = useState(3);
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(0);
  const [state, setState] = useState<'pass' | 'wait' | 'go' | 'early' | 'done'>('pass');
  const [ms, setMs] = useState<number | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});
  const goAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (!started) return <RoundsSetup value={tries} onChange={setTries} label="Intentos por persona" options={[1, 3, 5]} onStart={() => setStarted(true)} />;
  const total = tries * players.length;
  const player = turnPlayer(players, turn);

  const arm = () => {
    setMs(null);
    setState('wait');
    timer.current = setTimeout(() => {
      goAt.current = Date.now();
      setState('go');
    }, 1500 + Math.random() * 2500);
  };

  const tap = () => {
    if (state === 'wait') {
      if (timer.current) clearTimeout(timer.current);
      setState('early');
      return;
    }
    if (state === 'go') {
      const t = Date.now() - goAt.current;
      setMs(t);
      setBest((b) => ({ ...b, [player.id]: Math.min(b[player.id] ?? Infinity, t) }));
      setState('done');
    }
  };

  const finish = (b: Record<string, number>) => {
    const ranked = players.filter((p) => b[p.id] !== undefined).sort((x, y) => b[x.id] - b[y.id]);
    let s: Scores = zeroScores(players);
    const prizes = [150, 100, 50];
    ranked.forEach((p, i) => (s = addPoints(s, p.id, prizes[i] ?? 0)));
    const stats = emptyStats(players);
    for (const p of players) if (b[p.id] !== undefined) stats[p.id].best = b[p.id];
    onFinish({ scores: s, stats, summary: ranked.length ? `Mejor tiempo: ${ranked[0].name} con ${b[ranked[0].id]} ms.` : undefined });
  };

  const next = () => {
    if (turn + 1 >= total) return finish(best);
    setTurn(turn + 1);
    setState('pass');
  };

  if (state === 'pass') return <PassDevice player={player} note={`Intento ${Math.floor(turn / players.length) + 1} de ${tries}`} onReady={arm} cta="Preparado" />;

  const bg = state === 'go' ? colors.success : state === 'early' ? colors.danger : state === 'wait' ? '#7F1D1D' : colors.surface;
  return (
    <View style={{ gap: space.md }}>
      <Pressable {...NO_PRESS_DELAY} onPressIn={tap} style={[styles.reflex, { backgroundColor: bg }]} accessibilityRole="button" accessibilityLabel="Zona de reflejos">
        <Text style={styles.reflexText}>
          {state === 'wait' ? 'Espera el verde…' : state === 'go' ? '¡TOCA YA!' : state === 'early' ? '¡Demasiado pronto!' : `${ms} ms`}
        </Text>
      </Pressable>
      {state === 'early' ? <NeonButton label="Reintentar" onPress={arm} /> : null}
      {state === 'done' || state === 'early' ? <NeonButton label={turn + 1 >= total ? 'Ver resultados' : 'Siguiente'} variant="secondary" onPress={next} /> : null}
      <View style={{ gap: 2 }}>
        {players.filter((p) => best[p.id] !== undefined).sort((x, y) => best[x.id] - best[y.id]).map((p) => (
          <Body key={p.id} muted>{p.emoji} {p.name}: {best[p.id]} ms</Body>
        ))}
      </View>
    </View>
  );
}

// ─────────── Memoria visual ───────────
const PADS = [colors.violet, colors.cyan, colors.pink, colors.warning];

export function MemoryEngine({ players, onFinish }: EngineProps) {
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(0);
  const [seq, setSeq] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<'pass' | 'show' | 'input' | 'fail'>('pass');
  const [scores, setScores] = useState(() => zeroScores(players));
  const [stats, setStats] = useState(() => emptyStats(players));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!started) return <RoundsSetup value={1} onChange={() => undefined} options={[1]} label="Un turno por persona" onStart={() => setStarted(true)} note="La secuencia empieza con 3 colores y crece en cada acierto." />;
  const player = turnPlayer(players, turn);

  const play = (s: number[]) => {
    setPhase('show');
    setInput([]);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    s.forEach((pad, i) => {
      timers.current.push(setTimeout(() => setLit(pad), 300 + i * 650));
      timers.current.push(setTimeout(() => setLit(null), 300 + i * 650 + 420));
    });
    timers.current.push(setTimeout(() => setPhase('input'), 300 + s.length * 650));
  };

  const start = () => {
    const s = Array.from({ length: 3 }, () => Math.floor(Math.random() * 4));
    setSeq(s);
    play(s);
  };

  const press = (pad: number) => {
    if (phase !== 'input') return;
    const i = input.length;
    setLit(pad);
    timers.current.push(setTimeout(() => setLit(null), 180));
    if (seq[i] !== pad) {
      setPhase('fail');
      return;
    }
    setScores((s) => addPoints(s, player.id, 10));
    const ni = [...input, pad];
    setInput(ni);
    if (ni.length === seq.length) {
      setStats((st) => ({ ...st, [player.id]: { ...st[player.id], correct: st[player.id].correct + 1, best: seq.length } }));
      const s = [...seq, Math.floor(Math.random() * 4)];
      setSeq(s);
      timers.current.push(setTimeout(() => play(s), 500));
    }
  };

  const next = () => {
    if (turn + 1 >= players.length) return onFinish({ scores, stats });
    setTurn(turn + 1);
    setPhase('pass');
  };

  if (phase === 'pass') return <PassDevice player={player} note="Observa la secuencia y repítela." onReady={start} cta="¡Empezar!" />;

  return (
    <View style={{ gap: space.md }}>
      <TurnHeader player={player} right={<Text style={styles.streak}>Nivel {seq.length}</Text>} />
      <Text style={styles.kicker}>{phase === 'show' ? 'MEMORIZA…' : phase === 'input' ? `TU TURNO · ${input.length}/${seq.length}` : '¡FALLASTE!'}</Text>
      <View style={styles.pads}>
        {PADS.map((c, i) => (
          <Pressable
            key={i}
            {...NO_PRESS_DELAY}
            onPressIn={() => press(i)}
            accessibilityRole="button"
            accessibilityLabel={`Color ${i + 1}`}
            style={[styles.pad, { backgroundColor: c, opacity: lit === i ? 1 : 0.35 }, lit === i && { boxShadow: glow(c, 24) }]}
          />
        ))}
      </View>
      {phase === 'fail' ? (
        <>
          <Body style={{ textAlign: 'center' }}>Llegaste al nivel {seq.length}. Puntos: {scores[player.id]}</Body>
          <NeonButton label={turn + 1 >= players.length ? 'Ver resultados' : 'Siguiente jugador'} onPress={next} />
        </>
      ) : null}
      <ScoreStrip players={players} scores={scores} highlight={player.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.muted, fontWeight: '900', letterSpacing: 2, fontSize: 12, textAlign: 'center' },
  big: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  name: { color: colors.text, fontWeight: '800', flexShrink: 1 },
  coin: { width: 150, height: 150, borderRadius: 75, backgroundColor: colors.surfaceHigh, borderWidth: 4, borderColor: colors.warning, alignItems: 'center', justifyContent: 'center', boxShadow: glow(colors.warning, 20) },
  coinText: { color: colors.warning, fontWeight: '900', letterSpacing: 2 },
  betRow: { gap: 4, backgroundColor: colors.surface, borderRadius: radius.md, padding: space.sm },
  rpsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', gap: space.sm },
  rpsBtn: { flex: 1, alignItems: 'center', paddingVertical: space.lg, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.violet, backgroundColor: colors.surface },
  rpsLabel: { color: colors.text, fontWeight: '800', textTransform: 'capitalize' },
  rpsReveal: { alignItems: 'center', gap: 4 },
  row2: { flexDirection: 'row', gap: space.sm },
  streak: { color: colors.warning, fontWeight: '900', fontSize: 18 },
  cards: { flexDirection: 'row', justifyContent: 'center', gap: space.md },
  playing: { width: 110, height: 150, borderRadius: radius.md, backgroundColor: '#F8FAFC', borderWidth: 3, borderColor: colors.cyan, alignItems: 'center', justifyContent: 'center' },
  cardValue: { fontSize: 52, fontWeight: '900', color: '#0F172A' },
  reflex: { height: 320, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  reflexText: { color: colors.text, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  pads: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'center' },
  pad: { width: '44%', aspectRatio: 1, borderRadius: radius.lg },
});
