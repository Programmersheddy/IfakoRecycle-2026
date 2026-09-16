import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BUSINESS_RULES, formatNaira } from "@eas/types";
import type { WalletSummary, WalletTransaction } from "@eas/types";
import { Colors, Radii, Spacing, Typography } from "../../src/constants/theme";
import { REF_TYPE_LABELS, getWallet } from "../../src/services/wallet";
import { friendlyAuthError } from "../../src/services/auth";

function TxRow({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.type === "CREDIT";
  const label = (tx.refType && REF_TYPE_LABELS[tx.refType]) || "Wallet activity";
  const when = new Date(tx.createdAt).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, isCredit ? styles.txIconCredit : styles.txIconDebit]}>
        <Text style={isCredit ? styles.txIconCreditText : styles.txIconDebitText}>
          {isCredit ? "↓" : "↑"}
        </Text>
      </View>
      <View style={styles.txMeta}>
        <Text style={styles.txLabel}>{label}</Text>
        <Text style={styles.txWhen}>{when}</Text>
      </View>
      <Text style={[styles.txAmount, { color: isCredit ? Colors.success : Colors.ink }]}>
        {isCredit ? "+" : "−"}
        {formatNaira(tx.amountKobo)}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "refresh") setRefreshing(true);
    setError(null);
    try {
      setSummary(await getWallet());
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load("initial");
  }, [load]);

  const canCashOut = (summary?.balanceKobo ?? 0) >= BUSINESS_RULES.MIN_CASHOUT_KOBO; // ₦1,000 min (PRD §4.4)

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />
      }
    >
      {/* ── Header ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Wallet</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spinner} size="large" color={Colors.primary} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load("refresh")}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : summary ? (
        <>
          {/* ── Balance card ── */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available balance</Text>
            <Text style={styles.balanceAmount}>{formatNaira(summary.balanceKobo)}</Text>
            {!summary.bvnVerified && (
              <Text style={styles.balanceNote}>
                First cashout needs a one-time BVN check — you'll be asked on the next screen.
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.cashoutBtn, !canCashOut && styles.cashoutDisabled]}
            activeOpacity={0.85}
            disabled={!canCashOut}
            onPress={() => router.push("/(app)/cashout")}
            accessibilityRole="button"
            accessibilityLabel="Cash out"
          >
            <Text style={styles.cashoutText}>
              {canCashOut ? "Cash Out" : `Cash out unlocks at ${formatNaira(BUSINESS_RULES.MIN_CASHOUT_KOBO)}`}
            </Text>
          </TouchableOpacity>

          {/* ── Ledger ── */}
          <Text style={styles.ledgerTitle}>Last 90 days</Text>
          {summary.transactions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>♻️</Text>
              <Text style={styles.emptyText}>
                No transactions yet — drop off recyclables to start earning.
              </Text>
            </View>
          ) : (
            <View style={styles.ledgerCard}>
              {summary.transactions.map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg },
  spinner: { marginTop: Spacing.xxl },

  // ── Header ─────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 24, color: Colors.ink },
  title: { ...Typography.titleLg, color: Colors.ink },

  // ── Balance card ───────────────────────────────────────────────────────────
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  balanceLabel: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  balanceAmount: { ...Typography.displayLg, color: "#fff" },
  balanceNote: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.8)",
    marginTop: Spacing.sm,
    lineHeight: 17,
  },

  // ── Cash out ───────────────────────────────────────────────────────────────
  cashoutBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radii.md,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  cashoutDisabled: { backgroundColor: Colors.border },
  cashoutText: { ...Typography.bodyMd, color: "#fff", fontWeight: "700" },

  // ── Ledger ─────────────────────────────────────────────────────────────────
  ledgerTitle: { ...Typography.titleMd, color: Colors.ink, marginBottom: Spacing.sm },
  ledgerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  txIconCredit: { backgroundColor: Colors.successLight },
  txIconDebit: { backgroundColor: Colors.errorLight },
  txIconCreditText: { color: Colors.success, fontSize: 16, fontWeight: "700" },
  txIconDebitText: { color: Colors.error, fontSize: 16, fontWeight: "700" },
  txMeta: { flex: 1 },
  txLabel: { ...Typography.bodySm, color: Colors.ink, fontWeight: "600" },
  txWhen: { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  txAmount: { ...Typography.bodyMd, fontWeight: "700" },

  // ── States ─────────────────────────────────────────────────────────────────
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    alignItems: "center",
  },
  errorText: { ...Typography.bodySm, color: Colors.error, textAlign: "center", marginBottom: Spacing.md },
  retryBtn: {
    backgroundColor: Colors.error,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
  },
  retryText: { ...Typography.bodySm, color: "#fff", fontWeight: "600" },
  emptyBox: { alignItems: "center", padding: Spacing.xl },
  emptyIcon: { fontSize: 32, marginBottom: Spacing.sm },
  emptyText: { ...Typography.bodySm, color: Colors.muted, textAlign: "center", lineHeight: 20 },
});