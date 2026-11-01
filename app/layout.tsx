import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The System — Hunter Protocol",
  description: "Awaken your potential. Complete quests, conquer dungeons, and rise through the Hunter ranks.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
