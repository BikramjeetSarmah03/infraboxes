"use server";

import { db } from "@/shared/infrastructure/database/db-client";
import { domain, dnsRecord } from "@/shared/infrastructure/database/schemas";
import { eq } from "drizzle-orm";
import {
  listDnsRecords as listRCRecords,
  addDnsRecord as addRCRecord,
  deleteDnsRecord as deleteRCRecord,
  activateDns as activateRCDns,
  getDomainDetailsByName,
} from "@/modules/domains/infrastructure/resellerclub-provider";
import { revalidatePath } from "next/cache";
// DNSRecord removed as it was unused in current version

/**
 * Fetch domain info by ID from database
 */
export async function getDomainInfo(domainId: string) {
  try {
    const record = await db.query.domain.findFirst({
      where: eq(domain.id, domainId),
    });

    if (!record) return { success: false, error: "Domain not found" };

    // Auto-sync orderId if missing (fulfills user request to save it in DB)
    if (!record.orderId) {
      console.log(`[dns-actions] orderId missing for ${record.name}, attempting sync...`);
      const syncResult = await getDomainDetailsByName(record.name);
      if (syncResult.success && syncResult.details?.orderid) {
        const orderId = syncResult.details.orderid.toString();
        await db
          .update(domain)
          .set({ orderId, updatedAt: new Date() })
          .where(eq(domain.id, domainId));
        record.orderId = orderId;
        console.log(`[dns-actions] Successfully synced orderId: ${orderId}`);
      }
    }

    return { success: true, domain: record };
  } catch (error) {
    console.error("[dns-actions] getDomainInfo error:", error);
    return { success: false, error: "Failed to fetch domain info" };
  }
}

/**
 * Helper: Wait for DNS zone to be ready after activation
 * DNS zones need a few seconds to propagate after activation
 */
