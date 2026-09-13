import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Shell from "./components/Sidebar";
import LiveFeed from "./components/LiveFeed";
import RealtimeProvider from "./components/RealtimeProvider";
import { getSession } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tourist CMS",
  description: "Manage trips, bookings and users.",
  // This app is the back office — it should never end up in a search index.
  robots: { index: false, follow: false },
};

/**
 * Reads the session once, here, for the whole shell: the sidebar draws the links
 * this role may use, and the socket is only attempted for an admin.
 *
 * Reading cookies in the root layout makes every page render per request. In a
 * back office where every screen is now per-user, that is the correct cost — a
 * statically cached page would serve one person's sidebar to the next.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSession();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <RealtimeProvider isAdmin={user?.role === "admin"}>
          <Shell user={user}>{children}</Shell>
          <LiveFeed />
        </RealtimeProvider>
      </body>
    </html>
  );
}
