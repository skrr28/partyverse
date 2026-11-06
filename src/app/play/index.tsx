/** Paso 1: elegir el ambiente. */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AMBIENTES, GAMES } from '@/catalog/games';
import type { AmbienteId } from '@/catalog/types';
import { useParty } from '@/local/party';
import { routes } from '@/navigation/routes';
import { Body, NeonButton, NeonTitle, Screen } from '@/ui/components';
import { colors, glow, radius, space } from '@/ui/theme';
import { StepHeader } from '@/local/StepHeader';

export default function AmbienteScreen() {
  const party = useParty();
  const list = AMBIENTES.filter((a) => a.id !== 'adultos' || !party.settings.hideAdult);

  const choose = (id: AmbienteId | null) => {
    party.setAmbiente(id);
    router.push(routes.players);
  };

  return (
    <Screen scroll>
      <StepHeader step={1} />
      <NeonTitle>¿Qué ambiente hay hoy?</NeonTitle>
      <View style={styles.grid}>
        {list.map((a) => {
          const on = party.ambiente === a.id;
          const count = GAMES.filter((g) => g.ambientes.includes(a.id)).length;
          return (
            <Pressable
              key={a.id}
              onPress={() => choose(a.id)}
              accessibilityRole="button"
              accessibilityLabel={`${a.label}: ${a.hint}`}
              style={({ pressed }) => [styles.tile, on && styles.on, pressed && { transform: [{ scale: 0.97 }] }]}
            >
              <Text style={styles.emoji}>{a.emoji}</Text>
              <Text style={styles.label}>{a.label}</Text>
              <Text style={styles.hint}>{a.hint}</Text>
              <Text style={styles.count}>{count} juegos</Text>
            </Pressable>
          );
        })}
      </View>
      <NeonButton label="Me da igual: ver todo" variant="ghost" onPress={() => choose(null)} />
      <Body muted style={{ textAlign: 'center', fontSize: 12 }}>
        Podrás cambiar de ambiente en cualquier momento.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: { width: '47%', flexGrow: 1, gap: 2, padding: space.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  on: { borderColor: colors.pink, boxShadow: glow(colors.pink, 14) },
  emoji: { fontSize: 32 },
  label: { color: colors.text, fontWeight: '900', fontSize: 16 },
  hint: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  count: { color: colors.cyan, fontSize: 12, fontWeight: '900', marginTop: 4 },
});
