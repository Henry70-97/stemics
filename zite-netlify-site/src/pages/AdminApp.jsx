import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import { adminApi } from "../api.js";
import AdminTable from "./AdminTable.jsx";

const STORAGE_KEY = "qfh_admin_password";

export default function AdminApp() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(STORAGE_KEY) || "");
  const [authed, setAuthed] = useState(null); // null = checking, true/false once known
  const [schema, setSchema] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!password) {
      setAuthed(false);
      return;
    }
    adminApi
      .checkPassword(password)
      .then(() => {
        setAuthed(true);
        return adminApi.getSchema(password);
      })
      .then((db) => setSchema(db))
      .catch(() => {
        setAuthed(false);
        sessionStorage.removeItem(STORAGE_KEY);
      });
  }, [password]);

  function handleLogin(pw) {
    sessionStorage.setItem(STORAGE_KEY, pw);
    setError("");
    setPassword(pw);
  }

  function handleLoginFail(message) {
    setError(message);
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword("");
    setAuthed(false);
    setSchema(null);
  }

  if (authed === null) {
    return (
      <div className="shell">
        <main>
          <p>Checking access…</p>
        </main>
      </div>
    );
  }

  if (!authed) {
    return <LoginScreen onLogin={handleLogin} onFail={handleLoginFail} error={error} />;
  }

  if (!schema) {
    return (
      <div className="shell">
        <main>
          <p>Loading database schema…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="wordmark" style={{ display: "block", padding: "0.3rem 0.6rem 1rem" }}>
          Quantum<span style={{ color: "var(--accent)" }}>Hub</span>
        </Link>
        <h4>Tables ({schema.tables.length})</h4>
        {schema.tables.map((t) => (
          <TableLink key={t.id} table={t} />
        ))}
        <button onClick={logout} style={{ marginTop: "1rem", color: "var(--danger)" }}>
          Log out
        </button>
      </aside>
      <div className="admin-main">
        <Routes>
          <Route
            index
            element={<p>Pick a table on the left to view and edit its records.</p>}
          />
          <Route
            path="tables/:tableName"
            element={<AdminTable schema={schema} password={password} />}
          />
        </Routes>
      </div>
    </div>
  );
}

function TableLink({ table }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(`tables/${encodeURIComponent(table.name)}`)}>
      {table.name}
    </button>
  );
}

function LoginScreen({ onLogin, onFail, error }) {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setChecking(true);
    try {
      await adminApi.checkPassword(value);
      onLogin(value);
    } catch (err) {
      onFail("Incorrect password.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="shell">
      <main>
        <div className="login-box">
          <h1>Admin</h1>
          <p>Enter the admin password to manage Quantum Freelance Hub data.</p>
          {error && <div className="notice error">{error}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="pw">Password</label>
              <input
                id="pw"
                type="password"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <button className="btn" type="submit" disabled={checking}>
              {checking ? "Checking…" : "Log in"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
