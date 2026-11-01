import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { hunters } from "@/db/schema";
import { Action, applyAction, createHunter, GameEvent, HunterState } from "@/lib/game";

export async function getHunter(userId: string, displayName: string): Promise<HunterState> {
  const db = getDb();
  const initial = createHunter(displayName);
  await db.insert(hunters).values({ userId, stateJson: JSON.stringify(initial), updatedAt: new Date().toISOString() }).onConflictDoNothing();
  const row = await db.query.hunters.findFirst({ where: eq(hunters.userId, userId) });
  if (!row) throw new Error("Unable to load Hunter profile.");
  return JSON.parse(row.stateJson) as HunterState;
}

export async function dispatchAction(userId: string, displayName: string, action: Action): Promise<{ state: HunterState; event: GameEvent }> {
  const db = getDb();
  await getHunter(userId, displayName);
  for (let attempt = 0; attempt < 4; attempt++) {
    const row = await db.query.hunters.findFirst({ where: eq(hunters.userId, userId) });
    if (!row) throw new Error("Hunter profile missing.");
    const result = applyAction(JSON.parse(row.stateJson) as HunterState, action);
    const updated = await db.update(hunters)
      .set({ stateJson: JSON.stringify(result.state), version: row.version + 1, updatedAt: new Date().toISOString() })
      .where(and(eq(hunters.userId, userId), eq(hunters.version, row.version)))
      .returning({ version: hunters.version });
    if (updated.length) return result;
  }
  throw new Error("The System is busy. Retry your action.");
}
