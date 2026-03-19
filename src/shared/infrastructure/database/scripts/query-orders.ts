import { db } from "../db-client";
import { googleWorkspaceOrder } from "../schemas";

async function main() {
  const orders = await db.select().from(googleWorkspaceOrder);
  console.log(JSON.stringify(orders, null, 2));
}

main().catch(console.error);
