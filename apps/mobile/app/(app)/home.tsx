import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { clearSession, getStoredPhone } from "../../src/services/auth";
import { Colors, Radii, Spacing, Typography } from "../../src/constants/theme";

/** Mock wallet data — replace with real API calls */
const MOCK_BALANCE = 2450;
const MOCK_POINTS = 183;
const MOCK_PICKUPS = 7;

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  accent: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: accent }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    getStoredPhone().then(setPhone);
  }, []);

  const handleSignOut = async () => {
    await clearSession();
    router.replace("/(auth)/phone");
  };

  const maskedPhone = phone
    ? `+234 ${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`
    : "—";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>EAS</Text>
        </View>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          testID="sign-out-button"
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* ── Welcome banner ── */}
      <View style={styles.welcomeBanner}>
        <View style={styles.bannerBubble1} />
        <View style={styles.bannerBubble2} />
        <Text style={styles.welcomeEmoji}>🎉</Text>
        <Text style={styles.welcomeTitle}>Welcome back!</Text>
        <Text style={styles.welcomePhone}>{maskedPhone}</Text>
        <Text style={styles.welcomeSub}>
          You're making Ifako-Ijaye cleaner, one pickup at a time.
        </Text>
      </View>

      {/* ── Wallet card ── */}
      <View style={styles.walletCard}>
        <View style={styles.walletRow}>
          <View>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
            <Text style={styles.walletAmount}>
              ₦{MOCK_BALANCE.toLocaleString()}
            </Text>
          </View>
          <View style={styles.walletIcon}>
            <Text style={{ fontSize: 28 }}>💰</Text>
          </View>
        </View>

        <View style={styles.walletDivider} />

        <TouchableOpacity
          style={styles.cashoutBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Cash out"
        >
          <Text style={styles.cashoutText}>Cash Out →</Text>
        </TouchableOpacity>
      </View>

      {/* ── Stats row ── */}
      <Text style={styles.sectionTitle}>Your impact</Text>
      <View style={styles.statsRow}>
        <StatCard
          label="EAS Points"
          value={MOCK_POINTS.toString()}
          icon="♻️"
          accent={Colors.primary}
        />
        <StatCard
          label="Pickups"
          value={MOCK_PICKUPS.toString()}
          icon="🚛"
          accent={Colors.accent}
        />
        <StatCard
          label="kg Recycled"
          value="34"
          icon="🌱"
          accent="#0EA5E9"
        />
      </View>

      {/* ── Quick actions placeholder ── */}
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.actionsGrid}>
        {[
          { icon: "📍", label: "Drop Points" },
          { icon: "📷", label: "Report Trash" },
          { icon: "📅", label: "Schedule" },
          { icon: "👛", label: "Rewards" },
        ].map((a) => (
          <TouchableOpacity
            key={a.label}
            style={styles.actionCard}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={a.label}
          >
            <Text style={styles.actionIcon}>{a.icon}</Text>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Footer note ── */}
      <Text style={styles.footerNote}>
        🚧 Full app coming soon — auth complete ✓
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logoBox: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  logoText: {
    ...Typography.titleMd,
    color: "#fff",
    letterSpacing: 2,
  },
  signOutBtn: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  signOutText: {
    ...Typography.bodySm,
    color: Colors.error,
    fontWeight: "600",
  },

  // ── Welcome banner ────────────────────────────────────────────────────────
  welcomeBanner: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    position: "relative",
  },
  bannerBubble1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primaryDark,
    opacity: 0.3,
    top: -40,
    right: -40,
  },
  bannerBubble2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    opacity: 0.2,
    bottom: -10,
    left: 20,
  },
  welcomeEmoji: { fontSize: 36, marginBottom: Spacing.xs },
  welcomeTitle: {
    ...Typography.displayMd,
    color: "#fff",
    marginBottom: 2,
  },
  welcomePhone: {
    ...Typography.bodyMd,
    color: "rgba(255,255,255,0.75)",
    marginBottom: Spacing.sm,
  },
  welcomeSub: {
    ...Typography.bodySm,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 20,
  },

  // ── Wallet card ───────────────────────────────────────────────────────────
  walletCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  walletRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabel: {
    ...Typography.caption,
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  walletAmount: {
    ...Typography.displayMd,
    color: Colors.ink,
  },
  walletIcon: {
    backgroundColor: Colors.successLight,
    borderRadius: Radii.md,
    padding: 12,
  },
  walletDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  cashoutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  cashoutText: {
    ...Typography.bodyMd,
    color: "#fff",
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  sectionTitle: {
    ...Typography.titleMd,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { ...Typography.titleLg, marginBottom: 2 },
  statLabel: { ...Typography.caption, color: Colors.muted },

  // ── Actions ───────────────────────────────────────────────────────────────
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: { fontSize: 28, marginBottom: Spacing.xs },
  actionLabel: { ...Typography.bodySm, color: Colors.subtext, fontWeight: "600" },

  footerNote: {
    ...Typography.caption,
    color: Colors.muted,
    textAlign: "center",
  },
});
