import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const domain = pgTable("domain", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  orderId: text("orderId").notNull(),
  status: text("status").default("active").notNull(), // active, pending, expired, etc.
  isDnsActivated: boolean("isDnsActivated").default(false).notNull(),
  expiryDate: timestamp("expiryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const dnsRecord = pgTable("dns_record", {
  id: text("id").primaryKey(),
  domainId: text("domainId")
    .notNull()
    .references(() => domain.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  host: text("host").notNull(),
  value: text("value").notNull(),
  ttl: text("ttl").notNull(),
  priority: text("priority"),
  providerRecordId: text("providerRecordId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const domainRelations = relations(domain, ({ one, many }) => ({
  user: one(user, {
    fields: [domain.userId],
    references: [user.id],
  }),
  dnsRecords: many(dnsRecord),
}));

export const dnsRecordRelations = relations(dnsRecord, ({ one }) => ({
  domain: one(domain, {
    fields: [dnsRecord.domainId],
    references: [domain.id],
  }),
}));
