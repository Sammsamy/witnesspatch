import type { NextConfig } from "next";

// Vinext otherwise emits a random deployment UUID into index.html and index.rsc.
// This source-controlled ID keeps the static export byte-reproducible across
// supported build hosts. Change it only when the retained V2 release profile
// changes; content-hashed client assets still own ordinary cache busting.
const STATIC_BUILD_ID = "witnesspatch-v2-c9fb4568";

const nextConfig: NextConfig = {
  // WitnessPatch is a single, fully local replay with no request-time data.
  // Exporting it makes the public demo a static asset instead of spending
  // Cloudflare Worker CPU on every judge visit.
  output: "export",
  generateBuildId: async () => STATIC_BUILD_ID,
};

export default nextConfig;
