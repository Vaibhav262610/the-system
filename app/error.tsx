"use client";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <main className="error-screen"><div className="eyebrow">SYSTEM INTERRUPTION</div><h1>Connection lost.</h1><p>Your Hunter data is safe. Reconnect to resume your journey.</p><button className="secondary-button" onClick={reset}>Retry connection</button></main>;
}
