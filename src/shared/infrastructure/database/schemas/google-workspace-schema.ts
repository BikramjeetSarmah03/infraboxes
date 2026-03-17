import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { domain } from "./domain-schema";

export const googleWorkspaceOrder = pgTable("google_workspace_order", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  domainId: text("domainId")
    .notNull()
    .references(() => domain.id, { onDelete: "cascade" }),
  rcOrderId: text("rcOrderId").notNull(),
  rcCustomerId: text("rcCustomerId").notNull(),
  domainName: text("domainName").notNull(),
  status: text("status").default("pending").notNull(), // pending, active, admin_configured, suspended, deleted
  numberOfAccounts: integer("numberOfAccounts").default(1).notNull(),
  months: integer("months").default(1).notNull(),
  adminEmail: text("adminEmail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const googleWorkspaceMailbox = pgTable("google_workspace_mailbox", {
  id: text("id").primaryKey(),
  workspaceOrderId: text("workspaceOrderId")
    .notNull()
    .references(() => googleWorkspaceOrder.id, { onDelete: "cascade" }),
  email: text("email").unique().notNull(),
  username: text("username").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  password: text("password"),
  passwordUpdatedAt: timestamp("passwordUpdatedAt"),
  role: text("role").default("user").notNull(), // admin, user
  status: text("status").default("active").notNull(), // active, suspended, deleted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const googleWorkspaceOrderRelations = relations(
  googleWorkspaceOrder,
  ({ one, many }) => ({
    user: one(user, {
      fields: [googleWorkspaceOrder.userId],
      references: [user.id],
    }),
    domain: one(domain, {
      fields: [googleWorkspaceOrder.domainId],
      references: [domain.id],
    }),
    mailboxes: many(googleWorkspaceMailbox),
  }),
);

export const googleWorkspaceMailboxRelations = relations(
  googleWorkspaceMailbox,
  ({ one }) => ({
    order: one(googleWorkspaceOrder, {
      fields: [googleWorkspaceMailbox.workspaceOrderId],
      references: [googleWorkspaceOrder.id],
    }),
  }),
);
