import { type ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '@/players/session';
import { Banner, LoadingView, Screen } from '@/ui/components';
import { routes } from './routes';

/**
 * Protege una pantalla: sin sesión vuelve a la bienvenida; sin perfil (si se
 * exige) va a la selección de apodo y avatar.
 */
export function RequireSession({ children, requireProfile = true }: { children: ReactNode; requireProfile?: boolean }) {
  const { status, profile, profileLoaded, profileError, reloadProfile } = useSession();

  if (status === 'loading') return <LoadingScreen />;
  if (status !== 'signedIn') return <Redirect href={routes.welcome} />;

  if (requireProfile) {
    if (profileError && !profileLoaded) {
      return (
        <Screen>
          <Banner text={profileError.message} onRetry={reloadProfile} />
        </Screen>
      );
    }
    if (!profileLoaded) return <LoadingScreen />;
    if (!profile) return <Redirect href={routes.profile} />;
  }
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <Screen>
      <LoadingView />
    </Screen>
  );
}
