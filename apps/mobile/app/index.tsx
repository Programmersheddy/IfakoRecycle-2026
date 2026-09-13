import { Redirect } from "expo-router";

/** Root index — redirects to the phone auth screen on first launch */
export default function Index() {
  return <Redirect href="/(auth)/phone" />;
}
