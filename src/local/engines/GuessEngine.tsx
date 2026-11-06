/** Motor de adivinar contra reloj: charadas, mímica, dibujo, palabras prohibidas, emojis… */
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GuessConfig, GuessWord } from '@/catalog/types';
import { Body, Card, NeonButton } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';
import { Deck, addPoints, emptyStats, makeTeams, zeroScores, type LocalPlayer } from '../logic';
import { Chips, PassDevice, RevealCard, ScoreStrip, TimerBar, TurnHeader, useTimer } from '../ui';
import type { EngineProps } from './types';

type Phase = 'setup' | 'pass' | 'play' | 'summary' | 'clue' | 'answer';
const POINTS = 100;

export function GuessEngine(props: EngineProps) {
  const cfg = (props.game.config as { data: GuessConfig }).data;
  return cfg.style === 'clue' ? <ClueMode {...props} cfg={cfg} /> : <PerformMode {...props} cfg={cfg} />;
}

function PerformMode({ players, onFinish, cfg }: EngineProps & { cfg: GuessConfig }) {
  const [seconds, setSeconds] = useState(cfg.defaultSeconds);
  const [turnsEach, setTurnsEach] = useState(1);
  const [useTeams, setUseTeams] = useState(cfg.allowTeams && players.length >= 4);
  const [difficulty, setDifficulty] = useState<0 | 1 | 2 | 3>(0);
  const [phase, setPhase] = useState<Phase>('setup');
  const [turn, setTurn] = useState(0);
  const [word, setWord] = useState<GuessWord | null>(null);
  const [hits, setHits] = useState<string[]>([]);
  const [scores, setScores] = useState(() => zeroScores(players));
  const [stats, setStats] = useState(() => emptyStats(players));
  const [teams, setTeams] = useState<{ name: string; ids: string[]; score: number }[]>([]);
  const deck = useRef<Deck<GuessWord> | null>(null);

  // Orden de actuación: alterna equipos (A1, B1, A2, B2…) o simplemente por jugador.
  const order: LocalPlayer[] = useMemo(() => {
    if (!useTeams || !teams.length) return players;
    const byId = new Map(players.map((p) => [p.id, p]));
    const max = Math.max(...teams.map((t) => t.ids.length));
    const out: LocalPlayer[] = [];
    for (let i = 0; i < max; i++) for (const t of teams) if (t.ids[i]) out.push(byId.get(t.ids[i])!);
    return out;
  }, [useTeams, teams, players]);

  const totalTurns = order.length * turnsEach;
  const performer = order[turn % Math.max(1, order.length)];
  const teamOf = (id: string) => teams.findIndex((t) => t.ids.includes(id));

  const timer = useTimer(seconds * 1000, phase === 'play', () => setPhase('summary'));

  const start = () => {
    const pool = difficulty ? cfg.pack.filter((w) => (w.difficulty ?? 1) === difficulty) : cfg.pack;
    deck.current = new Deck(pool.length >= 5 ? pool : cfg.pack);
    if (useTeams) setTeams(makeTeams(players, 2).map((t) => ({ ...t, score: 0 })));
    setPhase('pass');
  };

  const beginTurn = () => {
    setHits([]);
    setWord(deck.current!.draw());
    timer.reset(seconds * 1000);
    setPhase('play');
  };

  const hit = () => {
    if (!word) return;
    setHits((h) => [...h, word.word]);
    setScores((s) => addPoints(s, performer.id, POINTS));
    setStats((s) => ({ ...s, [performer.id]: { ...s[performer.id], correct: s[performer.id].correct + 1, done: s[performer.id].done + 1 } }));
    if (useTeams) {
      const ti = teamOf(performer.id);
      setTeams((ts) => ts.map((t, i) => (i === ti ? { ...t, score: t.score + POINTS } : t)));
    }
    setWord(deck.current!.draw());
  };

  const pass = () => {
    setStats((s) => ({ ...s, [performer.id]: { ...s[performer.id], skipped: s[performer.id].skipped + 1 } }));
    setWord(deck.current!.draw());
  };

  const nextTurn = () => {
    const t = turn + 1;
    if (t >= totalTurns) {
      onFinish({ scores, stats, teams: useTeams ? teams : undefined });
      return;
    }
    setTurn(t);
    setPhase('pass');
  };

  if (phase === 'setup') {
    return (
      <View style={{ gap: space.md }}>
        <Chips label="Tiempo por turno" value={seconds} onChange={setSeconds} options={[30, 45, 60, 90].map((s) => ({ value: s, label: `${s}s` }))} />
        <Chips label="Turnos por persona" value={turnsEach} onChange={setTurnsEach} options={[1, 2, 3].map((n) => ({ value: n, label: String(n) }))} />
        <Chips
          label="Dificultad"
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: 0, label: 'Mezcla' },
            { value: 1, label: 'Fácil' },
            { value: 2, label: 'Media' },
            { value: 3, label: 'Difícil' },
          ]}
        />
        {cfg.allowTeams && players.length >= 4 ? (
          <Chips
            label="Modalidad"
            value={useTeams ? 'equipos' : 'individual'}
            onChange={(v) => setUseTeams(v === 'equipos')}
            options={[
              { value: 'individual', label: '👤 Individual' },
              { value: 'equipos', label: '👥 Dos equipos' },
            ]}
          />
        ) : null}
        <NeonButton label="¡Empezar!" onPress={start} />
      </View>
    );
  }

  const header = (
    <>
      {useTeams && teams.length ? (
        <View style={styles.teams}>
          {teams.map((t, i) => (
            <View key={t.name} style={[styles.team, teamOf(performer.id) === i && { borderColor: colors.cyan }]}>
              <Text style={styles.teamName}>{t.name}</Text>
              <Text style={styles.teamScore}>{t.score}</Text>
            </View>
          ))}
        </View>
      ) : (
        <ScoreStrip players={players} scores={scores} highlight={performer.id} />
      )}
    </>
  );

  if (phase === 'pass') {
    const team = useTeams && teams.length ? teams[teamOf(performer.id)]?.name : null;
    return (
      <View style={{ gap: space.md }}>
        {header}
        <PassDevice
          player={performer}
          note={`${team ? `${team} · ` : ''}${cfg.howTo}. Que nadie más mire la pantalla.`}
          cta="Empezar el turno"
          onReady={beginTurn}
        />
      </View>
    );
  }

  if (phase === 'play' && word) {
    return (
      <View style={{ gap: space.md }}>
        <TurnHeader player={performer} label="ACTÚA" right={<Text style={styles.hits}>✅ {hits.length}</Text>} />
        <TimerBar left={timer.left} total={seconds * 1000} />
        <RevealCard revealKey={word.word} accent={colors.pink}>
          <Text style={styles.word}>{word.word}</Text>
          {word.forbidden ? (
            <View style={styles.forbidden}>
              <Text style={styles.forbiddenLabel}>PROHIBIDAS</Text>
              {word.forbidden.map((f) => (
                <Text key={f} style={styles.forbiddenWord}>
                  🚫 {f}
                </Text>
              ))}
            </View>
          ) : null}
        </RevealCard>
        <View style={styles.row}>
          <NeonButton label="Pasar" variant="ghost" onPress={pass} style={{ flex: 1 }} />
          <NeonButton label={`Acertado +${POINTS}`} onPress={hit} style={{ flex: 2 }} />
        </View>
      </View>
    );
  }

  // summary
  return (
    <View style={{ gap: space.md }}>
      {header}
      <Card accent={colors.violet} style={{ alignItems: 'center', gap: space.sm }}>
        <Text style={styles.kicker}>¡TIEMPO!</Text>
        <Text style={styles.word}>
          {performer.emoji} {hits.length} acierto{hits.length === 1 ? '' : 's'}
        </Text>
        {hits.length ? <Body muted style={{ textAlign: 'center' }}>{hits.join(' · ')}</Body> : null}
      </Card>
      <NeonButton label={turn + 1 >= totalTurns ? 'Ver resultados' : 'Siguiente turno'} onPress={nextTurn} />
    </View>
  );
}

