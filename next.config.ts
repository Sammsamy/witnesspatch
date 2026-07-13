import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // WitnessPatch is a single, fully local replay with no request-time data.
  // Exporting it makes the public demo a static asset instead of spending
  // Cloudflare Worker CPU on every judge visit.
  output: "export",
};

export default nextConfig;
