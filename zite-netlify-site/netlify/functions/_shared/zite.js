// Shared helper for talking to the Zite Database REST API.
// This file runs ONLY on the server (inside Netlify Functions) —
// the API key never reaches the browser.

const BASE_URL = "https://tables.zite.com/api/v1";

function getEnv() {
  const apiKey = process.env.ZITE_API_KEY;
  const databaseId = process.env.ZITE_DATABASE_ID || "ac388e59ebc6c188";
  if (!apiKey) {
    throw new Error(
      "Missing ZITE_API_KEY environment variable. Set it in Netlify site settings."
    );
  }
  return { apiKey, databaseId };
}

async function ziteFetch(path, { method = "GET", body } = {}) {
  const { apiKey } = getEnv();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const message =
      json?.error?.message || json?.message || `Zite API error (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.details = json;
    throw err;
  }
  return json;
}

export const zite = {
  getDatabase() {
    const { databaseId } = getEnv();
    return ziteFetch(`/bases/${databaseId}`);
  },

  listRecords(table, { limit = 100, offset = 0, sort, filter } = {}) {
    const { databaseId } = getEnv();
    return ziteFetch(
      `/bases/${databaseId}/tables/${encodeURIComponent(table)}/records/list`,
      { method: "POST", body: { limit, offset, sort, filter } }
    );
  },

  getRecord(table, recordId) {
    const { databaseId } = getEnv();
    return ziteFetch(
      `/bases/${databaseId}/tables/${encodeURIComponent(
        table
      )}/records/${recordId}`
    );
  },

  createRecord(table, record) {
    const { databaseId } = getEnv();
    return ziteFetch(
      `/bases/${databaseId}/tables/${encodeURIComponent(table)}/records`,
      { method: "POST", body: { record } }
    );
  },

  updateRecord(table, recordId, record) {
    const { databaseId } = getEnv();
    return ziteFetch(
      `/bases/${databaseId}/tables/${encodeURIComponent(
        table
      )}/records/${recordId}`,
      { method: "PATCH", body: { record } }
    );
  },

  deleteRecord(table, recordId) {
    const { databaseId } = getEnv();
    return ziteFetch(
      `/bases/${databaseId}/tables/${encodeURIComponent(
        table
      )}/records/${recordId}`,
      { method: "DELETE" }
    );
  },
};

export function json(statusCode, data) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

export function errorResponse(err) {
  console.error(err);
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  return json(status, { error: err.message || "Internal error" });
}