function ClueMode({ players, onFinish, cfg }: EngineProps & { cfg: GuessConfig }) {
  const [count, setCount] = useState(10);
  const [phase, setPhase] = useState<Phase>('setup');
  const [i, setI] = useState(0);
  const [item, setItem] = useState<GuessWord | null>(null);
  const [scores, setScores] = useState(() => zeroScores(players));
  const [stats, setStats] = useState(() => emptyStats(players));
  const deck = useRef<Deck<GuessWord> | null>(null);
  const timer = useTimer(cfg.defaultSeconds * 1000, phase === 'clue', () => setPhase('answer'));

  const nextItem = (n: number) => {
    if (n >= count) {
      onFinish({ scores, stats });
      return;
    }
    setI(n);
    setItem(deck.current!.draw());
    timer.reset(cfg.defaultSeconds * 1000);
    setPhase('clue');
  };

  const award = (id: string) => {
    setScores((s) => addPoints(s, id, POINTS));
    setStats((s) => ({ ...s, [id]: { ...s[id], correct: s[id].correct + 1 } }));
    setPhase('answer');
  };

  if (phase === 'setup') {
    return (
      <View style={{ gap: space.md }}>
        <Chips label="Número de rondas" value={count} onChange={setCount} options={[5, 10, 15].map((n) => ({ value: n, label: String(n) }))} />
        <Body muted>Pon el móvil donde todos lo vean. {cfg.howTo}.</Body>
        <NeonButton
          label="¡Empezar!"
          onPress={() => {
            deck.current = new Deck(cfg.pack);
            nextItem(0);
          }}
        />
      </View>
    );
  }

  if (!item) return null;
  return (
    <View style={{ gap: space.md }}>
      <ScoreStrip players={players} scores={scores} />
      <Text style={styles.kicker}>
        RONDA {i + 1} / {count}
      </Text>
      {phase === 'clue' ? <TimerBar left={timer.left} total={cfg.defaultSeconds * 1000} /> : null}
      <RevealCard revealKey={`${i}-${phase}`} accent={phase === 'answer' ? colors.cyan : colors.pink}>
        <Text style={item.clue && item.clue.length < 12 ? styles.emojiClue : styles.textClue}>{item.clue}</Text>
        {phase === 'answer' ? <Text style={styles.answer}>👉 {item.word}</Text> : null}
      </RevealCard>
      {phase === 'clue' ? (
        <>
          <Text style={styles.kicker}>¿QUIÉN ACERTÓ PRIMERO?</Text>
          <View style={styles.grid}>
            {players.map((p) => (
              <Pressable key={p.id} onPress={() => award(p.id)} style={styles.who} accessibilityRole="button" accessibilityLabel={`${p.name} acertó`}>
                <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                <Text style={styles.whoName} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <NeonButton label="Ver respuesta" variant="ghost" onPress={() => setPhase('answer')} />
        </>
      ) : (
        <NeonButton label={i + 1 >= count ? 'Ver resultados' : 'Siguiente'} onPress={() => nextItem(i + 1)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  word: { color: colors.text, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  kicker: { color: colors.muted, fontWeight: '900', letterSpacing: 3, fontSize: 12, textAlign: 'center' },
  hits: { color: colors.success, fontWeight: '900', fontSize: 18 },
  forbidden: { alignItems: 'center', gap: 2, marginTop: space.sm },
  forbiddenLabel: { color: colors.danger, fontWeight: '900', letterSpacing: 2, fontSize: 11 },
  forbiddenWord: { color: colors.danger, fontWeight: '800', fontSize: 16 },
  teams: { flexDirection: 'row', gap: space.sm },
  team: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: space.sm, alignItems: 'center', backgroundColor: colors.surface },
  teamName: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  teamScore: { color: colors.text, fontWeight: '900', fontSize: 22 },
  emojiClue: { fontSize: 56, textAlign: 'center' },
  textClue: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 30 },
  answer: { color: colors.cyan, fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  who: { alignItems: 'center', gap: 2, padding: space.sm, minWidth: 80, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  whoName: { color: colors.text, fontWeight: '800', fontSize: 13, maxWidth: 90 },
});
