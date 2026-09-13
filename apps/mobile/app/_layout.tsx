import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { DefaultTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { getToken } from "../src/services/auth";
import { paperTheme } from "../src/constants/theme";

/** Guards unauthenticated users away from app screens */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const inAuthGroup = segments[0] === "(auth)";
      const inAppGroup = segments[0] === "(app)";

      if (!token && inAppGroup) {
        router.replace("/(auth)/phone");
      } else if (token && inAuthGroup) {
        router.replace("/(app)/home");
      }
      setChecked(true);
    })();
  }, [segments]);

  if (!checked) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <PaperProvider
      theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, ...paperTheme.colors } }}
    >
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthGuard>
          <Slot />
        </AuthGuard>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
