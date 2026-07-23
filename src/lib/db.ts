import { PrismaClient } from "@/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// D1 bindings are handed to the Worker per invocation, so the client cannot be
// built at module scope. Keyed on the binding itself: reused while the isolate
// keeps serving the same D1 instance, rebuilt when the runtime swaps it out.
const clients = new WeakMap<D1Database, PrismaClient>();

export function getPrisma(): PrismaClient {
  const { env } = getCloudflareContext();
  const db = env.DB;

  let client = clients.get(db);
  if (!client) {
    client = new PrismaClient({ adapter: new PrismaD1(db) });
    clients.set(db, client);
  }
  return client;
}
