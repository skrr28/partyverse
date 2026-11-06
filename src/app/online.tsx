/** Juego en línea: acceso de invitado, crear sala y unirse con código. */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { api } from '@/backend/api';
import { toPartyError, type PartyError } from '@/backend/errors';
import { PlayerAvatar } from '@/players/PlayerAvatar';
import { useSession } from '@/players/session';
import { routes } from '@/navigation/routes';
import { Banner, Body, Card, LoadingView, NeonButton, NeonInput, NeonTitle, Screen } from '@/ui/components';
import { colors, space } from '@/ui/theme';

const CODE_RE = /^[A-HJKMNP-Z2-9]{6}$/;

export default function OnlineRoute() {
  const { status, profile, profileLoaded, profileError, reloadProfile, signInAsGuest } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PartyError | null>(null);

  if (status === 'signedIn' && profileLoaded && !profile) return <Redirect href={routes.profile} />;
  if (status === 'signedIn' && profile) return <HomeScreen />;

  const enter = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInAsGuest();
    } catch (e) {
      setError(toPartyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <BackToHub />
      <NeonTitle>Jugar en línea</NeonTitle>
      <Body muted>Cada persona juega desde su propio móvil: salas con código y contraseña, votos secretos y puntos validados en el servidor.</Body>
      {status === 'unconfigured' ? (
        <Banner kind="warning" text="El modo en línea aún no está configurado en esta instalación. Los juegos locales funcionan igual." />
      ) : status === 'loading' || (status === 'signedIn' && !profileLoaded && !profileError) ? (
        <LoadingView label="Conectando…" />
      ) : profileError ? (
        <Banner text={profileError.message} onRetry={reloadProfile} />
      ) : (
        <Card accent={colors.cyan} style={{ gap: space.sm }}>
          <Text style={styles.cardTitle}>Entrar como invitado</Text>
          <Body muted>Sin registro. Después eliges apodo y avatar.</Body>
          {error ? <Banner text={error.message} /> : null}
          <NeonButton label="Jugar en línea como invitado" onPress={enter} loading={busy} />
        </Card>
      )}
    </Screen>
  );
}

function BackToHub() {
  return (
    <NeonButton
      label="← Inicio"
      variant="ghost"
      onPress={() => (router.canGoBack() ? router.back() : router.replace(routes.hub))}
      style={{ alignSelf: 'flex-start', minHeight: 40, paddingHorizontal: space.md }}
    />
  );
}

function HomeScreen() {
  const { profile } = useSession();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<PartyError | null>(null);

  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const codeValid = CODE_RE.test(normalized);
  const newPasswordValid = newPassword.length >= 4 && newPassword.length <= 32;
  const joinPasswordValid = joinPassword.length >= 1;

  const create = async () => {
    setBusy('create');
    setError(null);
    try {
      const r = await api.createRoom(newPassword);
      setNewPassword('');
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
      const r = await api.joinRoom(normalized, joinPassword);
      setCode('');
      setJoinPassword('');
      router.push(routes.room(r.room_id));
    } catch (e) {
      setError(toPartyError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen scroll>
      <BackToHub />
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

      <NeonTitle>Jugar en línea</NeonTitle>

      <Card accent={colors.violet} style={{ gap: space.sm }}>
        <Text style={styles.cardTitle}>Crear sala</Text>
        <Body muted>Serás el anfitrión. Comparte el código y la contraseña con 2 a 11 amigos.</Body>
        <NeonInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Contraseña de la sala (4–32)"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={32}
          returnKeyType="go"
          onSubmitEditing={() => newPasswordValid && create()}
          accessibilityLabel="Contraseña para la nueva sala"
        />
        <NeonButton
          label="Crear sala"
          onPress={create}
          loading={busy === 'create'}
          disabled={!newPasswordValid || busy !== null}
        />
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
          returnKeyType="next"
          accessibilityLabel="Código de sala"
        />
        <NeonInput
          value={joinPassword}
          onChangeText={setJoinPassword}
          placeholder="Contraseña"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={32}
          returnKeyType="go"
          onSubmitEditing={() => codeValid && joinPasswordValid && join()}
          accessibilityLabel="Contraseña de la sala"
        />
        <NeonButton
          label="Unirme"
          variant="secondary"
          onPress={join}
          loading={busy === 'join'}
          disabled={!codeValid || !joinPasswordValid || busy !== null}
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
