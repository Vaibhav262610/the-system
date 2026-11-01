# The System — Hunter Protocol

An original, Solo Leveling-inspired RPG productivity application. Built with Next.js-compatible App Router components, TypeScript, Tailwind CSS, Framer Motion, GSAP, Three.js, Drizzle ORM, and Cloudflare D1. The hosted Sites runtime uses Vinext to run the Next.js application on Cloudflare Workers.

## Features

- Private Hunter profile with a cinematic awakening and returning-player boot sequence
- Daily quests with fixed difficulty-based XP, timezone-aware resets, streaks, reminders, and custom quest creation
- XP thresholds, automatic levels, E-to-S ranks, stat allocation, rank ceremonies, and progress history
- Long-term goal dungeons with missions, boss clears, XP bonuses, titles, and collectible rewards
- Achievement gallery, inventory, analytics, and keyboard navigation
- Configurable themes, sound, motion, timezone, and notification settings
- Optional server-side OpenAI coach with a deterministic fallback

## Architecture

`lib/game.ts` contains pure progression rules. `lib/action-schema.ts` validates client actions. `lib/server-state.ts` persists one versioned Hunter aggregate per signed-in user. The optimistic version check prevents lost updates when two actions arrive together. The `app/api/action` route is the only way the client mutates progress. `app/api/assistant` reads the authenticated player's current state and calls the OpenAI Responses API only when a server-side key is configured.

The D1 `hunters` table is defined in `db/schema.ts` and initialized by `drizzle/0000_hunter_profiles.sql`. The private Site supplies a stable authenticated user ID; it is the database key. No API key or progress data is stored in browser local storage. Browser session storage is used only to prevent duplicate reminder notifications.

## Local setup

1. Use Node.js 22.13 or newer. Run `npm ci` in this directory.
2. Run `npm run build` once to create `dist/server/wrangler.json`.
3. Apply the included local D1 migration:

   ```sh
   node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_hunter_profiles.sql
   ```

4. Run `npm run dev`, then open `/signin-with-chatgpt?return_to=/` on the printed local origin. The portable preview signs in a local test user. Hosted Sites uses real ChatGPT sign-in.

For optional AI coaching, configure `OPENAI_API_KEY` as a **server-side Sites secret**. `OPENAI_MODEL` can select a model; the default is `gpt-6-astra`. Do not place credentials in client code or commit a `.env` file. Without a key or when the provider is unavailable, the assistant returns personalized rule-based guidance and quest suggestions.

## Progression rules

- Difficulty rewards: easy 35, normal 60, hard 100, epic 150 XP.
- Level `n` begins at `round(100 × (n − 1)^1.45)` cumulative XP.
- Every level awards three stat points. Ranks: E (1–9), D (10–19), C (20–34), B (35–49), A (50–74), S (75+).
- New training quests unlock at levels 5 and 10; abilities and achievements unlock as milestones are reached.
- Dungeon missions award 50 XP. Clearing the final mission automatically defeats the boss and awards 220 bonus XP and the dungeon's reward title.
- Quests can be completed once per date in the Hunter's configured IANA timezone. The daily board resets at local midnight. Historical completions and XP remain.

## Tests and controls

Run `node --experimental-strip-types --test tests/game.test.ts` for progression tests and `python tests/schema.test.py` for a migration smoke test. Keyboard shortcuts: `1`–`6` select sections, `N` creates a quest, `?` opens shortcuts, and `Esc` closes overlays. Reduced-motion settings and the system media preference disable cinematic animation and the Three.js scene.

Reminders use browser notifications while the app is open. They require browser permission; an in-app System notice is also shown. Scheduled push notifications are outside this version's scope.

All visuals are CSS/SVG or programmatically rendered 3D shapes. No anime artwork or copyrighted assets are included.
