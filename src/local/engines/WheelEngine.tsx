/** Ruleta PARTYVERSE: giro animado con resultado aleatorio real y ruletas propias. */
import { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { WheelConfig } from '@/catalog/types';
import { Body, Card, NeonButton, NeonInput } from '@/ui/components';
import { colors, glow, radius, space } from '@/ui/theme';
import { useParty } from '../party';
import { addPoints, emptyStats, pickIndex, turnPlayer, wheelTarget, zeroScores } from '../logic';
import { ScoreStrip, TurnHeader } from '../ui';
import type { EngineProps } from './types';

const SIZE = 280;
const SEG_COLORS = [colors.violet, colors.cyan, colors.pink, '#4F46E5', '#06B6D4', '#DB2777', '#7C3AED', '#0EA5E9', '#F472B6', '#6366F1', '#14B8A6', '#E879F9'];
const BONUS = 50;

export function WheelEngine({ game, players, onFinish }: EngineProps) {
  const cfg = (game.config as { data: WheelConfig }).data;
  const party = useParty();
  const [options, setOptions] = useState<string[]>(cfg.options);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [wheelName, setWheelName] = useState('');
  const [turn, setTurn] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [scores, setScores] = useState(() => zeroScores(players));
  const [stats, setStats] = useState(() => emptyStats(players));
  const rotation = useRef(new Animated.Value(0)).current;
  const current = useRef(0);

  const player = turnPlayer(players, turn);

  const spin = () => {
    if (spinning || options.length < 2) return;
    const idx = pickIndex(options.length);
    const target = wheelTarget(current.current, idx, options.length, 5, Math.random());
    setSpinning(true);
    setResult(null);
    Animated.timing(rotation, { toValue: target, duration: 3600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
      current.current = target;
      setSpinning(false);
      setResult(options[idx]);
    });
  };

  const resolve = (done: boolean) => {
    const auto = result ? /gana\s+\d+/i.test(result) : false;
    if (done || auto) {
      setScores((s) => addPoints(s, player.id, BONUS));
      setStats((s) => ({ ...s, [player.id]: { ...s[player.id], done: s[player.id].done + 1 } }));
    } else {
      setStats((s) => ({ ...s, [player.id]: { ...s[player.id], skipped: s[player.id].skipped + 1 } }));
    }
    setResult(null);
    setTurn((t) => t + 1);
  };

  const seg = 360 / options.length;
  const spinDeg = rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });

  if (editing) {
    return (
      <View style={{ gap: space.md }}>
        <Text style={styles.title}>Editar ruleta ({options.length})</Text>
        {options.map((o, i) => (
          <View key={`${o}-${i}`} style={styles.optRow}>
            <View style={[styles.dot, { backgroundColor: SEG_COLORS[i % SEG_COLORS.length] }]} />
            <Text style={styles.optText}>{o}</Text>
            <Pressable onPress={() => setOptions((x) => x.filter((_, j) => j !== i))} disabled={options.length <= 2} hitSlop={8} accessibilityLabel={`Quitar ${o}`}>
              <Text style={[styles.remove, options.length <= 2 && { opacity: 0.3 }]}>✕</Text>
            </Pressable>
          </View>
        ))}
        <NeonInput value={draft} onChangeText={setDraft} placeholder="Nueva opción" maxLength={40} />
        <NeonButton
          label="Añadir opción"
          variant="secondary"
          disabled={!draft.trim() || options.length >= 12}
          onPress={() => {
            setOptions((x) => [...x, draft.trim()]);
            setDraft('');
          }}
        />
        <Card style={{ gap: space.sm }}>
          <NeonInput value={wheelName} onChangeText={setWheelName} placeholder="Nombre para guardarla" maxLength={24} />
          <NeonButton label="Guardar en favoritas" variant="secondary" disabled={!wheelName.trim()} onPress={() => party.saveWheel(wheelName.trim(), options)} />
        </Card>
        <NeonButton label="Listo" onPress={() => setEditing(false)} />
      </View>
    );
  }

  return (
    <View style={{ gap: space.md }}>
      <TurnHeader player={player} label="GIRA" />
      <ScoreStrip players={players} scores={scores} highlight={player.id} />

      <View style={styles.wheelWrap}>
        <Text style={styles.pointer}>▼</Text>
        <Animated.View style={[styles.wheel, { transform: [{ rotate: spinDeg }] }]}>
          {options.map((o, i) => (
            <View key={`d${i}`} style={[styles.spoke, { transform: [{ rotate: `${i * seg}deg` }] }]}>
              <View style={styles.divider} />
            </View>
          ))}
          {options.map((o, i) => (
            <View key={`l${i}`} style={[styles.spoke, { transform: [{ rotate: `${(i + 0.5) * seg}deg` }] }]}>
              <View style={[styles.label, { backgroundColor: SEG_COLORS[i % SEG_COLORS.length] }]}>
                <Text style={styles.labelText} numberOfLines={2}>
                  {o}
                </Text>
              </View>
            </View>
          ))}
          <View style={styles.hub}>
            <Text style={{ fontSize: 22 }}>🎡</Text>
          </View>
        </Animated.View>
      </View>

      {result ? (
        <Card accent={colors.pink} style={{ alignItems: 'center', gap: space.sm }}>
          <Text style={styles.kicker}>¡TE TOCA!</Text>
          <Text style={styles.result}>{result}</Text>
          {/gana\s+\d+/i.test(result) ? (
            <NeonButton label={`Sumar +${BONUS} y seguir`} onPress={() => resolve(true)} style={{ alignSelf: 'stretch' }} />
          ) : (
            <View style={styles.row}>
              <NeonButton label="Paso" variant="ghost" onPress={() => resolve(false)} style={{ flex: 1 }} />
              <NeonButton label={`Cumplido +${BONUS}`} onPress={() => resolve(true)} style={{ flex: 2 }} />
            </View>
          )}
        </Card>
      ) : (
        <NeonButton label={spinning ? 'Girando…' : '¡Girar!'} onPress={spin} disabled={spinning} />
      )}

      {!spinning && !result ? (
        <View style={{ gap: space.sm }}>
          <View style={styles.row}>
            <NeonButton label="✏️ Editar" variant="ghost" onPress={() => setEditing(true)} style={{ flex: 1 }} />
            <NeonButton label="Terminar" variant="secondary" onPress={() => onFinish({ scores, stats })} style={{ flex: 1 }} />
          </View>
          {party.customWheels.length ? (
            <View style={{ gap: space.xs }}>
              <Body muted style={{ fontSize: 13 }}>Tus ruletas guardadas:</Body>
              <View style={styles.saved}>
                <Pressable onPress={() => setOptions(cfg.options)} style={styles.savedChip}>
                  <Text style={styles.savedText}>⭐ Original</Text>
                </Pressable>
                {party.customWheels.map((w) => (
                  <Pressable key={w.name} onPress={() => setOptions(w.options)} onLongPress={() => party.deleteWheel(w.name)} style={styles.savedChip}>
                    <Text style={styles.savedText}>{w.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  title: { color: colors.text, fontWeight: '900', fontSize: 20 },
  wheelWrap: { alignItems: 'center', gap: 0 },
  pointer: { color: colors.pink, fontSize: 30, textShadowColor: colors.pink, textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 }, marginBottom: -10, zIndex: 2 },
  wheel: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 4,
    borderColor: colors.violet,
    backgroundColor: colors.bgDeep,
    boxShadow: glow(colors.violet, 24),
    overflow: 'hidden',
  },
  spoke: { position: 'absolute', left: 0, top: 0, width: SIZE - 8, height: SIZE - 8, alignItems: 'center' },
  divider: { width: 2, height: (SIZE - 8) / 2, backgroundColor: colors.border },
  label: { marginTop: 10, width: 86, minHeight: 34, borderRadius: radius.sm, paddingHorizontal: 4, paddingVertical: 3, alignItems: 'center', justifyContent: 'center' },
  labelText: { color: colors.text, fontWeight: '900', fontSize: 10, textAlign: 'center' },
  hub: { position: 'absolute', left: SIZE / 2 - 4 - 26, top: SIZE / 2 - 4 - 26, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surfaceHigh, borderWidth: 2, borderColor: colors.cyan, alignItems: 'center', justifyContent: 'center' },
  kicker: { color: colors.muted, fontWeight: '900', letterSpacing: 3, fontSize: 12 },
  result: { color: colors.text, fontWeight: '900', fontSize: 26, textAlign: 'center' },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: space.sm },
  dot: { width: 14, height: 14, borderRadius: 7 },
  optText: { flex: 1, color: colors.text, fontWeight: '700' },
  remove: { color: colors.danger, fontWeight: '900', fontSize: 18, paddingHorizontal: space.sm },
  saved: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  savedChip: { paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.cyan },
  savedText: { color: colors.cyan, fontWeight: '800', fontSize: 13 },
});
