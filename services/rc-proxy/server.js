import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;
const RESELLERCLUB_AUTH_USER_ID = process.env.RESELLERCLUB_AUTH_USER_ID;
const RESELLERCLUB_API_KEY = process.env.RESELLERCLUB_API_KEY;
const PROXY_TOKEN = process.env.PROXY_TOKEN;

// API base URLs (production only)
// API base URLs
const IS_TEST = process.env.RESELLERCLUB_IS_TEST === "true";
const RC_BASE_URL = IS_TEST
  ? "https://test.httpapi.com/api"
  : "https://httpapi.com/api";
const RC_DOMAINCHECK_URL = IS_TEST
  ? `${RC_BASE_URL}/domains/available.json`
  : "https://domaincheck.httpapi.com/api/domains/available.json";
const RC_DNS_URL = `${RC_BASE_URL}/dns`;

// Browser-like headers to reduce WAF/Cloudflare blocking
const UPSTREAM_HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

/**
 * Log diagnostics for outgoing ResellerClub requests
 * Redacts sensitive credentials
 */
function logOutgoingRequest(url, method) {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    if (params.has("auth-userid")) params.set("auth-userid", "[REDACTED]");
    if (params.has("api-key")) params.set("api-key", "[REDACTED]");
    if (params.has("passwd")) params.set("passwd", "[REDACTED]");
    if (params.has("password")) params.set("password", "[REDACTED]");
    const scrubbedUrl = `${urlObj.origin}${urlObj.pathname}?${params.toString()}`;
    console.log(`[proxy] -> Upstream ${method}: ${scrubbedUrl}`);
  } catch (_err) {
    console.log(
      `[proxy] -> Upstream ${method}: ${url.split("?")[0]} (params could not be parsed)`,
    );
  }
}

/**
 * Log diagnostics for suspicious upstream responses (non-JSON or error status)
 * Never logs secrets - only status, content-type, and sanitized body preview
 */
function logUpstreamDiagnostics(path, status, contentType, body) {
  const ct = contentType || "none";
  const isJson = ct.includes("application/json");
  const isError = status >= 400;

  if (!isJson || isError) {
    console.log("[upstream block?]", {
      path,
      status,
      contentType: ct,
      bodyHead: body.slice(0, 120),
    });
  }

  // Detect common Cloudflare WAF block pages
  if (
    body.includes("Cloudflare") ||
    body.includes("Attention Required") ||
    body.includes("administrative rules") ||
    body.includes("Sorry, you have been blocked")
  ) {
    console.warn("[cloudflare-block]", "Upstream returned HTML WAF page");
  }
}

app.use(express.json({ limit: "100kb" }));

// Log every incoming request
app.use((req, res, next) => {
  console.log(`[proxy] <- Incoming request: ${req.method} ${req.path}`);
  next();
});

function requireAuth(req, res, next) {
  const authHeader = req.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!PROXY_TOKEN || token !== PROXY_TOKEN) {
    console.warn(`[proxy] !! Authentication FAILED for ${req.path}. 
      Expected token: ${PROXY_TOKEN ? "Present" : "MISSING FROM ENV!"}, 
      Received: ${token ? "Present" : "Empty"}`);
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/egress-ip", requireAuth, async (req, res) => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({ error: "Failed to fetch egress IP" });
  }
});

