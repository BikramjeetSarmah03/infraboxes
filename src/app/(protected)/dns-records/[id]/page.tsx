"use client";

import { useParams } from "next/navigation";
import { DnsRecordDetailsContainer } from "@/modules/dns-records/components/dns-record-details-container";

export default function DNSRecordDetailsPage() {
  const params = useParams();
  const domainId = params.id as string;

  return <DnsRecordDetailsContainer domainId={domainId} />;
}
