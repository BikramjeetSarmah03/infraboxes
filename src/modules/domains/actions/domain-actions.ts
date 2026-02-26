"use server";

import {
  getDomainSuggestions,
  checkDomainAvailability,
} from "../infrastructure/resellerclub-provider";
import type { DomainAvailability } from "../domain-types";

/**
 * Search for domains based on keyword
 * 1. Get suggestions from ResellerClub
 * 2. Rapidly check availability in chunks
 * 3. Return combined results
 */
export async function searchDomains(keyword: string) {
  try {
    console.log(`[actions] Searching domains for: "${keyword}"`);

    // 1. Get suggestions
    const suggestions = await getDomainSuggestions(keyword);
    if (!suggestions || suggestions.length === 0) {
      return { success: true, domains: [] };
    }

    // 2. Extract domain names for availability check
    const domainNames = suggestions.map((s) => s.domain);

    // 3. Check availability
    const availabilityResults = await checkDomainAvailability(domainNames);

    return {
      success: true,
      domains: availabilityResults,
    };
  } catch (error) {
    console.error("[actions] searchDomains error:", error);
    return {
      success: false,
      error: "Failed to search for domains. Please try again.",
    };
  }
}

/**
 * Simulate domain purchase flow
 */
export async function purchaseDomain(domainName: string) {
  try {
    console.log(`[actions] Reserving domain: ${domainName}`);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // TODO: Implement actual registration logic via resellerclub-provider
    // This will involve:
    // 1. Creating/Finding ResellerClub customer
    // 2. Creating/Finding contact
    // 3. Calling registerDomain

    return {
      success: true,
      message: `Domain ${domainName} has been reserved successfully!`,
      orderId: `sim_${Math.random().toString(36).substring(7)}`,
    };
  } catch (error) {
    console.error("[actions] purchaseDomain error:", error);
    return {
      success: false,
      error: "Registration failed. Please contact support.",
    };
  }
}
