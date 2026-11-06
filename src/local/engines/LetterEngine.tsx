/** Basta / Stop y Categorías contra reloj: letra al azar, categorías y puntos anotados. */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LetterConfig } from '@/catalog/types';
import { STOP_LETTERS } from '@/content/misc';
import { Body, Card, NeonButton } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';
import { addPoints, emptyStats, randomLetter, zeroScores } from '../logic';
import { Chips, RevealCard, TimerBar, useTimer } from '../ui';
import type { EngineProps } from './types';

type Phase = 'setup' | 'play' | 'score';

export function LetterEngine({ game, players, onFinish }: EngineProps) {
  const cfg = (game.config as { data: LetterConfig }).data;
  const [rounds, setRounds] = useState(3);
  const [seconds, setSeconds] = useState(cfg.defaultSeconds);
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [used, setUsed] = useState<string[]>([]);
  const [letter, setLetter] = useState('A');
  const [scores, setScores] = useState(() => zeroScores(players));
  const [roundPts, setRoundPts] = useState(() => zeroScores(players));
  const [stats] = useState(() => emptyStats(players));
  const timer = useTimer(seconds * 1000, phase === 'play', () => setPhase('score'));

  const begin = (r: number) => {
    const l = randomLetter(STOP_LETTERS, used);
    setUsed((u) => [...u, l]);
    setLetter(l);
    setRound(r);
    setRoundPts(zeroScores(players));
    timer.reset(seconds * 1000);
    setPhase('play');
  };

  const bump = (id: string, d: number) => setRoundPts((s) => ({ ...s, [id]: Math.max(0, (s[id] ?? 0) + d) }));

  const closeRound = () => {
    let s = scores;
    for (const p of players) s = addPoints(s, p.id, roundPts[p.id] ?? 0);
    setScores(s);
    if (round + 1 >= rounds) onFinish({ scores: s, stats });
    else begin(round + 1);
  };

  if (phase === 'setup') {
    return (
      <View style={{ gap: space.md }}>
        <Chips label="Rondas" value={rounds} onChange={setRounds} options={[1, 3, 5].map((n) => ({ value: n, label: String(n) }))} />
        <Chips label="Tiempo" value={seconds} onChange={setSeconds} options={[30, 60, 90, 120].map((s) => ({ value: s, label: `${s}s` }))} />
        <Body muted>Cada jugador necesita papel y lápiz. Pon el móvil donde todos lo vean.</Body>
        <NeonButton label="¡Sacar letra!" onPress={() => begin(0)} />
      </View>
    );
  }

  if (phase === 'play') {
    return (
      <View style={{ gap: space.md }}>
        <Text style={styles.kicker}>RONDA {round + 1}/{rounds}</Text>
        <RevealCard revealKey={letter + round} accent={colors.cyan}>
          <Text style={styles.letter}>{letter}</Text>
        </RevealCard>
        <TimerBar left={timer.left} total={seconds * 1000} />
        <Card style={{ gap: 4 }}>
          {cfg.categories.map((c) => (
            <Text key={c} style={styles.cat}>
              • {c}
            </Text>
          ))}
        </Card>
        <NeonButton label="✋ ¡Basta!" onPress={() => setPhase('score')} />
      </View>
    );
  }

  return (
    <View style={{ gap: space.md }}>
      <Text style={styles.kicker}>PUNTOS DE LA RONDA · LETRA {letter}</Text>
      <Body muted>10 por respuesta única, 5 si alguien repitió, 0 si está vacía.</Body>
      {players.map((p) => (
        <View key={p.id} style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {p.emoji} {p.name}
          </Text>
          <Pressable onPress={() => bump(p.id, -5)} style={styles.pill} accessibilityLabel={`Restar 5 a ${p.name}`}>
            <Text style={styles.pillText}>−5</Text>
          </Pressable>
          <Text style={styles.pts}>{roundPts[p.id] ?? 0}</Text>
          <Pressable onPress={() => bump(p.id, 5)} style={styles.pill} accessibilityLabel={`Sumar 5 a ${p.name}`}>
            <Text style={styles.pillText}>+5</Text>
          </Pressable>
          <Pressable onPress={() => bump(p.id, 10)} style={[styles.pill, { borderColor: colors.cyan }]} accessibilityLabel={`Sumar 10 a ${p.name}`}>
            <Text style={[styles.pillText, { color: colors.cyan }]}>+10</Text>
          </Pressable>
        </View>
      ))}
      <NeonButton label={round + 1 >= rounds ? 'Ver resultados' : 'Siguiente letra'} onPress={closeRound} />
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.muted, fontWeight: '900', letterSpacing: 2, fontSize: 12, textAlign: 'center' },
  letter: { color: colors.cyan, fontSize: 96, fontWeight: '900', textShadowColor: colors.cyan, textShadowRadius: 24, textShadowOffset: { width: 0, height: 0 } },
  cat: { color: colors.text, fontWeight: '700', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: radius.md, padding: space.sm },
  name: { flex: 1, color: colors.text, fontWeight: '800' },
  pill: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { color: colors.text, fontWeight: '900' },
  pts: { color: colors.text, fontWeight: '900', fontSize: 18, width: 36, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
