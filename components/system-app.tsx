"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity, ArrowDownRight, ArrowRight, Bell, BookOpen, Check, ChevronDown,
  CircleHelp, Clock3, Compass, Flame, Gem, Hexagon, Keyboard, LayoutDashboard,
  LockKeyhole, Menu, MoreHorizontal, Plus, Settings2, Shield, Sparkles, Swords,
  Target, Trash2, TrendingUp, Trophy, UserRound, WandSparkles, X, Zap,
  type LucideIcon,
} from "lucide-react";
import { SystemCore } from "@/components/system-core";
import { ACHIEVEMENTS, Action, currentXp, dateKey, DIFFICULTY_XP, Difficulty, Dungeon, GameEvent, HunterState, rankForLevel, STAT_LABELS, Stat, streak, todayCompletions, View } from "@/lib/game";
import type { AssistantMode, AssistantReply } from "@/lib/assistant";

const nav: Array<{ id: View; label: string; icon: LucideIcon; key: string }> = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard, key: "1" },
  { id: "quests", label: "Daily Quests", icon: Target, key: "2" },
  { id: "dungeons", label: "Dungeons", icon: Swords, key: "3" },
  { id: "inventory", label: "Achievements", icon: Trophy, key: "4" },
  { id: "analytics", label: "Analytics", icon: Activity, key: "5" },
  { id: "profile", label: "Hunter Profile", icon: UserRound, key: "6" },
];
const themes = [
  { id: "abyss", label: "Abyss Blue", color: "#48baff" },
  { id: "arcane", label: "Arcane Violet", color: "#a67aff" },
  { id: "ember", label: "Ember Gold", color: "#f6bd68" },
] as const;

