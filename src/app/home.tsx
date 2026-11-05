/** 3. Inicio: Crear sala / Unirme con código. */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/backend/api';
import { toPartyError, type PartyError } from '@/backend/errors';
import { PlayerAvatar } from '@/players/PlayerAvatar';
import { useSession } from '@/players/session';
import { RequireSession } from '@/navigation/RequireSession';
import { routes } from '@/navigation/routes';
import { Banner, Body, Card, NeonButton, NeonInput, NeonTitle, Screen } from '@/ui/components';
import { colors, space } from '@/ui/theme';

const CODE_RE = /^[A-HJKMNP-Z2-9]{6}$/;

export default function HomeRoute() {
  return (
    <RequireSession>
      <HomeScreen />
    </RequireSession>
  );
}

function HomeScreen() {
  const { profile } = useSession();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<PartyError | null>(null);

  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const codeValid = CODE_RE.test(normalized);

  const create = async () => {
    setBusy('create');
    setError(null);
    try {
      const r = await api.createRoom();
      router.push(routes.room(r.room_id));
    } catch (e) {
      setError(toPartyError(e));
    } finally {
      setBusy(null);
    }
  };

  const join = async () => {
    setBusy('join');
    setError(null);
    try {
      const r = await api.joinRoom(normalized);
      setCode('');
      router.push(routes.room(r.room_id));
    } catch (e) {
      setError(toPartyError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <PlayerAvatar avatar={profile?.avatar ?? 'astro'} size={52} />
        <View style={{ flex: 1 }}>
          <Body muted style={{ fontSize: 13 }}>
            Hola,
          </Body>
          <Text style={styles.name} numberOfLines={1}>
            {profile?.nickname}
          </Text>
        </View>
        <NeonButton label="Editar" variant="ghost" onPress={() => router.push(routes.profile)} style={styles.edit} />
      </View>

      <NeonTitle>¿A qué jugamos hoy?</NeonTitle>

      <Card accent={colors.violet} style={{ gap: space.sm }}>
        <Text style={styles.cardTitle}>Crear sala</Text>
        <Body muted>Serás el anfitrión. Comparte el código con 2 a 11 amigos.</Body>
        <NeonButton label="Crear sala" onPress={create} loading={busy === 'create'} disabled={busy !== null} />
      </Card>

      <Card accent={colors.cyan} style={{ gap: space.sm }}>
        <Text style={styles.cardTitle}>Unirme con código</Text>
        <NeonInput
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="ABC234"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          style={styles.codeInput}
          returnKeyType="go"
          onSubmitEditing={() => codeValid && join()}
          accessibilityLabel="Código de sala"
        />
        <NeonButton
          label="Unirme"
          variant="secondary"
          onPress={join}
          loading={busy === 'join'}
          disabled={!codeValid || busy !== null}
        />
      </Card>

      {error ? <Banner text={error.message} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  name: { color: colors.text, fontSize: 20, fontWeight: '900' },
  edit: { minHeight: 40, paddingHorizontal: space.md },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 20 },
  codeInput: { textAlign: 'center', letterSpacing: 8, fontSize: 26 },
});
