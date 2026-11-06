/** Paso 3: catálogo filtrable por ambiente, categoría, tamaño del grupo y búsqueda. */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AMBIENTES, CATEGORIES, GAMES, filterGames } from '@/catalog/games';
import { GameCard } from '@/catalog/GameCard';
import type { AmbienteId, CategoryId } from '@/catalog/types';
import { AgeGate } from '@/local/AgeGate';
import { useParty } from '@/local/party';
import { StepHeader } from '@/local/StepHeader';
import { routes } from '@/navigation/routes';
import { Body, NeonButton, NeonInput, NeonTitle, Screen } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

export default function GamesScreen() {
  const params = useLocalSearchParams<{ ambiente?: string; category?: string }>();
  const party = useParty();
  const [ambiente, setAmbiente] = useState<AmbienteId | null>((params.ambiente as AmbienteId) ?? party.ambiente ?? null);
  const [category, setCategory] = useState<CategoryId | null>((params.category as CategoryId) ?? null);
  const [query, setQuery] = useState('');
  const [fitGroup, setFitGroup] = useState(true);
  const players = party.players.length;
  const includeAdult = party.adultConfirmed && !party.settings.hideAdult;
  const needsGate = ambiente === 'adultos' && !includeAdult;

  const list = filterGames(GAMES, { ambiente, category, query, players: fitGroup && players ? players : null, includeAdult });
  const ambs = AMBIENTES.filter((a) => a.id !== 'adultos' || !party.settings.hideAdult);

  const pickAmb = (id: AmbienteId | null) => {
    setAmbiente(id);
    party.setAmbiente(id);
  };

  return (
    <Screen scroll>
      <StepHeader step={3} />
      <NeonTitle>Elige un juego</NeonTitle>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Todos" on={!ambiente} onPress={() => pickAmb(null)} />
        {ambs.map((a) => (
          <Chip key={a.id} label={`${a.emoji} ${a.label}`} on={ambiente === a.id} onPress={() => pickAmb(a.id)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Todas las categorías" on={!category} onPress={() => setCategory(null)} small />
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={`${c.emoji} ${c.label}`} on={category === c.id} onPress={() => setCategory(c.id)} small />
        ))}
      </ScrollView>

      <NeonInput value={query} onChangeText={setQuery} placeholder="Buscar juego…" autoCorrect={false} accessibilityLabel="Buscar juego" />
      {players ? (
        <Pressable onPress={() => setFitGroup((v) => !v)} accessibilityRole="switch" accessibilityState={{ checked: fitGroup }} style={styles.toggle}>
          <Text style={styles.toggleBox}>{fitGroup ? '☑' : '☐'}</Text>
          <Text style={styles.toggleText}>Solo juegos para {players} participante{players === 1 ? '' : 's'}</Text>
        </Pressable>
      ) : (
        <NeonButton label="👥 Añadir participantes" variant="ghost" onPress={() => router.push(routes.players)} />
      )}

      {needsGate ? (
        <AgeGate onCancel={() => pickAmb(null)} />
      ) : (
        <>
          <Body muted>
            {list.length} juego{list.length === 1 ? '' : 's'}
          </Body>
          <View style={{ gap: space.sm }}>
            {list.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </View>
          {list.length === 0 ? (
            <Body muted style={{ textAlign: 'center' }}>
              No hay juegos con estos filtros. Prueba otro ambiente o quita el filtro del grupo.
            </Body>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function Chip({ label, on, onPress, small }: { label: string; on: boolean; onPress: () => void; small?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.chip, small && { paddingVertical: 6 }, on && { borderColor: colors.pink, backgroundColor: colors.surfaceHigh }]}>
      <Text style={[styles.chipText, on && { color: colors.text }, small && { fontSize: 12 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: { gap: space.sm, paddingRight: space.lg },
  chip: { paddingHorizontal: space.md, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  chipText: { color: colors.muted, fontWeight: '800', fontSize: 13 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 },
  toggleBox: { color: colors.cyan, fontSize: 20 },
  toggleText: { color: colors.text, fontWeight: '700' },
});
