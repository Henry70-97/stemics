import { Routes, Route, Link, NavLink } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Jobs from "./pages/Jobs.jsx";
import JobDetail from "./pages/JobDetail.jsx";
import Gigs from "./pages/Gigs.jsx";
import GigDetail from "./pages/GigDetail.jsx";
import Contact from "./pages/Contact.jsx";
import AdminApp from "./pages/AdminApp.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route
        path="*"
        element={
          <div className="shell">
            <header className="topbar">
              <Link to="/" className="wordmark">
                Quantum<span>Freelance</span>Hub
              </Link>
              <nav className="nav-links">
                <NavLink to="/jobs">Jobs</NavLink>
                <NavLink to="/gigs">Gigs</NavLink>
                <NavLink to="/contact">Contact</NavLink>
                <NavLink to="/admin">Admin</NavLink>
              </nav>
            </header>
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<JobDetail />} />
                <Route path="/gigs" element={<Gigs />} />
                <Route path="/gigs/:id" element={<GigDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<p>Page not found.</p>} />
              </Routes>
            </main>
            <footer className="footer">
              Quantum Freelance Hub — built on Zite, hosted on Netlify.
            </footer>
          </div>
        }
      />
    </Routes>
  );
}
