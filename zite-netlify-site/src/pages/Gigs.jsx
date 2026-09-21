import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { publicApi } from "../api.js";

export default function Gigs() {
  const [gigs, setGigs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    publicApi
      .listGigs()
      .then((d) => setGigs(d.records || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Gigs</h1>
      <p>Ready-made services freelancers are offering right now.</p>

      {error && <div className="notice error">{error}</div>}
      {!gigs && !error && <p>Loading gigs…</p>}
      {gigs && gigs.length === 0 && <p>No active gigs yet.</p>}

      <div className="gig-grid">
        {gigs?.map((gig) => {
          const f = gig.fields || {};
          return (
            <Link to={`/gigs/${gig.id}`} className="gig-card" key={gig.id}>
              <h3>{f["Gig Title"] || "Untitled gig"}</h3>
              {f["Category"] && <span className="pill">{f["Category"]}</span>}
              <div className="gig-price">{f["Price"] ? `$${f["Price"]}` : "—"}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
