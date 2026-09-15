import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/app/content/site";
import { destinations } from "@/app/content/destinations";
import s from "@/app/components/public/pages.module.css";
import n from "@/app/components/public/public.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who we are, how we plan routes, and what a trip with us actually looks like.",
};

const values = [
  {
    title: "Small groups",
    text: "Eight travellers at most on a northern route. Big enough to split a jeep, small enough that a change of plan doesn't need a committee.",
  },
  {
    title: "Local guides",
    text: "Everyone who guides for us lives in the valley they guide in. That is the difference between a viewpoint and the story of the viewpoint.",
  },
  {
    title: "Planned in house",
    text: "We book the vehicles, the beds and the permits ourselves. Nothing is resold from a third party, so nothing gets lost between them and you.",
  },
  {
    title: "Room for the weather",
    text: "Mountain itineraries that are scheduled to the minute fail. Ours carry slack, so a closed pass or a late flight doesn't cost you the trip.",
  },
];

export default function AboutPage() {
  const nights = destinations.reduce((sum, d) => sum + d.nights, 0);

  return (
    <div className={s.wrap}>
      <header className={s.pageHead}>
        <p className={s.eyebrow}>About</p>
        <h1 className={s.h1}>{site.name}</h1>
        <p className={s.lede}>{site.tagline}</p>
      </header>

      <section className={`${s.section} ${s.narrow}`}>
        <div className={s.prose}>
          <p>
            We started running trips because the ones we kept going on were
            organised around photographs rather than places. Four valleys in
            five days, everybody tired, nobody able to say what they had
            actually seen. So we built the opposite: fewer stops, longer in each
            one, and enough time in the morning to watch the light change on a
            mountain before getting back in the car.
          </p>
          <p>
            Today that is {destinations.length} routes and {nights} nights of
            itinerary across Gilgit-Baltistan, Azad Kashmir, Punjab and the
            Balochistan coast. We drive them ourselves every season, which is
            the only honest way to know that a hotel is still good and a road is
            still open.
          </p>
          <p>
            If you have travelled in northern Pakistan before, you already know
            the two things that go wrong: the vehicle and the weather. We spend
            most of our planning on exactly those.
          </p>
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>How we work</h2>
        <div className={s.valueGrid}>
          {values.map((v) => (
            <div className={s.valueCard} key={v.title}>
              <h3 className={s.valueTitle}>{v.title}</h3>
              <p className={s.valueText}>{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.ctaBand}>
        <h2>Come with us</h2>
        <p>
          Pick a route, or tell us when you can travel and we&rsquo;ll suggest
          one. Either way a real person replies.
        </p>
        <div className={s.ctaActions}>
          <Link href="/destinations" className={`${n.btn} ${s.btnLight}`}>
            Browse destinations
          </Link>
          <Link href="/contact" className={`${n.btn} ${s.btnOutline}`}>
            Get in touch
          </Link>
        </div>
      </section>
    </div>
  );
}
