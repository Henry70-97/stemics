import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminApi } from "../api.js";

const READONLY_TYPES = new Set([
  "linked_record",
  "lookup",
  "attachments",
  "autonumber",
  "created_at",
]);

function fieldDefsFor(schema, tableName) {
  const table = schema.tables.find((t) => t.name === tableName);
  return table ? table.fields : [];
}

function emptyRecord(fields) {
  const rec = {};
  for (const f of fields) {
    if (READONLY_TYPES.has(f.type)) continue;
    if (f.type === "checkbox") rec[f.name] = false;
    else rec[f.name] = "";
  }
  return rec;
}

export default function AdminTable({ schema, password }) {
  const { tableName } = useParams();
  const fields = fieldDefsFor(schema, tableName);
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newRecord, setNewRecord] = useState(() => emptyRecord(fields));

  useEffect(() => {
    setRecords(null);
    setError("");
    setShowNew(false);
    setNewRecord(emptyRecord(fields));
    adminApi
      .listRecords(password, tableName, { limit: 200 })
      .then((d) => setRecords(d.records || []))
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName]);

  async function saveField(record, fieldName, value) {
    setSavingId(record.id);
    try {
      await adminApi.updateRecord(password, tableName, record.id, { [fieldName]: value });
      setRecords((rs) =>
        rs.map((r) => (r.id === record.id ? { ...r, fields: { ...r.fields, [fieldName]: value } } : r))
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(record) {
    if (!confirm(`Delete this ${tableName} record? This can't be undone.`)) return;
    try {
      await adminApi.deleteRecord(password, tableName, record.id);
      setRecords((rs) => rs.filter((r) => r.id !== record.id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function createRow(e) {
    e.preventDefault();
    try {
      const created = await adminApi.createRecord(password, tableName, newRecord);
      setRecords((rs) => [created, ...(rs || [])]);
      setNewRecord(emptyRecord(fields));
      setShowNew(false);
    } catch (e2) {
      setError(e2.message);
    }
  }

  if (error) return <div className="notice error">{error}</div>;
  if (!records) return <p>Loading {tableName}…</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>
          {tableName} <span className="mono" style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>({records.length})</span>
        </h2>
        <button className="btn" onClick={() => setShowNew((s) => !s)}>
          {showNew ? "Cancel" : "+ New record"}
        </button>
      </div>

      {showNew && (
        <form
          onSubmit={createRow}
          style={{ border: "1px solid var(--line)", borderRadius: "3px", padding: "1rem", marginBottom: "1.5rem" }}
        >
          {fields
            .filter((f) => !READONLY_TYPES.has(f.type))
            .map((f) => (
              <FieldInput
                key={f.id || f.name}
                field={f}
                value={newRecord[f.name]}
                onChange={(v) => setNewRecord((r) => ({ ...r, [f.name]: v }))}
              />
            ))}
          <button className="btn" type="submit">
            Create
          </button>
        </form>
      )}

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              {fields.map((f) => (
                <th key={f.id || f.name}>{f.name}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} style={{ opacity: savingId === record.id ? 0.5 : 1 }}>
                {fields.map((f) => (
                  <td key={f.id || f.name}>
                    {READONLY_TYPES.has(f.type) ? (
                      <span className="readonly-cell">{displayValue(record.fields?.[f.name])}</span>
                    ) : (
                      <FieldInput
                        field={f}
                        value={record.fields?.[f.name]}
                        onChange={(v) => saveField(record, f.name, v)}
                        compact
                      />
                    )}
                  </td>
                ))}
                <td>
                  <button className="btn danger" style={{ padding: "0.3rem 0.6rem" }} onClick={() => deleteRow(record)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return `${value.length} linked`;
  if (typeof value === "object") return JSON.stringify(value).slice(0, 40);
  return String(value);
}

// A single field's editor. In "compact" mode (inside the data table) it
// commits on blur; in the "new record" form it's a controlled input that
// commits on submit.
function FieldInput({ field, value, onChange, compact }) {
  const [local, setLocal] = useState(value ?? (field.type === "checkbox" ? false : ""));

  useEffect(() => {
    setLocal(value ?? (field.type === "checkbox" ? false : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = (v) => {
    if (compact) {
      if (v !== value) onChange(v);
    } else {
      onChange(v);
    }
  };

  if (field.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={!!local}
        onChange={(e) => {
          setLocal(e.target.checked);
          commit(e.target.checked);
        }}
      />
    );
  }

  if (field.type === "single_select" && field.options) {
    return (
      <select
        value={local || ""}
        onChange={(e) => {
          setLocal(e.target.value);
          commit(e.target.value);
        }}
      >
        <option value="">—</option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.label}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (["number", "currency", "percent", "rating", "duration"].includes(field.type)) {
    return (
      <input
        type="number"
        value={local ?? ""}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => commit(local === "" ? null : Number(local))}
      />
    );
  }

  if (["date", "datetime"].includes(field.type)) {
    return (
      <input
        type={field.type === "date" ? "date" : "datetime-local"}
        value={local ? String(local).slice(0, field.type === "date" ? 10 : 16) : ""}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => commit(local || null)}
      />
    );
  }

  if (field.type === "long_text") {
    if (compact) {
      return (
        <input
          value={local || ""}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => commit(local)}
        />
      );
    }
    return (
      <div className="field">
        <label>{field.name}</label>
        <textarea value={local || ""} onChange={(e) => setLocal(e.target.value)} onBlur={() => commit(local)} />
      </div>
    );
  }

  const input = (
    <input
      value={local || ""}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => commit(local)}
    />
  );

  if (compact) return input;

  return (
    <div className="field">
      <label>{field.name}</label>
      {input}
    </div>
  );
}
