# brewlab

A local-first coffee-brewing companion: log brews per machine (espresso, V60,
AeroPress…), rate the result, and let an optimizer suggest the next parameters
to try. Built with Expo + SQLite (Drizzle), developed inside a dev container
with Claude Code.

## Quick start (dev container)

1. Open the folder in VS Code → **Reopen in Container** (Dev Containers extension).
   The `post-create` step installs dependencies, version-matches the Expo SDK
   packages, and generates the first database migration.
2. In the container terminal:
   ```
   npm start -- --tunnel      # tunnel is required on Windows / inside the container
   ```
   Scan the QR code with **Expo Go** on your phone.

   > **Web is not supported.** `expo-sqlite` requires SharedArrayBuffer and
   > WebAssembly on web, which need headers Metro doesn't set. The app is
   > mobile-only.
   >
   > Pressing `a` / `i` for an emulator also does **not** work inside the container
   > (no Android SDK, no Xcode). Use tunnel + Expo Go or a dev build (see below).

3. Start Claude Code: run `claude` in the terminal. It reads `CLAUDE.md` for context.

### Shell aliases (available in the container)

```
es    → npx expo start
est   → npx expo start --tunnel
ni    → npm install
nr    → npm run
dbg   → npm run db:generate
dbs   → npm run db:studio
```

> The container runs as **root** and sets `IS_SANDBOX=1`. That's deliberate:
> `/workspace` is bind-mounted from your host, and on Windows drives a non-root
> user can't write into it. `IS_SANDBOX=1` lets Claude Code use bypass mode as
> root; the deny-list in `.claude/settings.json` (`git push`, `npm publish`) still
> applies. root *inside* the container is not root on your machine.
>
> Prefer non-root? Move the project into the WSL2 filesystem, then switch
> `remoteUser`/`containerUser` back to `node` in `devcontainer.json`.

### Hot reload / fast refresh

Fast Refresh rewrites changed modules automatically — you should not need to
press `r`. If you do press `r` (full bundle reload), Metro sends the command over
the tunnel websocket, which can be flaky.

**If code changes aren't appearing on the phone:**

1. Watch the **Metro terminal** when you save a file.
   - *Re-bundling activity appears* → Metro sees the change; the problem is
     delivery over the tunnel. Shake the phone → **Reload** is more reliable
     than `r` in the terminal.
   - *No activity at all* → Metro's file watcher isn't seeing your edits.
     This happens when the repo lives on a Windows drive (bind-mounted into WSL2)
     because inotify events don't cross that boundary. **Fix: move the repo into
     the WSL2 ext4 filesystem** (`~/projects/brewlab`) instead of a Windows drive,
     then reopen the container.

---

## Installing on your phone (no Expo Go)

Building a standalone app requires **EAS Build** (Expo's cloud build service).
The compilation runs on Expo's servers, so no Android SDK or Xcode is needed
in the container.

### One-time setup

```bash
# 1. Create a free Expo account at expo.dev if you don't have one.

# 2. Install EAS CLI and log in (inside the container):
npm install -g eas-cli
eas login

# 3. Link the project to your Expo account:
eas init        # creates eas.json — commit this file

# 4. Add a bundleIdentifier (iOS) and package name (Android) to app.json:
#    "ios":     { "bundleIdentifier": "com.yourname.brewlab" }
#    "android": { "package":          "com.yourname.brewlab" }
```

### Development build (recommended while iterating)

A development build is like Expo Go but for your specific app — it connects to
Metro over Wi-Fi so you keep hot reload, but it runs as a real standalone app
and supports all native modules.

```bash
# Android (produces an .apk you sideload):
eas build --profile development --platform android

# iOS (requires an Apple Developer account):
eas build --profile development --platform ios
```

After the build finishes, EAS prints a download link. Install the APK on your
Android device (enable "Install from unknown sources"), or use the iOS device
portal / TestFlight for iPhone.

**To connect the dev build to Metro:**
```bash
est   # or: npm start -- --tunnel
```
Open the app on your phone → it prompts for the Metro server URL → enter the
tunnel URL, or shake the device to open the dev menu.

> You only need to rebuild the native app when you add a new native module or
> change `app.json`. JS/UI changes are picked up live via Metro.

### Preview / production build

When the app is stable enough to use fully offline (no Metro):

```bash
eas build --profile preview --platform android   # unsigned APK, easy to share
eas build --profile production --platform android # signed, ready for Play Store
```

---

## Layout

```
app/            expo-router screens (tabs: Brews / Beans / Gear; brew/new; analysis)
db/             Drizzle schema + client (schema.ts is the data model)
drizzle/        generated SQL migrations (committed, run automatically on startup)
lib/methods.ts  brew methods + parameter specs (forms / timer / optimizer share this)
lib/optimizer/  suggestNextBrew() + pluggable strategies (RandomSearch, PerturbBest)
.devcontainer/  container config, Claude Code feature, permissions
CLAUDE.md       project plan, conventions, and roadmap for Claude Code
```

## Common commands

```
npm start              # Metro (use -- --tunnel inside the container)
npm run typecheck      # tsc --noEmit — run before committing
npm run lint
npm run db:generate    # regenerate migrations after schema changes
npm run db:studio      # browse the local SQLite DB
```

## Data & backup

Brew data lives in a local SQLite database on-device. Use **Settings → Export**
to save a JSON backup, and **Settings → Import** to restore it (e.g. after
reinstalling the app or switching devices).

See `CLAUDE.md` for the full data model, optimizer design, and phase roadmap.
