/** Comprobación de mayoría de edad para el contenido +18. */
import { StyleSheet, Text } from 'react-native';
import { Body, Card, NeonButton } from '@/ui/components';
import { colors, space } from '@/ui/theme';
import { useParty } from './party';

export function AgeGate({ onCancel }: { onCancel: () => void }) {
  const { confirmAdult, settings } = useParty();
  if (settings.hideAdult) {
    return (
      <Card accent={colors.warning} style={{ gap: space.sm }}>
        <Text style={styles.title}>Contenido +18 oculto</Text>
        <Body muted>Lo desactivaste en Configuración. Puedes volver a activarlo allí.</Body>
        <NeonButton label="Volver" variant="ghost" onPress={onCancel} />
      </Card>
    );
  }
  return (
    <Card accent={colors.danger} style={{ gap: space.sm }}>
      <Text style={styles.title}>🌶️ Zona para adultos</Text>
      <Body>Este contenido es solo para mayores de 18 años. Es atrevido, pero nunca explícito, y nadie está obligado a responder ni a hacer nada.</Body>
      <Body muted style={{ fontSize: 13 }}>
        Al continuar confirmas que todas las personas que participan tienen 18 años o más. La confirmación dura hasta que cierres la app.
      </Body>
      <NeonButton label="Todos somos mayores de 18" onPress={confirmAdult} />
      <NeonButton label="No, volver" variant="ghost" onPress={onCancel} />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontWeight: '900', fontSize: 20 },
});
