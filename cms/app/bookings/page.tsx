import { destinations } from "../components/home/destinations";
import BookingForm from "./BookingForm";

/**
 * Booking page.
 *
 * A Server Component so the ?trip= preselection is resolved before anything
 * renders: a trip card on the home page links here as /bookings?trip=<id>, and
 * the form arrives with that destination already chosen rather than filling
 * itself in after hydration.
 *
 * The id is validated against the content file here — an unknown or malformed
 * one falls back to an empty select rather than to a broken value the form
 * would then try to submit.
 *
 * `searchParams` is a Promise in Next 16; synchronous access was removed.
 */
export default async function BookingsPage(props: PageProps<"/bookings">) {
  const { trip } = await props.searchParams;

  const preselect =
    typeof trip === "string" && destinations.some((d) => d.id === trip)
      ? trip
      : "";

  return <BookingForm preselect={preselect} />;
}
