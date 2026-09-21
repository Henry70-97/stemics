// Public-facing API. No password required.
// Reads are restricted to an allow-list of tables that are safe to expose
// publicly. Writes are restricted to a single safe action (submitting a
// help/contact ticket) — extend carefully, and never widen table access
// here without checking what's in that table (Users, Transactions, KYC
// Documents, etc. must never be reachable from this function).

import { zite, json, errorResponse } from "./_shared/zite.js";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  // event.path looks like /.netlify/functions/zite-public/jobs/123
  const parts = event.path
    .replace(/^\/\.netlify\/functions\/zite-public\/?/, "")
    .split("/")
    .filter(Boolean);

  try {
    let response;

    if (event.httpMethod === "GET" && parts[0] === "jobs" && !parts[1]) {
      const qs = event.queryStringParameters || {};
      const filter = { and: [{ field: "Status", equals: qs.status || "Open" }] };
      if (qs.category) filter.and.push({ field: "Category", equals: qs.category });
      const data = await zite.listRecords("Jobs", {
        limit: Number(qs.limit) || 100,
        offset: Number(qs.offset) || 0,
        sort: [{ field: "Posted At", direction: "desc" }],
        filter,
      });
      response = data;
    } else if (event.httpMethod === "GET" && parts[0] === "jobs" && parts[1]) {
      response = await zite.getRecord("Jobs", parts[1]);
    } else if (event.httpMethod === "GET" && parts[0] === "gigs" && !parts[1]) {
      const qs = event.queryStringParameters || {};
      const data = await zite.listRecords("Gigs", {
        limit: Number(qs.limit) || 100,
        offset: Number(qs.offset) || 0,
        sort: [{ field: "Created At", direction: "desc" }],
        filter: { field: "Status", equals: "Active" },
      });
      response = data;
    } else if (event.httpMethod === "GET" && parts[0] === "gigs" && parts[1]) {
      response = await zite.getRecord("Gigs", parts[1]);
    } else if (event.httpMethod === "POST" && parts[0] === "help-tickets") {
      const body = JSON.parse(event.body || "{}");
      const { name, email, subject, message, category } = body;
      if (!email || !message) {
        return json(400, { error: "email and message are required" });
      }
      response = await zite.createRecord("Help Tickets", {
        Subject: subject || "Website contact form",
        Message: `From: ${name || "Anonymous"} <${email}>\n\n${message}`,
        Category: category || "Other",
        Status: "Open",
      });
    } else {
      return json(404, { error: "Not found" });
    }

    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(response) };
  } catch (err) {
    const errRes = errorResponse(err);
    return { ...errRes, headers: { ...errRes.headers, ...corsHeaders() } };
  }
}
