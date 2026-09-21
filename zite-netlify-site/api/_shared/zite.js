const BASE_URL = "https://tables.zite.com/api/v1";

function getEnv() {
  const apiKey = process.env.ZITE_API_KEY;
  const databaseId = process.env.ZITE_DATABASE_ID || "ac388e59ebc6c188";
  if (!apiKey) throw new Error("Missing ZITE_API_KEY environment variable.");
  return { apiKey, databaseId };
}

async function ziteFetch(path, { method = "GET", body } = {}) {
  const { apiKey } = getEnv();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const error = new Error(data?.error?.message || data?.message || `Zite API error (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const zite = {
  getDatabase: () => { const { databaseId } = getEnv(); return ziteFetch(`/bases/${databaseId}`); },
  listRecords: (table, options = {}) => { const { databaseId } = getEnv(); return ziteFetch(`/bases/${databaseId}/tables/${encodeURIComponent(table)}/records/list`, { method: "POST", body: options }); },
  getRecord: (table, id) => { const { databaseId } = getEnv(); return ziteFetch(`/bases/${databaseId}/tables/${encodeURIComponent(table)}/records/${id}`); },
  createRecord: (table, record) => { const { databaseId } = getEnv(); return ziteFetch(`/bases/${databaseId}/tables/${encodeURIComponent(table)}/records`, { method: "POST", body: { record } }); },
  updateRecord: (table, id, record) => { const { databaseId } = getEnv(); return ziteFetch(`/bases/${databaseId}/tables/${encodeURIComponent(table)}/records/${id}`, { method: "PATCH", body: { record } }); },
  deleteRecord: (table, id) => { const { databaseId } = getEnv(); return ziteFetch(`/bases/${databaseId}/tables/${encodeURIComponent(table)}/records/${id}`, { method: "DELETE" }); },
};

export function send(res, status, data, headers = {}) {
  res.status(status).setHeader("Content-Type", "application/json");
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  return res.status(status).json(data);
}

export function handleError(res, error) {
  console.error(error);
  const status = error.status >= 400 && error.status < 600 ? error.status : 500;
  return send(res, status, { error: error.message || "Internal error" });
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(Object.assign(new Error("Invalid JSON body"), { status: 400 })); } });
    req.on("error", reject);
  });
}

export const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password", "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS" };

export function routeParts(req, prefix) {
  const route = req.query.route || [];
  return (Array.isArray(route) ? route : [route]).filter(Boolean).map(decodeURIComponent);
}

export function auth(req) {
  const provided = req.headers["x-admin-password"];
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw Object.assign(new Error("ADMIN_PASSWORD is not configured on the server"), { status: 500 });
  if (!provided || provided !== expected) throw Object.assign(new Error("Unauthorized"), { status: 401 });
}
