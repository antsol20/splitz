import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

// Makes the Cloudflare bindings declared in wrangler.jsonc (D1, vars) available
// to `next dev` via getCloudflareContext(), backed by local Miniflare state.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
