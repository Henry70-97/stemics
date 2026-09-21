import { useState } from "react";
import { publicApi } from "../api.js";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState({ state: "idle", message: "" });

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ state: "sending", message: "" });
    try {
      await publicApi.submitHelpTicket(form);
      setStatus({ state: "success", message: "Thanks — we'll get back to you soon." });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus({ state: "error", message: err.message });
    }
  }

  return (
    <div style={{ maxWidth: "480px" }}>
      <h1>Get in touch</h1>
      <p>Questions about a job, a gig, or the platform — send us a note.</p>

      {status.state === "success" && <div className="notice success">{status.message}</div>}
      {status.state === "error" && <div className="notice error">{status.message}</div>}

      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            required
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
          />
        </div>
        <button className="btn" type="submit" disabled={status.state === "sending"}>
          {status.state === "sending" ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
