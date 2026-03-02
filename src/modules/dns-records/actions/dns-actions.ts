"use server";

import { db } from "@/shared/infrastructure/database/db-client";
import { domain } from "@/shared/infrastructure/database/schemas";
import { eq } from "drizzle-orm";
import {
  listDnsRecords as listRCRecords,
  addDnsRecord as addRCRecord,
  deleteDnsRecord as deleteRCRecord,
} from "@/modules/domains/infrastructure/resellerclub-provider";
import { revalidatePath } from "next/cache";

/**
 * Fetch domain info by ID from database
 */
export async function getDomainInfo(domainId: string) {
  try {
    const record = await db.query.domain.findFirst({
      where: eq(domain.id, domainId),
    });

    if (!record) return { success: false, error: "Domain not found" };

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

    const result = await listRCRecords(domainData.domain.name);
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
