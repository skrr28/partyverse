import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/backend/api';
import { toPartyError, type PartyError } from '@/backend/errors';
import type { RoomState } from '@/backend/types';
import { PlayerAvatar } from '@/players/PlayerAvatar';
import { rankByScore } from '@/scoring/mostLikely';
import { Banner, Body, NeonButton, NeonTitle } from '@/ui/components';
import { colors, glow, radius, space } from '@/ui/theme';

const MEDALS = ['🥇', '🥈', '🥉'];

export function ResultsView({ state, refresh, onLeave }: { state: RoomState; refresh: () => void; onLeave: () => void }) {
  const isHost = state.room.host_id === state.me;
  const ranked = rankByScore(state.players);
  const winners = ranked.filter((r) => r.rank === 1).map((r) => r.item.nickname);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PartyError | null>(null);

  const playAgain = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.restartGame(state.room.id);
      refresh();
    } catch (e) {
      setError(toPartyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: space.md }}>
      <View style={{ alignItems: 'center', gap: space.xs }}>
        <Text style={styles.kicker}>FIN DE LA PARTIDA</Text>
        <NeonTitle color={colors.pink} style={{ textAlign: 'center' }}>
          {winners.length > 1 ? `¡Empate! ${winners.join(' y ')}` : `¡Gana ${winners[0] ?? '—'}!`}
        </NeonTitle>
      </View>

      <View style={{ gap: space.sm }}>
        {ranked.map(({ rank, item: p }) => {
          const first = rank === 1;
          return (
            <View
              key={p.user_id}
              style={[styles.row, first && { borderColor: colors.pink, boxShadow: glow(colors.pink, 14) }]}
              accessibilityLabel={`Puesto ${rank}, ${p.nickname}, ${p.score} puntos`}
            >
              <Text style={styles.rank}>{MEDALS[rank - 1] ?? `${rank}.`}</Text>
              <PlayerAvatar avatar={p.avatar} size={40} dimmed={!p.is_active} />
              <Text style={styles.name} numberOfLines={1}>
                {p.nickname}
                {p.user_id === state.me ? ' (tú)' : ''}
              </Text>
              <Text style={[styles.score, first && { color: colors.pink }]}>{p.score}</Text>
            </View>
          );
        })}
      </View>

      {error ? <Banner text={error.message} /> : null}
      {isHost ? (
        <NeonButton label="Volver a jugar" onPress={playAgain} loading={busy} />
      ) : (
        <Body muted style={{ textAlign: 'center' }}>
          El anfitrión puede iniciar otra partida.
        </Body>
      )}
      <NeonButton label="Salir de la sala" variant="ghost" onPress={onLeave} />
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.muted, fontWeight: '900', letterSpacing: 3, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.sm,
  },
  rank: { width: 34, textAlign: 'center', fontSize: 20, color: colors.text, fontWeight: '900' },
  name: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 16 },
  score: { color: colors.cyan, fontWeight: '900', fontSize: 20, fontVariant: ['tabular-nums'] },
});
