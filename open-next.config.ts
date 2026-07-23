import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache override: every page in this app reads the database on
// each request, so there is no ISR/`use cache` output worth persisting. If that
// changes, add `r2IncrementalCache` here plus the matching R2 bucket and
// WORKER_SELF_REFERENCE service binding in wrangler.jsonc.
export default defineCloudflareConfig();
