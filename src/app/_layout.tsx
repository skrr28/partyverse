import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PartyProvider } from '@/local/party';
import { SessionProvider } from '@/players/session';
import { colors } from '@/ui/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <PartyProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="room/[id]" options={{ gestureEnabled: false }} />
            <Stack.Screen name="game/[id]" options={{ gestureEnabled: false }} />
          </Stack>
        </PartyProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
