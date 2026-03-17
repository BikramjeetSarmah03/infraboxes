import { listDnsRecords } from "./src/modules/dns-records/actions/dns-actions";

async function main() {
  const domainId = "dcb04f3e-865a-4879-87b9-dfd00eade0e6";
  const res = await listDnsRecords(domainId);
  console.log(JSON.stringify(res, null, 2));
}

main().catch(console.error);
