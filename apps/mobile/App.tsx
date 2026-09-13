import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

const colors = {
  green: "#0B7A3B",
  ink: "#0F172A",
  muted: "#64748B",
  bg: "#F8FAFC"
};

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>EAS</Text>
      <Text style={styles.subtitle}>Earn While You Clean — Ifako-Ijaye LGA</Text>
      <Text style={styles.note}>
        Monorepo scaffold ready. Next up (PRD §4): phone + OTP auth, map &amp; collection
        points, trash reports, wallet &amp; cashout, pickup scheduling.
      </Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  title: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.green,
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
    marginTop: 8,
    textAlign: "center"
  },
  note: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 16,
    textAlign: "center",
    lineHeight: 20
  }
});
