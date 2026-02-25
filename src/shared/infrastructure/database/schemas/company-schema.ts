import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const company = pgTable("company", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  legalName: text("legalName").notNull(),
  taxId: text("taxId"),
  incorporationDate: timestamp("incorporationDate"),
  status: text("status").default("pending").notNull(),
  address: text("address"),
  country: text("country"),
  state: text("state"),
  city: text("city"),
  zip: text("zip"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const companyRelations = relations(company, ({ one }) => ({
  user: one(user, {
    fields: [company.userId],
    references: [user.id],
  }),
}));
