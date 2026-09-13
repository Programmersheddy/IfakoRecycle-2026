import { Stack } from "expo-router";

/** App group layout — future home for tab navigation */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="home" />
    </Stack>
  );
}
