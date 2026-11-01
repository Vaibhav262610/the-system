export type Difficulty = "easy" | "normal" | "hard" | "epic";
export type Stat = "strength" | "agility" | "intelligence" | "perception" | "vitality";
export type Theme = "abyss" | "arcane" | "ember";
export type View = "dashboard" | "quests" | "dungeons" | "inventory" | "analytics" | "profile";

export interface Quest {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  xp: number;
  createdAt: string;
  reminder?: string;
}
export interface Completion { id: string; questId: string; date: string; at: string; xp: number }
export interface Mission { id: string; title: string; completedAt?: string }
export interface Dungeon {
  id: string;
  title: string;
  description: string;
  boss: string;
  reward: string;
  missions: Mission[];
  createdAt: string;
  completedAt?: string;
}
export interface Activity {
  id: string;
  at: string;
  type: "quest" | "mission" | "dungeon" | "level" | "rank" | "achievement";
  title: string;
  xp: number;
}
export interface HunterState {
  name: string;
  title: string;
  awakenedAt: string | null;
  timezone: string;
  theme: Theme;
  sound: boolean;
  reducedMotion: boolean;
  reminders: boolean;
  reminderTime: string;
  xp: number;
  level: number;
  statPoints: number;
  stats: Record<Stat, number>;
  quests: Quest[];
  completions: Completion[];
  dungeons: Dungeon[];
  activity: Activity[];
  achievements: string[];
  inventory: string[];
}

export type Action =
  | { type: "awaken"; name: string; timezone: string }
  | { type: "completeQuest"; id: string }
  | { type: "addQuest"; title: string; category: string; difficulty: Difficulty; reminder?: string }
  | { type: "deleteQuest"; id: string }
  | { type: "createDungeon"; title: string; description: string; boss: string; reward: string; missions: string[] }
  | { type: "completeMission"; dungeonId: string; missionId: string }
  | { type: "allocateStat"; stat: Stat }
  | { type: "updateProfile"; name: string; title: string }
  | { type: "updateSettings"; theme: Theme; sound: boolean; reducedMotion: boolean; reminders: boolean; reminderTime: string; timezone: string };

export interface GameEvent {
  kind: "quest" | "mission" | "dungeon" | "level" | "rank" | "achievement" | "saved";
  title: string;
  xp?: number;
  level?: number;
  rank?: string;
  unlocked?: string[];
  questUnlocks?: string[];
}

export const DIFFICULTY_XP: Record<Difficulty, number> = { easy: 35, normal: 60, hard: 100, epic: 150 };
export const STAT_LABELS: Record<Stat, string> = { strength: "Strength", agility: "Agility", intelligence: "Intelligence", perception: "Perception", vitality: "Vitality" };
export const ACHIEVEMENTS = [
  { id: "first-step", name: "First Step", description: "Complete your first daily quest.", rarity: "common", icon: "✦" },
  { id: "five-quests", name: "Unbreakable Will", description: "Complete five quests.", rarity: "rare", icon: "◆" },
  { id: "three-day-streak", name: "Daily Discipline", description: "Reach a three-day streak.", rarity: "rare", icon: "◈" },
  { id: "level-five", name: "Rising Hunter", description: "Reach level five.", rarity: "epic", icon: "✧" },
  { id: "dungeon-clear", name: "Dungeon Breaker", description: "Clear your first dungeon.", rarity: "epic", icon: "⬡" },
  { id: "rank-d", name: "Rank Ascension", description: "Ascend to D rank.", rarity: "legendary", icon: "✴" },
] as const;

const seedQuests: Array<[string, string, Difficulty]> = [
  ["Complete 30 push-ups", "PHYSICAL TRAINING", "normal"],
  ["Study for 2 hours", "KNOWLEDGE", "hard"],
  ["Read 20 pages", "KNOWLEDGE", "easy"],
  ["Practice coding for 1 hour", "SKILL BUILDING", "hard"],
  ["Meditate for 10 minutes", "RECOVERY", "easy"],
];
const unlockableQuests: Array<{ level: number; title: string; category: string; difficulty: Difficulty }> = [
  { level: 5, title: "Complete a 45-minute deep work session", category: "FOCUS", difficulty: "hard" },
  { level: 10, title: "Train a new skill for 90 minutes", category: "ADVANCED TRAINING", difficulty: "epic" },
];

