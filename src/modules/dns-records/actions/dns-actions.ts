"use server";

import { db } from "@/shared/infrastructure/database/db-client";
import { domain } from "@/shared/infrastructure/database/schemas";
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
 * List all DNS records for a domain
 */
export async function listDnsRecords(domainId: string) {
  try {
    const domainData = await getDomainInfo(domainId);
    if (!domainData.success || !domainData.domain) {
      return { success: false, error: domainData.error };
    }

    const result = await listRCRecords(
      domainData.domain.name,
      domainData.domain.orderId,
    );

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
          id: String(r.recordid || r.id || r.object_id || ""),
          type: String(r.type || ""),
          host: String(r.host || ""),
          value: String(r.value || ""),
          ttl: Number(r.ttl || 3600),
        })),
      };
    }

    return result;
  } catch (error) {
    console.error("[dns-actions] listDnsRecords error:", error);
    return { success: false, error: "Failed to list DNS records" };
  }
}

/**
 * Add a new DNS record
 */
export async function addDnsRecord(
  domainId: string,
  type: string,
  host: string,
  value: string,
  ttl: number = 3600,
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