function playTone(kind: GameEvent["kind"], enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext;
    const context = new AudioContextClass();
    const frequencies = kind === "level" || kind === "rank" ? [330, 440, 660, 880] : kind === "dungeon" ? [220, 330, 520, 780] : [480, 620, 820];
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + index * 0.09);
      gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + index * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.09 + 0.22);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + index * 0.09);
      oscillator.stop(context.currentTime + index * 0.09 + 0.23);
    });
    window.setTimeout(() => void context.close(), 1200);
  } catch { /* Audio is optional. */ }
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`system-panel ${className}`}>{children}</section>;
}
function PanelTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="panel-title"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div>{action}</div>;
}
function ProgressBar({ value, tone = "blue", className = "" }: { value: number; tone?: "blue" | "pink" | "green" | "gold"; className?: string }) {
  return <div className={`progress-track ${className}`}><div className={`progress-fill ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
function Emblem({ className = "" }: { className?: string }) {
  return <span className={`emblem ${className}`} aria-hidden="true"><span className="emblem-center" /></span>;
}

export default function SystemApp({ initialState, signOutPath }: { initialState: HunterState; signOutPath: string }) {
  const [state, setState] = useState(initialState);
  const [view, setView] = useState<View>("dashboard");
  const [modal, setModal] = useState<"quest" | "dungeon" | "settings" | "shortcuts" | null>(null);
  const [ceremony, setCeremony] = useState<GameEvent | null>(null);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState("");
  const [boot, setBoot] = useState(!!initialState.awakenedAt);
  const [mobileNav, setMobileNav] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const [assistant, setAssistant] = useState<AssistantReply | null>(null);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [questForm, setQuestForm] = useState({ title: "", category: "PERSONAL", difficulty: "normal" as Difficulty, reminder: "" });
  const [dungeonForm, setDungeonForm] = useState({ title: "", description: "", boss: "", reward: "", missions: "" });
  const [profileForm, setProfileForm] = useState({ name: initialState.name, title: initialState.title });
  const [settingsForm, setSettingsForm] = useState({ theme: initialState.theme, sound: initialState.sound, reducedMotion: initialState.reducedMotion, reminders: initialState.reminders, reminderTime: initialState.reminderTime, timezone: initialState.timezone });
  const systemReducedMotion = useReducedMotion();
  const reducedMotion = state.reducedMotion || !!systemReducedMotion;
  const today = dateKey(state.timezone, clock);
  const completed = todayCompletions(state, today);
  const completedIds = new Set(completed.map((c) => c.questId));
  const xp = currentXp(state);
  const rank = rankForLevel(state.level);
  const dailyPercent = state.quests.length ? Math.round((completed.length / state.quests.length) * 100) : 0;
  const currentStreak = streak(state, today);
  const totalDungeonClears = state.dungeons.filter((d) => d.completedAt).length;

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!boot) return;
    if (reducedMotion) { setBoot(false); return; }
    let live = true;
    import("gsap").then(({ gsap }) => {
      if (!live) return;
      gsap.fromTo(".boot-word", { opacity: 0, y: 22, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.75, stagger: 0.1, ease: "power3.out" });
    });
    const timer = window.setTimeout(() => setBoot(false), 1450);
    return () => { live = false; window.clearTimeout(timer); };
  }, [boot, reducedMotion]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "Escape") { setModal(null); setCeremony(null); setMobileNav(false); }
      if (event.key === "?") setModal("shortcuts");
      if (event.key.toLowerCase() === "n") { setModal("quest"); setView("quests"); }
      const item = nav.find((entry) => entry.key === event.key);
      if (item) { setView(item.id); setModal(null); setMobileNav(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!state.reminders || !state.awakenedAt) return;
    const check = () => {
      const time = new Date().toLocaleTimeString("en-GB", { timeZone: state.timezone, hour: "2-digit", minute: "2-digit", hour12: false });
      const day = dateKey(state.timezone);
      const key = `system-reminder-${day}`;
      const completedToday = new Set(todayCompletions(state, day).map((c) => c.questId));
      const remaining = state.quests.length - completedToday.size;
      const personal = state.quests.find((q) => q.reminder === time && !completedToday.has(q.id));
      if ((time === state.reminderTime || personal) && remaining > 0 && sessionStorage.getItem(key + time) !== "sent") {
        sessionStorage.setItem(key + time, "sent");
        setToast(personal ? `QUEST REMINDER · ${personal.title}` : `${remaining} quest${remaining === 1 ? "" : "s"} remain in today's protocol.`);
        if ("Notification" in window && Notification.permission === "granted") new Notification("THE SYSTEM · Daily protocol", { body: personal ? personal.title : `${remaining} quests await your attention.` });
      }
    };
    check();
    const interval = window.setInterval(check, 30_000);
    return () => window.clearInterval(interval);
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function act(action: Action, busyKey = action.type) {
    if (busy) return false;
    setBusy(busyKey);
    try {
      const response = await fetch("/api/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action failed.");
      setState(data.state as HunterState);
      const event = data.event as GameEvent;
      playTone(event.kind, state.sound);
      if (event.kind === "level" || event.kind === "rank") setCeremony(event);
      else setToast(`${event.title}${event.xp ? ` · +${event.xp} XP` : ""}`);
      if (event.unlocked?.length) {
        const names = event.unlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.name || id).join(", ");
        window.setTimeout(() => setToast(`ACHIEVEMENT UNLOCKED · ${names}`), 900);
      }
      if (event.questUnlocks?.length) window.setTimeout(() => setToast(`NEW QUEST UNLOCKED · ${event.questUnlocks?.join(", ")}`), 1750);
      return true;
    } catch (error) {
      setToast(error instanceof Error ? error.message : "System error. Retry your action.");
      return false;
    } finally { setBusy(""); }
  }

  async function askAssistant(mode: AssistantMode) {
    setAssistantBusy(true);
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
      if (!response.ok) throw new Error("Assistant unavailable.");
      setAssistant(await response.json());
    } catch { setToast("The System assistant is temporarily unavailable."); }
    finally { setAssistantBusy(false); }
  }

  function navigate(next: View) { setView(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" }); }
  async function saveSettings() {
    const saved = await act({ type: "updateSettings", ...settingsForm });
    if (saved) setModal(null);
  }
  async function createQuest(event: React.FormEvent) {
    event.preventDefault();
    const saved = await act({ type: "addQuest", title: questForm.title, category: questForm.category, difficulty: questForm.difficulty, reminder: questForm.reminder || undefined });
    if (saved) { setQuestForm({ title: "", category: "PERSONAL", difficulty: "normal", reminder: "" }); setModal(null); }
  }
  async function createDungeon(event: React.FormEvent) {
    event.preventDefault();
    const missions = dungeonForm.missions.split("\n").map((m) => m.trim()).filter(Boolean);
    const saved = await act({ type: "createDungeon", title: dungeonForm.title, description: dungeonForm.description, boss: dungeonForm.boss, reward: dungeonForm.reward, missions });
    if (saved) { setDungeonForm({ title: "", description: "", boss: "", reward: "", missions: "" }); setModal(null); }
  }

  const lastSevenDays = useMemo(() => {
    const result: Array<{ date: string; label: string; count: number; xp: number }> = [];
    const cursor = new Date(`${today}T12:00:00Z`);
    for (let i = 6; i >= 0; i--) {
      const day = new Date(cursor); day.setUTCDate(day.getUTCDate() - i);
      const key = day.toISOString().slice(0, 10);
      const list = state.completions.filter((c) => c.date === key);
      result.push({ date: key, label: day.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase(), count: list.length, xp: list.reduce((sum, c) => sum + c.xp, 0) });
    }
    return result;
  }, [state.completions, today]);

  return <div className={`system-app theme-${state.theme} ${reducedMotion ? "reduced-motion" : ""}`}>
    <div className="ambient-grid" aria-hidden="true" /><div className="ambient-glow" aria-hidden="true" />
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="sidebar-brand"><Emblem /><div><strong>THE SYSTEM</strong><span>HUNTER PROTOCOL</span></div><button className="mobile-close icon-button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button></div>
        <div className="sidebar-section-label">COMMAND CENTER</div>
        <nav className="side-nav" aria-label="Main navigation">{nav.map(({ id, label, icon: Icon, key }) => <button key={id} className={`nav-item ${view === id ? "active" : ""}`} onClick={() => navigate(id)} aria-current={view === id ? "page" : undefined}><Icon size={18} strokeWidth={1.8} /><span>{label}</span><kbd>{key}</kbd></button>)}</nav>
        <div className="sidebar-divider" />
        <div className="sidebar-section-label">SYSTEM STATUS</div>
        <div className="sidebar-status"><div><span className="status-dot" /> ALL SYSTEMS ONLINE</div><small>Daily protocol resets at midnight<br />{state.timezone.replaceAll("_", " ")}</small></div>
        <div className="sidebar-bottom"><button className="nav-item" onClick={() => { setSettingsForm({ theme: state.theme, sound: state.sound, reducedMotion: state.reducedMotion, reminders: state.reminders, reminderTime: state.reminderTime, timezone: state.timezone }); setModal("settings"); }}><Settings2 size={18} /><span>Settings</span></button><button className="nav-item" onClick={() => setModal("shortcuts")}><Keyboard size={18} /><span>Shortcuts</span><kbd>?</kbd></button><div className="sidebar-profile" onClick={() => navigate("profile")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") navigate("profile"); }}><div className="sidebar-avatar"><UserRound size={20} /></div><div><strong>{state.name}</strong><span>LEVEL {String(state.level).padStart(2, "0")} · {rank}-RANK</span></div><MoreHorizontal size={16} /></div></div>
      </aside>
      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      <main className="main-area">
        <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={21} /></button><span className="breadcrumb">SYSTEM</span><span className="breadcrumb-divider">/</span><span className="breadcrumb-current">{nav.find((item) => item.id === view)?.label}</span></div><div className="topbar-right"><div className="server-pill"><span className="status-dot" /> SYSTEM ONLINE</div><button className="top-icon" aria-label="Keyboard shortcuts" onClick={() => setModal("shortcuts")}><CircleHelp size={18} /></button><button className="top-icon" aria-label="Settings" onClick={() => setModal("settings")}><Settings2 size={18} /></button><button className="top-avatar" onClick={() => navigate("profile")} aria-label="Hunter profile"><UserRound size={18} /></button></div></header>
        <div className="content-area">
          <AnimatePresence mode="wait" initial={false}><motion.div key={view} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {view === "dashboard" && <>
              <section className="hero"><div className="hero-copy"><div className="hero-tag"><span className="tag-line" /> PLAYER STATUS // AWAKENED</div><h1>Arise, <span>Hunter.</span></h1><p>Every action shapes your legend. Your journey to greatness continues today.</p><div className="hero-actions"><button className="primary-button" onClick={() => navigate("quests")}>Continue your journey <ArrowRight size={17} /></button><button className="text-button" onClick={() => navigate("profile")}>View status <ArrowRight size={16} /></button></div><div className="hero-coordinates">PLAYER ID <span>#{state.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "HUNTER"}</span><i /> SYSTEM VER. 01.04</div></div><div className="hero-art"><SystemCore reducedMotion={reducedMotion} /><div className="hero-rank"><small>CURRENT RANK</small><strong>{rank}</strong><span>HUNTER</span></div></div><span className="hero-corner hero-corner-a" /><span className="hero-corner hero-corner-b" /></section>
              <div className="section-heading"><div><span className="eyebrow">YOUR JOURNEY</span><h2>Hunter Overview</h2></div><span className="date-label"><Clock3 size={14} /> {clock.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span></div>
              <div className="metric-grid"><Metric icon={Zap} label="TOTAL EXPERIENCE" value={state.xp.toLocaleString()} suffix="XP" foot={`Level ${state.level} → ${state.level + 1}`} tone="blue" /><Metric icon={Target} label="QUESTS TODAY" value={`${completed.length}/${state.quests.length}`} foot={`${dailyPercent}% daily completion`} tone="purple" /><Metric icon={Flame} label="CURRENT STREAK" value={String(currentStreak).padStart(2, "0")} suffix="DAYS" foot="Consistency is power" tone="orange" /><Metric icon={Gem} label="STAT POINTS" value={String(state.statPoints).padStart(2, "0")} foot="Ready to allocate" tone="green" /></div>
              <div className="dashboard-grid"><Panel className="quest-panel"><PanelTitle eyebrow="DAILY PROTOCOL" title="Active Quests" action={<button className="panel-link" onClick={() => navigate("quests")}>View all <ArrowRight size={15} /></button>} /><div className="daily-progress"><div><span>DAILY PROGRESS</span><strong>{dailyPercent}%</strong></div><ProgressBar value={dailyPercent} /></div><div className="quest-list">{state.quests.slice(0, 5).map((quest) => <QuestRow key={quest.id} quest={quest} done={completedIds.has(quest.id)} busy={!!busy} onComplete={() => void act({ type: "completeQuest" as const, id: quest.id }, quest.id)} />)}{!state.quests.length && <EmptyState icon={Target} title="No quests in your protocol" text="Add a quest to begin earning XP." action={<button className="secondary-button" onClick={() => setModal("quest")}>Add a quest</button>} />}</div><button className="quest-add-inline" onClick={() => setModal("quest")}><Plus size={17} /> Create custom quest</button></Panel>
              <div className="right-stack"><Panel className="hunter-panel"><PanelTitle eyebrow="HUNTER INFORMATION" title="Your Status" action={<span className="rank-chip">{rank}-RANK</span>} /><div className="hunter-identity"><div className="hunter-portrait"><UserRound size={40} strokeWidth={1.2} /></div><div><h3>{state.name}</h3><span>{state.title}</span><div className="level-line">LVL {String(state.level).padStart(0, "0")} <i /> {rank}-RANK HUNTER</div></div></div><div className="xp-heading"><span>EXPERIENCE</span><strong>{xp.current} / {xp.required} XP</strong></div><ProgressBar value={xp.percent} /><div className="resource-list"><Resource label="HP" value={Math.min(100, 75 + state.stats.vitality)} max={100} tone="pink" /><Resource label="MP" value={Math.min(100, 55 + state.stats.intelligence)} max={100} tone="blue" /><Resource label="STAMINA" value={Math.min(100, 55 + state.stats.strength)} max={100} tone="green" /><Resource label="ENERGY" value={Math.min(100, 60 + state.stats.agility)} max={100} tone="gold" /></div><button className="panel-link status-link" onClick={() => navigate("profile")}>Full hunter profile <ArrowRight size={16} /></button></Panel><Panel className="assistant-card"><div className="assistant-icon"><Sparkles size={20} /></div><div className="eyebrow">SYSTEM ASSISTANT</div><h3>A guide for your ascent.</h3><p>{assistant?.message || "Your personal System is standing by. Request a briefing or a new quest recommendation."}</p><div className="assistant-actions"><button className="assistant-button" disabled={assistantBusy} onClick={() => void askAssistant("briefing")}>{assistantBusy ? "Consulting..." : "Get briefing"} <ArrowRight size={15} /></button><button className="assistant-small" disabled={assistantBusy} onClick={() => void askAssistant("quests")}>Quest ideas</button></div>{assistant?.suggestions?.length ? <div className="assistant-suggestions">{assistant.suggestions.map((s) => <button key={s.title} onClick={() => void act({ type: "addQuest" as const, title: s.title, category: s.category, difficulty: s.difficulty })}><Plus size={14} /> {s.title}</button>)}</div> : null}<span className="assistant-orbit" /></Panel></div></div>
              <div className="dashboard-lower"><Panel className="dungeon-preview"><PanelTitle eyebrow="THE NEXT CHALLENGE" title="Dungeon Gates" action={<button className="panel-link" onClick={() => navigate("dungeons")}>Explore <ArrowRight size={15} /></button>} />{state.dungeons.length ? <div className="dungeon-preview-content"><div className="gate-icon"><Swords size={29} /></div><div><strong>{state.dungeons[0].title}</strong><span>{state.dungeons[0].missions.filter((m) => m.completedAt).length} of {state.dungeons[0].missions.length} missions cleared</span><ProgressBar value={Math.round(state.dungeons[0].missions.filter((m) => m.completedAt).length / state.dungeons[0].missions.length * 100)} /></div></div> : <div className="dungeon-preview-content"><div className="gate-icon"><Swords size={29} /></div><div><strong>Your next gate awaits</strong><span>Turn a long-term goal into missions and face its final trial.</span><button className="inline-action" onClick={() => { setView("dungeons"); setModal("dungeon"); }}>Open a dungeon <ArrowRight size={14} /></button></div></div>}</Panel><Panel className="activity-preview"><PanelTitle eyebrow="RECENT EVENTS" title="Activity Log" action={<button className="panel-link" onClick={() => navigate("analytics")}>History <ArrowRight size={15} /></button>} /><div className="mini-activity">{state.activity.slice(0, 3).map((entry) => <div key={entry.id}><span className="activity-dot" /><span>{entry.title}</span><strong>{entry.xp ? `+${entry.xp} XP` : "UNLOCK"}</strong></div>)}{!state.activity.length && <div className="muted-empty">No activity yet. Complete a quest to write your story.</div>}</div></Panel></div>
            </>}
            {view === "quests" && <><PageHeading eyebrow="DAILY PROTOCOL // 01" title="Daily Quests" description="Real-world victories become experience. Complete each quest once per day." action={<button className="primary-button" onClick={() => setModal("quest")}><Plus size={17} /> New quest</button>} /><div className="quest-summary"><div><span>TODAY'S PROGRESS</span><strong>{completed.length} <em>/ {state.quests.length}</em></strong><ProgressBar value={dailyPercent} /></div><div><span>AVAILABLE XP</span><strong>{state.quests.filter((q) => !completedIds.has(q.id)).reduce((sum, q) => sum + q.xp, 0)} <em>XP</em></strong><small>Potential rewards remaining</small></div><div><span>CURRENT STREAK</span><strong>{currentStreak} <em>DAYS</em></strong><small>Show up again tomorrow</small></div></div><Panel><div className="quest-filter-row"><div><div className="eyebrow">QUEST BOARD</div><h2>Today's Missions</h2></div><div className="segmented">{(["all", "open", "done"] as const).map((f) => <button key={f} className={filter === f ? "selected" : ""} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "open" ? "Available" : "Completed"}</button>)}</div></div><div className="quest-list full">{state.quests.filter((q) => filter === "all" || (filter === "done" ? completedIds.has(q.id) : !completedIds.has(q.id))).map((quest) => <QuestRow key={quest.id} quest={quest} done={completedIds.has(quest.id)} busy={!!busy} onComplete={() => void act({ type: "completeQuest" as const, id: quest.id }, quest.id)} onDelete={() => void act({ type: "deleteQuest" as const, id: quest.id }, quest.id)} />)}{!state.quests.length && <EmptyState icon={Target} title="Your quest board is empty" text="Create a daily quest and start earning experience." action={<button className="secondary-button" onClick={() => setModal("quest")}>Create a quest</button>} />}{state.quests.length > 0 && filter !== "all" && state.quests.filter((q) => filter === "done" ? completedIds.has(q.id) : !completedIds.has(q.id)).length === 0 && <EmptyState icon={Check} title={filter === "done" ? "No quests completed yet" : "All quests complete"} text={filter === "done" ? "A single action is all it takes to begin." : "Excellent work. Your daily protocol is clear."} />}</div></Panel><div className="quest-bottom-note"><Bell size={16} /> Your quests reset at midnight in {state.timezone.replaceAll("_", " ")}. Completed quests remain in your history.</div></>}
            {view === "dungeons" && <><PageHeading eyebrow="LONG-TERM OBJECTIVES // 02" title="Dungeons" description="Break ambitious goals into missions. The boss falls when every mission is cleared." action={<button className="primary-button" onClick={() => setModal("dungeon")}><Plus size={17} /> Open dungeon</button>} /><div className="dungeon-stats"><div><Swords size={20} /><span>ACTIVE GATES</span><strong>{state.dungeons.filter((d) => !d.completedAt).length}</strong></div><div><Shield size={20} /><span>DUNGEONS CLEARED</span><strong>{totalDungeonClears}</strong></div><div><Gem size={20} /><span>REWARDS CLAIMED</span><strong>{totalDungeonClears}</strong></div></div>{!state.dungeons.length ? <Panel><EmptyState icon={Swords} title="No dungeon gates are open" text="Choose a long-term goal, split it into missions, and face your final milestone." action={<button className="primary-button" onClick={() => setModal("dungeon")}>Create your first dungeon <ArrowRight size={16} /></button>} /></Panel> : <div className="dungeon-grid">{state.dungeons.map((dungeon) => <DungeonCard key={dungeon.id} dungeon={dungeon} busy={!!busy} onMission={(missionId) => void act({ type: "completeMission" as const, dungeonId: dungeon.id, missionId }, missionId)} />)}</div>}</>}
            {view === "inventory" && <><PageHeading eyebrow="HUNTER ARCHIVE // 03" title="Achievements" description="A record of every threshold crossed and every trial survived." /><div className="achievement-hero"><div><div className="eyebrow">COLLECTION PROGRESS</div><h2>{state.achievements.length} <span>/ {ACHIEVEMENTS.length}</span></h2><p>Badges unlocked through consistency and courage.</p></div><div className="achievement-progress-ring" style={{ "--value": `${Math.round(state.achievements.length / ACHIEVEMENTS.length * 100)}%` } as React.CSSProperties}><Trophy size={30} /></div></div><div className="section-heading"><div><span className="eyebrow">HUNTER HONORS</span><h2>Badge Gallery</h2></div></div><div className="achievement-grid">{ACHIEVEMENTS.map((achievement) => { const unlocked = state.achievements.includes(achievement.id); return <Panel key={achievement.id} className={`achievement-card rarity-${achievement.rarity} ${unlocked ? "unlocked" : "locked"}`}><div className="achievement-symbol">{unlocked ? achievement.icon : <LockKeyhole size={27} />}</div><div className="rarity-label">{achievement.rarity.toUpperCase()}</div><h3>{achievement.name}</h3><p>{achievement.description}</p><span className="achievement-state">{unlocked ? <><Check size={14} /> UNLOCKED</> : <><LockKeyhole size={13} /> LOCKED</>}</span></Panel>; })}</div><Panel className="inventory-panel"><PanelTitle eyebrow="VIRTUAL REWARDS" title="Inventory" /><div className="inventory-list">{state.inventory.length ? state.inventory.map((item, index) => <div key={`${item}-${index}`}><span className="inventory-gem"><Gem size={18} /></span><span>{item}</span><small>COLLECTED</small></div>) : <EmptyState icon={Gem} title="Your inventory is empty" text="Complete quests and dungeons to earn rewards." />}</div></Panel></>}
            {view === "analytics" && <><PageHeading eyebrow="PERFORMANCE ARCHIVE // 04" title="Analytics" description="Track the effort behind your evolution." /><div className="metric-grid analytics-metrics"><Metric icon={Zap} label="TOTAL XP EARNED" value={state.xp.toLocaleString()} suffix="XP" foot="Across all activities" tone="blue" /><Metric icon={Target} label="QUESTS CLEARED" value={String(state.completions.length)} foot="All-time completions" tone="purple" /><Metric icon={Flame} label="CURRENT STREAK" value={String(currentStreak)} suffix="DAYS" foot="Consecutive days" tone="orange" /><Metric icon={Swords} label="DUNGEON CLEARS" value={String(totalDungeonClears)} foot="Major goals achieved" tone="green" /></div><div className="analytics-grid"><Panel><PanelTitle eyebrow="LAST SEVEN DAYS" title="Quest Activity" /><div className="chart-area"><div className="chart-y-axis"><span>{Math.max(4, ...lastSevenDays.map((d) => d.count))}</span><span>2</span><span>0</span></div><div className="chart-bars">{lastSevenDays.map((day) => <div className="chart-column" key={day.date}><div className="chart-bar-wrap" title={`${day.count} quests · ${day.xp} XP`}><div className="chart-bar" style={{ height: `${day.count ? Math.max(8, day.count / Math.max(4, ...lastSevenDays.map((d) => d.count)) * 100) : 2}%` }} /></div><span>{day.label}</span></div>)}</div></div></Panel><Panel className="insight-panel"><PanelTitle eyebrow="SYSTEM INSIGHT" title="Your Pattern" /><div className="insight-orb"><TrendingUp size={34} /></div><p>{assistant?.message || (state.completions.length ? `You have completed ${state.completions.length} quests. Keep your streak alive by completing one quest each day.` : "Your activity story begins with one quest. Consistency will reveal your strongest patterns.")}</p><button className="secondary-button" disabled={assistantBusy} onClick={() => void askAssistant("analysis")}>{assistantBusy ? "Analyzing..." : "Analyze my progress"} <Sparkles size={16} /></button></Panel></div><Panel className="history-panel"><PanelTitle eyebrow="PROGRESSION HISTORY" title="XP Activity Log" /><div className="history-list">{state.activity.map((entry) => <div key={entry.id}><span className={`history-icon history-${entry.type}`}>{entry.type === "quest" ? <Target size={16} /> : entry.type === "dungeon" ? <Swords size={16} /> : entry.type === "level" || entry.type === "rank" ? <Zap size={16} /> : <Trophy size={16} />}</span><div><strong>{entry.title}</strong><small>{new Date(entry.at).toLocaleString()}</small></div><span className="history-xp">{entry.xp ? `+${entry.xp} XP` : entry.type.toUpperCase()}</span></div>)}{!state.activity.length && <EmptyState icon={Activity} title="No history yet" text="Your progression log will appear as you complete quests." />}</div></Panel></>}
            {view === "profile" && <><PageHeading eyebrow="HUNTER RECORD // 05" title="Hunter Profile" description="The attributes you build in life are reflected here." /><div className="profile-grid"><Panel className="profile-identity"><div className="profile-backdrop"><Emblem /><span>HUNTER LICENSE // ACTIVE</span></div><div className="large-portrait"><UserRound size={62} strokeWidth={1.1} /></div><div className="profile-name"><h2>{state.name}</h2><p>{state.title}</p><span className="rank-chip">{rank}-RANK HUNTER</span></div><div className="profile-info"><div><span>LEVEL</span><strong>{state.level}</strong></div><div><span>TOTAL XP</span><strong>{state.xp.toLocaleString()}</strong></div><div><span>AWAKENED</span><strong>{state.awakenedAt ? new Date(state.awakenedAt).toLocaleDateString() : "TODAY"}</strong></div></div><form className="profile-edit" onSubmit={async (e) => { e.preventDefault(); await act({ type: "updateProfile", ...profileForm }); }}><label>HUNTER NAME<input value={profileForm.name} maxLength={32} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></label><label>CUSTOM TITLE<input value={profileForm.title} maxLength={40} onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })} /></label><button className="secondary-button" disabled={!!busy}>Save profile</button></form></Panel><div className="profile-right"><Panel><PanelTitle eyebrow="ATTRIBUTE POINTS" title="Hunter Stats" action={<span className="points-chip">{state.statPoints} AVAILABLE</span>} /><p className="panel-description">Earn three stat points for every level gained. Choose how your Hunter grows.</p><div className="stat-list">{(Object.keys(STAT_LABELS) as Stat[]).map((stat) => <div className="stat-row" key={stat}><div className="stat-icon"><StatIcon stat={stat} /></div><div className="stat-main"><div><strong>{STAT_LABELS[stat]}</strong><span>{state.stats[stat]}</span></div><ProgressBar value={Math.min(100, state.stats[stat] * 3.3)} /></div><button className="stat-add" disabled={!state.statPoints || !!busy} aria-label={`Increase ${STAT_LABELS[stat]}`} onClick={() => void act({ type: "allocateStat", stat })}><Plus size={18} /></button></div>)}</div></Panel><Panel className="ability-panel"><PanelTitle eyebrow="PROGRESSION" title="Abilities & Milestones" /><div className="ability-list"><div className="unlocked"><span><Zap size={18} /></span><div><strong>Awakened Hunter</strong><small>Unlocked at level 1</small></div><Check size={16} /></div><div className={state.level >= 5 ? "unlocked" : ""}><span><Compass size={18} /></span><div><strong>Focused Mind</strong><small>Unlocks at level 5</small></div>{state.level >= 5 ? <Check size={16} /> : <LockKeyhole size={15} />}</div><div className={state.level >= 10 ? "unlocked" : ""}><span><Shield size={18} /></span><div><strong>Rank Ascension</strong><small>Unlocks at level 10</small></div>{state.level >= 10 ? <Check size={16} /> : <LockKeyhole size={15} />}</div></div></Panel></div></div></>}
          </motion.div></AnimatePresence>
          <footer className="app-footer"><span>THE SYSTEM © {clock.getFullYear()} · BECOME THE HUNTER YOU WERE MEANT TO BE</span><span>POWERED BY CONSISTENCY</span></footer>
        </div>
      </main>
    </div>

    <AnimatePresence>{toast && <motion.div className="system-toast" role="status" initial={{ opacity: 0, y: 25, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 15, x: "-50%" }}><span className="status-dot" /> {toast}<button aria-label="Dismiss notification" onClick={() => setToast("")}><X size={15} /></button></motion.div>}</AnimatePresence>
    <AnimatePresence>{ceremony && <motion.div className="ceremony-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="ceremony-rays" /><motion.div className="ceremony-card" initial={reducedMotion ? false : { opacity: 0, scale: 0.76, y: 25 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 180, damping: 18 }}><Emblem /><div className="eyebrow">THE SYSTEM HAS RECOGNIZED YOUR GROWTH</div><h2>{ceremony.kind === "rank" ? "RANK UP" : "LEVEL UP"}</h2><div className="ceremony-level">{ceremony.kind === "rank" ? ceremony.rank : String(ceremony.level).padStart(2, "0")}</div><p>{ceremony.kind === "rank" ? `You have ascended to ${ceremony.rank}-Rank. The world sees your power.` : `You reached level ${ceremony.level}. Three new attribute points await.`}</p><button className="primary-button" onClick={() => setCeremony(null)}>Continue ascent <ArrowRight size={16} /></button></motion.div></motion.div>}</AnimatePresence>
    <AnimatePresence>{(boot || !state.awakenedAt) && <motion.div className="opening-overlay" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.6 }}><div className="opening-grid" /><Emblem className="opening-emblem" />{!state.awakenedAt ? <div className="awakening-content"><div className="opening-kicker">[ SYSTEM NOTIFICATION ]</div><h1>YOU HAVE<br /><span>AWAKENED.</span></h1><p>A new path has opened before you. Every action is a quest. Every day is a chance to rise.</p><form onSubmit={async (e) => { e.preventDefault(); const ok = await act({ type: "awaken", name: profileForm.name, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" }); if (ok) setBoot(false); }}><label>ENTER YOUR HUNTER NAME<input autoFocus required maxLength={32} value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></label><button className="primary-button" disabled={!!busy}>{busy ? "AWAKENING..." : "ACCEPT THE SYSTEM"} <ArrowRight size={17} /></button></form><small>YOUR PROGRESS IS SAVED TO YOUR PRIVATE HUNTER PROFILE</small></div> : <div className="boot-content"><span className="boot-word">SYSTEM INITIALIZING</span><h1 className="boot-word">WELCOME BACK,<br /><span>HUNTER.</span></h1><div className="boot-progress"><span /></div><button onClick={() => setBoot(false)}>SKIP INTRO <ArrowRight size={14} /></button></div>}</motion.div>}</AnimatePresence>
    <AnimatePresence>{modal && <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}><motion.div className={`modal-card ${modal === "settings" ? "settings-modal" : ""}`} role="dialog" aria-modal="true" aria-label={modal} initial={reducedMotion ? false : { opacity: 0, scale: 0.94, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}><div className="modal-head"><div><span className="eyebrow">THE SYSTEM // {modal.toUpperCase()}</span><h2>{modal === "quest" ? "Create a Quest" : modal === "dungeon" ? "Open a Dungeon" : modal === "settings" ? "System Settings" : "Keyboard Shortcuts"}</h2></div><button className="icon-button" aria-label="Close" onClick={() => setModal(null)}><X size={20} /></button></div>
      {modal === "quest" && <form className="system-form" onSubmit={createQuest}><p>Define a repeatable real-world action. XP is awarded when you complete it each day.</p><label>QUEST OBJECTIVE<input autoFocus required maxLength={100} placeholder="e.g. Run for 20 minutes" value={questForm.title} onChange={(e) => setQuestForm({ ...questForm, title: e.target.value })} /></label><div className="form-grid"><label>CATEGORY<input maxLength={30} placeholder="PHYSICAL TRAINING" value={questForm.category} onChange={(e) => setQuestForm({ ...questForm, category: e.target.value })} /></label><label>DIFFICULTY<select value={questForm.difficulty} onChange={(e) => setQuestForm({ ...questForm, difficulty: e.target.value as Difficulty })}><option value="easy">Easy · 35 XP</option><option value="normal">Normal · 60 XP</option><option value="hard">Hard · 100 XP</option><option value="epic">Epic · 150 XP</option></select></label></div><label>OPTIONAL REMINDER TIME<input type="time" value={questForm.reminder} onChange={(e) => setQuestForm({ ...questForm, reminder: e.target.value })} /></label><button className="primary-button" disabled={!!busy}>Add to daily protocol <Plus size={16} /></button></form>}
      {modal === "dungeon" && <form className="system-form" onSubmit={createDungeon}><p>Choose a long-term objective. Each mission is worth 50 XP; clearing the final mission earns a 220 XP boss reward.</p><label>DUNGEON NAME<input autoFocus required maxLength={100} placeholder="e.g. Build my portfolio" value={dungeonForm.title} onChange={(e) => setDungeonForm({ ...dungeonForm, title: e.target.value })} /></label><label>DESCRIPTION<textarea rows={2} maxLength={300} placeholder="What does victory look like?" value={dungeonForm.description} onChange={(e) => setDungeonForm({ ...dungeonForm, description: e.target.value })} /></label><label>MISSIONS · ONE PER LINE<textarea rows={5} required placeholder={"Choose a design direction\nBuild the homepage\nPublish the finished site"} value={dungeonForm.missions} onChange={(e) => setDungeonForm({ ...dungeonForm, missions: e.target.value })} /></label><div className="form-grid"><label>FINAL BOSS<input maxLength={80} placeholder="The Final Trial" value={dungeonForm.boss} onChange={(e) => setDungeonForm({ ...dungeonForm, boss: e.target.value })} /></label><label>REWARD TITLE<input maxLength={80} placeholder="Dungeon Conqueror" value={dungeonForm.reward} onChange={(e) => setDungeonForm({ ...dungeonForm, reward: e.target.value })} /></label></div><button className="primary-button" disabled={!!busy}>Open dungeon gate <Swords size={16} /></button></form>}
      {modal === "settings" && <div className="settings-content"><p>Customize how the System looks and responds to you.</p><div className="settings-section"><span>INTERFACE THEME</span><div className="theme-options">{themes.map((theme) => <button key={theme.id} className={settingsForm.theme === theme.id ? "selected" : ""} onClick={() => setSettingsForm({ ...settingsForm, theme: theme.id })}><i style={{ background: theme.color }} />{theme.label}{settingsForm.theme === theme.id && <Check size={15} />}</button>)}</div></div><div className="setting-toggle"><div><strong>Sound effects</strong><small>Play a tone for quest clears, level-ups and rank ascensions.</small></div><button className={`switch ${settingsForm.sound ? "on" : ""}`} onClick={() => setSettingsForm({ ...settingsForm, sound: !settingsForm.sound })} role="switch" aria-checked={settingsForm.sound}><span /></button></div><div className="setting-toggle"><div><strong>Reduced motion</strong><small>Minimize cinematic effects and 3D animation.</small></div><button className={`switch ${settingsForm.reducedMotion ? "on" : ""}`} onClick={() => setSettingsForm({ ...settingsForm, reducedMotion: !settingsForm.reducedMotion })} role="switch" aria-checked={settingsForm.reducedMotion}><span /></button></div><div className="setting-toggle"><div><strong>Daily reminders</strong><small>Notify you while the app is open when quests remain.</small></div><button className={`switch ${settingsForm.reminders ? "on" : ""}`} onClick={async () => { if (!settingsForm.reminders && "Notification" in window && Notification.permission === "default") await Notification.requestPermission(); setSettingsForm({ ...settingsForm, reminders: !settingsForm.reminders }); }} role="switch" aria-checked={settingsForm.reminders}><span /></button></div><div className="form-grid settings-fields"><label>REMINDER TIME<input type="time" value={settingsForm.reminderTime} onChange={(e) => setSettingsForm({ ...settingsForm, reminderTime: e.target.value })} /></label><label>TIMEZONE<input value={settingsForm.timezone} onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })} placeholder="Asia/Kolkata" /></label></div><button className="primary-button" disabled={!!busy} onClick={() => void saveSettings()}>Save settings <Check size={16} /></button><a className="signout-link" href={signOutPath} target="_top">Sign out of Hunter profile <ArrowRight size={14} /></a></div>}
      {modal === "shortcuts" && <div className="shortcuts-list"><p>Navigate the System without leaving your keyboard.</p>{nav.map((item) => <div key={item.id}><span>{item.label}</span><kbd>{item.key}</kbd></div>)}<div><span>New quest</span><kbd>N</kbd></div><div><span>Shortcuts</span><kbd>?</kbd></div><div><span>Close dialog</span><kbd>ESC</kbd></div></div>}
    </motion.div></motion.div>}</AnimatePresence>
  </div>;
}

function Metric({ icon: Icon, label, value, suffix, foot, tone }: { icon: LucideIcon; label: string; value: string; suffix?: string; foot: string; tone: string }) {
  return <div className={`metric-card metric-${tone}`}><div className="metric-top"><span>{label}</span><Icon size={20} strokeWidth={1.7} /></div><div className="metric-value">{value} {suffix && <small>{suffix}</small>}</div><div className="metric-foot"><ArrowDownRight size={13} /> {foot}</div></div>;
}
function Resource({ label, value, max, tone }: { label: string; value: number; max: number; tone: "pink" | "blue" | "green" | "gold" }) {
  return <div className="resource"><span>{label}</span><ProgressBar value={value / max * 100} tone={tone} /><strong>{value}<small>/{max}</small></strong></div>;
}
function QuestRow({ quest, done, busy, onComplete, onDelete }: { quest: HunterState["quests"][number]; done: boolean; busy: boolean; onComplete: () => void; onDelete?: () => void }) {
  return <div className={`quest-row ${done ? "done" : ""}`}><button className="quest-check" disabled={done || busy} aria-label={done ? `${quest.title} complete` : `Complete ${quest.title}`} onClick={onComplete}>{done && <Check size={16} />}</button><div className="quest-row-main"><strong>{quest.title}</strong><span>{quest.category} <i /> {quest.difficulty.toUpperCase()}</span></div><span className="quest-xp">+{quest.xp} XP</span>{onDelete && <button className="quest-delete" aria-label={`Delete ${quest.title}`} onClick={onDelete} disabled={busy}><Trash2 size={16} /></button>}</div>;
}
function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: React.ReactNode }) {
  return <div className="empty-state"><div><Icon size={28} /></div><h3>{title}</h3><p>{text}</p>{action}</div>;
}
function DungeonCard({ dungeon, busy, onMission }: { dungeon: Dungeon; busy: boolean; onMission: (id: string) => void }) {
  const done = dungeon.missions.filter((m) => m.completedAt).length;
  const percent = Math.round(done / dungeon.missions.length * 100);
  return <Panel className={`dungeon-card ${dungeon.completedAt ? "cleared" : ""}`}><div className="dungeon-card-top"><div className="gate-icon"><Swords size={27} /></div><span className="gate-status">{dungeon.completedAt ? "GATE CLEARED" : "GATE ACTIVE"}</span></div><div className="eyebrow">DUNGEON // {String(dungeon.missions.length).padStart(2, "0")} MISSIONS</div><h2>{dungeon.title}</h2><p>{dungeon.description || "A long-term objective awaits its Hunter."}</p><div className="dungeon-progress"><div><span>PROGRESS</span><strong>{done}/{dungeon.missions.length} MISSIONS</strong></div><ProgressBar value={percent} /></div><div className="mission-list">{dungeon.missions.map((mission, index) => <button key={mission.id} disabled={!!mission.completedAt || busy || !!dungeon.completedAt} className={mission.completedAt ? "complete" : ""} onClick={() => onMission(mission.id)}><span className="mission-check">{mission.completedAt ? <Check size={13} /> : String(index + 1).padStart(2, "0")}</span><span>{mission.title}</span><small>{mission.completedAt ? "CLEARED" : "+50 XP"}</small></button>)}</div><div className={`boss-bar ${dungeon.completedAt ? "defeated" : ""}`}><span>{dungeon.completedAt ? <Check size={18} /> : <LockKeyhole size={18} />}</span><div><small>FINAL BOSS</small><strong>{dungeon.boss}</strong></div><div className="boss-reward">{dungeon.completedAt ? "DEFEATED" : "+220 XP"}</div></div><div className="dungeon-reward"><Gem size={15} /> REWARD: {dungeon.reward}</div></Panel>;
}
function StatIcon({ stat }: { stat: Stat }) {
  if (stat === "strength") return <Swords size={18} />;
  if (stat === "agility") return <Zap size={18} />;
  if (stat === "intelligence") return <BookOpen size={18} />;
  if (stat === "perception") return <Compass size={18} />;
  return <Shield size={18} />;
}