app.post("/domains/available", requireAuth, async (req, res) => {
  const { domainNames, tlds } = req.body ?? {};

  if (
    !Array.isArray(domainNames) ||
    domainNames.length === 0 ||
    !domainNames.every((item) => typeof item === "string" && item.trim()) ||
    !Array.isArray(tlds) ||
    tlds.length === 0 ||
    !tlds.every((item) => typeof item === "string" && item.trim())
  ) {
    return res.status(400).json({
      error: "domainNames and tlds must be non-empty arrays of strings",
    });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  domainNames.forEach((name) => params.append("domain-name", name.trim()));
  tlds.forEach((tld) => params.append("tlds", tld.trim()));

  const url = `${RC_DOMAINCHECK_URL}?${params.toString()}`;
  logOutgoingRequest(url, "GET");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    // Log diagnostics for suspicious responses (non-JSON or errors)
    logUpstreamDiagnostics(
      "/domains/available",
      response.status,
      contentType,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

app.get("/products/customer-price", requireAuth, async (req, res) => {
  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);

  // Forward product-key and customer-id if present
  if (req.query["product-key"]) {
    const pk = req.query["product-key"];
    if (Array.isArray(pk)) {
      pk.forEach((p) => params.append("product-key", p));
    } else {
      params.append("product-key", pk);
    }
  }
  if (req.query["customer-id"]) {
    params.append("customer-id", req.query["customer-id"]);
  }

  const url = `${RC_BASE_URL}/products/customer-price.json?${params.toString()}`;
  logOutgoingRequest(url, "GET");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics(
      "/products/customer-price",
      response.status,
      contentType,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

app.get("/domains/suggest", requireAuth, async (req, res) => {
  const keyword = req.query.keyword;

  if (
    typeof keyword !== "string" ||
    !keyword.trim() ||
    keyword.trim().length < 2
  ) {
    return res
      .status(400)
      .json({ error: "keyword must be a string with at least 2 characters" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("keyword", keyword.trim());

  // Forward optional tlds parameters
  const tlds = req.query.tlds;
  if (Array.isArray(tlds)) {
    tlds.forEach((tld) => params.append("tlds", tld.trim()));
  } else if (typeof tlds === "string" && tlds.trim()) {
    params.append("tlds", tlds.trim());
  }

  const url = `${RC_BASE_URL}/domains/v5/suggest-names.json?${params.toString()}`;
  logOutgoingRequest(url, "GET");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    // Log diagnostics for suspicious responses (non-JSON or errors)
    logUpstreamDiagnostics(
      "/domains/suggest",
      response.status,
      contentType,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

app.post("/customers/signup", requireAuth, async (req, res) => {
  const {
    username,
    password,
    name,
    company,
    addressLine1,
    city,
    state,
    country,
    zipcode,
    phoneCountryCode,
    phone,
    langPref,
  } = req.body ?? {};

  // Validate required fields
  if (
    !username ||
    !password ||
    !name ||
    !company ||
    !addressLine1 ||
    !city ||
    !state ||
    !country ||
    !zipcode ||
    !phoneCountryCode ||
    !phone
  ) {
    return res.status(400).json({ error: "All customer fields are required" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("username", username.trim());
  params.append("passwd", password);
  params.append("name", name.trim());
  params.append("company", company.trim());
  params.append("address-line-1", addressLine1.trim());
  params.append("city", city.trim());
  params.append("state", state.trim());
  params.append("country", country.trim().toUpperCase());
  params.append("zipcode", zipcode.replace(/\s/g, "").trim());
  params.append("phone-cc", phoneCountryCode.replace(/\D/g, ""));
  params.append("phone", phone.replace(/\D/g, ""));
  params.append("lang-pref", langPref || "en");

  const url = `${RC_BASE_URL}/customers/v2/signup.json?${params.toString()}`;
  logOutgoingRequest(url, "POST");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    // Log diagnostics for suspicious responses (non-JSON or errors)
    logUpstreamDiagnostics(
      "/customers/signup",
      response.status,
      contentType,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

app.get("/customers/search", requireAuth, async (req, res) => {
  const noOfRecords = Number.parseInt(req.query["no-of-records"] ?? "10", 10);
  const pageNo = Number.parseInt(req.query["page-no"] ?? "1", 10);
  const status = req.query.status;

  if (Number.isNaN(noOfRecords) || Number.isNaN(pageNo)) {
    return res
      .status(400)
      .json({ error: "no-of-records and page-no must be numbers" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("no-of-records", String(noOfRecords));
  params.append("page-no", String(pageNo));
  if (typeof status === "string" && status.trim()) {
    params.append("status", status.trim());
  }

  const url = `${RC_BASE_URL}/customers/search.json?${params.toString()}`;
  logOutgoingRequest(url, "GET");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    // Log diagnostics for suspicious responses (non-JSON or errors)
    logUpstreamDiagnostics(
      "/customers/search",
      response.status,
      contentType,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

/**
 * Get customer details by username (email)
 * GET /customers/details
 * Query: { username }
 *
 * ResellerClub API: https://httpapi.com/api/customers/details.json
 */
app.get("/customers/details", requireAuth, async (req, res) => {
  const username = req.query.username;

  if (!username || typeof username !== "string" || !username.trim()) {
    return res
      .status(400)
      .json({ error: "username query parameter is required" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("username", username.trim());

  const url = `${RC_BASE_URL}/customers/details.json?${params.toString()}`;
  logOutgoingRequest(url, "GET");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics(
      "/customers/details",
      response.status,
      contentType,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error("[customers/details] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

/**
 * GET /domains/details-by-name
 * Get domain registration details by domain name
 */
app.get("/domains/details-by-name", requireAuth, async (req, res) => {
  const { domain_name, domainName } = req.query ?? {};
  const actualDomainName = domain_name || domainName;

  if (!actualDomainName) {
    return res.status(400).json({ error: "domain_name is required" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("domain-name", String(actualDomainName));
  params.append("options", "All"); // Get all details

  const url = `${RC_BASE_URL}/domains/details-by-name.json?${params.toString()}`;
  logOutgoingRequest(url, "GET");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics(
      "/domains/details-by-name",
      response.status,
      contentType,
      body,
    );

    if (contentType) res.set("content-type", contentType);
    res.status(response.status).send(body);
  } catch (error) {
    console.error("[domains/details-by-name] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

/**
 * GET /domains/details
 * Get domain details by order ID
 */
app.get("/domains/details", requireAuth, async (req, res) => {
  const { order_id, orderId, "order-id": orderIdDash } = req.query ?? {};
  const actualOrderId = order_id || orderId || orderIdDash;

  if (!actualOrderId) {
    return res.status(400).json({ error: "order_id is required" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("order-id", String(actualOrderId));
  params.append("options", "All");

  const url = `${RC_BASE_URL}/domains/details.json?${params.toString()}`;
  logOutgoingRequest(url, "GET");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics(
      "/domains/details",
      response.status,
      contentType,
      body,
    );

    if (contentType) res.set("content-type", contentType);
    res.status(response.status).send(body);
  } catch (error) {
    console.error("[domains/details] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

// ============================================
// Domain Registration Endpoints
// ============================================

/**
 * Register a domain
 * POST /domains/register
 * Body: { domainName, years, customerId, regContactId, adminContactId, techContactId, billingContactId, nameServers, invoiceOption, discountAmount }
 *
 * ResellerClub API: https://httpapi.com/api/domains/register.json
 */
app.post("/domains/register", requireAuth, async (req, res) => {
  const {
    domainName,
    "domain-name": domainNameDash,
    domain_name,
    years,
    customerId,
    customer_id,
    "customer-id": customerIdDash,
    regContactId,
    adminContactId,
    techContactId,
    billingContactId,
    nameServers,
    invoiceOption,
    discountAmount,
  } = req.body ?? {};

  const actualDomainName = domainName || domainNameDash || domain_name;
  const actualCustomerId = customerId || customer_id || customerIdDash;

  if (
    !actualDomainName ||
    !actualCustomerId ||
    !regContactId ||
    !adminContactId ||
    !techContactId ||
    !billingContactId
  ) {
    return res.status(400).json({
      error:
        "domainName, customerId, regContactId, adminContactId, techContactId, and billingContactId are required",
    });
  }

  if (!Array.isArray(nameServers) || nameServers.length === 0) {
    return res
      .status(400)
      .json({ error: "nameServers must be a non-empty array" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams({
    "auth-userid": RESELLERCLUB_AUTH_USER_ID,
    "api-key": RESELLERCLUB_API_KEY,
    "domain-name": actualDomainName,
    years: String(years || 1),
    ns: Array.isArray(nameServers) ? nameServers[0] : "ns1.dns-parking.com",
    "customer-id": String(actualCustomerId),
    "reg-contact-id": String(regContactId),
    "admin-contact-id": String(adminContactId),
    "tech-contact-id": String(techContactId),
    "billing-contact-id": String(billingContactId),
    "invoice-option": invoiceOption || "NoInvoice",
    "discount-amount": String(discountAmount || 0),
  });

  if (Array.isArray(nameServers) && nameServers.length > 1) {
    for (let i = 1; i < nameServers.length; i++) {
      params.append("ns", nameServers[i]);
    }
  }

  const url = `${RC_BASE_URL}/domains/register.json?${params.toString()}`;
  logOutgoingRequest(url, "POST");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics(
      "/domains/register",
      response.status,
      contentType,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error("[domains/register] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

// ============================================
// Contact Endpoints
// ============================================

/**
 * Create a contact for domain registration
 * POST /contacts/add
 * Body: { customerId, name, company, email, addressLine1, city, state, country, zipcode, phoneCountryCode, phone, type }
 *
 * ResellerClub API: https://httpapi.com/api/contacts/add.json
 */
app.post("/contacts/add", requireAuth, async (req, res) => {
  const {
    customerId,
    name,
    company,
    email,
    addressLine1,
    city,
    state,
    country,
    zipcode,
    phoneCountryCode,
    phone,
    type,
  } = req.body ?? {};

  if (
    !customerId ||
    !name ||
    !company ||
    !email ||
    !addressLine1 ||
    !city ||
    !state ||
    !country ||
    !zipcode ||
    !phoneCountryCode ||
    !phone
  ) {
    return res.status(400).json({
      error:
        "All contact fields are required (customerId, name, company, email, addressLine1, city, state, country, zipcode, phoneCountryCode, phone)",
    });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("name", name.trim());
  params.append("company", company.trim());
  params.append("email", email.trim());
  params.append("address-line-1", addressLine1.trim());
  params.append("city", city.trim());
  params.append("state", state.trim());
  params.append("country", country.trim().toUpperCase());
  params.append("zipcode", zipcode.replace(/\s/g, "").trim());
  params.append("phone-cc", phoneCountryCode.replace(/\D/g, ""));
  params.append("phone", phone.replace(/\D/g, ""));
  params.append("customer-id", String(customerId));
  params.append("type", type || "Contact");

  const url = `${RC_BASE_URL}/contacts/add.json?${params.toString()}`;
  logOutgoingRequest(url, "POST");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics("/contacts/add", response.status, contentType, body);

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error("[contacts/add] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

// ============================================
// DNS Record Endpoints
// ============================================

/**
 * List DNS records for a domain
 * GET /dns/records
 * Query: { domainName }
 *
 * ResellerClub API: GET https://httpapi.com/api/domainforward/dns-records.json
 * Required params: auth-userid, api-key, domain-name
 */
app.get("/dns/records", requireAuth, async (req, res) => {
  const domainName = req.query["domain-name"] || req.query.domainName;

  if (!domainName || typeof domainName !== "string" || !domainName.trim()) {
    return res
      .status(400)
      .json({ error: "domain-name query parameter is required" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("domain-name", domainName.trim());

  const url = `${RC_BASE_URL}/domainforward/dns-records.json?${params.toString()}`;
  logOutgoingRequest(url, "GET");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics("/dns/records", response.status, contentType, body);

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error("[dns/records] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

// ============================================
// Contact Endpoints
// ============================================

// ============================================
// Domain Registration Endpoints
// ============================================

/**
 * Register a domain
 * POST /domains/register
 * Body: { domainName, years, customerId, regContactId, adminContactId, techContactId, billingContactId, nameServers, invoiceOption }
 */

// ============================================
// Google Workspace Endpoints
// ============================================

/**
 * Order Google Workspace for a domain
 * POST /googleapps/order
 * Body: { domainName, customerId, months, noOfAccounts }
 *
 * ResellerClub API: https://httpapi.com/api/gapps/in/add.json
 */
app.post("/googleapps/order", requireAuth, async (req, res) => {
  const { domainName, customerId, months, noOfAccounts } = req.body ?? {};

  if (!domainName || !customerId) {
    return res
      .status(400)
      .json({ error: "domainName and customerId are required" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("domain-name", domainName);
  params.append("customer-id", customerId);
  params.append("months", String(months || 1)); // Default 1 month
  params.append("no-of-accounts", String(noOfAccounts || 3)); // Default 3 accounts
  params.append("invoice-option", "NoInvoice");

  console.log(`[proxy] /googleapps/order: Incoming Body=`, JSON.stringify(req.body));
  
  const apiUrl = `${RC_BASE_URL}/gapps/in/add.json`;
  logOutgoingRequest(apiUrl, "POST");

  const logParams = new URLSearchParams(params);
  logParams.set("auth-userid", "[REDACTED]");
  logParams.set("api-key", "[REDACTED]");
  console.log(`[proxy] /googleapps/order: Redacted Params Body=`, logParams.toString());

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        ...UPSTREAM_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    // Log diagnostics for suspicious responses (non-JSON or errors)
    logUpstreamDiagnostics(
      "/googleapps/order",
      response.status,
      contentType,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error("[googleapps/order] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

/**
 * Add a user to Google Workspace
 * POST /googleapps/add-user
 * Body: { domainName, username, firstName, lastName }
 */
app.post("/googleapps/add-user", requireAuth, async (req, res) => {
  const { domainName, username, firstName, lastName } = req.body ?? {};

  if (!domainName || !username || !firstName || !lastName) {
    return res.status(400).json({
      error: "domainName, username, firstName, and lastName are required",
    });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("domain-name", domainName);
  params.append("username", username);
  params.append("first-name", firstName);
  params.append("last-name", lastName);

  console.log(`[proxy] /googleapps/add-user: Incoming Body=`, JSON.stringify(req.body));
  
  const apiUrl = `${RC_BASE_URL}/googleapps/add-user.json`;
  logOutgoingRequest(apiUrl, "POST");

  const logParams = new URLSearchParams(params);
  logParams.set("auth-userid", "[REDACTED]");
  logParams.set("api-key", "[REDACTED]");
  console.log(`[proxy] /googleapps/add-user: Redacted Params Body=`, logParams.toString());

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        ...UPSTREAM_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    // Log diagnostics for suspicious responses (non-JSON or errors)
    logUpstreamDiagnostics(
      "/googleapps/add-user",
      response.status,
      contentType,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error("[googleapps/add-user] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

/**
 * Get Google Workspace order details
 * GET /googleapps/details
 * Query: { orderId }
 */
app.get("/googleapps/details", requireAuth, async (req, res) => {
  const orderId = req.query["order-id"];

  if (!orderId) {
    return res
      .status(400)
      .json({ error: "order-id query parameter is required" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("order-id", String(orderId));

  const url = `${RC_BASE_URL}/googleapps/details.json?${params.toString()}`;
  logOutgoingRequest(url, "GET");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics(
      "/googleapps/details",
      response.status,
      contentType,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error("[googleapps/details] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

/**
 * Add admin account for a Google Workspace order
 * POST /googleapps/admin/add
 * Body: { orderId, emailAddress, firstName, lastName, alternateEmailAddress, customerName, company, zip }
 *
 * ResellerClub API: https://httpapi.com/api/gapps/in/admin/add.json
 */
app.post("/googleapps/admin/add", requireAuth, async (req, res) => {
  const {
    orderId,
    emailAddress,
    firstName,
    lastName,
    alternateEmailAddress,
    customerName,
    company,
    zip,
  } = req.body ?? {};

  if (!orderId || !emailAddress || !firstName || !lastName) {
    return res.status(400).json({
      error: "orderId, emailAddress, firstName, and lastName are required",
    });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  const actualOrderId =
    orderId ||
    req.body["order-id"] ||
    req.body["entity-id"] ||
    req.body["entityId"] ||
    req.body["entityid"] ||
    req.body["orderid"];

  console.log(`[proxy] /googleapps/admin/add: Incoming Body=`, JSON.stringify(req.body));
  console.log(`[proxy] /googleapps/admin/add: Resolved ID=${actualOrderId}`);
  
  // Send all possible variations to be extremely safe
  const idStr = String(actualOrderId || 0);
  params.append("order-id", idStr);
  params.append("entity-id", idStr);
  params.append("entityId", idStr);
  params.append("entityid", idStr);
  params.append("orderid", idStr);
  
  const logParams = new URLSearchParams(params);
  logParams.set("auth-userid", "[REDACTED]");
  logParams.set("api-key", "[REDACTED]");
  console.log(`[proxy] /googleapps/admin/add: Redacted Params Body=`, logParams.toString());
  
  params.append("email-address", emailAddress);
  params.append("first-name", firstName);
  params.append("last-name", lastName);
  params.append(
    "alternate-email-address",
    alternateEmailAddress || emailAddress,
  );
  params.append("name", customerName || `${firstName} ${lastName}`);
  params.append("company", company || `${firstName} ${lastName}`);
  params.append("zip", zip || "00000");

  const apiUrl = `${RC_BASE_URL}/gapps/in/admin/add.json`;
  logOutgoingRequest(apiUrl, "POST");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        ...UPSTREAM_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics(
      "/googleapps/admin/add",
      response.status,
      contentType,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error("[googleapps/admin/add] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

/**
 * Search Google Workspace orders
 * GET /googleapps/search
 * Query: { domainName, customerId, status, noOfRecords, pageNo }
 *
 * ResellerClub API: https://httpapi.com/api/gapps/in/search.json
 */
app.get("/googleapps/search", requireAuth, async (req, res) => {
  const { domainName, customerId, status } = req.query ?? {};
  const noOfRecords = Number.parseInt(req.query["no-of-records"] ?? "10", 10);
  const pageNo = Number.parseInt(req.query["page-no"] ?? "1", 10);

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("no-of-records", String(noOfRecords));
  params.append("page-no", String(pageNo));
  if (domainName) params.append("domain-name", domainName);
  if (customerId) params.append("customer-id", customerId);
  if (status) params.append("status", status);

  const url = `${RC_BASE_URL}/gapps/in/search.json?${params.toString()}`;
  logOutgoingRequest(url, "GET");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics(
      "/googleapps/search",
      response.status,
      contentType,
      body,
    );

    if (contentType) res.set("content-type", contentType);
    res.status(response.status).send(body);
  } catch (error) {
    console.error("[googleapps/search] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

/**
 * Add accounts/licenses to an existing Google Workspace order
 * POST /googleapps/add-account
 * Body: { orderId, noOfAccounts, invoiceOption }
 *
 * ResellerClub API: https://httpapi.com/api/gapps/in/add-account.json
 */
app.post("/googleapps/add-account", requireAuth, async (req, res) => {
  const { orderId, noOfAccounts, invoiceOption } = req.body ?? {};

  if (!orderId || !noOfAccounts) {
    return res
      .status(400)
      .json({ error: "orderId and noOfAccounts are required" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  const actualOrderId =
    orderId ||
    req.body["order-id"] ||
    req.body["entity-id"] ||
    req.body["entityId"] ||
    req.body["entityid"] ||
    req.body["orderid"];
    
  console.log(`[proxy] /googleapps/add-account: Incoming Body=`, JSON.stringify(req.body));
  console.log(`[proxy] /googleapps/add-account: Resolved ID=${actualOrderId}`);
  
  const idStr = String(actualOrderId || 0);
  params.append("order-id", idStr);
  params.append("entity-id", idStr);
  params.append("entityId", idStr);
  params.append("entityid", idStr);
  params.append("orderid", idStr);
  
  const logParams = new URLSearchParams(params);
  logParams.set("auth-userid", "[REDACTED]");
  logParams.set("api-key", "[REDACTED]");
  console.log(`[proxy] /googleapps/add-account: Redacted Params Body=`, logParams.toString());
  
  params.append("no-of-accounts", String(noOfAccounts));
  params.append("invoice-option", invoiceOption || "NoInvoice");

  const apiUrl = `${RC_BASE_URL}/gapps/in/add-account.json`;
  logOutgoingRequest(apiUrl, "POST");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        ...UPSTREAM_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics(
      "/googleapps/add-account",
      response.status,
      contentType,
      body,
    );

    if (contentType) res.set("content-type", contentType);
    res.status(response.status).send(body);
  } catch (error) {
    console.error("[googleapps/add-account] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

// ===== DNS Management Endpoints =====

/**
 * POST /dns/activate
 * Activate DNS service for a domain order
 */
app.post("/dns/activate", requireAuth, async (req, res) => {
  const { order_id, orderId, "order-id": orderIdDash } = req.body ?? {};
  const actualOrderId = order_id || orderId || orderIdDash;

  if (!actualOrderId) {
    return res
      .status(400)
      .json({ error: "order_id, orderId, or order-id is required" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("order-id", String(actualOrderId));

  const url = `${RC_DNS_URL}/manage/activate.json?${params.toString()}`;
  logOutgoingRequest(url, "POST");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics("/dns/activate", response.status, contentType, body);

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error("[dns/activate] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

/**
 * POST /dns/manage/add-record
 * Add a DNS record
 */
app.post("/dns/manage/add-record", requireAuth, async (req, res) => {
  const {
    "order-id": orderIdDash,
    order_id,
    orderId,
    "domain-name": domainNameDash,
    domain_name,
    domainName,
    "record-type": recordTypeDash,
    record_type,
    type,
    host,
    value,
    ttl,
    priority,
  } = req.body ?? {};

  const actualOrderId = orderIdDash || order_id || orderId;
  const actualDomainName = domainNameDash || domain_name || domainName;
  const rawRecordType = (
    recordTypeDash ||
    record_type ||
    type ||
    ""
  ).toUpperCase();

  // Mapping for ResellerClub specific endpoint naming
  const typeMap = {
    A: "ipv4",
    AAAA: "ipv6",
  };
  const actualRecordType =
    typeMap[rawRecordType] || rawRecordType.toLowerCase();

  if (
    !actualOrderId ||
    !actualDomainName ||
    !rawRecordType ||
    typeof host !== "string" ||
    !value
  ) {
    const missing = [];
    if (!actualOrderId) missing.push("order-id");
    if (!actualDomainName) missing.push("domain-name");
    if (!rawRecordType) missing.push("record-type");
    if (typeof host !== "string") missing.push("host");
    if (!value) missing.push("value");

    return res.status(400).json({
      error: `Missing required fields: ${missing.join(", ")}`,
      received: {
        orderId: actualOrderId,
        domainName: actualDomainName,
        recordType: rawRecordType,
        hostType: typeof host,
        value: !!value,
      },
    });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("domain-name", actualDomainName);
  params.append("host", host);
  params.append("value", value);
  const finalTtl = Math.max(Number(ttl || 0), 7200);
  params.append("ttl", String(finalTtl));

  if (actualOrderId) {
    params.append("order-id", String(actualOrderId));
  }

  if (rawRecordType === "MX" || rawRecordType === "SRV") {
    params.append("priority", String(priority || 10));
  }

  const url = `${RC_DNS_URL}/manage/add-${actualRecordType}-record.json?${params.toString()}`;
  logOutgoingRequest(url, "POST");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics(
      "/dns/add-record",
      response.status,
      contentType,
      body,
    );
    console.log(
      `[proxy] ResellerClub add-record response for ${actualDomainName}:`,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error("[dns/add-record] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

/**
 * GET /dns/manage/search-records
 * List DNS records for a domain
 *
 * If type parameter is not provided, fetches all supported record types
 * and combines the results.
 */
app.get("/dns/manage/search-records", requireAuth, async (req, res) => {
  const { order_id, domain_name, type } = req.query ?? {};

  if (!order_id || !domain_name) {
    return res
      .status(400)
      .json({ error: "order_id and domain_name are required" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  // If type is specified, fetch only that type
  if (type) {
    const params = new URLSearchParams();
    params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
    params.append("api-key", RESELLERCLUB_API_KEY);
    params.append("order-id", String(order_id));
    params.append("domain-name", String(domain_name));
    params.append("type", String(type).toUpperCase());

    const url = `${RC_DNS_URL}/manage/search-records.json?${params.toString()}`;
    logOutgoingRequest(url, "GET");

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: UPSTREAM_HEADERS,
      });
      const body = await response.text();
      const contentType = response.headers.get("content-type");

      logUpstreamDiagnostics(
        "/dns/search-records",
        response.status,
        contentType,
        body,
      );

      if (contentType) {
        res.set("content-type", contentType);
      }

      res.status(response.status).send(body);
    } catch (error) {
      console.error("[dns/search-records] Error:", error);
      res.status(502).json({ error: "Failed to reach ResellerClub" });
    }
    return;
  }

  // If no type specified, fetch all supported record types
  const recordTypes = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"];
  const allRecords = [];

  try {
    for (const recordType of recordTypes) {
      const params = new URLSearchParams();
      params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
      params.append("api-key", RESELLERCLUB_API_KEY);
      params.append("order-id", String(order_id));
      params.append("domain-name", String(domain_name));
      params.append("type", recordType);

      const url = `${RC_DNS_URL}/manage/search-records.json?${params.toString()}`;
      logOutgoingRequest(url, "GET");

      const response = await fetch(url, {
        method: "GET",
        headers: UPSTREAM_HEADERS,
      });

      if (response.ok) {
        const body = await response.text();
        try {
          const records = JSON.parse(body);
          // ResellerClub returns records as an object keyed by record ID
          if (records && typeof records === "object") {
            Object.values(records).forEach((record) => {
              if (record && typeof record === "object") {
                allRecords.push(record);
              }
            });
          }
        } catch (parseError) {
          console.error(
            `[dns/search-records] Failed to parse ${recordType} records:`,
            parseError,
          );
        }
      }
    }

    // Fallback to Impressly DNS endpoint if no records found
    // This is often used for domains using "Free DNS" or "Impressly DNS"
    if (allRecords.length === 0 && order_id) {
      console.log(
        `[proxy] No standard records found for ${domain_name}, checking Impressly endpoint...`,
      );
      const impParams = new URLSearchParams();
      impParams.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
      impParams.append("api-key", RESELLERCLUB_API_KEY);
      impParams.append("order-id", String(order_id));

      const impUrl = `${RC_BASE_URL}/impressly/dns-record.json?${impParams.toString()}`;
      logOutgoingRequest(impUrl, "GET");

      try {
        const impResponse = await fetch(impUrl, {
          method: "GET",
          headers: UPSTREAM_HEADERS,
        });

        if (impResponse.ok) {
          const impBody = await impResponse.json();
          console.log(
            `[proxy] Impressly response for ${order_id}:`,
            JSON.stringify(impBody).slice(0, 500),
          );
          const items = impBody.records || impBody;
          if (Array.isArray(items)) {
            allRecords.push(...items);
          } else if (items && typeof items === "object") {
            Object.values(items).forEach((val) => {
              if (Array.isArray(val)) {
                allRecords.push(...val);
              } else if (val && typeof val === "object") {
                allRecords.push(val);
              }
            });
          }
        }
      } catch (impError) {
        console.error("[proxy] Impressly DNS search failed:", impError);
      }
    }

    res.status(200).json(allRecords);
  } catch (error) {
    console.error("[dns/search-records] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

/**
 * POST /dns/manage/delete-record
 * Delete a DNS record
 */
app.post("/dns/manage/delete-record", requireAuth, async (req, res) => {
  const {
    "order-id": orderIdDash,
    order_id,
    orderId,
    "domain-name": domainNameDash,
    domain_name,
    domainName,
    "record-id": recordIdDash,
    record_id,
    recordId,
  } = req.body ?? {};

  const actualOrderId = orderIdDash || order_id || orderId;
  const actualDomainName = domainNameDash || domain_name || domainName;
  const actualRecordId = recordIdDash || record_id || recordId;

  if (!actualOrderId || !actualDomainName || !actualRecordId) {
    return res
      .status(400)
      .json({ error: "order-id, domain-name, and record-id are required" });
  }

  if (!RESELLERCLUB_AUTH_USER_ID || !RESELLERCLUB_API_KEY) {
    return res.status(500).json({ error: "Missing ResellerClub credentials" });
  }

  const params = new URLSearchParams();
  params.append("auth-userid", RESELLERCLUB_AUTH_USER_ID);
  params.append("api-key", RESELLERCLUB_API_KEY);
  params.append("domain-name", actualDomainName);
  params.append("record-id", String(actualRecordId));

  if (actualOrderId && !actualDomainName) {
    params.append("order-id", String(actualOrderId));
  }

  const url = `${RC_DNS_URL}/manage/delete-record.json?${params.toString()}`;
  logOutgoingRequest(url, "POST");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: UPSTREAM_HEADERS,
    });
    const body = await response.text();
    const contentType = response.headers.get("content-type");

    logUpstreamDiagnostics(
      "/dns/delete-record",
      response.status,
      contentType,
      body,
    );

    if (contentType) {
      res.set("content-type", contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error("[dns/delete-record] Error:", error);
    res.status(502).json({ error: "Failed to reach ResellerClub" });
  }
});

app.listen(PORT, () => {
  console.log(`ResellerClub proxy listening on port ${PORT}`);
});