export function createHunter(displayName = "Hunter"): HunterState {
  const now = new Date().toISOString();
  return {
    name: displayName.split("@")[0].slice(0, 32) || "Hunter",
    title: "THE AWAKENED",
    awakenedAt: now,
    timezone: "Asia/Kolkata",
    theme: "abyss",
    sound: true,
    reducedMotion: false,
    reminders: false,
    reminderTime: "20:00",
    xp: 0,
    level: 1,
    statPoints: 0,
    stats: { strength: 10, agility: 10, intelligence: 10, perception: 10, vitality: 10 },
    quests: seedQuests.map(([title, category, difficulty]) => ({ id: crypto.randomUUID(), title, category, difficulty, xp: DIFFICULTY_XP[difficulty], createdAt: now })),
    completions: [], dungeons: [], activity: [], achievements: [], inventory: [],
  };
}

export function xpThreshold(level: number): number {
  return Math.round(100 * Math.pow(Math.max(0, level - 1), 1.45));
}
export function rankForLevel(level: number): string {
  if (level >= 75) return "S";
  if (level >= 50) return "A";
  if (level >= 35) return "B";
  if (level >= 20) return "C";
  if (level >= 10) return "D";
  return "E";
}
export function dateKey(timezone: string, date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    const get = (part: string) => parts.find((p) => p.type === part)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}`;
  } catch { return date.toISOString().slice(0, 10); }
}
export function dayBefore(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
export function streak(state: HunterState, today = dateKey(state.timezone)): number {
  const days = new Set(state.completions.map((c) => c.date));
  let cursor = days.has(today) ? today : dayBefore(today);
  let count = 0;
  while (days.has(cursor)) { count++; cursor = dayBefore(cursor); }
  return count;
}
export function todayCompletions(state: HunterState, today = dateKey(state.timezone)): Completion[] {
  const active = new Set(state.quests.map((q) => q.id));
  return state.completions.filter((c) => c.date === today && active.has(c.questId));
}
export function currentXp(state: HunterState): { current: number; required: number; percent: number } {
  const floor = xpThreshold(state.level);
  const ceiling = xpThreshold(state.level + 1);
  const current = state.xp - floor;
  const required = ceiling - floor;
  return { current, required, percent: Math.max(0, Math.min(100, Math.round((current / required) * 100))) };
}

function record(state: HunterState, type: Activity["type"], title: string, xp: number, now: string) {
  state.activity.unshift({ id: crypto.randomUUID(), at: now, type, title, xp });
  state.activity = state.activity.slice(0, 500);
}
function grantXp(state: HunterState, amount: number, title: string, type: Activity["type"], now: string): GameEvent | null {
  const priorLevel = state.level;
  const priorRank = rankForLevel(priorLevel);
  state.xp += amount;
  record(state, type, title, amount, now);
  while (state.xp >= xpThreshold(state.level + 1)) state.level++;
  if (state.level > priorLevel) {
    state.statPoints += (state.level - priorLevel) * 3;
    record(state, "level", `Level ${state.level} reached`, 0, now);
  }
  const questUnlocks = unlockableQuests.filter((quest) => priorLevel < quest.level && state.level >= quest.level && !state.quests.some((existing) => existing.title === quest.title));
  for (const quest of questUnlocks) state.quests.push({ id: crypto.randomUUID(), title: quest.title, category: quest.category, difficulty: quest.difficulty, xp: DIFFICULTY_XP[quest.difficulty], createdAt: now });
  const rank = rankForLevel(state.level);
  if (rank !== priorRank) {
    record(state, "rank", `Ascended to ${rank} rank`, 0, now);
    return { kind: "rank", title: "RANK ASCENSION", rank, level: state.level, xp: amount, questUnlocks: questUnlocks.map((q) => q.title) };
  }
  if (state.level > priorLevel) return { kind: "level", title: "LEVEL UP", level: state.level, xp: amount, questUnlocks: questUnlocks.map((q) => q.title) };
  return null;
}
function refreshAchievements(state: HunterState, now: string): string[] {
  const conditions: Record<string, boolean> = {
    "first-step": state.completions.length >= 1,
    "five-quests": state.completions.length >= 5,
    "three-day-streak": streak(state, dateKey(state.timezone, new Date(now))) >= 3,
    "level-five": state.level >= 5,
    "dungeon-clear": state.dungeons.some((d) => !!d.completedAt),
    "rank-d": rankForLevel(state.level) !== "E",
  };
  const unlocked = Object.keys(conditions).filter((id) => conditions[id] && !state.achievements.includes(id));
  for (const id of unlocked) {
    state.achievements.push(id);
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    record(state, "achievement", `${achievement?.name ?? id} unlocked`, 0, now);
    state.inventory.push(achievement?.name ?? id);
  }
  return unlocked;
}

export function applyAction(previous: HunterState, action: Action, now = new Date()): { state: HunterState; event: GameEvent } {
  const state: HunterState = structuredClone(previous);
  const at = now.toISOString();
  let event: GameEvent = { kind: "saved", title: "SYSTEM UPDATED" };
  switch (action.type) {
    case "awaken":
      if (state.awakenedAt) throw new Error("Hunter already awakened.");
      state.name = action.name.trim().slice(0, 32) || "Hunter";
      state.timezone = validTimezone(action.timezone);
      state.awakenedAt = at;
      event = { kind: "saved", title: "AWAKENING COMPLETE" };
      break;
    case "completeQuest": {
      const quest = state.quests.find((q) => q.id === action.id);
      if (!quest) throw new Error("Quest not found.");
      const day = dateKey(state.timezone, now);
      if (state.completions.some((c) => c.questId === quest.id && c.date === day)) throw new Error("Quest already completed today.");
      state.completions.push({ id: crypto.randomUUID(), questId: quest.id, date: day, at, xp: quest.xp });
      event = grantXp(state, quest.xp, quest.title, "quest", at) ?? { kind: "quest", title: "QUEST COMPLETE", xp: quest.xp };
      break;
    }
    case "addQuest": {
      const title = action.title.trim().slice(0, 100);
      if (!title) throw new Error("Quest title is required.");
      if (!Object.hasOwn(DIFFICULTY_XP, action.difficulty)) throw new Error("Invalid difficulty.");
      state.quests.push({ id: crypto.randomUUID(), title, category: action.category.trim().slice(0, 30).toUpperCase() || "PERSONAL", difficulty: action.difficulty, xp: DIFFICULTY_XP[action.difficulty], createdAt: at, reminder: action.reminder });
      event = { kind: "saved", title: "NEW QUEST ADDED" };
      break;
    }
    case "deleteQuest":
      if (!state.quests.some((q) => q.id === action.id)) throw new Error("Quest not found.");
      state.quests = state.quests.filter((q) => q.id !== action.id);
      event = { kind: "saved", title: "QUEST REMOVED" };
      break;
    case "createDungeon": {
      const title = action.title.trim().slice(0, 100);
      const missions = action.missions.map((m) => m.trim().slice(0, 100)).filter(Boolean).slice(0, 12);
      if (!title || missions.length < 2) throw new Error("Add a dungeon title and at least two missions.");
      state.dungeons.push({ id: crypto.randomUUID(), title, description: action.description.trim().slice(0, 300), boss: action.boss.trim().slice(0, 80) || "The Final Trial", reward: action.reward.trim().slice(0, 80) || "Dungeon Conqueror", missions: missions.map((m) => ({ id: crypto.randomUUID(), title: m })), createdAt: at });
      event = { kind: "saved", title: "DUNGEON GATE OPENED" };
      break;
    }
    case "completeMission": {
      const dungeon = state.dungeons.find((d) => d.id === action.dungeonId);
      if (!dungeon || dungeon.completedAt) throw new Error("Dungeon is unavailable.");
      const mission = dungeon.missions.find((m) => m.id === action.missionId);
      if (!mission || mission.completedAt) throw new Error("Mission is unavailable.");
      mission.completedAt = at;
      event = grantXp(state, 50, mission.title, "mission", at) ?? { kind: "mission", title: "MISSION CLEARED", xp: 50 };
      if (dungeon.missions.every((m) => m.completedAt)) {
        dungeon.completedAt = at;
        state.inventory.push(dungeon.reward);
        const bonus = grantXp(state, 220, `${dungeon.boss} defeated`, "dungeon", at);
        event = bonus?.kind === "rank" || bonus?.kind === "level" ? bonus : { kind: "dungeon", title: "DUNGEON CLEARED", xp: 270 };
      }
      break;
    }
    case "allocateStat":
      if (state.statPoints < 1 || !(action.stat in state.stats)) throw new Error("No stat point available.");
      state.stats[action.stat]++;
      state.statPoints--;
      event = { kind: "saved", title: `${STAT_LABELS[action.stat].toUpperCase()} INCREASED` };
      break;
    case "updateProfile":
      state.name = action.name.trim().slice(0, 32) || state.name;
      state.title = action.title.trim().slice(0, 40) || state.title;
      event = { kind: "saved", title: "PROFILE UPDATED" };
      break;
    case "updateSettings":
      state.theme = action.theme;
      state.sound = action.sound;
      state.reducedMotion = action.reducedMotion;
      state.reminders = action.reminders;
      state.reminderTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(action.reminderTime) ? action.reminderTime : "20:00";
      state.timezone = validTimezone(action.timezone);
      event = { kind: "saved", title: "SETTINGS SAVED" };
      break;
  }
  const unlocked = refreshAchievements(state, at);
  if (unlocked.length) event.unlocked = unlocked;
  return { state, event };
}

function validTimezone(timezone: string): string {
  try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }); return timezone; }
  catch { return "UTC"; }
}
