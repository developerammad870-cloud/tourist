/**
 * The photographs that rotate behind the home page headline.
 *
 * ── Using your own pictures ────────────────────────────────────────────────
 * Drop the files into `public/photos/` and point `src` at them with a leading
 * slash — `/photos/hunza-sunrise.jpg`. Local files are the best case by a wide
 * margin: next/image will generate AVIF and WebP at every size the layout
 * actually needs, so a 4K original is served as a ~200 KB file on a phone and
 * at full detail on a 5K display. Nothing else has to change.
 *
 * Aim for at least 2560px wide, landscape, and put the subject slightly off
 * centre — the headline sits over the left third of the frame.
 *
 * ── Why the remote ones look soft ──────────────────────────────────────────
 * The istock links below are the free 612px previews, which is as large as
 * that host will serve without a licence. next/image never upscales, so those
 * frames cannot be sharper than 612px no matter what the layout asks for. The
 * BBC image is different: its CDN resizes on demand — the size is right there
 * in the path — so that one is pulled at 2560px.
 */

export type HeroSlide = {
  src: string;
  /** Shown bottom-right while the slide is on screen. */
  credit: string;
  /** Roughly how wide the source really is, for the note above. */
  sourceWidth: number;
};

export const heroSlides: HeroSlide[] = [
  {
    src: "https://ychef.files.bbci.co.uk/2560x1440/p0lkwzv4.jpg",
    credit: "Attabad Lake · Hunza",
    sourceWidth: 2560,
  },
  {
    src: "https://media.istockphoto.com/id/2171450049/photo/nanga-parbat-from-fairy-meadows-in-morning-light.jpg?s=612x612&w=0&k=20&c=L2uQbAAMBz_mnC9-3mOmHeBBvLh_Rjc95zg34ELw5v8=",
    credit: "Nanga Parbat · Fairy Meadows",
    sourceWidth: 612,
  },
  {
    src: "https://media.istockphoto.com/id/545564864/photo/autumn-in-hunza-valley.jpg?s=612x612&w=0&k=20&c=PVIrofhR0K7kh1Mb4hGP47ZI33krSHrUcjNrf1eoXM0=",
    credit: "Autumn orchards · Hunza Valley",
    sourceWidth: 612,
  },
  {
    src: "https://media.istockphoto.com/id/1964717416/photo/shangrila-lower-kachura-lake-skardu-gilgit-baltistan-pakistan.jpg?s=612x612&w=0&k=20&c=0a0AVYm8R_tgkoxKFG-_h458dWou9jX6-EI6UyiairM=",
    credit: "Shangrila Lake · Skardu",
    sourceWidth: 612,
  },
];
