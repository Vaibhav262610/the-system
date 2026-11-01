import { z } from "zod";

const short = z.string().trim().max(100);
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("awaken"), name: z.string().trim().min(1).max(32), timezone: z.string().max(80) }),
  z.object({ type: z.literal("completeQuest"), id: z.string().uuid() }),
  z.object({ type: z.literal("addQuest"), title: short.min(1), category: z.string().max(30), difficulty: z.enum(["easy", "normal", "hard", "epic"]), reminder: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional() }),
  z.object({ type: z.literal("deleteQuest"), id: z.string().uuid() }),
  z.object({ type: z.literal("createDungeon"), title: short.min(1), description: z.string().max(300), boss: z.string().max(80), reward: z.string().max(80), missions: z.array(short.min(1)).min(2).max(12) }),
  z.object({ type: z.literal("completeMission"), dungeonId: z.string().uuid(), missionId: z.string().uuid() }),
  z.object({ type: z.literal("allocateStat"), stat: z.enum(["strength", "agility", "intelligence", "perception", "vitality"]) }),
  z.object({ type: z.literal("updateProfile"), name: z.string().trim().min(1).max(32), title: z.string().trim().min(1).max(40) }),
  z.object({ type: z.literal("updateSettings"), theme: z.enum(["abyss", "arcane", "ember"]), sound: z.boolean(), reducedMotion: z.boolean(), reminders: z.boolean(), reminderTime: z.string(), timezone: z.string().max(80) }),
]);
