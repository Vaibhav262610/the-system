import test from "node:test";
import assert from "node:assert/strict";
import { applyAction, createHunter, dateKey, rankForLevel, streak, xpThreshold } from "../lib/game.ts";

test("awakening, daily quest completion, and duplicate prevention", () => {
  const start = createHunter("hunter@example.com");
  const awakened = applyAction(start, { type: "awaken", name: "Sung", timezone: "Asia/Kolkata" }, new Date("2026-11-01T01:00:00Z")).state;
  assert.equal(awakened.name, "Sung");
  const quest = awakened.quests[0];
  const result = applyAction(awakened, { type: "completeQuest", id: quest.id }, new Date("2026-11-01T02:00:00Z"));
  assert.equal(result.state.xp, quest.xp);
  assert.equal(result.state.completions.length, 1);
  assert.ok(result.state.achievements.includes("first-step"));
  assert.throws(() => applyAction(result.state, { type: "completeQuest", id: quest.id }, new Date("2026-11-01T03:00:00Z")), /already completed/);
  const tomorrow = applyAction(result.state, { type: "completeQuest", id: quest.id }, new Date("2026-11-02T02:00:00Z"));
  assert.equal(tomorrow.state.completions.length, 2);
  assert.equal(streak(tomorrow.state, "2026-11-02"), 2);
});

test("XP thresholds grant levels and stat points", () => {
  let state = createHunter();
  state = applyAction(state, { type: "awaken", name: "Hunter", timezone: "UTC" }).state;
  const quest = state.quests.find((q) => q.xp === 100)!;
  const one = applyAction(state, { type: "completeQuest", id: quest.id }, new Date("2026-11-01T10:00:00Z"));
  assert.equal(one.state.level, 2);
  assert.equal(one.state.statPoints, 3);
  assert.equal(one.event.kind, "level");
  assert.equal(xpThreshold(2), 100);
  const allocated = applyAction(one.state, { type: "allocateStat", stat: "strength" });
  assert.equal(allocated.state.stats.strength, 11);
  assert.equal(allocated.state.statPoints, 2);
  assert.equal(rankForLevel(10), "D");
  assert.equal(rankForLevel(75), "S");
});

test("dungeon missions award XP and final boss unlocks reward once", () => {
  let state = createHunter();
  state = applyAction(state, { type: "createDungeon", title: "Launch project", description: "", boss: "Publish", reward: "Builder", missions: ["Plan", "Build"] }).state;
  const dungeon = state.dungeons[0];
  state = applyAction(state, { type: "completeMission", dungeonId: dungeon.id, missionId: dungeon.missions[0].id }).state;
  assert.equal(state.xp, 50);
  const last = applyAction(state, { type: "completeMission", dungeonId: dungeon.id, missionId: dungeon.missions[1].id });
  assert.equal(last.state.xp, 320);
  assert.equal(last.state.inventory.includes("Builder"), true);
  assert.equal(last.state.achievements.includes("dungeon-clear"), true);
  assert.throws(() => applyAction(last.state, { type: "completeMission", dungeonId: dungeon.id, missionId: dungeon.missions[1].id }), /unavailable/);
});

test("timezone day boundary controls reset", () => {
  assert.equal(dateKey("Asia/Kolkata", new Date("2026-11-01T19:00:00Z")), "2026-11-02");
  assert.equal(dateKey("America/Los_Angeles", new Date("2026-11-01T19:00:00Z")), "2026-11-01");
});

test("rank ascension and achievements follow earned XP", () => {
  let state = createHunter();
  const quest = state.quests.find((q) => q.xp === 100)!;
  let rankEvent = false;
  for (let day = 1; day <= 31; day++) {
    const date = new Date(Date.UTC(2026, 0, day, 12));
    const result = applyAction(state, { type: "completeQuest", id: quest.id }, date);
    state = result.state;
    if (result.event.kind === "rank") rankEvent = true;
  }
  assert.equal(rankForLevel(state.level), "D");
  assert.equal(rankEvent, true);
  assert.ok(state.achievements.includes("rank-d"));
  assert.ok(state.achievements.includes("three-day-streak"));
  assert.ok(state.quests.some((q) => q.title === "Complete a 45-minute deep work session"));
  assert.ok(state.quests.some((q) => q.title === "Train a new skill for 90 minutes"));
});

test("custom quest rewards are controlled by difficulty", () => {
  const initial = createHunter();
  const result = applyAction(initial, { type: "addQuest", title: "Sketch for 20 minutes", category: "Creativity", difficulty: "epic" });
  const custom = result.state.quests.at(-1)!;
  assert.equal(custom.xp, 150);
  assert.equal(custom.category, "CREATIVITY");
  assert.equal(result.state.xp, 0);
});
