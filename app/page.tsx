import SystemApp from "@/components/system-app";
import { chatGPTSignOutPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { getHunter } from "@/lib/server-state";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  
  // Auto-create demo user if none exists (for demo purposes)
  const finalUser = user || {
    userId: "demo_user",
    displayName: "Demo Hunter",
    email: "demo@example.com",
    fullName: "Demo Hunter",
  };
  
  const state = await getHunter(finalUser.userId, finalUser.displayName);
  return <SystemApp initialState={state} signOutPath={chatGPTSignOutPath("/")} />;
}
