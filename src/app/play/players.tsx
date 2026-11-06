/** Paso 2: participantes del grupo (se guardan en este dispositivo). */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AMBIENTES } from '@/catalog/games';
import { MAX_LOCAL_PLAYERS, useParty } from '@/local/party';
import { StepHeader } from '@/local/StepHeader';
import { routes } from '@/navigation/routes';
import { Banner, Body, NeonButton, NeonInput, NeonTitle, Screen } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

export default function PlayersScreen() {
  const party = useParty();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const amb = AMBIENTES.find((a) => a.id === party.ambiente);

  const add = () => {
    const r = party.addPlayer(name);
    if (r.ok) {
      setName('');
      setError(null);
    } else setError(r.reason ?? null);
  };

  return (
    <Screen scroll>
      <StepHeader step={2} />
      <NeonTitle>¿Quiénes juegan?</NeonTitle>
      {amb ? (
        <Body muted>
          Ambiente: {amb.emoji} {amb.label}
        </Body>
      ) : null}

      <View style={styles.addRow}>
        <NeonInput
          value={name}
          onChangeText={setName}
          placeholder="Nombre del participante"
          maxLength={16}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={add}
          style={{ flex: 1 }}
          accessibilityLabel="Nombre del participante"
        />
        <NeonButton label="Añadir" onPress={add} disabled={!name.trim()} style={{ paddingHorizontal: space.md }} />
      </View>
      {error ? <Banner kind="warning" text={error} /> : null}

      <Text style={styles.count}>
        {party.players.length}/{MAX_LOCAL_PLAYERS} participantes
      </Text>
      <View style={styles.list}>
        {party.players.map((p) => (
          <View key={p.id} style={styles.chip}>
            <Text style={{ fontSize: 20 }}>{p.emoji}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {p.name}
            </Text>
            <Pressable onPress={() => party.removePlayer(p.id)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Quitar a ${p.name}`}>
              <Text style={styles.remove}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>
      {party.players.length === 0 ? <Body muted>Añade al menos a una persona. Se recuerdan para la próxima vez.</Body> : null}
      {party.players.length > 1 ? <NeonButton label="Quitar a todos" variant="ghost" onPress={party.clearPlayers} /> : null}

      <NeonButton
        label={party.players.length ? `Elegir juego (${party.players.length})` : 'Añade participantes'}
        onPress={() => router.push(routes.games(party.ambiente ? { ambiente: party.ambiente } : {}))}
        disabled={party.players.length === 0}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  count: { color: colors.cyan, fontWeight: '900' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: space.sm, paddingRight: space.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  name: { color: colors.text, fontWeight: '800', maxWidth: 140 },
  remove: { color: colors.danger, fontWeight: '900', fontSize: 14, marginLeft: 4 },
});
