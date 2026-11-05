/** 2. Selección de apodo y avatar. */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { toPartyError, type PartyError } from '@/backend/errors';
import { AVATARS } from '@/players/avatars';
import { PlayerAvatar } from '@/players/PlayerAvatar';
import { useSession } from '@/players/session';
import { RequireSession } from '@/navigation/RequireSession';
import { routes } from '@/navigation/routes';
import { Banner, Body, NeonButton, NeonInput, NeonTitle, Screen } from '@/ui/components';
import { colors, glow, radius, space } from '@/ui/theme';

export default function ProfileRoute() {
  return (
    <RequireSession requireProfile={false}>
      <ProfileScreen />
    </RequireSession>
  );
}

function ProfileScreen() {
  const { profile, saveProfile } = useSession();
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? AVATARS[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PartyError | null>(null);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
      setAvatar(profile.avatar);
    }
  }, [profile]);

  const trimmed = nickname.trim().replace(/\s+/g, ' ');
  const valid = trimmed.length >= 2 && trimmed.length <= 16;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveProfile(trimmed, avatar);
      if (router.canGoBack() && profile) router.back();
      else router.replace(routes.home);
    } catch (e) {
      setError(toPartyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <NeonTitle>{profile ? 'Editar perfil' : '¿Cómo te llamamos?'}</NeonTitle>

      <View style={styles.preview}>
        <PlayerAvatar avatar={avatar} size={96} />
        <Text style={styles.previewName}>{trimmed || 'Tu apodo'}</Text>
      </View>

      <NeonInput
        value={nickname}
        onChangeText={setNickname}
        placeholder="Apodo (2–16 caracteres)"
        maxLength={16}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        accessibilityLabel="Apodo"
      />
      <Body muted style={{ fontSize: 13 }}>
        {trimmed.length}/16
      </Body>

      <Text style={styles.section}>Elige tu avatar</Text>
      <View style={styles.grid} accessibilityRole="radiogroup">
        {AVATARS.map((a) => {
          const selected = a.id === avatar;
          return (
            <Pressable
              key={a.id}
              onPress={() => setAvatar(a.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`Avatar ${a.id}`}
              style={[styles.cell, selected && { borderColor: a.color, boxShadow: glow(a.color, 14) }]}
            >
              <PlayerAvatar avatar={a.id} size={48} dimmed={!selected} />
            </Pressable>
          );
        })}
      </View>

      {error ? <Banner text={error.message} /> : null}
      <NeonButton label="Guardar y continuar" onPress={save} disabled={!valid} loading={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center', gap: space.sm, marginVertical: space.sm },
  previewName: { color: colors.text, fontSize: 22, fontWeight: '900' },
  section: { color: colors.text, fontWeight: '800', fontSize: 16, marginTop: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  cell: {
    padding: 6,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
});
