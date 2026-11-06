/** Portada de PARTYVERSE: empezar a jugar, ambientes, recientes, favoritos y catálogo destacado. */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AMBIENTES, CATEGORIES, GAMES, UPCOMING, gameById, recommend } from '@/catalog/games';
import { GameRow } from '@/catalog/GameCard';
import type { AmbienteId } from '@/catalog/types';
import { useParty } from '@/local/party';
import { routes } from '@/navigation/routes';
import { useSession } from '@/players/session';
import { Body, NeonButton, Screen } from '@/ui/components';
import { colors, glow, radius, space, type } from '@/ui/theme';

export default function HubScreen() {
  const { profile } = useSession();
  const party = useParty();
  const includeAdult = !party.settings.hideAdult && party.adultConfirmed;
  const ambientes = AMBIENTES.filter((a) => a.id !== 'adultos' || !party.settings.hideAdult);

  const recent = party.recent.map((r) => gameById(r.gameId)).filter((g): g is NonNullable<typeof g> => !!g && (!g.adult || includeAdult));
  const favorites = party.favorites.map(gameById).filter((g): g is NonNullable<typeof g> => !!g && (!g.adult || includeAdult));
  const players = party.players.length;
  const recommended = players ? recommend(GAMES, party.ambiente, players, includeAdult) : [];
  const popular = GAMES.filter((g) => g.popular && !g.adult);
  const fresh = GAMES.filter((g) => g.isNew && !g.adult);
  const name = profile?.nickname;

  const pickAmbiente = (id: AmbienteId) => {
    party.setAmbiente(id);
    router.push(routes.games({ ambiente: id }));
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.logo}>
            PARTY<Text style={{ color: colors.cyan, textShadowColor: colors.cyan }}>VERSE</Text>
          </Text>
          <Body muted>{name ? `¡Hola, ${name}! ¿Qué jugamos hoy?` : '¡Hola! ¿Qué jugamos hoy?'}</Body>
        </View>
        <Pressable onPress={() => router.push(routes.settings)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Perfil y configuración" style={styles.gear}>
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => router.push(routes.play)} accessibilityRole="button" accessibilityLabel="Empezar a jugar" style={({ pressed }) => [styles.hero, pressed && { transform: [{ scale: 0.98 }] }]}>
        <Text style={styles.heroText}>¡EMPEZAR A JUGAR!</Text>
        <Text style={styles.heroSub}>Ambiente → participantes → juego · en un solo móvil</Text>
      </Pressable>

      <View style={styles.row}>
        <NeonButton label="Crear una partida" variant="secondary" onPress={() => router.push(routes.online)} style={{ flex: 1 }} />
        <NeonButton label="Unirme con código" variant="secondary" onPress={() => router.push(routes.online)} style={{ flex: 1 }} />
      </View>
      <Body muted style={{ fontSize: 12, textAlign: 'center', marginTop: -8 }}>
        Partidas en línea: cada uno juega desde su móvil.
      </Body>

      <Text style={styles.section}>Elige el ambiente</Text>
      <View style={styles.ambientes}>
        {ambientes.map((a) => (
          <Pressable key={a.id} onPress={() => pickAmbiente(a.id)} style={styles.amb} accessibilityRole="button" accessibilityLabel={a.label}>
            <Text style={{ fontSize: 26 }}>{a.emoji}</Text>
            <Text style={styles.ambText} numberOfLines={2}>
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <GameRow title="🕘 Partidas recientes" games={recent} />
      <GameRow title="⭐ Tus favoritos" games={favorites} />
      {players ? (
        <GameRow title={`🎯 Recomendados para ${players} participante${players === 1 ? '' : 's'}`} games={recommended} />
      ) : (
        <Pressable onPress={() => router.push(routes.players)} style={styles.tip}>
          <Text style={styles.tipText}>👥 Añade a los participantes y te recomendamos juegos para tu grupo ›</Text>
        </Pressable>
      )}

      <Text style={styles.section}>Categorías</Text>
      <View style={styles.cats}>
        {CATEGORIES.map((c) => (
          <Pressable key={c.id} onPress={() => router.push(routes.games({ category: c.id }))} style={styles.cat} accessibilityRole="button" accessibilityLabel={c.label}>
            <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
            <Text style={styles.catText} numberOfLines={2}>
              {c.label}
            </Text>
            <Text style={styles.catCount}>{GAMES.filter((g) => g.category === c.id && !g.adult).length}</Text>
          </Pressable>
        ))}
      </View>

      <GameRow title="🔥 Juegos populares" games={popular} />
      <GameRow title="✨ Nuevos" games={fresh} />

      <Text style={styles.section}>🚀 Próximamente</Text>
      <View style={{ gap: space.xs }}>
        {UPCOMING.map((u) => (
          <View key={u.title} style={styles.upcoming}>
            <Text style={{ fontSize: 20 }}>{u.emoji}</Text>
            <Text style={styles.upText}>{u.title}</Text>
          </View>
        ))}
      </View>

      <NeonButton label={`Ver los ${GAMES.filter((g) => !g.adult).length} juegos`} variant="ghost" onPress={() => router.push(routes.games())} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  logo: { ...type.title, fontSize: 30, letterSpacing: 3, color: colors.violetSoft, textShadowColor: colors.violet, textShadowRadius: 16, textShadowOffset: { width: 0, height: 0 } },
  gear: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  hero: {
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.violet,
    borderWidth: 2,
    borderColor: colors.pink,
    boxShadow: `${glow(colors.violet, 28)}, ${glow(colors.pink, 12)}`,
    experimental_backgroundImage: `linear-gradient(120deg, ${colors.violet}, ${colors.pink})`,
  },
  heroText: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: 1.5 },
  heroSub: { color: colors.text, opacity: 0.85, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', gap: space.sm },
  section: { color: colors.text, fontWeight: '900', fontSize: 19, marginTop: space.sm },
  ambientes: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  amb: { width: '31%', flexGrow: 1, alignItems: 'center', gap: 4, paddingVertical: space.md, paddingHorizontal: 4, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  ambText: { color: colors.text, fontWeight: '800', fontSize: 12, textAlign: 'center' },
  tip: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.cyan, borderRadius: radius.md, padding: space.md },
  tipText: { color: colors.cyan, fontWeight: '800' },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cat: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  catText: { flex: 1, color: colors.text, fontWeight: '800', fontSize: 13 },
  catCount: { color: colors.cyan, fontWeight: '900' },
  upcoming: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  upText: { color: colors.muted, fontWeight: '700' },
});
