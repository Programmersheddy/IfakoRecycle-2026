// @ts-check
import tseslint from "typescript-eslint";

/**
 * Shared flat ESLint config for all EAS workspaces.
 * Consumers add an `eslint.config.mjs` containing:
 *
 *   import base from "@eas/config/eslint.config.base.mjs";
 *   export default base;
 */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.expo/**",
      "**/coverage/**"
    ]
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" }
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "no-console": "off"
    }
  }
);
