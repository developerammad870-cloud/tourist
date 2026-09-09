/**
 * Brand details and navigation, in one place so the navbar, the footer and the
 * contact page can't drift apart.
 */

export const site = {
  name: "Travel with AMMAD",
  /** Short mark used in the navbar and the admin sidebar. */
  mark: "ℜᗰΔ",
  tagline: "Routes across Pakistan, planned and run in house.",
  email: "hello@travelwithammad.pk",
  phone: "+92 300 1234567",
  address: "Blue Area, Islamabad, Pakistan",
  hours: "Mon – Sat, 9am – 7pm PKT",
} as const;

export type NavLink = { href: string; label: string };

/** Primary public navigation, left to right. */
export const publicNav: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/hotels", label: "Stays" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

