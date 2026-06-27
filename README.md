# brewlab

A local-first coffee-brewing companion: log brews per machine, rate the result,
and let an optimizer suggest the next parameters to try. Built with Expo +
SQLite (Drizzle), developed inside a dev container with Claude Code.

## Quick start

1. Open the folder in VS Code → **Reopen in Container** (Dev Containers extension).
   The `post-create` step installs dependencies, version-matches the Expo SDK
   packages, and generates the first database migration.
2. In the container terminal:
   ```
   npm start -- --tunnel      # --tunnel is the reliable option on Windows
   ```
   Scan the QR code with Expo Go, or press `a` / `i` for an emulator.
3. Start Claude Code: run `claude` in the terminal. It reads `CLAUDE.md` for context.

> The container runs as **root** and sets `IS_SANDBOX=1`. That's deliberate:
> `/workspace` is bind-mounted from your host, and on Windows drives a non-root
> user can't write into it — running as root removes that whole class of
> permission errors. `IS_SANDBOX=1` then lets Claude Code use **bypass mode** (no
> approval prompts) as root; the deny-list in `.claude/settings.json` (`git push`,
> `npm publish`) still applies. root *inside* the container is not root on your
> machine — the container is still the isolation boundary.
>
> Prefer non-root? Put the project inside the WSL2 filesystem instead of a
> Windows drive, then switch `remoteUser`/`containerUser` back to `node` — on
> ext4 the `node` user can write normally and root isn't needed.

## Layout

```
app/            expo-router screens (tabs: Brews / Beans / Gear; brew/new)
db/             Drizzle schema + client (schema.ts is the data model)
drizzle/        generated SQL migrations (run `npm run db:generate`)
lib/methods.ts  brew methods + parameter specs (forms/timer/optimizer share this)
lib/optimizer/  suggestNextBrew() + pluggable strategies
.devcontainer/  container, Claude Code feature, permissions
CLAUDE.md       project plan & conventions for Claude Code
```

## Common commands

```
npm start              # Metro
npm run typecheck      # tsc --noEmit
npm run db:generate    # after editing db/schema.ts
npm run db:studio      # browse the local DB
```

See `CLAUDE.md` for the full plan, data model, and roadmap.
