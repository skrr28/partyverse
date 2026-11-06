/** Juego: reglas → partida (motor local) → resultados. */
import { useState } from 'react';
import { Platform, StyleSheet, Text, View, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CATEGORIES, gameById } from '@/catalog/games';
import { AgeGate } from '@/local/AgeGate';
import { ENGINES } from '@/local/engines';
import { LocalResults } from '@/local/LocalResults';
import { ranking, type LocalResult } from '@/local/logic';
import { useParty } from '@/local/party';
import { routes } from '@/navigation/routes';
import { Banner, Body, Card, NeonButton, NeonTitle, Screen } from '@/ui/components';
import { colors, space } from '@/ui/theme';

type Phase = 'intro' | 'playing' | 'results';

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = id ? gameById(id) : undefined;
  const party = useParty();
  const [phase, setPhase] = useState<Phase>('intro');
  const [result, setResult] = useState<LocalResult | null>(null);
  const [runKey, setRunKey] = useState(0);

  const back = () => (router.canGoBack() ? router.back() : router.replace(routes.hub));

  if (!game) {
    return (
      <Screen>
        <Banner text="Ese juego no existe." />
        <NeonButton label="Volver al inicio" onPress={() => router.replace(routes.hub)} />
      </Screen>
    );
  }

  const includeAdult = party.adultConfirmed && !party.settings.hideAdult;
  if (game.adult && !includeAdult) {
    return (
      <Screen scroll>
        <NeonButton label="← Volver" variant="ghost" onPress={back} style={styles.back} />
        <AgeGate onCancel={back} />
      </Screen>
    );
  }

  const players = party.players;
  const enough = players.length >= game.minPlayers;
  const tooMany = players.length > game.maxPlayers;
  const Engine = ENGINES[game.config.engine];
  const category = CATEGORIES.find((c) => c.id === game.category);
  const fav = party.favorites.includes(game.id);

  const quit = () => {
    const msg = 'Se perderá el progreso de esta partida.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`¿Salir del juego?\n\n${msg}`)) setPhase('intro');
      return;
    }
    Alert.alert('¿Salir del juego?', msg, [
      { text: 'Seguir jugando', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => setPhase('intro') },
    ]);
  };

  const finish = (r: LocalResult) => {
    setResult(r);
    setPhase('results');
    const top = ranking(players, r.scores)[0];
    party.recordPlay({ gameId: game.id, at: Date.now(), players: players.length, winner: top && top.score > 0 ? top.player.name : undefined });
  };

  if (phase === 'playing' && Engine) {
    return (
      <Screen scroll>
        <View style={styles.topBar}>
          <NeonButton label="✕ Salir" variant="ghost" onPress={quit} style={styles.back} />
          <Text style={styles.topTitle} numberOfLines={1}>
            {game.emoji} {game.title}
          </Text>
        </View>
        <Engine key={runKey} game={game} players={players.slice(0, game.maxPlayers)} onFinish={finish} />
      </Screen>
    );
  }

  if (phase === 'results' && result) {
    return (
      <Screen scroll>
        <LocalResults
          players={players.slice(0, game.maxPlayers)}
          result={result}
          onAgain={() => {
            setRunKey((k) => k + 1);
            setPhase('playing');
          }}
          onOther={() => router.replace(routes.games(party.ambiente ? { ambiente: party.ambiente } : {}))}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.topBar}>
        <NeonButton label="← Volver" variant="ghost" onPress={back} style={styles.back} />
        <View style={{ flex: 1 }} />
        <NeonButton label={fav ? '★ Favorito' : '☆ Guardar'} variant="ghost" onPress={() => party.toggleFavorite(game.id)} style={styles.back} />
      </View>
      <View style={{ alignItems: 'center', gap: space.xs }}>
        <Text style={{ fontSize: 64 }}>{game.emoji}</Text>
        <NeonTitle style={{ textAlign: 'center' }}>{game.title}</NeonTitle>
        <Body muted style={{ textAlign: 'center' }}>
          {category?.emoji} {category?.label} · 👥 {game.minPlayers}–{game.maxPlayers} · ⏱ ~{game.minutes} min · {game.mode === 'online' ? 'En línea' : 'Un solo móvil'}
        </Body>
      </View>
      <Body style={{ textAlign: 'center' }}>{game.description}</Body>

      <Card style={{ gap: space.xs }}>
        <Text style={styles.rulesTitle}>Cómo se juega</Text>
        {game.rules.map((r, i) => (
          <Body key={i}>
            {i + 1}. {r}
          </Body>
        ))}
      </Card>

      {game.mode === 'online' ? (
        <>
          <Body muted>Cada participante necesita su propio móvil y conexión a internet.</Body>
          <NeonButton label="Ir a jugar en línea" onPress={() => router.push(routes.online)} />
        </>
      ) : (
        <>
          <Card style={{ gap: space.xs }}>
            <Text style={styles.rulesTitle}>Participantes ({players.length})</Text>
            <Body muted>{players.length ? players.map((p) => `${p.emoji} ${p.name}`).join('  ') : 'Todavía no hay nadie.'}</Body>
            <NeonButton label="Editar participantes" variant="ghost" onPress={() => router.push(routes.players)} />
          </Card>
          {!enough ? <Banner kind="warning" text={`Este juego necesita al menos ${game.minPlayers} participante${game.minPlayers === 1 ? '' : 's'}.`} /> : null}
          {tooMany ? <Banner kind="info" text={`Admite hasta ${game.maxPlayers}: jugarán los primeros ${game.maxPlayers} de la lista.`} /> : null}
          {!Engine ? <Banner text="Este juego aún no está disponible en esta versión." /> : null}
          <NeonButton
            label="¡Empezar!"
            disabled={!enough || !Engine}
            onPress={() => {
              setRunKey((k) => k + 1);
              setPhase('playing');
            }}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  topTitle: { flex: 1, color: colors.text, fontWeight: '900', fontSize: 16 },
  back: { minHeight: 40, paddingHorizontal: space.md },
  rulesTitle: { color: colors.text, fontWeight: '900', fontSize: 17 },
});
