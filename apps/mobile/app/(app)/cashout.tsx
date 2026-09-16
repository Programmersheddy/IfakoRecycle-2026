import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BUSINESS_RULES, CURRENCY_SYMBOL, formatNaira, parseNairaToKobo } from "@eas/types";
import { NIGERIAN_BANKS } from "../../src/constants/banks";
import { Colors, Radii, Spacing, Typography } from "../../src/constants/theme";
import { cashout, getWallet } from "../../src/services/wallet";
import { friendlyAuthError } from "../../src/services/auth";

const MIN_KOBO = BUSINESS_RULES.MIN_CASHOUT_KOBO; // ₦1,000 minimum (PRD §4.4)

export default function CashoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [amountNaira, setAmountNaira] = useState("");
  const [bankCode, setBankCode] = useState<string | null>(null);
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [bvn, setBvn] = useState("");
  const [needsBvn, setNeedsBvn] = useState<boolean | null>(null); // null = unknown until wallet loads
  const [submitting, setSubmitting] = useState(false);

  const amountKobo = useMemo(() => parseNairaToKobo(amountNaira), [amountNaira]);

  // Wallet fetch only tells us whether the BVN gate applies (§5.4 — first time only).
  useEffect(() => {
    getWallet()
      .then((w) => setNeedsBvn(!w.bvnVerified))
      .catch(() => setNeedsBvn(null));
  }, []);

  const bank = bankCode ? NIGERIAN_BANKS.find((b) => b.code === bankCode) ?? null : null;
  const accountValid = /^\d{10}$/.test(accountNumber);
  const bvnValid = /^\d{11}$/.test(bvn);
  const amountValid = amountKobo >= MIN_KOBO;
  const detailsValid =
    bank !== null && accountValid && (needsBvn === false || bvnValid) && needsBvn !== null;

  const submit = async () => {
    if (!amountValid || !detailsValid || submitting) return;
    setSubmitting(true);
    try {
      const result = await cashout({
        amountKobo,
        bankCode: bank!.code,
        accountNumber,
        ...(needsBvn ? { bvn } : {}),
      });
      const headline =
        result.status === "PAID"
          ? `${formatNaira(amountKobo)} is on its way to your bank account.`
          : result.status === "PROCESSING"
            ? "Transfer accepted — it will land in your account shortly."
            : `Cashout failed${result.failureReason ? `: ${result.failureReason}` : ""}. The amount has been returned to your wallet.`;
      Alert.alert(
        result.status === "FAILED" ? "Cashout failed" : "Cashout initiated",
        headline,
        [{ text: "OK", onPress: () => router.replace("/(app)/wallet") }]
      );
    } catch (err) {
      Alert.alert("Cashout failed", friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (valid: boolean, touched: boolean): string =>
    !touched ? Colors.border : valid ? Colors.success : Colors.error;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          <Text style={styles.title}>Cash Out</Text>
          <View style={styles.backBtn} />
        </View>

        {/* ── Amount ── */}
        <Text style={styles.label}>Amount</Text>
        <View style={[styles.amountBox, { borderColor: amountValid || !amountNaira ? Colors.border : Colors.error }]}>
          <Text style={styles.naira}>{CURRENCY_SYMBOL}</Text>
          <TextInput
            style={styles.amountInput}
            value={amountNaira}
            onChangeText={setAmountNaira}
            placeholder="1,000"
            placeholderTextColor={Colors.muted}
            keyboardType="number-pad"
            accessibilityLabel="Amount in naira"
          />
        </View>
        {amountNaira.length > 0 && !amountValid && (
          <Text style={styles.hintError}>Minimum cashout is {formatNaira(MIN_KOBO)}.</Text>
        )}

        {/* ── Bank picker ── */}
        <Text style={styles.label}>Bank</Text>
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setBankPickerOpen(!bankPickerOpen)}
          accessibilityRole="button"
          accessibilityLabel="Choose bank"
        >
          <Text style={[styles.pickerText, !bank && { color: Colors.muted }]}>
            {bank?.name ?? "Select your bank"}
          </Text>
          <Text style={styles.pickerChevron}>{bankPickerOpen ? "▲" : "▼"}</Text>
        </TouchableOpacity>
        {bankPickerOpen && (
          <View style={styles.bankList}>
            <ScrollView style={styles.bankListScroll} nestedScrollEnabled>
              {NIGERIAN_BANKS.map((b) => (
                <TouchableOpacity
                  key={b.code}
                  style={[styles.bankRow, b.code === bankCode && styles.bankRowActive]}
                  onPress={() => {
                    setBankCode(b.code);
                    setBankPickerOpen(false);
                  }}
                >
                  <Text style={styles.bankName}>{b.name}</Text>
                  {b.code === bankCode && <Text style={styles.bankCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Account number ── */}
        <Text style={styles.label}>Account number</Text>
        <TextInput
          style={[styles.input, { borderColor: statusColor(accountValid, accountNumber.length > 0) }]}
          value={accountNumber}
          onChangeText={(t) => setAccountNumber(t.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit NUBAN"
          placeholderTextColor={Colors.muted}
          keyboardType="number-pad"
          maxLength={10}
          accessibilityLabel="Bank account number"
        />

        {/* ── BVN (first cashout only, §5.4) ── */}
        {needsBvn === true && (
          <>
            <Text style={styles.label}>BVN</Text>
            <TextInput
              style={[styles.input, { borderColor: statusColor(bvnValid, bvn.length > 0) }]}
              value={bvn}
              onChangeText={(t) => setBvn(t.replace(/\D/g, "").slice(0, 11))}
              placeholder="11-digit Bank Verification Number"
              placeholderTextColor={Colors.muted}
              keyboardType="number-pad"
              maxLength={11}
              accessibilityLabel="Bank Verification Number"
            />
            <Text style={styles.hint}>One-time check — your BVN is verified and stored securely.</Text>
          </>
        )}
        {needsBvn === false && (
          <Text style={styles.hintOk}>✓ Identity already verified — no BVN needed.</Text>
        )}

        {/* ── Confirm summary ── */}
        {amountValid && detailsValid && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>You receive</Text>
              <Text style={styles.summaryVal}>{formatNaira(amountKobo)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>To</Text>
              <Text style={styles.summaryVal}>
                {bank!.name} ••••{accountNumber.slice(-4)}
              </Text>
            </View>
            <Text style={styles.summaryNote}>
              No EAS fee on cashouts. Transfers settle within minutes during banking hours.
            </Text>
          </View>
        )}

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, (!amountValid || !detailsValid || submitting) && styles.submitDisabled]}
          activeOpacity={0.85}
          disabled={!amountValid || !detailsValid || submitting}
          onPress={submit}
          accessibilityRole="button"
          accessibilityLabel="Confirm cashout"
        >
          <Text style={styles.submitText}>
            {submitting ? "Sending…" : `Cash Out${amountValid ? ` ${formatNaira(amountKobo)}` : ""}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg },

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

  // ── Fields ─────────────────────────────────────────────────────────────────
  label: {
    ...Typography.caption,
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
  },
  naira: { ...Typography.displayMd, color: Colors.ink, marginRight: Spacing.sm },
  amountInput: {
    flex: 1,
    ...Typography.displayMd,
    color: Colors.ink,
    paddingVertical: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    ...Typography.body,
    color: Colors.ink,
  },
  hint: { ...Typography.caption, color: Colors.muted, marginTop: Spacing.xs },
  hintOk: { ...Typography.caption, color: Colors.success, marginTop: Spacing.xs },
  hintError: { ...Typography.caption, color: Colors.error, marginTop: Spacing.xs },

  // ── Bank picker ────────────────────────────────────────────────────────────
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  pickerText: { ...Typography.body, color: Colors.ink },
  pickerChevron: { fontSize: 12, color: Colors.muted },
  bankList: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
    overflow: "hidden",
  },
  bankListScroll: { maxHeight: 220 },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  bankRowActive: { backgroundColor: Colors.successLight },
  bankName: { ...Typography.bodySm, color: Colors.ink },
  bankCheck: { color: Colors.primary, fontWeight: "700" },

  // ── Summary ────────────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: Colors.successLight,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  summaryKey: { ...Typography.bodySm, color: Colors.subtext },
  summaryVal: { ...Typography.bodySm, color: Colors.ink, fontWeight: "700" },
  summaryNote: { ...Typography.caption, color: Colors.subtext, marginTop: Spacing.xs, lineHeight: 16 },

  // ── Submit ─────────────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  submitDisabled: { backgroundColor: Colors.border },
  submitText: { ...Typography.bodyMd, color: "#fff", fontWeight: "700" },
});