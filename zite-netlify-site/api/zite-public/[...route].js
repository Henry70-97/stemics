import { zite, send, handleError, readBody, cors, routeParts } from "../_shared/zite.js";

export default async function handler(req, res) {
  Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === "OPTIONS") return res.status(204).end();
  const parts = routeParts(req, "zite-public");
  try {
    if (req.method === "GET" && parts[0] === "jobs" && !parts[1]) {
      const { status = "Open", category, limit = "100", offset = "0" } = req.query;
      const filter = { and: [{ field: "Status", equals: status }] };
      if (category) filter.and.push({ field: "Category", equals: category });
      return send(res, 200, await zite.listRecords("Jobs", { limit: Number(limit), offset: Number(offset), sort: [{ field: "Posted At", direction: "desc" }], filter }));
    }
    if (req.method === "GET" && parts[0] === "jobs" && parts[1]) return send(res, 200, await zite.getRecord("Jobs", parts[1]));
    if (req.method === "GET" && parts[0] === "gigs" && !parts[1]) return send(res, 200, await zite.listRecords("Gigs", { limit: Number(req.query.limit) || 100, offset: Number(req.query.offset) || 0, sort: [{ field: "Created At", direction: "desc" }], filter: { field: "Status", equals: "Active" } }));
    if (req.method === "GET" && parts[0] === "gigs" && parts[1]) return send(res, 200, await zite.getRecord("Gigs", parts[1]));
    if (req.method === "POST" && parts[0] === "help-tickets") {
      const { name, email, subject, message, category } = await readBody(req);
      if (!email || !message) return send(res, 400, { error: "email and message are required" });
      return send(res, 200, await zite.createRecord("Help Tickets", { Subject: subject || "Website contact form", Message: `From: ${name || "Anonymous"} <${email}>\n\n${message}`, Category: category || "Other", Status: "Open" }));
    }
    return send(res, 404, { error: "Not found" });
  } catch (error) { return handleError(res, error); }
}
