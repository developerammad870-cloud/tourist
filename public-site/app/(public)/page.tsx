import Link from "next/link";
import Hero from "../components/home/Hero";
import Reveal from "../components/home/Reveal";
import TripCard from "../components/home/TripCard";
import { destinations, getDestination } from "../content/destinations";
import { site } from "../content/site";
import { cmsRoutes } from "@/lib/cms";
import s from "../components/home/Home.module.css";

/**
 * Home page. A Server Component — the hero, the cards and every section render
 * to HTML; the only client island left is the scroll reveal.
 *
 * The footer belongs to app/(public)/layout.tsx so every public page gets the
 * same one.
 */

/** Photographs for the about section, pulled from the trips themselves so they
 *  can never drift from the content file. */
const aboutShots = [
  getDestination("hunza")?.images[1],
  getDestination("fairy-meadows")?.images[2],
].filter(Boolean) as string[];

export default function Home() {
  return (
    <div className={s.page}>
      <Hero />

      <div className={s.promise}>
        <div className={s.promiseItem}>
          <h2 className={s.promiseTitle}>
            <span className={s.promiseNum}>01</span> Private by default
          </h2>
          <p className={s.promiseNote}>
            Two to eight guests, your own vehicle and driver — never a coach
            with forty strangers.
          </p>
        </div>
        <div className={s.promiseItem}>
          <h2 className={s.promiseTitle}>
            <span className={s.promiseNum}>02</span> Planned end to end
          </h2>
          <p className={s.promiseNote}>
            Guides, transfers, permits and overnight stops are arranged long
            before you arrive.
          </p>
        </div>
        <div className={s.promiseItem}>
          <h2 className={s.promiseTitle}>
            <span className={s.promiseNum}>03</span> Held for 48 hours
          </h2>
          <p className={s.promiseNote}>
            Send a request and we hold your place while you sort flights and
            leave.
          </p>
        </div>
      </div>

      <section className={s.section} id="destinations">
        <Reveal>
          <div className={s.sectionHead}>
            <div>
              <p className={s.kicker}>The collection</p>
              <h2 className={s.sectionTitle}>Six journeys, run by us</h2>
              <p className={s.sectionNote}>
                Every route below is one we operate ourselves. Any of them can
                be lengthened, shortened or joined together.
              </p>
            </div>
            <Link className={`${s.btn} ${s.btnQuiet}`} href="/destinations">
              See all trips
            </Link>
          </div>
        </Reveal>

        <div className={s.grid}>
          {destinations.map((dest, i) => (
            <Reveal key={dest.id} delay={i * 70}>
              <TripCard dest={dest} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- about us */}
      <section className={s.section} id="about">
        <Reveal>
          <div className={s.about}>
            <div>
              <p className={s.kicker}>About us</p>
              <h2 className={s.sectionTitle}>
                A small house, one country, done properly
              </h2>
              <p className={s.aboutText}>
                {site.name} has been putting travellers on the Karakoram Highway
                since 2014. We are not a booking site with a call centre — we
                are a small team in Islamabad who drive these valleys ourselves,
                know which hotel has hot water in October, and answer the phone
                at 2am when a landslide changes the plan.
              </p>

              <ul className={s.aboutPoints}>
                <li className={s.point}>
                  <span className={s.pointMark} aria-hidden="true">
                    01
                  </span>
                  <span>
                    <strong>Local guides.</strong> Every trip is led by someone
                    from the region it crosses, paid properly and year-round.
                  </span>
                </li>
                <li className={s.point}>
                  <span className={s.pointMark} aria-hidden="true">
                    02
                  </span>
                  <span>
                    <strong>Flexible itineraries.</strong> Add days, swap
                    valleys or combine two routes — the plan bends to you, not
                    the other way round.
                  </span>
                </li>
                <li className={s.point}>
                  <span className={s.pointMark} aria-hidden="true">
                    03
                  </span>
                  <span>
                    <strong>On the road with you.</strong> Someone is reachable
                    for the whole trip, not just office hours.
                  </span>
                </li>
              </ul>

              <div className={s.signature}>
                <span className={s.signatureName}>Ammad</span>
                <span className={s.signatureRole}>Founder &amp; lead guide</span>
              </div>
            </div>

            <div className={s.aboutFrames}>
              <figure className={`${s.aboutFrame} ${s.aboutFrameTall}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={aboutShots[0]} alt="Passu Cones, Hunza" loading="lazy" />
              </figure>
              <figure className={`${s.aboutFrame} ${s.aboutFrameShort}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={aboutShots[1]}
                  alt="Nanga Parbat from Fairy Meadows"
                  loading="lazy"
                />
              </figure>
            </div>
          </div>
        </Reveal>
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
              Send a request and we&rsquo;ll confirm availability and hold your
              place for 48 hours. Create an account and every trip you book
              stays in one place.
            </p>
            <div className={s.ctaActions}>
              <a className={`${s.btn} ${s.btnLight}`} href={cmsRoutes.book}>
                Start a trip request
              </a>
              <a className={`${s.btn} ${s.btnOutline}`} href={cmsRoutes.signUp}>
                Create an account
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