async function waitForDnsReady(
  domainName: string,
  orderId: string,
  maxRetries = 3,
): Promise<{ success: boolean; records?: Record<string, unknown>[]; error?: string }> {
  for (let i = 0; i < maxRetries; i++) {
    if (i > 0) {
      const delay = 2000 * i;
      console.log(`[dns] Waiting ${delay}ms before retry ${i + 1}/${maxRetries}...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const result = await listRCRecords(domainName, orderId);

    if ((result.success && result.records && result.records.length > 0) || i === maxRetries - 1) {
      return result;
    }
  }

  return { success: true, records: [] };
}

/**
 * List all DNS records for a domain
 */
export async function listDnsRecords(domainId: string) {
  try {
    const domainData = await getDomainInfo(domainId);
    if (!domainData.success || !domainData.domain) {
      return { success: false, error: domainData.error };
    }

    // Auto-activate DNS if not already activated (matching old route logic)
    if (!domainData.domain.isDnsActivated) {
      console.log(`[dns-actions] DNS not activated for ${domainData.domain.name}, activating...`);
      const activation = await activateRCDns(domainData.domain.orderId);

      if (activation.success) {
        console.log(`[dns-actions] DNS activated for ${domainData.domain.name}`);
        await db
          .update(domain)
          .set({ isDnsActivated: true, updatedAt: new Date() })
          .where(eq(domain.id, domainId));
        
        // Use wait helper if we just activated
        const result = await waitForDnsReady(domainData.domain.name, domainData.domain.orderId);
        return processListingResult(result);
      } else {
        console.error(`[dns-actions] DNS activation failed for ${domainData.domain.name}:`, activation.error);
        // If activation fails, we still try to list, maybe it's already active upstream
      }
    }

    const result = await listRCRecords(
      domainData.domain.name,
      domainData.domain.orderId,
    );

    const processedResult = processListingResult(result);

    // Fetch local DB records to merge/fallback
    const localRecords = await db.select().from(dnsRecord).where(eq(dnsRecord.domainId, domainId));
    
    // If upstream succeeds but is empty (or we have local records), let's ensure we merge what we have
    if (processedResult.success) {
      const mergedRecords = [...(processedResult.records || [])];
      
      // Add any local records that aren't in the remote list (matching by host + type + value)
      for (const local of localRecords) {
        const existsRemote = mergedRecords.find(
          r => String(r.type).toUpperCase() === local.type.toUpperCase() && 
               String(r.host) === local.host && 
               String(r.value) === local.value
        );
        
        if (!existsRemote) {
          mergedRecords.push({
            id: local.providerRecordId || local.id,
            type: local.type,
            host: local.host,
            value: local.value,
            ttl: Number(local.ttl),
            priority: local.priority ? Number(local.priority) : undefined,
            _source: 'local' // marker for debugging
          });
        }
      }
      
      processedResult.records = mergedRecords;
    }

    return processedResult;
  } catch (error) {
    console.error("[dns-actions] listDnsRecords error:", error);
    return { success: false, error: "Failed to list DNS records" };
  }
}

/**
 * Process listing result with mapping and normalization
 */
function processListingResult(result: { success: boolean; records?: Record<string, unknown>[]; error?: string }) {
    if (result.success && result.records) {
      // Map ResellerClub fields to our consistent interface
      // RC returns some fields with different names based on record type
      // but usually they are: type, host, value, ttl, priority
      // and the record id is often not directly in the object but the key in RC response
      // or it might be 'ecardid' or 'recordid' in some proxy implementations.
      return {
        ...result,
        records: (result.records as Record<string, unknown>[]).map((r) => ({
          ...r,
          id: String(
            r.recordid ||
              r.id ||
              r.object_id ||
              r["record-id"] ||
              r.dns_id ||
              "",
          ),
          type: String(r.type || r["record-type"] || r.rectype || ""),
          host: String(r.host || r.hostname || r["host-name"] || ""),
          value: String(
            r.value ||
              r.val ||
              r["record-value"] ||
              r.address ||
              r.content ||
              "",
          ),
          ttl: Number(r.ttl || 7200),
        })),
      };
    }

    return result;
}

/**
 * Add a new DNS record
 */
export async function addDnsRecord(
  domainId: string,
  type: string,
  host: string,
  value: string,
  ttl: number = 7200,
  priority?: number,
) {
  try {
    const domainData = await getDomainInfo(domainId);
    if (!domainData.success || !domainData.domain) {
      return { success: false, error: domainData.error };
    }

    const result = await addRCRecord(
      domainData.domain.name,
      domainData.domain.orderId,
      type,
      host,
      value,
      ttl,
      priority,
    );

    if (result.success) {
      let recordId = result.recordId;

      // Fallback: If RC didn't return an ID, try to find it in the current list
      if (!recordId) {
        console.log(`[dns-actions] recordId missing in response, searching in list...`);
        const listRes = await listDnsRecords(domainId);
        if (listRes.success && listRes.records) {
          const found = listRes.records.find(
            (r: any) =>
              r.type.toUpperCase() === type.toUpperCase() &&
              r.host === host &&
              r.value === value,
          );
          if (found) {
            recordId = String(found.id || "");
            console.log(`[dns-actions] Found missing recordId: ${recordId}`);
            // Update the result object so the caller gets the ID
            result.recordId = recordId;
          }
        }
      }

      // Sync to local database even if providerRecordId is missing
      await db.insert(dnsRecord).values({
        id: crypto.randomUUID(),
        domainId,
        type: type.toUpperCase(),
        host,
        value,
        ttl: ttl.toString(),
        priority: priority?.toString() || null,
        providerRecordId: recordId ? String(recordId) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // If this is the first record, we might want to mark DNS as activated in our DB
      if (!domainData.domain.isDnsActivated) {
        await db
          .update(domain)
          .set({ isDnsActivated: true, updatedAt: new Date() })
          .where(eq(domain.id, domainId));
      }
      revalidatePath(`/dns-records/${domainId}`);
    }

    return result;
  } catch (error) {
    console.error("[dns-actions] addDnsRecord error:", error);
    return { success: false, error: "Failed to add DNS record" };
  }
}

/**
 * Update a DNS record (Delete then Create)
 */
export async function updateDnsRecord(
  domainId: string,
  recordId: string,
  oldData: { type: string; host: string; value: string },
  newData: { type: string; host: string; value: string; ttl?: number; priority?: number },
) {
  try {
    console.log(`[dns-actions] Updating record ${recordId} (Delete + Recreate)`);
    
    // 1. Delete the old record
    const deleteResult = await deleteDnsRecord(
      domainId,
      recordId,
      oldData.type,
      oldData.host,
      oldData.value,
    );

    if (!deleteResult.success) {
      return { success: false, error: `Failed to remove old record: ${deleteResult.error}` };
    }

    // 2. Create the new record
    const createResult = await addDnsRecord(
      domainId,
      newData.type,
      newData.host,
      newData.value,
      newData.ttl,
      newData.priority,
    );

    return createResult;
  } catch (error) {
    console.error("[dns-actions] updateDnsRecord error:", error);
    return { success: false, error: "Failed to update DNS record" };
  }
}

/**
 * Delete a DNS record
 */
export async function deleteDnsRecord(
  domainId: string,
  recordId: string,
  type: string,
  host: string,
  value: string,
) {
  try {
    const domainData = await getDomainInfo(domainId);
    if (!domainData.success || !domainData.domain) {
      return { success: false, error: domainData.error };
    }

    const result = await deleteRCRecord(
      domainData.domain.name,
      domainData.domain.orderId,
      recordId,
      type,
      host,
      value,
    );

    if (result.success) {
      // Remove from local database
      await db.delete(dnsRecord).where(eq(dnsRecord.providerRecordId, recordId));
      revalidatePath(`/dns-records/${domainId}`);
    }

    return result;
  } catch (error) {
    console.error("[dns-actions] deleteDnsRecord error:", error);
    return { success: false, error: "Failed to delete DNS record" };
  }
}

/**
 * Activate DNS for a domain
 */
export async function activateDns(domainId: string) {
  try {
    const domainData = await getDomainInfo(domainId);
    if (!domainData.success || !domainData.domain) {
      return { success: false, error: domainData.error };
    }

    const result = await activateRCDns(domainData.domain.orderId);

    if (result.success) {
      await db
        .update(domain)
        .set({ isDnsActivated: true, updatedAt: new Date() })
        .where(eq(domain.id, domainId));

      revalidatePath(`/dns-records/${domainId}`);
    }

    return result;
  } catch (error) {
    console.error("[dns-actions] activateDns error:", error);
    return { success: false, error: "Failed to activate DNS" };
  }
}
