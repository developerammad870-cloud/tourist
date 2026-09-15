import type { Metadata } from "next";
import { site } from "@/app/content/site";
import ContactForm from "./ContactForm";
import s from "@/app/components/public/pages.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.name} — email, phone, and an enquiry form.`,
};

/**
 * Contact page. The page itself stays a Server Component; only the form needs
 * the client, so it's split into its own island.
 */
export default function ContactPage() {
  return (
    <div className={s.wrap}>
      <header className={s.pageHead}>
        <p className={s.eyebrow}>Contact</p>
        <h1 className={s.h1}>Talk to us</h1>
        <p className={s.lede}>
          Questions about a route, a date, or whether a trip suits the people
          you&rsquo;re travelling with — send them over. A real person answers,
          usually the same day.
        </p>
      </header>

      <div className={s.contactGrid}>
        <ContactForm />

        <aside className={s.infoCard}>
          <h2>Direct</h2>
          <ul className={s.infoList}>
            <li>
              <span className={s.infoLabel}>Email</span>
              <a className={s.infoValue} href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </li>
            <li>
              <span className={s.infoLabel}>Phone</span>
              <a
                className={s.infoValue}
                href={`tel:${site.phone.replace(/\s/g, "")}`}
              >
                {site.phone}
              </a>
            </li>
            <li>
              <span className={s.infoLabel}>Office</span>
              <span className={s.infoValue}>{site.address}</span>
            </li>
            <li>
              <span className={s.infoLabel}>Hours</span>
              <span className={s.infoValue}>{site.hours}</span>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
