/** Motor de tarjetas por turnos: verdad o reto, rompehielos, trabalenguas, parejas… */
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Prompt, PromptsConfig } from '@/catalog/types';
import { Body, Card, NeonButton, NeonInput } from '@/ui/components';
import { colors, space } from '@/ui/theme';
import { Deck, addPoints, emptyStats, turnPlayer, zeroScores } from '../logic';
import { Chips, RevealCard, ScoreStrip, TurnHeader } from '../ui';
import type { EngineProps } from './types';

type Phase = 'setup' | 'choose' | 'card' | 'done';

export function PromptsEngine({ game, players, onFinish }: EngineProps) {
  const cfg = (game.config as { data: PromptsConfig }).data;
  const [rounds, setRounds] = useState(3);
  const [level, setLevel] = useState<1 | 2 | 3>(cfg.levels?.[0] ?? 1);
  const [custom, setCustom] = useState<Prompt[]>([]);
  const [draft, setDraft] = useState('');
  const [draftKind, setDraftKind] = useState<'verdad' | 'reto'>('verdad');
  const [phase, setPhase] = useState<Phase>('setup');
  const [turn, setTurn] = useState(0);
  const [card, setCard] = useState<Prompt | null>(null);
  const [scores, setScores] = useState(() => zeroScores(players));
  const [stats, setStats] = useState(() => emptyStats(players));
  const decks = useRef<Record<string, Deck<Prompt>>>({});

  const totalTurns = rounds * players.length;
  const player = turnPlayer(players, turn);

  const pool = useMemo((): Record<string, Prompt[]> => {
    const all = [...cfg.pack, ...custom];
    if (!cfg.truthOrDare) return { any: all };
    // Nivel elegido y, si se acaban, los inferiores.
    const byKind = (kind: 'verdad' | 'reto') => {
      const exact = all.filter((p) => p.kind === kind && (p.level ?? 1) === level);
      return exact.length ? exact : all.filter((p) => p.kind === kind && (p.level ?? 1) <= level);
    };
    return { verdad: byKind('verdad'), reto: byKind('reto') };
  }, [cfg, custom, level]);

  const draw = (key: 'any' | 'verdad' | 'reto') => {
    const items = pool[key];
    if (!items?.length) return;
    decks.current[key] ??= new Deck(items);
    setCard(decks.current[key].draw());
    setPhase('card');
  };

  const start = () => {
    decks.current = {};
    setPhase(cfg.truthOrDare ? 'choose' : 'card');
    if (!cfg.truthOrDare) draw('any');
  };

  const next = (completed: boolean) => {
    if (completed) {
      if (cfg.points) setScores((s) => addPoints(s, player.id, cfg.points));
      setStats((s) => ({ ...s, [player.id]: { ...s[player.id], done: s[player.id].done + 1 } }));
    } else {
      setStats((s) => ({ ...s, [player.id]: { ...s[player.id], skipped: s[player.id].skipped + 1 } }));
    }
    const t = turn + 1;
    if (t >= totalTurns) {
      setPhase('done');
      // Los estados se actualizan de forma asíncrona: se calcula aquí el final.
      const finalScores = completed && cfg.points ? addPoints(scores, player.id, cfg.points) : scores;
      const finalStats = {
        ...stats,
        [player.id]: completed
          ? { ...stats[player.id], done: stats[player.id].done + 1 }
          : { ...stats[player.id], skipped: stats[player.id].skipped + 1 },
      };
      onFinish({ scores: finalScores, stats: finalStats });
      return;
    }
    setTurn(t);
    if (cfg.truthOrDare) {
      setPhase('choose');
      setCard(null);
    } else {
      // Recalcula el jugador del siguiente turno al sacar carta.
      decks.current.any ??= new Deck(pool.any ?? cfg.pack);
      setCard(decks.current.any.draw());
    }
  };

  const addCustom = () => {
    const text = draft.trim();
    if (text.length < 4) return;
    setCustom((c) => [...c, cfg.truthOrDare ? { text, kind: draftKind, level } : { text }]);
    setDraft('');
    decks.current = {};
  };

  if (phase === 'setup') {
    return (
      <View style={{ gap: space.md }}>
        <Chips
          label="Rondas (turnos por persona)"
          value={rounds}
          onChange={setRounds}
          options={[1, 2, 3, 5].map((n) => ({ value: n, label: String(n) }))}
        />
        {cfg.levels && cfg.levels.length > 1 ? (
          <Chips
            label="Intensidad"
            value={level}
            onChange={setLevel}
            options={cfg.levels.map((l) => ({ value: l, label: l === 1 ? '😇 Suave' : l === 2 ? '😏 Picante' : '🌶️ Atrevido' }))}
          />
        ) : null}
        {cfg.allowCustom ? (
          <Card style={{ gap: space.sm }}>
            <Text style={styles.small}>Añade tarjetas propias (opcional)</Text>
            {cfg.truthOrDare ? (
              <Chips
                value={draftKind}
                onChange={setDraftKind}
                options={[
                  { value: 'verdad', label: 'Verdad' },
                  { value: 'reto', label: 'Reto' },
                ]}
              />
            ) : null}
            <NeonInput value={draft} onChangeText={setDraft} placeholder="Escribe tu pregunta o reto" maxLength={140} onSubmitEditing={addCustom} />
            <NeonButton label="Añadir tarjeta" variant="secondary" onPress={addCustom} disabled={draft.trim().length < 4} />
            {custom.length ? <Body muted>{custom.length} tarjeta(s) propia(s) añadida(s).</Body> : null}
          </Card>
        ) : null}
        <NeonButton label="¡Empezar!" onPress={start} />
      </View>
    );
  }

  if (phase === 'done') return null;

  const roundNo = Math.floor(turn / players.length) + 1;

  return (
    <View style={{ gap: space.md }}>
      <TurnHeader player={player} right={<Text style={styles.small}>Ronda {roundNo}/{rounds}</Text>} />
      {cfg.points ? <ScoreStrip players={players} scores={scores} highlight={player.id} /> : null}

      {phase === 'choose' ? (
        <View style={{ gap: space.md }}>
          <Body style={{ textAlign: 'center' }}>{player.name}, ¿qué eliges?</Body>
          <View style={styles.row}>
            <NeonButton label="🗣️ Verdad" variant="secondary" onPress={() => draw('verdad')} style={{ flex: 1 }} />
            <NeonButton label="🔥 Reto" onPress={() => draw('reto')} style={{ flex: 1 }} />
          </View>
        </View>
      ) : card ? (
        <>
          <RevealCard revealKey={`${turn}-${card.text}`} accent={card.kind === 'reto' ? colors.pink : colors.violet}>
            {card.kind ? <Text style={[styles.kind, { color: card.kind === 'reto' ? colors.pink : colors.cyan }]}>{card.kind.toUpperCase()}</Text> : null}
            <Text style={styles.cardText}>{card.text}</Text>
          </RevealCard>
          <View style={styles.row}>
            <NeonButton label="Paso" variant="ghost" onPress={() => next(false)} style={{ flex: 1 }} />
            <NeonButton
              label={cfg.points ? `${cfg.doneLabel ?? 'Hecho'} +${cfg.points}` : cfg.doneLabel ?? 'Siguiente'}
              onPress={() => next(true)}
              style={{ flex: 2 }}
            />
          </View>
          <Body muted style={{ textAlign: 'center', fontSize: 13 }}>
            Pasar no penaliza. Nadie está obligado a responder ni a hacer nada.
          </Body>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  small: { color: colors.muted, fontWeight: '800', fontSize: 13 },
  kind: { fontWeight: '900', letterSpacing: 3, fontSize: 13 },
  cardText: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 30 },
});
