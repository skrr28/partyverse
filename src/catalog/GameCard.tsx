/** Tarjeta de juego: nombre, descripción, participantes, duración, modalidad y botón para comenzar. */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { routes } from '@/navigation/routes';
import { useParty } from '@/local/party';
import { colors, radius, space } from "@/ui/theme";
import type { GameDef } from './types';

export function GameCard({ game, compact }: { game: GameDef; compact?: boolean }) {
  const { favorites, toggleFavorite } = useParty();
  const fav = favorites.includes(game.id);
  const players = game.minPlayers === game.maxPlayers ? `${game.minPlayers}` : `${game.minPlayers}–${game.maxPlayers}`;
  return (
    <Pressable
      onPress={() => router.push(routes.game(game.id))}
      accessibilityRole="button"
      accessibilityLabel={`${game.title}. ${game.description}`}
      style={({ pressed }) => [styles.card, compact && styles.compact, pressed && { transform: [{ scale: 0.98 }], borderColor: colors.violet }]}
    >
      <View style={styles.top}>
        <Text style={styles.emoji}>{game.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {game.title}
          </Text>
          <View style={styles.badges}>
            {game.mode === 'online' ? <Badge text="EN LÍNEA" color={colors.cyan} /> : <Badge text="1 MÓVIL" color={colors.violetSoft} />}
            {game.isNew ? <Badge text="NUEVO" color={colors.pink} /> : null}
            {game.adult ? <Badge text="+18" color={colors.danger} /> : null}
          </View>
        </View>
        <Pressable onPress={() => toggleFavorite(game.id)} hitSlop={10} accessibilityRole="button" accessibilityLabel={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
          <Text style={[styles.star, fav && { color: colors.warning }]}>{fav ? '★' : '☆'}</Text>
        </Pressable>
      </View>
      <Text style={styles.desc} numberOfLines={compact ? 2 : 3}>
        {game.description}
      </Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>👥 {players}</Text>
        <Text style={styles.metaText}>⏱ ~{game.minutes} min</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.play}>Jugar ›</Text>
      </View>
    </Pressable>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

/** Fila horizontal de tarjetas para la portada. */
export function GameRow({ title, games }: { title: string; games: GameDef[] }) {
  if (!games.length) return null;
  return (
    <View style={{ gap: space.sm }}>
      <Text style={styles.section}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingRight: space.lg }}>
        {games.map((g) => (
          <View key={g.id} style={{ width: 250 }}>
            <GameCard game={g} compact />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md, gap: space.sm },
  compact: { minHeight: 170 },
  top: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  emoji: { fontSize: 34 },
  title: { color: colors.text, fontWeight: '900', fontSize: 17 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  star: { color: colors.muted, fontSize: 24 },
  desc: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  metaText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  play: { color: colors.cyan, fontWeight: '900', fontSize: 14, textShadowColor: colors.cyan, textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
  section: { color: colors.text, fontWeight: '900', fontSize: 19 },
});

