import { zite, send, handleError, readBody, cors, routeParts, auth } from "../_shared/zite.js";

export default async function handler(req, res) {
  Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === "OPTIONS") return res.status(204).end();
  const parts = routeParts(req, "zite-admin");
  try {
    if (parts[0] === "auth") { auth(req); return send(res, 200, { ok: true }); }
    auth(req);
    if (parts[0] === "schema") return send(res, 200, await zite.getDatabase());
    if (parts[0] === "tables" && parts[1] && parts[2] === "records") {
      const table = parts[1];
      if (!parts[3] && req.method === "GET") return send(res, 200, await zite.listRecords(table, { limit: Number(req.query.limit) || 100, offset: Number(req.query.offset) || 0 }));
      if (!parts[3] && req.method === "POST") return send(res, 201, await zite.createRecord(table, (await readBody(req)).record || {}));
      if (parts[3] && req.method === "GET") return send(res, 200, await zite.getRecord(table, parts[3]));
      if (parts[3] && req.method === "PATCH") return send(res, 200, await zite.updateRecord(table, parts[3], (await readBody(req)).record || {}));
      if (parts[3] && req.method === "DELETE") { await zite.deleteRecord(table, parts[3]); return send(res, 200, { ok: true }); }
    }
    return send(res, 404, { error: "Not found" });
  } catch (error) { return handleError(res, error); }
}
