import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { api } from '@/backend/api';
import { toPartyError, type PartyError } from '@/backend/errors';
import type { RoomState } from '@/backend/types';
import { minigameFor } from '@/minigames/registry';
import { PlayerAvatar } from '@/players/PlayerAvatar';
import { MAX_PLAYERS, MIN_PLAYERS } from '@/scoring/mostLikely';
import { Banner, Body, Card, NeonButton, NeonTitle } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

export function LobbyView({ state, refresh }: { state: RoomState; refresh: () => void }) {
  const { room } = state;
  const players = state.players.filter((p) => p.is_active);
  const isHost = room.host_id === state.me;
  const game = minigameFor(room.game_mode);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<PartyError | null>(null);

  const missing = Math.max(0, MIN_PLAYERS - players.length);
  const full = players.length >= MAX_PLAYERS;

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      await api.startGame(room.id);
      refresh();
    } catch (e) {
      setError(toPartyError(e));
    } finally {
      setStarting(false);
    }
  };

  const share = () =>
    Share.share({ message: `¡Únete a mi sala de PARTYVERSE! Código: ${room.code}` }).catch(() => undefined);

  return (
    <View style={{ gap: space.md }}>
      <Card accent={colors.cyan} style={styles.codeCard}>
        <Text style={styles.codeLabel}>CÓDIGO DE SALA</Text>
        <Text style={styles.code} selectable accessibilityLabel={`Código ${room.code.split('').join(' ')}`}>
          {room.code}
        </Text>
        <NeonButton label="Compartir código" variant="secondary" onPress={share} style={{ alignSelf: 'stretch' }} />
      </Card>

      {game ? (
        <View>
          <NeonTitle color={colors.pink} style={{ fontSize: 20 }}>
            {game.title}
          </NeonTitle>
          <Body muted>{game.tagline}</Body>
          <Body muted>
            {room.total_rounds} rondas · {room.vote_seconds}s para votar
          </Body>
        </View>
      ) : null}

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Jugadores</Text>
        <Text style={[styles.count, full && { color: colors.warning }]}>
          {players.length}/{MAX_PLAYERS}
        </Text>
      </View>

      <View style={{ gap: space.sm }}>
        {players.map((p) => (
          <View key={p.user_id} style={styles.playerRow}>
            <PlayerAvatar avatar={p.avatar} size={42} />
            <Text style={styles.playerName} numberOfLines={1}>
              {p.nickname}
              {p.user_id === state.me ? ' (tú)' : ''}
            </Text>
            {p.is_host ? <Text style={styles.hostBadge}>ANFITRIÓN</Text> : null}
          </View>
        ))}
      </View>

      {full ? <Banner kind="warning" text="Sala llena: 12 jugadores." /> : null}
      {error ? <Banner text={error.message} /> : null}

      {isHost ? (
        <NeonButton
          label={missing > 0 ? `Faltan ${missing} jugador${missing > 1 ? 'es' : ''}` : '¡Empezar partida!'}
          onPress={start}
          disabled={missing > 0}
          loading={starting}
        />
      ) : (
        <Body muted style={{ textAlign: 'center' }}>
          Esperando a que el anfitrión inicie la partida…
        </Body>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  codeCard: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
  codeLabel: { color: colors.muted, fontWeight: '900', letterSpacing: 3, fontSize: 12 },
  code: {
    color: colors.cyan,
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 10,
    textShadowColor: colors.cyan,
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
    fontVariant: ['tabular-nums'],
  },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
  count: { color: colors.cyan, fontWeight: '900', fontSize: 16 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerName: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 16 },
  hostBadge: {
    color: colors.pink,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.5,
    borderWidth: 1,
    borderColor: colors.pink,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
});
