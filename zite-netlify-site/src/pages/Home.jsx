import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { publicApi } from "../api.js";

export default function Home() {
  const [counts, setCounts] = useState({ jobs: null, gigs: null });

  useEffect(() => {
    publicApi
      .listJobs({ limit: 1 })
      .then((d) => setCounts((c) => ({ ...c, jobs: d.records?.length ?? 0 })))
      .catch(() => {});
    publicApi
      .listGigs({ limit: 1 })
      .then((d) => setCounts((c) => ({ ...c, gigs: d.records?.length ?? 0 })))
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="hero">
        <h1>Work finds its people here.</h1>
        <p>
          Quantum Freelance Hub connects clients posting real work with
          freelancers ready to do it — jobs, gigs, and everything needed to
          get paid for both.
        </p>
        <div style={{ display: "flex", gap: "0.9rem", marginTop: "1.5rem" }}>
          <Link className="btn" to="/jobs">
            Browse jobs
          </Link>
          <Link className="btn secondary" to="/gigs">
            Browse gigs
          </Link>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <b>{counts.jobs === null ? "—" : "Open"}</b>
            <span>Jobs accepting applications</span>
          </div>
          <div className="hero-stat">
            <b>{counts.gigs === null ? "—" : "Live"}</b>
            <span>Gigs ready to order</span>
          </div>
        </div>
      </section>

      <section>
        <h2>How it works</h2>
        <p>
          Clients post jobs with a budget and scope. Freelancers apply, sign
          the contract, and submit work through the platform. Payment moves
          through escrow so both sides are covered.
        </p>
      </section>
    </div>
  );
}
