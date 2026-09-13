/**
 * Global types for the Metro/Expo runtime.
 *
 * `process` exists in the React Native bundle (a minimal shim), and
 * babel-preset-expo statically inlines `process.env.EXPO_PUBLIC_*` member
 * accesses from apps/mobile/.env at build time — so no @types/node needed.
 */
declare const process: {
  env: Record<string, string | undefined>;
};
