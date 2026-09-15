import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // See the matching note in ../public-site/next.config.ts: an unrelated
    // package-lock.json sits in "d:\learning html\", and Turbopack would
    // otherwise treat that folder as this app's workspace root and warn on
    // every start. This app is its own project, so pin the root here.
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
