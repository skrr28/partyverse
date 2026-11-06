/** Perfil y configuración. */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { GAMES } from '@/catalog/games';
import { useParty } from '@/local/party';
import { routes } from '@/navigation/routes';
import { PlayerAvatar } from '@/players/PlayerAvatar';
import { useSession } from '@/players/session';
import { Body, Card, NeonButton, NeonTitle, Screen } from '@/ui/components';
import { colors, space } from '@/ui/theme';

export default function SettingsScreen() {
  const party = useParty();
  const { status, profile } = useSession();
  const plays = party.recent.length;

  return (
    <Screen scroll>
      <NeonButton
        label="← Inicio"
        variant="ghost"
        onPress={() => (router.canGoBack() ? router.back() : router.replace(routes.hub))}
        style={{ alignSelf: 'flex-start', minHeight: 40, paddingHorizontal: space.md }}
      />
      <NeonTitle>Perfil y configuración</NeonTitle>

      <Card style={{ gap: space.sm }}>
        <Text style={styles.title}>Perfil en línea</Text>
        {status === 'signedIn' && profile ? (
          <View style={styles.row}>
            <PlayerAvatar avatar={profile.avatar} size={48} />
            <Text style={styles.name}>{profile.nickname}</Text>
            <NeonButton label="Editar" variant="ghost" onPress={() => router.push(routes.profile)} style={{ minHeight: 40 }} />
          </View>
        ) : (
          <>
            <Body muted>Solo hace falta para jugar en línea con varios móviles.</Body>
            <NeonButton label="Configurar juego en línea" variant="secondary" onPress={() => router.push(routes.online)} />
          </>
        )}
      </Card>

      <Card style={{ gap: space.sm }}>
        <Text style={styles.title}>En este dispositivo</Text>
        <Body muted>
          {party.players.length} participante(s) guardado(s) · {party.favorites.length} favorito(s) · {plays} juego(s) reciente(s) · {party.customWheels.length} ruleta(s) propia(s)
        </Body>
        <NeonButton label="Editar participantes" variant="ghost" onPress={() => router.push(routes.players)} />
      </Card>

      <Card style={{ gap: space.sm }}>
        <Text style={styles.title}>Contenido</Text>
        <Pressable
          onPress={() => party.setHideAdult(!party.settings.hideAdult)}
          accessibilityRole="switch"
          accessibilityState={{ checked: party.settings.hideAdult }}
          style={styles.row}
        >
          <Text style={styles.box}>{party.settings.hideAdult ? '☑' : '☐'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Ocultar el contenido +18</Text>
            <Body muted style={{ fontSize: 13 }}>
              Recomendado si juegan menores o en reuniones familiares. Oculta el ambiente y los juegos para adultos.
            </Body>
          </View>
        </Pressable>
      </Card>

      <Card style={{ gap: space.xs }}>
        <Text style={styles.title}>Juego responsable</Text>
        <Body muted style={{ fontSize: 13 }}>
          Nadie está obligado a responder ni a hacer ningún reto: «Paso» nunca resta puntos. Los retos evitan situaciones peligrosas, ilegales o humillantes.
        </Body>
      </Card>

      <Body muted style={{ textAlign: 'center', fontSize: 12 }}>PARTYVERSE · {GAMES.length} juegos</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontWeight: '900', fontSize: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { flex: 1, color: colors.text, fontWeight: '800', fontSize: 16 },
  box: { color: colors.cyan, fontSize: 22 },
});
