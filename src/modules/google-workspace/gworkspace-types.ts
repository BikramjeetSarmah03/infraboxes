export type WorkspaceOrderStatus =
  | "pending"
  | "active"
  | "admin_configured"
  | "suspended"
  | "deleted";

export type MailboxStatus = "active" | "suspended" | "deleted";

export type MailboxRole = "admin" | "user";

export interface GoogleWorkspaceOrder {
  id: string;
  userId: string;
  domainId: string;
  rcOrderId: string;
  rcCustomerId: string;
  domainName: string;
  status: WorkspaceOrderStatus;
  numberOfAccounts: number;
  months: number;
  adminEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleWorkspaceMailbox {
  id: string;
  workspaceOrderId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password?: string | null;
  passwordUpdatedAt?: Date | null;
  role: MailboxRole;
  status: MailboxStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkspaceOrderInput {
  domainId: string;
  domainName: string;
  customerId: string;
  months: number;
  numberOfAccounts: number;
}

export interface SetupAdminInput {
  workspaceOrderId: string;
  rcOrderId: string;
  domainName: string;
  emailPrefix: string;
  firstName: string;
  lastName: string;
  alternateEmail: string;
  customerName: string;
  company: string;
  zip: string;
}

export interface AddMailboxUserInput {
  workspaceOrderId: string;
  domainName: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface RCWorkspaceOrderDetails {
  orderid: string;
  domainname: string;
  status: string;
  no_of_accounts: string;
  months: string;
  creation_date: string;
  expiry_date: string;
  admin_email?: string;
}
