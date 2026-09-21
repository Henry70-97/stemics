const PUBLIC_BASE = "/api/zite-public";
const ADMIN_BASE = "/api/zite-admin";

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const publicApi = {
  listJobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`${PUBLIC_BASE}/jobs${qs ? `?${qs}` : ""}`);
  },
  getJob: (id) => request(`${PUBLIC_BASE}/jobs/${id}`),
  listGigs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`${PUBLIC_BASE}/gigs${qs ? `?${qs}` : ""}`);
  },
  getGig: (id) => request(`${PUBLIC_BASE}/gigs/${id}`),
  submitHelpTicket: (payload) =>
    request(`${PUBLIC_BASE}/help-tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};

function adminHeaders(password) {
  return {
    "Content-Type": "application/json",
    "X-Admin-Password": password,
  };
}

export const adminApi = {
  checkPassword: (password) =>
    request(`${ADMIN_BASE}/auth`, { headers: adminHeaders(password) }),

  getSchema: (password) =>
    request(`${ADMIN_BASE}/schema`, { headers: adminHeaders(password) }),

  listRecords: (password, table, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(
      `${ADMIN_BASE}/tables/${encodeURIComponent(table)}/records${qs ? `?${qs}` : ""}`,
      { headers: adminHeaders(password) }
    );
  },

  createRecord: (password, table, record) =>
    request(`${ADMIN_BASE}/tables/${encodeURIComponent(table)}/records`, {
      method: "POST",
      headers: adminHeaders(password),
      body: JSON.stringify({ record }),
    }),

  updateRecord: (password, table, recordId, record) =>
    request(
      `${ADMIN_BASE}/tables/${encodeURIComponent(table)}/records/${recordId}`,
      {
        method: "PATCH",
        headers: adminHeaders(password),
        body: JSON.stringify({ record }),
      }
    ),

  deleteRecord: (password, table, recordId) =>
    request(
      `${ADMIN_BASE}/tables/${encodeURIComponent(table)}/records/${recordId}`,
      { method: "DELETE", headers: adminHeaders(password) }
    ),
};
