/** Piezas de interfaz compartidas por los juegos locales. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Card, NeonButton } from '@/ui/components';
import { colors, glow, radius, space } from '@/ui/theme';
import type { LocalPlayer, Scores } from './logic';

/** Pantalla para pasar el dispositivo sin que nadie vea lo que viene. */
export function PassDevice({ player, note, onReady, cta }: { player: LocalPlayer; note?: string; onReady: () => void; cta?: string }) {
  return (
    <Card accent={colors.cyan} style={styles.pass}>
      <Text style={styles.passEmoji}>{player.emoji}</Text>
      <Text style={styles.passKicker}>PASA EL MÓVIL A</Text>
      <Text style={styles.passName}>{player.name}</Text>
      {note ? <Body muted style={{ textAlign: 'center' }}>{note}</Body> : null}
      <NeonButton label={cta ?? `Soy ${player.name}, ¡listo!`} onPress={onReady} style={{ alignSelf: 'stretch' }} />
    </Card>
  );
}

export function TurnHeader({ player, label, right }: { player: LocalPlayer; label?: string; right?: ReactNode }) {
  return (
    <View style={styles.turn}>
      <Text style={styles.turnEmoji}>{player.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.turnLabel}>{label ?? 'TURNO DE'}</Text>
        <Text style={styles.turnName} numberOfLines={1}>
          {player.name}
        </Text>
      </View>
      {right}
    </View>
  );
}

/** Selector de opciones en forma de fichas. */
export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <View style={{ gap: space.xs }}>
      {label ? <Text style={styles.chipsLabel}>{label}</Text> : null}
      <View style={styles.chips} accessibilityRole="radiogroup">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[styles.chip, on && { borderColor: colors.violet, backgroundColor: colors.surfaceHigh, boxShadow: glow(colors.violet, 10) }]}
            >
              <Text style={[styles.chipText, on && { color: colors.text }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ScoreStrip({ players, scores, highlight }: { players: LocalPlayer[]; scores: Scores; highlight?: string }) {
  return (
    <View style={styles.strip}>
      {players.map((p) => (
        <View key={p.id} style={[styles.stripItem, highlight === p.id && { borderColor: colors.cyan }]}>
          <Text style={{ fontSize: 16 }}>{p.emoji}</Text>
          <Text style={styles.stripScore}>{scores[p.id] ?? 0}</Text>
        </View>
      ))}
    </View>
  );
}

/** Temporizador local en milisegundos. `running=false` lo pausa. */
export function useTimer(totalMs: number, running: boolean, onEnd?: () => void) {
  const [left, setLeft] = useState(totalMs);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  const startedAt = useRef<number | null>(null);
  const base = useRef(totalMs);

  useEffect(() => {
    setLeft(totalMs);
    base.current = totalMs;
  }, [totalMs]);

  useEffect(() => {
    if (!running) {
      startedAt.current = null;
      return;
    }
    startedAt.current = Date.now();
    const startLeft = base.current;
    const t = setInterval(() => {
      const l = Math.max(0, startLeft - (Date.now() - (startedAt.current ?? Date.now())));
      base.current = l;
      setLeft(l);
      if (l <= 0) {
        clearInterval(t);
        endRef.current?.();
      }
    }, 100);
    return () => clearInterval(t);
  }, [running]);

  const reset = (ms = totalMs) => {
    base.current = ms;
    setLeft(ms);
  };
  return { left, reset };
}

export function TimerBar({ left, total, color = colors.cyan }: { left: number; total: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, left / total));
  const secs = Math.ceil(left / 1000);
  return (
    <View accessibilityLabel={`Quedan ${secs} segundos`}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: secs <= 5 ? colors.pink : color }]} />
      </View>
      <Text style={[styles.timeText, secs <= 5 && { color: colors.pink }]}>{secs}s</Text>
    </View>
  );
}

/** Tarjeta grande con animación de aparición (microinteracción al revelar). */
export function RevealCard({ children, accent = colors.violet, revealKey }: { children: ReactNode; accent?: string; revealKey: string | number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 320, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }).start();
  }, [revealKey, anim]);
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }, { rotateX: anim.interpolate({ inputRange: [0, 1], outputRange: ['60deg', '0deg'] }) }],
      }}
    >
      <Card accent={accent} style={styles.reveal}>
        {children}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pass: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
  passEmoji: { fontSize: 64 },
  passKicker: { color: colors.muted, fontWeight: '900', letterSpacing: 3, fontSize: 12 },
  passName: { color: colors.text, fontSize: 32, fontWeight: '900', textAlign: 'center' },
  turn: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  turnEmoji: { fontSize: 40 },
  turnLabel: { color: colors.muted, fontWeight: '900', letterSpacing: 2, fontSize: 11 },
  turnName: { color: colors.text, fontWeight: '900', fontSize: 22 },
  chipsLabel: { color: colors.muted, fontWeight: '800', fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { paddingHorizontal: space.md, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  chipText: { color: colors.muted, fontWeight: '800', fontSize: 14 },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stripItem: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  stripScore: { color: colors.text, fontWeight: '900', fontSize: 13, fontVariant: ['tabular-nums'] },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  timeText: { color: colors.muted, fontWeight: '800', marginTop: 4, textAlign: 'right' },
  reveal: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.xl },
});

/**
 * Sin retraso al tocar. React Native Web espera 50 ms antes de `onPressIn`,
 * lo que pierde toques rápidos y falsea los tiempos de reflejos.
 * `unstable_pressDelay` es el nombre en Android/iOS; `delayPressIn`, en web.
 */
export const NO_PRESS_DELAY = { unstable_pressDelay: 0, delayPressIn: 0 } as object;
