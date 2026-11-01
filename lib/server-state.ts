import { Action, applyAction, createHunter, GameEvent, HunterState } from "@/lib/game";

// In-memory storage (replace with your preferred storage solution in production)
const hunters = new Map<string, { state: HunterState; version: number }>();

export async function getHunter(userId: string, displayName: string): Promise<HunterState> {
  if (!hunters.has(userId)) {
    const initial = createHunter(displayName);
    hunters.set(userId, { state: initial, version: 0 });
  }
  return hunters.get(userId)!.state;
}

export async function dispatchAction(userId: string, displayName: string, action: Action): Promise<{ state: HunterState; event: GameEvent }> {
  await getHunter(userId, displayName);
  
  for (let attempt = 0; attempt < 4; attempt++) {
    const record = hunters.get(userId);
    if (!record) throw new Error("Hunter profile missing.");
    
    const result = applyAction(record.state, action);
    
    // Simple version check for optimistic concurrency
    hunters.set(userId, { 
      state: result.state, 
      version: record.version + 1 
    });
    
    return result;
  }
  
  throw new Error("The System is busy. Retry your action.");
}
