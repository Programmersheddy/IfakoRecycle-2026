/**
 * OTP Verification Screen
 *
 * Features:
 * - 6 individual boxes, auto-focus next on input, retreat on backspace
 * - 60-second resend countdown (mirrors the API's anti-abuse cooldown)
 * - Android SMS auto-read via the SMS Retriever API (dev-client builds only;
 *   gracefully falls back to manual entry in Expo Go)
 * - Verifies against POST /v1/auth/otp/verify and persists both tokens
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { friendlyAuthError, sendOtp, verifyOtp } from "../../src/services/auth";
import { startSmsAutoRead, stopSmsAutoRead } from "../../src/services/smsRetriever";
import { Colors, Radii, Spacing, Typography } from "../../src/constants/theme";

const CODE_LENGTH = 6;
const RESEND_TIMEOUT = 60; // seconds

// ---------------------------------------------------------------------------
// OTP Box component
// ---------------------------------------------------------------------------
interface OtpBoxProps {
  value: string;
  isFocused: boolean;
  hasError: boolean;
}

function OtpBox({ value, isFocused, hasError }: OtpBoxProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isFocused, pulseAnim]);

  const borderColor = hasError
    ? Colors.error
    : isFocused
    ? Colors.primary
    : value
    ? Colors.primaryLight
    : Colors.border;

  const bgColor = hasError
    ? Colors.errorLight
    : isFocused
    ? "#F0FDF4"
    : value
    ? Colors.otpFilled
    : Colors.otpIdle;

  return (
    <View
      style={[
        styles.otpBox,
        { borderColor, backgroundColor: bgColor },
        isFocused && styles.otpBoxFocused,
      ]}
    >
      <Text style={[styles.otpDigit, hasError && styles.otpDigitError]}>
        {value || ""}
      </Text>
      {isFocused && !value && (
        <Animated.View style={[styles.cursor, { opacity: pulseAnim }]} />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { phone, devCode: devCodeParam } = useLocalSearchParams<{
    phone: string;
    devCode?: string;
  }>();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const [resending, setResending] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  // Dev-only OTP surfaced by the API when it runs without a Termii key.
  const [devCode, setDevCode] = useState<string | null>(devCodeParam || null);

  const inputRefs = useRef<Array<TextInput | null>>(
    Array(CODE_LENGTH).fill(null)
  );

  const fullCode = code.join("");
  const isComplete = fullCode.length === CODE_LENGTH;

  // Masked phone display: +234 XXX-XXX-XXXX
  const maskedPhone = useMemo(() => {
    if (!phone || phone.length < 10) return phone ?? "";
    const p = phone.slice(0, 10);
    return `+234 ${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`;
  }, [phone]);

  // Auto-focus first box on mount
  useEffect(() => {
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  // SMS auto-read — Android only; a no-op in Expo Go (see src/services/smsRetriever.ts)
  const handleSmsCode = useCallback(
    (smsCode: string) => {
      const digits = smsCode.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
      const padded = [...digits, ...Array(CODE_LENGTH - digits.length).fill("")];
      setCode(padded);
      setHasError(false);
      setFormError(null);
      // Focus last box
      inputRefs.current[CODE_LENGTH - 1]?.focus();
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    startSmsAutoRead(handleSmsCode).then((ok) => {
      if (mounted) setAutoRead(ok);
    });
    return () => {
      mounted = false;
      stopSmsAutoRead();
    };
  }, [handleSmsCode]);

  // ── Input handling ──────────────────────────────────────────────────────
  const handleChangeText = (text: string, index: number) => {
    setHasError(false);
    const digit = text.replace(/\D/g, "").slice(-1);
    const next = [...code];

    if (digit) {
      next[index] = digit;
      setCode(next);
      const nextIndex = index + 1;
      if (nextIndex < CODE_LENGTH) {
        inputRefs.current[nextIndex]?.focus();
        setFocusedIndex(nextIndex);
      }
    } else {
      // Clear current
      next[index] = "";
      setCode(next);
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (code[index]) {
        // Clear current box
        const next = [...code];
        next[index] = "";
        setCode(next);
      } else if (index > 0) {
        // Move to previous box and clear it
        const next = [...code];
        next[index - 1] = "";
        setCode(next);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    }
  };

  // ── Verify ───────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!isComplete || loading) return;
    setLoading(true);
    setHasError(false);
    setFormError(null);
    try {
      // verifyOtp persists the access + refresh tokens (src/services/auth.ts);
      // the auth guard in app/_layout.tsx then lets us into the (app) group.
      await verifyOtp(phone ?? "", fullCode);
      router.replace("/(app)/home");
    } catch (err) {
      setHasError(true);
      setFormError(friendlyAuthError(err));
      setCode(Array(CODE_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ───────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      const result = await sendOtp(phone ?? "");
      setDevCode(result.debugCode ?? null);
      setCode(Array(CODE_LENGTH).fill(""));
      setCountdown(RESEND_TIMEOUT);
      setHasError(false);
      setFormError(null);
      inputRefs.current[0]?.focus();
    } catch (err) {
      // E.g. RESEND_COOLDOWN (429) — shows the server's wait-time message.
      setFormError(friendlyAuthError(err));
    } finally {
      setResending(false);
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
        {/* ── Hero ── */}
        <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />

          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.shieldIcon}>
            <Text style={{ fontSize: 40 }}>🔐</Text>
          </View>
          <Text style={styles.heroTitle}>Verify your{"\n"}number</Text>
          <Text style={styles.heroSub}>
            We sent a 6-digit code to{"\n"}
            <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
          </Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Enter OTP</Text>

          {/* 6-box row */}
          <View style={styles.otpRow} accessibilityLabel="OTP input boxes">
            {Array(CODE_LENGTH)
              .fill(null)
              .map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    inputRefs.current[i]?.focus();
                    setFocusedIndex(i);
                  }}
                  activeOpacity={0.8}
                >
                  <OtpBox
                    value={code[i] ?? ""}
                    isFocused={focusedIndex === i}
                    hasError={hasError}
                  />
                </TouchableOpacity>
              ))}
          </View>

          {/* Hidden inputs (one per digit for proper focus management) */}
          <View style={styles.hiddenInputs}>
            {Array(CODE_LENGTH)
              .fill(null)
              .map((_, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { inputRefs.current[i] = r; }}
                  value={code[i]}
                  onChangeText={(t) => handleChangeText(t, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  onFocus={() => setFocusedIndex(i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={styles.hiddenInput}
                  testID={`otp-input-${i}`}
                  accessibilityLabel={`OTP digit ${i + 1}`}
                  caretHidden
                />
              ))}
          </View>

          {(hasError || formError) && (
            <Text style={styles.errorText} accessibilityLiveRegion="polite">
              ⚠ {formError ?? "Invalid code — please check and try again"}
            </Text>
          )}

          {/* Dev-only: the API echoed the OTP (OTP_DEBUG_LOG — no Termii key) */}
          {devCode ? (
            <TouchableOpacity
              style={styles.devChip}
              onPress={() => handleSmsCode(devCode)}
              accessibilityRole="button"
              accessibilityLabel={`Fill development OTP ${devCode}`}
            >
              <Text style={styles.devChipText}>Dev OTP: {devCode} — tap to fill</Text>
            </TouchableOpacity>
          ) : null}

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.button, !isComplete && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={!isComplete || loading}
            activeOpacity={0.85}
            testID="verify-button"
            accessibilityRole="button"
            accessibilityLabel="Verify OTP"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Verify & Continue ✓</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive it? </Text>
            {countdown > 0 ? (
              <Text style={styles.resendTimer}>
                Resend in {countdown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={styles.resendLink}>
                  {resending ? "Sending…" : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* SMS Retriever note */}
          {Platform.OS === "android" && (
            <View style={styles.smsNote}>
              <Text style={styles.smsNoteText}>
                {autoRead
                  ? "📱 SMS auto-read is on — the code fills in automatically when the SMS arrives."
                  : "📱 Enter the code manually — SMS auto-read needs a dev build (unavailable in Expo Go)."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BOX_SIZE = 48;
const BOX_HEIGHT = 58;

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
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryDark,
    opacity: 0.4,
    top: -40,
    right: -40,
  },
  circle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    opacity: 0.15,
    bottom: 10,
    left: -20,
  },
  backBtn: {
    marginBottom: Spacing.lg,
  },
  backText: {
    ...Typography.bodyMd,
    color: "rgba(255,255,255,0.8)",
  },
  shieldIcon: {
    marginBottom: Spacing.md,
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
  phoneHighlight: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    minHeight: 460,
  },
  cardLabel: {
    ...Typography.bodyMd,
    color: Colors.subtext,
    marginBottom: Spacing.lg,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── OTP boxes ─────────────────────────────────────────────────────────────
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  otpBox: {
    width: BOX_SIZE,
    height: BOX_HEIGHT,
    borderRadius: Radii.sm,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  otpBoxFocused: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  otpDigit: {
    ...Typography.titleLg,
    color: Colors.ink,
    textAlign: "center",
  },
  otpDigitError: { color: Colors.error },
  cursor: {
    position: "absolute",
    bottom: 8,
    width: 2,
    height: 20,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },

  // Hidden inputs sit behind the visible boxes; absolute position keeps them
  // reachable for focus but invisible to the user.
  hiddenInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    // Offset matches the OTP row position (cardLabel height ~28 + margin ~16 + card padding ~32)
    top: 96,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  hiddenInput: {
    width: BOX_SIZE,
    height: BOX_HEIGHT,
    opacity: 0,
  },

  // ── Dev OTP chip (OTP_DEBUG_LOG builds only) ──────────────────────────────
  devChip: {
    alignSelf: "flex-start",
    backgroundColor: Colors.otpIdle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginTop: Spacing.xs,
  },
  devChipText: {
    ...Typography.caption,
    color: Colors.muted,
  },

  // ── Feedback ──────────────────────────────────────────────────────────────
  errorText: {
    ...Typography.bodySm,
    color: Colors.error,
    marginBottom: Spacing.md,
  },

  // ── Button ────────────────────────────────────────────────────────────────
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: Spacing.lg,
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
  },

  // ── Resend ────────────────────────────────────────────────────────────────
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  resendLabel: {
    ...Typography.bodySm,
    color: Colors.subtext,
  },
  resendTimer: {
    ...Typography.bodySm,
    color: Colors.muted,
    fontWeight: "600",
  },
  resendLink: {
    ...Typography.bodySm,
    color: Colors.primary,
    fontWeight: "700",
  },

  // ── SMS note ──────────────────────────────────────────────────────────────
  smsNote: {
    backgroundColor: Colors.successLight,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  smsNoteText: {
    ...Typography.caption,
    color: Colors.success,
    lineHeight: 18,
  },
});
