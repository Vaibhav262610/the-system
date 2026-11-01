import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { actionSchema } from "@/lib/action-schema";
import { dispatchAction } from "@/lib/server-state";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const payload = await request.json();
    const parsed = actionSchema.safeParse(payload);
    if (!parsed.success) return NextResponse.json({ error: "Invalid action.", details: parsed.error.flatten() }, { status: 400 });
    const result = await dispatchAction(user.userId, user.displayName, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "System error.";
    const expected = /already|not found|unavailable|required|busy|No stat|Hunter/.test(message);
    return NextResponse.json({ error: message }, { status: expected ? 409 : 500 });
  }
}
