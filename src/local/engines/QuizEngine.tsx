/** Trivia por turnos con temporizador, puntos por rapidez y explicación. */
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { QuizConfig, QuizQuestion } from '@/catalog/types';
import { Body, Card, NeonButton } from '@/ui/components';
import { colors, glow, radius, space } from '@/ui/theme';
import { Deck, QUIZ_SECONDS, addPoints, emptyStats, quizPoints, turnPlayer, zeroScores } from '../logic';
import { Chips, PassDevice, ScoreStrip, TimerBar, TurnHeader, useTimer } from '../ui';
import type { EngineProps } from './types';

type Phase = 'setup' | 'pass' | 'question' | 'feedback';

export function QuizEngine({ game, players, onFinish }: EngineProps) {
  const cfg = (game.config as { data: QuizConfig }).data;
  const [perPlayer, setPerPlayer] = useState(3);
  const [difficulty, setDifficulty] = useState<0 | 1 | 2 | 3>(0);
  const [phase, setPhase] = useState<Phase>('setup');
  const [turn, setTurn] = useState(0);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [gained, setGained] = useState(0);
  const [scores, setScores] = useState(() => zeroScores(players));
  const [stats, setStats] = useState(() => emptyStats(players));
  const deck = useRef<Deck<QuizQuestion> | null>(null);

  const total = perPlayer * players.length;
  const player = turnPlayer(players, turn);
  const timer = useTimer(QUIZ_SECONDS * 1000, phase === 'question', () => answer(-1));

  const answer = (idx: number) => {
    if (!question || phase !== 'question') return;
    const correct = idx === question.answer;
    const pts = quizPoints(correct, timer.left);
    setPicked(idx);
    setGained(pts);
    setScores((s) => addPoints(s, player.id, pts));
    setStats((s) => ({ ...s, [player.id]: { ...s[player.id], correct: s[player.id].correct + (correct ? 1 : 0), done: s[player.id].done + 1 } }));
    setPhase('feedback');
  };

  const next = () => {
    const t = turn + 1;
    if (t >= total) {
      onFinish({ scores, stats });
      return;
    }
    setTurn(t);
    setPhase(players.length > 1 ? 'pass' : 'question');
    if (players.length === 1) ask();
  };

  const ask = () => {
    setQuestion(deck.current!.draw());
    setPicked(null);
    timer.reset(QUIZ_SECONDS * 1000);
    setPhase('question');
  };

  if (phase === 'setup') {
    const counts = [1, 2, 3].map((d) => cfg.pack.filter((q) => q.difficulty === d).length);
    return (
      <View style={{ gap: space.md }}>
        <Chips label="Preguntas por persona" value={perPlayer} onChange={setPerPlayer} options={[3, 5, 8].map((n) => ({ value: n, label: String(n) }))} />
        <Chips
          label="Dificultad"
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: 0, label: 'Mezcla' },
            ...([1, 2, 3] as const).filter((d) => counts[d - 1] >= 3).map((d) => ({ value: d, label: d === 1 ? 'Fácil' : d === 2 ? 'Media' : 'Difícil' })),
          ]}
        />
        <Body muted>{cfg.pack.length} preguntas disponibles. 20 segundos por pregunta.</Body>
        <NeonButton
          label="¡Empezar!"
          onPress={() => {
            const pool = difficulty ? cfg.pack.filter((q) => q.difficulty === difficulty) : cfg.pack;
            deck.current = new Deck(pool.length ? pool : cfg.pack);
            if (players.length > 1) setPhase('pass');
            else ask();
          }}
        />
      </View>
    );
  }

  if (phase === 'pass') {
    return (
      <View style={{ gap: space.md }}>
        <ScoreStrip players={players} scores={scores} highlight={player.id} />
        <PassDevice player={player} note={`Pregunta ${turn + 1} de ${total}`} onReady={ask} />
      </View>
    );
  }

  if (!question) return null;
  const showResult = phase === 'feedback';

  return (
    <View style={{ gap: space.md }}>
      <TurnHeader player={player} right={<Text style={styles.small}>{turn + 1}/{total}</Text>} />
      {!showResult ? <TimerBar left={timer.left} total={QUIZ_SECONDS * 1000} /> : null}
      <Card accent={colors.violet}>
        <Text style={styles.q}>{question.q}</Text>
      </Card>
      <View style={{ gap: space.sm }}>
        {question.options.map((o, i) => {
          const isAnswer = i === question.answer;
          const isPicked = i === picked;
          const border = showResult ? (isAnswer ? colors.success : isPicked ? colors.danger : colors.border) : colors.border;
          return (
            <Pressable
              key={o}
              disabled={showResult}
              onPress={() => answer(i)}
              accessibilityRole="button"
              accessibilityLabel={o}
              style={({ pressed }) => [
                styles.option,
                { borderColor: border, opacity: pressed ? 0.8 : 1 },
                showResult && isAnswer && { boxShadow: glow(colors.success, 12) },
              ]}
            >
              <Text style={styles.letter}>{'ABCD'[i]}</Text>
              <Text style={styles.optionText}>{o}</Text>
              {showResult && isAnswer ? <Text>✅</Text> : showResult && isPicked ? <Text>❌</Text> : null}
            </Pressable>
          );
        })}
      </View>
      {showResult ? (
        <>
          <Card style={{ alignItems: 'center', gap: 4 }}>
            <Text style={[styles.gain, { color: gained ? colors.success : colors.danger }]}>
              {gained ? `¡Correcto! +${gained}` : picked === -1 ? '⏰ Se acabó el tiempo' : 'Incorrecto'}
            </Text>
            {question.explain ? <Body muted style={{ textAlign: 'center' }}>{question.explain}</Body> : null}
          </Card>
          <NeonButton label={turn + 1 >= total ? 'Ver resultados' : 'Siguiente'} onPress={next} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  small: { color: colors.muted, fontWeight: '800' },
  q: { color: colors.text, fontSize: 20, fontWeight: '800', lineHeight: 28 },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, borderWidth: 2, backgroundColor: colors.surface, minHeight: 56 },
  letter: { color: colors.cyan, fontWeight: '900', width: 20 },
  optionText: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '700' },
  gain: { fontSize: 22, fontWeight: '900' },
});
