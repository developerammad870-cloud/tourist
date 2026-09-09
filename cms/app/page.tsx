import Dashboard from "./components/home/Dashboard";
import Hero from "./components/home/Hero";
import Reveal from "./components/home/Reveal";
import TiltCard from "./components/home/TiltCard";
import { destinations } from "./components/home/destinations";
import s from "./components/home/Home.module.css";

/**
 * Home page. Stays a Server Component — only the hero, the tilt cards and the
 * scroll reveal need the client, and each of those is its own `"use client"`
 * island, so the page shell, the dashboard numbers and all the copy still
 * render on the server.
 *
 * The dashboard reads MongoDB directly, so the page must never be cached: an
 * enquiry taken thirty seconds ago has to be in the count.
 */

export const dynamic = "force-dynamic";
export default function Home() {
  return (
    <div className={`${s.page} home-page`}>
      <Hero />

      <Dashboard />

      <section className={s.section} id="destinations">
        <Reveal>
          <div className={s.sectionHead}>
            <div>
              <h2 className={s.sectionTitle}>Where we&rsquo;re going next</h2>
              <p className={s.sectionNote}>
                Six routes across Pakistan that we run ourselves — guides,
                transfers and overnight stops already arranged.
              </p>
            </div>
            <a className={`${s.btn} ${s.btnPrimary}`} href="/hotels">
              See all trips
            </a>
          </div>
        </Reveal>

        <div className={s.grid}>
          {destinations.map((dest, i) => (
            <Reveal key={dest.id} delay={i * 70}>
              <TiltCard dest={dest} index={i} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <Reveal>
          <div className={s.stats}>
            <div className={s.stat}>
              <span className={s.statValue}>24</span>
              <span className={s.statLabel}>Valleys &amp; routes</span>
            </div>
            <div className={s.stat}>
              <span className={s.statValue}>12k</span>
              <span className={s.statLabel}>Travellers hosted</span>
            </div>
            <div className={s.stat}>
              <span className={s.statValue}>4.8</span>
              <span className={s.statLabel}>Average rating</span>
            </div>
            <div className={s.stat}>
              <span className={s.statValue}>24/7</span>
              <span className={s.statLabel}>Support on the road</span>
            </div>
          </div>
        </Reveal>
      </section>

      <section className={s.section}>
        <Reveal>
          <div className={s.cta}>
            <h2 className={s.ctaTitle}>Ready when you are</h2>
            <p className={s.ctaNote}>
              Create an account to save trips, hold a booking for 48 hours and
              pick up planning wherever you left off.
            </p>
            <div className={s.ctaActions}>
              <a className={`${s.btn} ${s.btnPrimary}`} href="/signUp">
                Create an account
              </a>
              <a className={`${s.btn} ${s.btnGhost}`} href="/login">
                Sign in
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className={s.footer}>
        <p>&copy; {new Date().getFullYear()} Travel with AMMAD &mdash; all routes planned in house.</p>
      </footer>
    </div>
  );
}
