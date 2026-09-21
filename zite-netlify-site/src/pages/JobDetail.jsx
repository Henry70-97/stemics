import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { publicApi } from "../api.js";

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    publicApi
      .getJob(id)
      .then((d) => setJob(d.fields ? d : { fields: d }))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="notice error">{error}</div>;
  if (!job) return <p>Loading…</p>;

  const f = job.fields || {};

  return (
    <div>
      <p>
        <Link to="/jobs">← All jobs</Link>
      </p>
      <h1>{f["Job Title"]}</h1>
      <div className="job-meta" style={{ marginBottom: "1.5rem" }}>
        {f["Type"] && <span className="pill">{f["Type"]}</span>}
        {f["Status"] && <span className="pill success">{f["Status"]}</span>}
        {f["Category"] && <span>{f["Category"]}</span>}
        {f["Duration"] && <span>{f["Duration"]}</span>}
      </div>

      <p style={{ whiteSpace: "pre-wrap", maxWidth: "70ch" }}>{f["Description"]}</p>

      {f["Skills Required"] && (
        <p>
          <strong>Skills:</strong> {f["Skills Required"]}
        </p>
      )}

      <div
        style={{
          border: "1px solid var(--line)",
          borderRadius: "3px",
          padding: "1.25rem",
          marginTop: "2rem",
        }}
      >
        <h3 style={{ marginBottom: "0.4rem" }}>Applying to this job</h3>
        <p style={{ marginBottom: "0.75rem" }}>
          Job applications are tied to a signed-in freelancer account, which
          this starter doesn't wire up yet. Add sign-in (see README →
          "Adding real user accounts") and this section becomes a working
          application form that posts to the Job Applications table.
        </p>
        <Link className="btn secondary" to="/contact">
          Contact us about this job instead
        </Link>
      </div>
    </div>
  );
}
