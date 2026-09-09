import PublicNav from "../components/public/PublicNav";
import Footer from "../components/public/Footer";
import { getSession } from "@/lib/session";
import s from "../components/public/public.module.css";

/**
 * Chrome for every public-facing page.
 *
 * `(public)` is a route group: the parentheses keep it out of the URL, so
 * app/(public)/page.tsx is still "/" and app/(public)/hotels/page.tsx is still
 * "/hotels". It exists purely so these pages can share a navbar and footer
 * that nothing else needs.
 *
 * Reading the session here opts the public pages into dynamic rendering. That
 * is the deliberate cost of a navbar that knows who you are; the alternative
 * is a client-side fetch that flashes "Sign in" on every page load.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  return (
    <div className={s.shell}>
      <PublicNav user={user} />
      <main className={s.main}>{children}</main>
      <Footer />
    </div>
  );
}
