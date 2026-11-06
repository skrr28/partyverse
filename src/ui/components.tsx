import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, glow, radius, space, type } from './theme';

export function Screen({ children, scroll = false }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.screenContent}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function NeonTitle({
  children,
  color = colors.violetSoft,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={[styles.title, { textShadowColor: color }, style]} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, muted && { color: colors.muted }, style]}>{children}</Text>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function NeonButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const accent =
    variant === 'secondary' ? colors.cyan : variant === 'danger' ? colors.danger : variant === 'ghost' ? colors.muted : colors.violet;
  const filled = variant === 'primary';
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      accessibilityLabel={label}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: accent,
          backgroundColor: filled ? accent : 'transparent',
          boxShadow: variant === 'ghost' || inactive ? undefined : glow(accent, pressed ? 8 : 16),
          opacity: inactive ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={filled ? colors.text : accent} />
      ) : (
        <Text style={[styles.buttonText, { color: filled ? colors.text : accent }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  return (
    <View style={[styles.card, accent && { borderColor: accent, boxShadow: glow(accent, 12) }, style]}>{children}</View>
  );
}

export function NeonInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      selectionColor={colors.cyan}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

export function Banner({ kind = 'error', text, onRetry }: { kind?: 'error' | 'info' | 'warning'; text: string; onRetry?: () => void }) {
  const c = kind === 'error' ? colors.danger : kind === 'warning' ? colors.warning : colors.cyan;
  return (
    <View style={[styles.banner, { borderColor: c }]} accessibilityRole="alert">
      <Text style={[styles.bannerText, { color: c }]}>{text}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
          <Text style={[styles.bannerAction, { color: c }]}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function LoadingView({ label = 'Cargando…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.cyan} />
      <Body muted style={{ marginTop: space.md }}>
        {label}
      </Body>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { flexGrow: 1, padding: space.lg, gap: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  title: {
    ...type.title,
    color: colors.text,
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
  body: { ...type.body, color: colors.text, lineHeight: 22 },
  button: {
    minHeight: 54,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  buttonText: { fontSize: 17, fontWeight: '800', letterSpacing: 0.6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  input: {
    // En web, <input> tiene un ancho mínimo propio: sin esto no se encoge en filas.
    minWidth: 0,
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bgDeep,
    color: colors.text,
    paddingHorizontal: space.md,
    fontSize: 18,
    fontWeight: '700',
  },
  banner: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.bgDeep,
  },
  bannerText: { flex: 1, fontSize: 14, fontWeight: '600' },
  bannerAction: { fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
});
