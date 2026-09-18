import {useEffect, useState, type ComponentType} from 'react';
import {useBootstrap} from '../../hooks/useFamFeast';
import {useAppStore} from '../../store/useAppStore';
import {SplashScreen} from '../../screens/SplashScreen';

const SPLASH_HOLD_MS = 2200;

type AppStackComponent = ComponentType<{onboarded: boolean}>;

export function RootNavigator() {
  const bootstrap = useBootstrap();
  const onboarded = useAppStore(state => state.snapshot.onboardingComplete);
  const [minHold, setMinHold] = useState(true);
  const [AppStack, setAppStack] = useState<AppStackComponent | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMinHold(false), SPLASH_HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    import('./AppStack')
      .then(mod => {
        if (!cancelled) {
          setAppStack(() => mod.AppStack);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (minHold || bootstrap.isLoading || !AppStack) {
    return <SplashScreen durationMs={SPLASH_HOLD_MS} />;
  }

  return <AppStack onboarded={onboarded} />;
}
