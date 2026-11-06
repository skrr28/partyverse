/** El impostor: roles secretos repartidos en privado, discusión, voto secreto y revelación. */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImpostorConfig } from '@/catalog/types';
import { Banner, Body, Card, NeonButton } from '@/ui/components';
import { colors, glow, radius, space } from '@/ui/theme';
import { addPoints, assignImpostors, emptyStats, maxImpostors, pickIndex, resolveImpostor, shuffle, tallyVotes, zeroScores, type LocalPlayer } from '../logic';
import { Chips, NO_PRESS_DELAY, PassDevice, ScoreStrip, TimerBar, useTimer } from '../ui';
import type { EngineProps } from './types';

type Phase = 'setup' | 'pass' | 'role' | 'discuss' | 'votePass' | 'vote' | 'tally' | 'guess' | 'reveal';
type Mode = 'sin-palabra' | 'parecida';

export function ImpostorEngine({ game, players, onFinish }: EngineProps) {
  const cfg = (game.config as { data: ImpostorConfig }).data;
  const cats = Object.keys(cfg.packs);
  const [category, setCategory] = useState<string>('Todas');
  const [impCount, setImpCount] = useState(1);
  const [mode, setMode] = useState<Mode>('sin-palabra');
  const [discussSec, setDiscussSec] = useState(120);
  const [rounds, setRounds] = useState(1);

  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [word, setWord] = useState<[string, string]>(['', '']);
  const [impostors, setImpostors] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [peek, setPeek] = useState(false);
  const [firstSpeaker, setFirstSpeaker] = useState<LocalPlayer | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [revote, setRevote] = useState(false);
  const [outcome, setOutcome] = useState<ReturnType<typeof resolveImpostor> | null>(null);
  const [scores, setScores] = useState(() => zeroScores(players));
  const [stats, setStats] = useState(() => emptyStats(players));

  const timer = useTimer(discussSec * 1000, phase === 'discuss');
  const ids = players.map((p) => p.id);
  const byId = new Map(players.map((p) => [p.id, p]));
  const current = players[idx];

  const startRound = () => {
    const pool = category === 'Todas' ? cats.flatMap((c) => cfg.packs[c]) : cfg.packs[category];
    setWord(pool[pickIndex(pool.length)]);
    setImpostors(assignImpostors(ids, impCount));
    setIdx(0);
    setVotes({});
    setRevote(false);
    setCandidates(ids);
    setOutcome(null);
    setPeek(false);
    setPhase('pass');
  };

  const afterRole = () => {
    setPeek(false);
    if (idx + 1 < players.length) {
      setIdx(idx + 1);
      setPhase('pass');
    } else {
      setFirstSpeaker(shuffle(players)[0]);
      timer.reset(discussSec * 1000);
      setPhase('discuss');
    }
  };

  const castVote = (target: string) => {
    const v = { ...votes, [current.id]: target };
    setVotes(v);
    if (idx + 1 < players.length) {
      setIdx(idx + 1);
      setPhase('votePass');
      return;
    }
    const { top } = tallyVotes(v);
    if (top.length > 1 && !revote) {
      // Desempate: nueva votación solo entre los empatados.
      setCandidates(top);
      setRevote(true);
      setVotes({});
      setIdx(0);
      setPhase('tally');
      return;
    }
    finishVote(v);
  };

  const finishVote = (v: Record<string, string>, guessed = false) => {
    const o = resolveImpostor(ids, impostors, v, guessed);
    const caughtImpostor = o.expelled && impostors.includes(o.expelled);
    if (caughtImpostor && mode === 'sin-palabra' && !guessed && phase !== 'guess') {
      setOutcome(o);
      setPhase('guess');
      return;
    }
    setOutcome(o);
    let s = scores;
    for (const [id, pts] of Object.entries(o.points)) s = addPoints(s, id, pts);
    setScores(s);
    setStats((st) => {
      const n = { ...st };
      for (const id of ids) if (o.points[id] > 0) n[id] = { ...n[id], correct: n[id].correct + 1 };
      return n;
    });
    setPhase('reveal');
  };

  const nextRound = () => {
    if (round + 1 >= rounds) {
      onFinish({
        scores,
        stats,
        summary: `La última palabra era «${word[0]}». ${impostors.map((i) => byId.get(i)?.name).join(' y ')} era${impostors.length > 1 ? 'n' : ''} impostor${impostors.length > 1 ? 'es' : ''}.`,
      });
      return;
    }
    setRound(round + 1);
    startRound();
  };

  if (phase === 'setup') {
    const max = maxImpostors(players.length);
    return (
      <View style={{ gap: space.md }}>
        <Chips label="Categoría" value={category} onChange={setCategory} options={['Todas', ...cats].map((c) => ({ value: c, label: c }))} />
        <Chips label="Impostores" value={impCount} onChange={setImpCount} options={Array.from({ length: max }, (_, i) => ({ value: i + 1, label: String(i + 1) }))} />
        <Chips
          label="Variante"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'sin-palabra', label: '🕵️ El impostor no sabe la palabra' },
            { value: 'parecida', label: '🎭 Infiltrado: palabra parecida' },
          ]}
        />
        <Body muted style={{ fontSize: 13 }}>
          {mode === 'parecida'
            ? 'En la variante infiltrado, el impostor recibe una palabra parecida y ni siquiera sabe que es el impostor.'
            : 'El impostor sabe que lo es, pero no conoce la palabra. Si lo descubren, puede robar puntos adivinándola.'}
        </Body>
        <Chips label="Tiempo de discusión" value={discussSec} onChange={setDiscussSec} options={[60, 120, 180].map((s) => ({ value: s, label: `${s / 60} min` }))} />
        <Chips label="Rondas" value={rounds} onChange={setRounds} options={[1, 3, 5].map((n) => ({ value: n, label: String(n) }))} />
        <NeonButton label="Repartir roles" onPress={startRound} />
      </View>
    );
  }

  if (phase === 'pass') {
    return <PassDevice player={current} note="Vas a ver tu rol en secreto." onReady={() => setPhase('role')} />;
  }

  if (phase === 'role') {
    const isImp = impostors.includes(current.id);
    const text = isImp ? (mode === 'parecida' ? word[1] : '¡Eres el impostor!') : word[0];
    return (
      <View style={{ gap: space.md }}>
        <Text style={styles.kicker}>{current.emoji} {current.name.toUpperCase()}</Text>
        <Pressable
          {...NO_PRESS_DELAY}
          onPressIn={() => setPeek(true)}
          onPressOut={() => setPeek(false)}
          accessibilityRole="button"
          accessibilityLabel="Mantén pulsado para ver tu rol"
          style={[styles.secret, peek && { borderColor: isImp && mode === 'sin-palabra' ? colors.pink : colors.cyan, boxShadow: glow(colors.cyan, 18) }]}
        >
          {peek ? (
            <>
              <Text style={styles.secretWord}>{text}</Text>
              {isImp && mode === 'sin-palabra' ? <Body muted style={{ textAlign: 'center' }}>Disimula y descubre la palabra escuchando a los demás.</Body> : <Body muted>Tu palabra secreta</Body>}
            </>
          ) : (
            <>
              <Text style={{ fontSize: 48 }}>🙈</Text>
              <Body muted>Mantén pulsado para ver</Body>
            </>
          )}
        </Pressable>
        <NeonButton label="Ya lo vi, ocultar y pasar" onPress={afterRole} />
      </View>
    );
  }

  if (phase === 'discuss') {
    return (
      <View style={{ gap: space.md }}>
        <Card accent={colors.violet} style={{ alignItems: 'center', gap: space.sm }}>
          <Text style={styles.kicker}>RONDA DE PISTAS {round + 1}/{rounds}</Text>
          <Body style={{ textAlign: 'center' }}>
            Empieza {firstSpeaker?.emoji} <Text style={{ fontWeight: '900' }}>{firstSpeaker?.name}</Text>. Por turnos, digan una palabra relacionada sin revelar la secreta. Pueden hacer preguntas.
          </Body>
        </Card>
        <TimerBar left={timer.left} total={discussSec * 1000} color={colors.violet} />
        <NeonButton
          label={timer.left > 0 ? 'Votar ya' : '¡Hora de votar!'}
          onPress={() => {
            setIdx(0);
            setPhase('votePass');
          }}
        />
      </View>
    );
  }

  if (phase === 'tally') {
    return (
      <View style={{ gap: space.md }}>
        <Banner kind="warning" text={`¡Empate entre ${candidates.map((c) => byId.get(c)?.name).join(', ')}! Desempate: voten solo entre ellos.`} />
        <NeonButton label="Votar el desempate" onPress={() => setPhase('votePass')} />
      </View>
    );
  }

  if (phase === 'votePass') {
    return <PassDevice player={current} note={revote ? 'Voto de desempate, en secreto.' : 'Tu voto es secreto.'} onReady={() => setPhase('vote')} />;
  }

  if (phase === 'vote') {
    const options = candidates.filter((c) => c !== current.id);
    return (
      <View style={{ gap: space.md }}>
        <Text style={styles.kicker}>{current.emoji} {current.name.toUpperCase()}: ¿QUIÉN ES EL IMPOSTOR?</Text>
        <View style={styles.grid}>
          {options.map((c) => {
            const p = byId.get(c)!;
            return (
              <Pressable key={c} onPress={() => castVote(c)} style={styles.tile} accessibilityRole="button" accessibilityLabel={`Votar a ${p.name}`}>
                <Text style={{ fontSize: 32 }}>{p.emoji}</Text>
                <Text style={styles.tileName} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {options.length === 0 ? <NeonButton label="No puedo votar (soy el empatado), pasar" variant="ghost" onPress={() => castVote(current.id)} /> : null}
      </View>
    );
  }

  if (phase === 'guess' && outcome?.expelled) {
    const imp = byId.get(outcome.expelled)!;
    return (
      <View style={{ gap: space.md }}>
        <Card accent={colors.pink} style={{ alignItems: 'center', gap: space.sm }}>
          <Text style={styles.big}>¡{imp.emoji} {imp.name} era impostor!</Text>
          <Body style={{ textAlign: 'center' }}>Última oportunidad: {imp.name}, di en voz alta cuál crees que era la palabra.</Body>
        </Card>
        <Body muted style={{ textAlign: 'center' }}>El grupo decide si acertó.</Body>
        <View style={styles.row}>
          <NeonButton label="Falló" variant="ghost" onPress={() => finishVote(votes, false)} style={{ flex: 1 }} />
          <NeonButton label="¡Acertó! +150" onPress={() => finishVote(votes, true)} style={{ flex: 1 }} />
        </View>
      </View>
    );
  }

  // reveal
  const { counts } = tallyVotes(votes);
  return (
    <View style={{ gap: space.md }}>
      <Card accent={outcome?.crewWins ? colors.success : colors.pink} style={{ alignItems: 'center', gap: space.sm }}>
        <Text style={styles.kicker}>{outcome?.crewWins ? 'GANA EL GRUPO' : 'GANA EL IMPOSTOR'}</Text>
        <Text style={styles.big}>{outcome?.crewWins ? '🎉 ¡Lo descubrieron!' : '😈 ¡Escapó!'}</Text>
        <Body style={{ textAlign: 'center' }}>
          Palabra: <Text style={{ fontWeight: '900', color: colors.cyan }}>{word[0]}</Text>
          {mode === 'parecida' ? `  ·  Infiltrado: ${word[1]}` : ''}
        </Body>
        <Body style={{ textAlign: 'center' }}>
          Impostor{impostors.length > 1 ? 'es' : ''}: {impostors.map((i) => `${byId.get(i)?.emoji} ${byId.get(i)?.name}`).join(', ')}
        </Body>
        {outcome?.expelled ? <Body muted>Expulsado: {byId.get(outcome.expelled)?.name}</Body> : <Body muted>Empate: nadie fue expulsado.</Body>}
      </Card>
      <View style={{ gap: 4 }}>
        {Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([id, n]) => (
            <Body key={id} muted>
              {byId.get(id)?.emoji} {byId.get(id)?.name}: {n} voto{n === 1 ? '' : 's'}
            </Body>
          ))}
      </View>
      <ScoreStrip players={players} scores={scores} />
      <NeonButton label={round + 1 >= rounds ? 'Ver resultados' : 'Siguiente ronda'} onPress={nextRound} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  kicker: { color: colors.muted, fontWeight: '900', letterSpacing: 2, fontSize: 12, textAlign: 'center' },
  big: { color: colors.text, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  secret: { minHeight: 240, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.lg },
  secretWord: { color: colors.text, fontSize: 34, fontWeight: '900', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  tile: { width: '30%', minWidth: 96, alignItems: 'center', gap: 4, paddingVertical: space.md, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  tileName: { color: colors.text, fontWeight: '800', maxWidth: '90%' },
});
