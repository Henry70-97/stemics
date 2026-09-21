import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { publicApi } from "../api.js";

export default function Jobs() {
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    publicApi
      .listJobs({ status: "Open" })
      .then((d) => setJobs(d.records || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Open jobs</h1>
      <p>Fixed-price and hourly work, posted by clients right now.</p>

      {error && <div className="notice error">{error}</div>}
      {!jobs && !error && <p>Loading jobs…</p>}
      {jobs && jobs.length === 0 && <p>No open jobs right now — check back soon.</p>}

      {jobs?.map((job) => {
        const f = job.fields || {};
        return (
          <div className="job-row" key={job.id}>
            <div>
              <h3>
                <Link to={`/jobs/${job.id}`}>{f["Job Title"] || "Untitled job"}</Link>
              </h3>
              <div className="job-meta">
                {f["Type"] && <span className="pill">{f["Type"]}</span>}
                {f["Category"] && <span>{f["Category"]}</span>}
                {f["Duration"] && <span>{f["Duration"]}</span>}
              </div>
            </div>
            <div className="job-budget">
              {formatBudget(f)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatBudget(f) {
  if (f["Budget"]) return `$${f["Budget"]}`;
  if (f["Budget Min"] && f["Budget Max"]) return `$${f["Budget Min"]}–$${f["Budget Max"]}`;
  return "—";
}
