/** 1. Pantalla de bienvenida y acceso de invitado. */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { toPartyError, type PartyError } from '@/backend/errors';
import { useSession } from '@/players/session';
import { routes } from '@/navigation/routes';
import { Banner, Body, Card, LoadingView, NeonButton, Screen } from '@/ui/components';
import { colors, space, type } from '@/ui/theme';

export default function WelcomeScreen() {
  const { status, profile, profileLoaded, signInAsGuest } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PartyError | null>(null);

  if (status === 'signedIn' && profileLoaded) {
    return <Redirect href={profile ? routes.home : routes.profile} />;
  }

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
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.logo}>PARTY</Text>
        <Text style={[styles.logo, styles.logoAccent]}>VERSE</Text>
        <Body muted style={styles.tagline}>
          Minijuegos en tiempo real para jugar con tus amigos.
        </Body>
      </View>

      {status === 'unconfigured' ? (
        <Card accent={colors.warning} style={{ gap: space.sm }}>
          <Text style={styles.warnTitle}>Falta conectar Supabase</Text>
          <Body muted>
            Crea el archivo .env.local a partir de .env.example con la URL y la clave publicable de tu proyecto, y
            reinicia con «npx expo start --clear». Detalles en el README.
          </Body>
        </Card>
      ) : status === 'loading' || (status === 'signedIn' && !profileLoaded) ? (
        <LoadingView label="Conectando…" />
      ) : (
        <View style={{ gap: space.md }}>
          {error ? <Banner text={error.message} /> : null}
          <NeonButton label="Jugar como invitado" onPress={enter} loading={busy} />
          <Body muted style={{ textAlign: 'center', fontSize: 13 }}>
            Gratis · Sin registro · Sin anuncios invasivos
          </Body>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  logo: {
    ...type.hero,
    fontSize: 52,
    color: colors.violetSoft,
    textShadowColor: colors.violet,
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
    lineHeight: 58,
  },
  logoAccent: { color: colors.cyan, textShadowColor: colors.cyan },
  tagline: { textAlign: 'center', marginTop: space.md, maxWidth: 280 },
  warnTitle: { color: colors.warning, fontWeight: '900', fontSize: 18 },
});
