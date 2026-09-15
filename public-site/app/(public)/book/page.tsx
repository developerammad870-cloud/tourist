import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getDestination } from "@/app/content/destinations";
import BookingForm from "./BookingForm";
import s from "@/app/components/public/pages.module.css";

export const metadata: Metadata = {
  title: "Book a trip",
  description:
    "Send a booking request — we'll confirm availability and hold your place for 48 hours.",
};

/**
 * Booking page.
 *
 * A Server Component so the session and the ?trip= preselection are resolved
 * before anything renders — the form arrives already filled in rather than
 * populating itself after hydration.
 *
 * `searchParams` is a Promise in Next 16; synchronous access was removed.
 */
export default async function BookPage(props: PageProps<"/book">) {
  const [{ trip }, user] = await Promise.all([props.searchParams, getSession()]);

  // Only accept a preselection that names a real trip.
  const preselect =
    typeof trip === "string" && getDestination(trip) ? trip : "";

  return (
    <div className={`${s.wrap} ${s.narrow}`}>
      <header className={s.pageHead}>
        <p className={s.eyebrow}>Reserve</p>
        <h1 className={s.h1}>Book your travel</h1>
        <p className={s.lede}>
          Tell us where and when. We&rsquo;ll confirm availability and hold your
          place for 48 hours — nothing is charged at this stage.
        </p>
      </header>

      <BookingForm
        preselect={preselect}
        defaultName={user?.name ?? ""}
        defaultEmail={user?.email ?? ""}
      />
    </div>
  );
}
