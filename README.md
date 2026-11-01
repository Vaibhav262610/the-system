# The System — Hunter Protocol

An original, Solo Leveling-inspired RPG productivity application. Built with Next.js, TypeScript, Tailwind CSS, Framer Motion, GSAP, Three.js, and in-memory state management.

## Features

- Private Hunter profile with a cinematic awakening and returning-player boot sequence
- Daily quests with fixed difficulty-based XP, timezone-aware resets, streaks, reminders, and custom quest creation
- XP thresholds, automatic levels, E-to-S ranks, stat allocation, rank ceremonies, and progress history
- Long-term goal dungeons with missions, boss clears, XP bonuses, titles, and collectible rewards
- Achievement gallery, inventory, analytics, and keyboard navigation
- Configurable themes, sound, motion, timezone, and notification settings
- Optional server-side OpenAI coach with a deterministic fallback

## Architecture

`lib/game.ts` contains pure progression rules. `lib/action-schema.ts` validates client actions. `lib/server-state.ts` persists one versioned Hunter aggregate per signed-in user in memory. The optimistic version check prevents lost updates when two actions arrive together. The `app/api/action` route is the only way the client mutates progress. `app/api/assistant` reads the authenticated player's current state and calls the OpenAI Responses API only when a server-side key is configured.

**Note**: The application currently uses in-memory storage. Data is lost on server restart. For production persistence, implement your preferred storage solution (database, Redis, file system, etc.).

The application uses cookie-based sessions with a demo user in development mode. For production, implement your preferred authentication solution (NextAuth.js recommended). No API key or progress data is stored in browser local storage. Browser session storage is used only to prevent duplicate reminder notifications.

## Local Development

1. **Prerequisites**: Node.js 22.13 or newer

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Set up environment variables** (optional):
   Create a `.env.local` file:
   ```env
   # Optional: OpenAI API for AI coaching
   OPENAI_API_KEY=your-api-key
   OPENAI_MODEL=gpt-4
   ```

4. **Run development server**:
   ```sh
   npm run dev
   ```
   
   The app will auto-login as a demo user in development mode. Open [http://localhost:3000](http://localhost:3000) to view.

## Production Deployment on Vercel

### Step 1: Deploy to Vercel

1. **Push code to GitHub**:
   ```sh
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables** in Vercel (Optional):
   
   For AI coaching:
   - `OPENAI_API_KEY` = Your OpenAI API key
   - `OPENAI_MODEL` = `gpt-4` (or your preferred model)

4. **Deploy**: Click "Deploy" - Vercel will build and deploy automatically

### Step 2: Set Up Authentication (Production)

**Important**: The current auth system uses a demo user in development. For production, you should implement proper authentication:

**Recommended: NextAuth.js**

1. Install NextAuth:
   ```sh
   npm install next-auth
   ```

2. Update `app/chatgpt-auth.ts` to use NextAuth's session management

3. Configure providers (Google, GitHub, Email, etc.) in `app/api/auth/[...nextauth]/route.ts`

See [NextAuth.js documentation](https://next-auth.js.org/) for detailed setup.

### Step 3: Add Persistent Storage (Optional)

The app currently uses in-memory storage. To add persistence:

1. Choose a storage solution (PostgreSQL, MongoDB, Redis, etc.)
2. Update `lib/server-state.ts` to use your chosen storage
3. Add connection configuration to environment variables

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
