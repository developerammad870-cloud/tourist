import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { site } from "./content/site";

/**
 * Root layout — html, body and fonts only.
 *
 * Deliberately holds no navigation — the navbar and footer come from
 * app/(public)/layout.tsx. The CMS is a separate application entirely; it
 * lives in ../cms and runs on its own port.
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Display face for headlines. A high-contrast serif is what separates a
 * premium travel brand from a generic SaaS landing page — the body text stays
 * on Geist so long-form copy keeps its readability.
 */
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description:
    "Small-group trips through Hunza, Skardu, Fairy Meadows, Neelum, Lahore and the Makran coast. Guides, transfers and stays arranged end to end.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
