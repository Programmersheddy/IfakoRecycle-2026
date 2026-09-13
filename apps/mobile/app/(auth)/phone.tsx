import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { friendlyAuthError, sendOtp } from "../../src/services/auth";
import { Colors, Radii, Spacing, Typography } from "../../src/constants/theme";

// NCC mobile prefixes (70x/80x/81x/90x/91x) — mirrors the API's regex in
// services/api/src/modules/auth/auth.schema.ts so client errors match 400s.
const PHONE_REGEX = /^(70[13]|80[2358]|81[014]|90[1259]|91[02])\d{7}$/;

function validate(raw: string): string | null {
  if (!raw) return null;
  if (!/^[0-9]+$/.test(raw)) return "Only digits are allowed";
  if (raw.length < 10) return `${10 - raw.length} more digit${10 - raw.length > 1 ? "s" : ""} needed`;
  if (raw.length > 10) return "Phone number must be exactly 10 digits";
  if (!PHONE_REGEX.test(raw)) return "Invalid Nigerian number — check the prefix (803, 701, 905…)";
  return null; // valid
}

export default function PhoneScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-focus on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const handleChange = useCallback((text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    setError(validate(digits));
  }, []);

  const isValid = phone.length === 10 && !error;

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const result = await sendOtp(phone);
      // Dev builds: the API may echo the OTP (OTP_DEBUG_LOG) so emulator
      // testing works without a Termii account.
      router.push({
        pathname: "/(auth)/otp",
        params: { phone, devCode: result.debugCode ?? "" },
      });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* ── Hero header ── */}
        <View style={[styles.hero, { paddingTop: insets.top + 32 }]}>
          {/* Decorative circles */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />

          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>EAS</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Welcome Back</Text>
          <Text style={styles.heroSub}>
            Enter your phone number to{"\n"}continue earning rewards
          </Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Mobile Number</Text>

          {/* Input row */}
          <View style={[styles.inputRow, error ? styles.inputRowError : isValid && phone.length > 0 ? styles.inputRowSuccess : {}]}>
            {/* Nigerian flag + prefix */}
            <View style={styles.prefixBox}>
              <Text style={styles.flag}>🇳🇬</Text>
              <View style={styles.divider} />
              <Text style={styles.prefix}>+234</Text>
            </View>

            <TextInput
              ref={inputRef}
              style={styles.phoneInput}
              value={phone}
              onChangeText={handleChange}
              onSubmitEditing={handleSubmit}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="8012345678"
              placeholderTextColor={Colors.muted}
              returnKeyType="done"
              testID="phone-input"
              accessibilityLabel="Nigerian phone number input"
            />

            {/* Digit counter */}
            <Text style={[styles.counter, phone.length === 10 ? styles.counterDone : {}]}>
              {phone.length}/10
            </Text>
          </View>

          {/* Error / hint */}
          {error ? (
            <Text style={styles.errorText} accessibilityLiveRegion="polite">
              ⚠ {error}
            </Text>
          ) : phone.length === 10 ? (
            <Text style={styles.successText}>✓ Looks good!</Text>
          ) : (
            <Text style={styles.hintText}>Enter your 10-digit number without leading 0</Text>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
            activeOpacity={0.85}
            testID="send-otp-button"
            accessibilityRole="button"
            accessibilityLabel="Send OTP"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Send OTP →</Text>
            )}
          </TouchableOpacity>

          {/* Footer note */}
          <Text style={styles.footerNote}>
            By continuing you agree to our{" "}
            <Text style={styles.link}>Terms of Service</Text>
          </Text>
        </View>

        {/* Bottom watermark */}
        <Text style={styles.watermark}>Ifako-Ijaye LGA · Lagos</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.primary },

  scroll: { flexGrow: 1 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.primaryDark,
    opacity: 0.4,
    top: -60,
    right: -60,
  },
  circle2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primaryLight,
    opacity: 0.15,
    bottom: 20,
    left: -40,
  },
  logoRow: { marginBottom: Spacing.lg },
  logoBox: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  logoText: {
    ...Typography.titleMd,
    color: "#fff",
    letterSpacing: 3,
  },
  heroTitle: {
    ...Typography.displayLg,
    color: "#fff",
    marginBottom: Spacing.sm,
  },
  heroSub: {
    ...Typography.body,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 24,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    minHeight: 420,
  },
  cardLabel: {
    ...Typography.bodyMd,
    color: Colors.subtext,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── Input ─────────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  inputRowError: { borderColor: Colors.error },
  inputRowSuccess: { borderColor: Colors.success },

  prefixBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#F1F5F9",
    gap: 8,
  },
  flag: { fontSize: 20 },
  divider: { width: 1, height: 20, backgroundColor: Colors.border },
  prefix: {
    ...Typography.bodyMd,
    color: Colors.ink,
  },

  phoneInput: {
    flex: 1,
    ...Typography.titleMd,
    color: Colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 14,
    letterSpacing: 1.5,
  },
  counter: {
    ...Typography.caption,
    color: Colors.muted,
    paddingRight: 12,
  },
  counterDone: { color: Colors.success },

  // ── Feedback text ─────────────────────────────────────────────────────────
  errorText: {
    ...Typography.bodySm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  successText: {
    ...Typography.bodySm,
    color: Colors.success,
    marginTop: Spacing.xs,
  },
  hintText: {
    ...Typography.bodySm,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },

  // ── Button ────────────────────────────────────────────────────────────────
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: Spacing.xl,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: Colors.muted,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    ...Typography.titleMd,
    color: "#fff",
    letterSpacing: 0.5,
  },

  footerNote: {
    ...Typography.caption,
    color: Colors.muted,
    textAlign: "center",
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
  link: { color: Colors.primary, fontWeight: "600" },

  watermark: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
});
