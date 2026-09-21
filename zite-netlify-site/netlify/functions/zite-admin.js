// Admin API. Every request must include a correct password.
// This is a lightweight gate suitable for a small internal tool with a
// shared password — NOT a substitute for real user accounts/roles. See
// README.md for how to upgrade this to per-person logins later.

import { zite, json, errorResponse } from "./_shared/zite.js";

function checkAuth(event) {
  const provided = event.headers["x-admin-password"] || event.headers["X-Admin-Password"];
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw Object.assign(new Error("ADMIN_PASSWORD is not configured on the server"), {
      status: 500,
    });
  }
  if (!provided || provided !== expected) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
}

export async function handler(event) {
  try {
    // /auth just checks the password so the frontend can show a login state.
    const parts = event.path
      .replace(/^\/\.netlify\/functions\/zite-admin\/?/, "")
      .split("/")
      .filter(Boolean);

    if (parts[0] === "auth") {
      checkAuth(event);
      return json(200, { ok: true });
    }

    checkAuth(event);

    if (parts[0] === "schema") {
      // Full database schema (tables + fields) for building the generic
      // admin UI dynamically.
      const db = await zite.getDatabase();
      return json(200, db);
    }

    if (parts[0] === "tables" && parts[1]) {
      const table = decodeURIComponent(parts[1]);

      if (parts[2] === "records" && !parts[3]) {
        if (event.httpMethod === "GET") {
          const qs = event.queryStringParameters || {};
          const data = await zite.listRecords(table, {
            limit: Number(qs.limit) || 100,
            offset: Number(qs.offset) || 0,
          });
          return json(200, data);
        }
        if (event.httpMethod === "POST") {
          const body = JSON.parse(event.body || "{}");
          const data = await zite.createRecord(table, body.record || {});
          return json(201, data);
        }
      }

      if (parts[2] === "records" && parts[3]) {
        const recordId = parts[3];
        if (event.httpMethod === "GET") {
          return json(200, await zite.getRecord(table, recordId));
        }
        if (event.httpMethod === "PATCH") {
          const body = JSON.parse(event.body || "{}");
          return json(200, await zite.updateRecord(table, recordId, body.record || {}));
        }
        if (event.httpMethod === "DELETE") {
          await zite.deleteRecord(table, recordId);
          return json(200, { ok: true });
        }
      }
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    return errorResponse(err);
  }
}
