import SystemApp from "@/components/system-app";
import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { getHunter } from "@/lib/server-state";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireChatGPTUser("/");
  const state = await getHunter(user.userId, user.displayName);
  return <SystemApp initialState={state} signOutPath={chatGPTSignOutPath("/")} />;
}
