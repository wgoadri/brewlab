#!/usr/bin/env bash
set -euo pipefail

# Running as root → no ownership juggling, no chown, no permission errors.
git config --global --add safe.directory /workspace || true

# Project shell aliases (idempotent).
if ! grep -q 'brewlab aliases' /root/.zshrc 2>/dev/null; then
  cat >> /root/.zshrc <<'ZRC'

# brewlab aliases
export EDITOR=nano
alias es="npx expo start"
alias est="npx expo start --tunnel"
alias ni="npm install"
alias nr="npm run"
alias dbg="npm run db:generate"
alias dbs="npm run db:studio"
ZRC
fi

echo "▶ Installing base dependencies…"
npm install

echo "▶ Adding Expo SDK packages (versions matched to the installed SDK)…"
npx expo install \
  react react-native \
  expo-router expo-constants expo-linking expo-status-bar \
  expo-sqlite expo-haptics expo-keep-awake \
  react-native-safe-area-context react-native-screens \
  react-native-gesture-handler react-native-reanimated \
  react-native-web react-dom @expo/vector-icons

echo "▶ Reconciling versions with expo-doctor…"
npx expo install --fix || true

echo "▶ Generating the initial database migration from db/schema.ts…"
npm run db:generate || echo "⚠ db:generate failed — run it manually once deps are settled."

cat <<'MSG'

✓ brewlab dev container is ready.

  Start Metro:   npm start            (on Windows, prefer: npm start -- --tunnel)
  Type-check:    npm run typecheck
  DB migration:  npm run db:generate  (run after every schema change)

Run `claude` in the terminal — it starts prompt-free (bypass mode) and reads CLAUDE.md.
MSG
