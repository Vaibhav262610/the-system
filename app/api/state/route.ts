import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getHunter } from "@/lib/server-state";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try { return NextResponse.json({ state: await getHunter(user.userId, user.displayName) }); }
  catch { return NextResponse.json({ error: "Unable to load Hunter profile." }, { status: 500 }); }
}
