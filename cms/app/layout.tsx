import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Shell from "./components/Sidebar";
import LiveFeed from "./components/LiveFeed";
import RealtimeProvider from "./components/RealtimeProvider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        {/* One socket for the whole back office: the feed listens on it and
            the order buttons send on it. */}
        <RealtimeProvider>
          <Shell>{children}</Shell>
          <LiveFeed />
        </RealtimeProvider>
      </body>
    </html>
  );
}
