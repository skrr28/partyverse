import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { routes } from '@/navigation/routes';
import { NeonButton } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

const STEPS = ['Ambiente', 'Participantes', 'Juego'];

/** Cabecera con «volver» y progreso de los 3 pasos. */
export function StepHeader({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View style={{ gap: space.sm }}>
      <NeonButton
        label="← Volver"
        variant="ghost"
        onPress={() => (router.canGoBack() ? router.back() : router.replace(routes.hub))}
        style={{ alignSelf: 'flex-start', minHeight: 40, paddingHorizontal: space.md }}
      />
      <View style={styles.row} accessibilityLabel={`Paso ${step} de 3: ${STEPS[step - 1]}`}>
        {STEPS.map((s, i) => (
          <View key={s} style={{ flex: 1, gap: 4 }}>
            <View style={[styles.bar, i < step && { backgroundColor: i === step - 1 ? colors.pink : colors.violet }]} />
            <Text style={[styles.label, i === step - 1 && { color: colors.text }]}>
              {i + 1}. {s}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  bar: { height: 5, borderRadius: radius.pill, backgroundColor: colors.surface },
  label: { color: colors.muted, fontSize: 11, fontWeight: '800' },
});
