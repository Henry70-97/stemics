import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { publicApi } from "../api.js";

export default function GigDetail() {
  const { id } = useParams();
  const [gig, setGig] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    publicApi
      .getGig(id)
      .then((d) => setGig(d.fields ? d : { fields: d }))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="notice error">{error}</div>;
  if (!gig) return <p>Loading…</p>;

  const f = gig.fields || {};

  return (
    <div>
      <p>
        <Link to="/gigs">← All gigs</Link>
      </p>
      <h1>{f["Gig Title"]}</h1>
      <div className="job-meta" style={{ marginBottom: "1.5rem" }}>
        {f["Category"] && <span className="pill">{f["Category"]}</span>}
        {f["Delivery Time"] && <span>{f["Delivery Time"]} delivery</span>}
      </div>
      <p style={{ whiteSpace: "pre-wrap", maxWidth: "70ch" }}>{f["Description"]}</p>
      <div className="gig-price" style={{ marginTop: "1.5rem" }}>
        {f["Price"] ? `$${f["Price"]}` : "Price on request"}
      </div>
      <Link className="btn" to="/contact" style={{ marginTop: "1.25rem", display: "inline-flex" }}>
        Ask about this gig
      </Link>
    </div>
  );
}
