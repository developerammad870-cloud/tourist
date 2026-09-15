import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // There is an unrelated package-lock.json in "d:\learning html\", left over
    // from an older project. Turbopack picks the outermost lockfile it can find
    // as the workspace root, which made it treat that folder as the root of
    // this app and warn on every start. Pinning the root to this directory
    // settles it — each app in this repo is its own independent project.
    root: path.resolve(process.cwd()),
  },

  /*
   * Image optimisation.
   *
   * Every photograph on the site is a remote hotlink (see the note in
   * app/content/gallery.ts), and next/image refuses remote hosts unless they
   * are listed here — that is the point of the allowlist: it stops the
   * optimiser being pointed at arbitrary URLs by anyone who can craft a query
   * string. These are exactly the hosts the content files already use.
   *
   * Optimising matters most for the hero: the source is 2560px, and without
   * this a phone would download all 2560 of them. With it, each device gets an
   * AVIF or WebP at the width it actually paints.
   */
  images: {
    // Object form rather than `new URL(...)`: the istock links carry a signed
    // query string, and a URL entry pins `search` to whatever that URL had —
    // which for a bare host is the empty string, rejecting every real link.
    // Leaving `search` out here allows any query.
    remotePatterns: [
      { protocol: "https", hostname: "ychef.files.bbci.co.uk", pathname: "/**" },
      { protocol: "https", hostname: "media.istockphoto.com", pathname: "/**" },
      { protocol: "https", hostname: "c4.wallpaperflare.com", pathname: "/**" },
      { protocol: "https", hostname: "i.pinimg.com", pathname: "/**" },
      { protocol: "https", hostname: "media.gettyimages.com", pathname: "/**" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com", pathname: "/**" },
    ],
    // Next 16 requires the allowlist; 85 is for the full-bleed hero, where the
    // default 75 shows banding in the sky gradients.
    qualities: [75, 85],
  },
};

export default nextConfig;
