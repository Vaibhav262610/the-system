import { HunterState, dateKey, streak, todayCompletions } from "@/lib/game";

export type AssistantMode = "briefing" | "quests" | "analysis";
export interface Suggestion { title: string; category: string; difficulty: "easy" | "normal" | "hard" }
export interface AssistantReply { message: string; suggestions: Suggestion[]; source: "system" | "ai" }

export function fallbackAssistant(state: HunterState, mode: AssistantMode): AssistantReply {
  const done = todayCompletions(state).length;
  const remaining = state.quests.filter((q) => !state.completions.some((c) => c.questId === q.id && c.date === dateKey(state.timezone)));
  const suggestions: Suggestion[] = [
    { title: "Take a 15-minute focused walk", category: "PHYSICAL TRAINING", difficulty: "easy" },
    { title: "Plan tomorrow's top three priorities", category: "STRATEGY", difficulty: "easy" },
    { title: "Practice one difficult skill for 25 minutes", category: "SKILL BUILDING", difficulty: "normal" },
  ].filter((s) => !state.quests.some((q) => q.title.toLowerCase() === s.title.toLowerCase()));
  if (mode === "quests") return { message: "The System has prepared balanced training quests. Choose one to add to your daily rotation.", suggestions, source: "system" };
  if (mode === "analysis") {
    const total = state.completions.length;
    const weekly = state.completions.filter((c) => Date.now() - new Date(c.at).getTime() < 7 * 86400000).length;
    return { message: total ? `You have completed ${total} quests in total, including ${weekly} in the last seven days. Your current streak is ${streak(state)} day${streak(state) === 1 ? "" : "s"}. ${weekly < 5 ? "Choose one small quest each day to build momentum." : "Your pace is strong. Keep recovery in your rotation to stay consistent."}` : "Your journey has just begun. Complete one manageable quest today to establish your baseline.", suggestions: [], source: "system" };
  }
  return { message: done ? `${done} quest${done === 1 ? "" : "s"} cleared today. ${remaining.length ? `Your next objective: ${remaining[0].title}.` : "Daily protocol complete. Rest and prepare for tomorrow."}` : `Welcome back, ${state.name}. ${remaining.length} daily quests await. Begin with a small victory to gain momentum.`, suggestions: [], source: "system" };
}
