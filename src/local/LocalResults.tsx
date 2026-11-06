/** Resultados de una partida local: clasificación, equipos, reconocimientos y celebración. */
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Body, Card, NeonButton, NeonTitle } from '@/ui/components';
import { colors, glow, radius, space } from '@/ui/theme';
import { awards, joinNames, ranking, type LocalPlayer, type LocalResult } from './logic';

const MEDALS = ['🥇', '🥈', '🥉'];

export function LocalResults({
  players,
  result,
  onAgain,
  onOther,
}: {
  players: LocalPlayer[];
  result: LocalResult;
  onAgain: () => void;
  onOther: () => void;
}) {
  const hasPoints = Object.values(result.scores).some((s) => s > 0);
  const ranked = ranking(players, result.scores);
  const winners = ranked.filter((r) => r.rank === 1 && r.score > 0).map((r) => r.player.name);
  const awardList = awards(players, result).filter((a) => a.emoji !== '👑');
  const byId = new Map(players.map((p) => [p.id, p]));
  const teamWinner = result.teams?.length ? [...result.teams].sort((a, b) => b.score - a.score)[0] : null;
  const teamTie = result.teams && result.teams.length > 1 && result.teams.every((t) => t.score === result.teams![0].score);

  return (
    <View style={{ gap: space.md }}>
      <Confetti />
      <View style={{ alignItems: 'center', gap: space.xs }}>
        <Text style={styles.kicker}>¡FIN DE LA PARTIDA!</Text>
        <NeonTitle color={colors.pink} style={{ textAlign: 'center' }}>
          {teamWinner && !teamTie
            ? `¡Gana el ${teamWinner.name}!`
            : teamTie
              ? '¡Empate entre equipos!'
              : winners.length > 1
                ? `¡Empate! ${joinNames(winners)}`
                : winners.length === 1
                  ? `¡Gana ${winners[0]}!`
                  : '¡Qué buena ronda!'}
        </NeonTitle>
        {result.summary ? <Body muted style={{ textAlign: 'center' }}>{result.summary}</Body> : null}
      </View>

      {result.teams?.length ? (
        <View style={styles.teams}>
          {result.teams.map((t) => (
            <Card key={t.name} accent={t === teamWinner && !teamTie ? colors.pink : undefined} style={styles.team}>
              <Text style={styles.teamName}>{t.name}</Text>
              <Text style={styles.teamScore}>{t.score}</Text>
              <Body muted style={{ fontSize: 12, textAlign: 'center' }}>{t.ids.map((id) => byId.get(id)?.name).join(', ')}</Body>
            </Card>
          ))}
        </View>
      ) : null}

      {hasPoints ? (
        <View style={{ gap: space.sm }}>
          {ranked.map(({ rank, player, score }) => (
            <View key={player.id} style={[styles.row, rank === 1 && score > 0 && { borderColor: colors.pink, boxShadow: glow(colors.pink, 12) }]}>
              <Text style={styles.rank}>{MEDALS[rank - 1] ?? `${rank}.`}</Text>
              <Text style={{ fontSize: 24 }}>{player.emoji}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {player.name}
              </Text>
              <Text style={styles.score}>{score}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Body muted style={{ textAlign: 'center' }}>Este juego no lleva puntos: lo importante era pasarlo bien. 💜</Body>
      )}

      {awardList.length ? (
        <View style={{ gap: space.sm }}>
          <Text style={styles.section}>Reconocimientos</Text>
          {awardList.map((a) => (
            <View key={a.title} style={styles.award}>
              <Text style={{ fontSize: 24 }}>{a.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.awardTitle}>{a.title}</Text>
                <Body muted>{joinNames(a.playerIds.map((id) => byId.get(id)?.name ?? ''))}</Body>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <NeonButton label="Jugar otra vez" onPress={onAgain} />
      <NeonButton label="Elegir otro juego" variant="secondary" onPress={onOther} />
    </View>
  );
}

/** Lluvia breve de emojis para celebrar. */
function Confetti() {
  const { width } = useWindowDimensions();
  const pieces = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({ x: Math.random() * (width - 40), delay: Math.random() * 600, e: ['🎉', '✨', '💜', '⭐', '🎊'][i % 5] })),
    [width],
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Piece key={i} {...p} />
      ))}
    </View>
  );
}

function Piece({ x, delay, e }: { x: number; delay: number; e: string }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(y, { toValue: 1, duration: 2200, delay, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
  }, [y, delay]);
  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x,
        top: -30,
        fontSize: 22,
        opacity: y.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
        transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, 700] }) }, { rotate: y.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
      }}
    >
      {e}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.muted, fontWeight: '900', letterSpacing: 3, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: space.sm },
  rank: { width: 34, textAlign: 'center', fontSize: 20, color: colors.text, fontWeight: '900' },
  name: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 16 },
  score: { color: colors.cyan, fontWeight: '900', fontSize: 20, fontVariant: ['tabular-nums'] },
  section: { color: colors.text, fontWeight: '900', fontSize: 18 },
  award: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: space.sm },
  awardTitle: { color: colors.text, fontWeight: '800' },
  teams: { flexDirection: 'row', gap: space.sm },
  team: { flex: 1, alignItems: 'center', gap: 2 },
  teamName: { color: colors.muted, fontWeight: '800' },
  teamScore: { color: colors.text, fontWeight: '900', fontSize: 28 },
});
