/**
 * 4–7. Sala multijugador. La vista depende del estado que dicta el servidor:
 * vestíbulo → minijuego (votación / revelación) → clasificación final.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '@/backend/api';
import { useRoundDriver } from '@/engine/useRoundDriver';
import { minigameFor } from '@/minigames/registry';
import { RequireSession } from '@/navigation/RequireSession';
import { routes } from '@/navigation/routes';
import { LobbyView } from '@/rooms/LobbyView';
import { ResultsView } from '@/rooms/ResultsView';
import { useRoom, type Connection } from '@/rooms/useRoom';
import { Banner, Body, LoadingView, NeonButton, Screen } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

export default function RoomRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RequireSession>{id ? <RoomScreen roomId={id} /> : null}</RequireSession>;
}

function RoomScreen({ roomId }: { roomId: string }) {
  const { state, error, connection, offsetMs, refresh } = useRoom(roomId);
  const { voteLeftMs, revealLeftMs } = useRoundDriver(state, offsetMs, refresh);
  const [leaving, setLeaving] = useState(false);

  const leave = useCallback(async () => {
    setLeaving(true);
    try {
      await api.leaveRoom(roomId);
    } catch {
      // Si no hay red, se sale igualmente; el servidor conserva el puesto para reconectar.
    }
    if (router.canGoBack()) router.back();
    else router.replace(routes.online);
  }, [roomId]);

  const confirmLeave = useCallback(() => {
    const playing = state?.room.status === 'playing';
    const message = playing ? 'La partida sigue sin ti. Podrás volver con el mismo código.' : '¿Seguro que quieres salir?';
    if (Platform.OS === 'web') {
      // Alert de React Native no muestra diálogos en el navegador.
      if (globalThis.confirm?.(`Salir de la sala\n\n${message}`)) void leave();
      return;
    }
    Alert.alert(
      'Salir de la sala',
      message,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: leave },
      ],
    );
  }, [leave, state?.room.status]);

  // Botón atrás de Android: confirmar antes de abandonar.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmLeave();
      return true;
    });
    return () => sub.remove();
  }, [confirmLeave]);

  if (!state) {
    return (
      <Screen>
        {error ? (
          <View style={{ gap: space.md, flex: 1, justifyContent: 'center' }}>
            <Banner text={error.message} onRetry={refresh} />
            <NeonButton label="Volver al inicio" variant="ghost" onPress={() => router.replace(routes.online)} />
          </View>
        ) : (
          <LoadingView label="Entrando en la sala…" />
        )}
      </Screen>
    );
  }

  const { room } = state;
  const me = state.players.find((p) => p.user_id === state.me);
  const game = minigameFor(room.game_mode);

  let body: ReactNode;
  if (room.status === 'closed') {
    body = <Banner kind="info" text="Esta sala se ha cerrado." />;
  } else if (room.status === 'lobby') {
    body = <LobbyView state={state} refresh={refresh} />;
  } else if (room.status === 'finished') {
    body = <ResultsView state={state} refresh={refresh} onLeave={leave} />;
  } else if (game && state.round) {
    body = (
      <game.Component state={state} offsetMs={offsetMs} voteLeftMs={voteLeftMs} revealLeftMs={revealLeftMs} refresh={refresh} />
    );
  } else {
    body = <LoadingView label="Preparando la ronda…" />;
  }

  return (
    <Screen scroll>
      <View style={styles.topBar}>
        <NeonButton label="Salir" variant="ghost" onPress={confirmLeave} loading={leaving} style={styles.leave} />
        <View style={{ flex: 1 }} />
        {room.status === 'playing' && me ? <Text style={styles.myScore}>{me.score} pts</Text> : null}
        <ConnectionPill connection={connection} hasError={!!error} />
      </View>

      {error && connection === 'live' ? <Banner kind="warning" text={error.message} onRetry={refresh} /> : null}
      {me && !me.is_active ? (
        <Banner kind="info" text="Saliste de esta sala. Únete de nuevo con el código para seguir jugando." />
      ) : null}

      {body}

      {room.status === 'closed' ? (
        <NeonButton label="Volver al inicio" onPress={() => router.replace(routes.online)} />
      ) : null}
    </Screen>
  );
}

function ConnectionPill({ connection, hasError }: { connection: Connection; hasError: boolean }) {
  const { label, color } =
    connection === 'live' && !hasError
      ? { label: 'En vivo', color: colors.success }
      : connection === 'connecting'
        ? { label: 'Conectando…', color: colors.cyan }
        : { label: 'Reconectando…', color: colors.warning };
  return (
    <View style={[styles.pill, { borderColor: color }]} accessibilityLabel={`Conexión: ${label}`}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Body style={[styles.pillText, { color }]}>{label}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  leave: { minHeight: 38, paddingHorizontal: space.md },
  myScore: { color: colors.cyan, fontWeight: '900', fontSize: 16 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontSize: 12, fontWeight: '800' },
});
