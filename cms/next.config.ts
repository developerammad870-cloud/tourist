import os from "node:os";
import path from "node:path";
import type { NextConfig } from "next";

/** This computer's Wi-Fi / LAN IPv4 addresses, e.g. 192.168.0.114. */
function lanAddresses(): string[] {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((n): n is os.NetworkInterfaceInfo => !!n && n.family === "IPv4" && !n.internal)
    .map((n) => n.address);
}

const nextConfig: NextConfig = {
  turbopack: {
    // See the matching note in ../public-site/next.config.ts: an unrelated
    // package-lock.json sits in "d:\learning html\", and Turbopack would
    // otherwise treat that folder as this app's workspace root and warn on
    // every start. This app is its own project, so pin the root here.
    root: path.resolve(process.cwd()),
  },

  // Lets another laptop on the same Wi-Fi open the dev server at
  // http://<this PC's IP>:3001. Next blocks dev assets for any host other than
  // localhost unless it is listed here. Dev only; ignored by production builds.
  allowedDevOrigins: lanAddresses(),
};

export default nextConfig;
