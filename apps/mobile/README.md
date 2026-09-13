# @eas/mobile

React Native + Expo (TypeScript) client for EAS — Earn While You Clean (PRD §7.4 `apps/mobile`).

## MVP feature order (PRD §4)

1. Auth — phone + OTP (§4.1)
2. Map & collection points (§4.2)
3. Report trash pile (§4.3)
4. Wallet & earnings / Paystack cashout (§4.4)
5. Pickup scheduling (§4.5)

## Run

```bash
pnpm start        # from repo root: pnpm mobile
```

## Notes

- Package versions are scaffold estimates for Expo SDK 54 — after the first
  `pnpm install`, run `npx expo install --fix` to align every Expo package with the SDK.
- Shared types come from `@eas/types` (`packages/types`).
- API base URL lives in `app.json` under `expo.extra.apiBaseUrl`.
