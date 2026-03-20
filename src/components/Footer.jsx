import { Flame, ExternalLink, ShoppingBag, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="kb-footer">
      <style>{styles}</style>

      <div className="kb-footer-inner">

        {/* ── Brand col ── */}
        <div className="kb-footer-brand">
          <div className="kb-footer-logo-row">
            <div className="kb-footer-badge">
              <Flame className="w-5 h-5" style={{ color: "#0e0700" }} />
            </div>
            <div>
              <span className="kb-footer-name">KOTABITES</span>
              <p className="kb-footer-tagline">Fresh · Fast · Fire</p>
            </div>
          </div>
          <p className="kb-footer-desc">
            Delicious kota sandwiches delivered hot to your door across
            Johannesburg. Order online in seconds.
          </p>
          <div className="kb-footer-contact">
            <span className="kb-footer-contact-item">
              <MapPin className="w-3.5 h-3.5" /> Johannesburg, South Africa
            </span>
            <span className="kb-footer-contact-item">
              <Phone className="w-3.5 h-3.5" /> Available via order form
            </span>
          </div>
        </div>

        {/* ── Quick links ── */}
        <div className="kb-footer-links-col">
          <h4 className="kb-footer-col-title">Quick Links</h4>
          <ul className="kb-footer-links">
            <li><Link to="/"        className="kb-footer-link">Home</Link></li>
            <li><Link to="/menu"    className="kb-footer-link">Menu</Link></li>
            <li><Link to="/cart"    className="kb-footer-link">Cart</Link></li>
            <li><Link to="/login"   className="kb-footer-link">Sign In</Link></li>
            <li><Link to="/register" className="kb-footer-link">Create Account</Link></li>
            <li><Link to="/coverage" className="kb-footer-link">Coverage delivery</Link></li>
          </ul>
        </div>

        {/* ── Order links ── */}
        <div className="kb-footer-links-col">
          <h4 className="kb-footer-col-title">Orders</h4>
          <ul className="kb-footer-links">
            <li><Link to="/menu"     className="kb-footer-link"><ShoppingBag className="w-3.5 h-3.5" /> Order Now</Link></li>
            <li><Link to="/checkout" className="kb-footer-link">Checkout</Link></li>
            <li>
              <a href="https://kotabites.onrender.com/docs" target="_blank" rel="noopener noreferrer" className="kb-footer-link">
                API Docs <ExternalLink className="w-3 h-3" />
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className="kb-footer-bottom">
        <p className="kb-footer-copy">
          © {year} KotaBites. All rights reserved.
        </p>

        {/* ✅ Powered by SwiftMeta */}
        <a
          href="https://swiftmeta.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="kb-powered"
        >
          <span className="kb-powered-text">Powered by</span>
          <span className="kb-powered-brand">
            <span className="kb-powered-dot" />
            SwiftMeta
          </span>
          <ExternalLink className="w-3 h-3 kb-powered-icon" />
        </a>
      </div>
    </footer>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .kb-footer {
    background: #0a0500;
    border-top: 1px solid rgba(255,199,44,0.1);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: #fff8e7;
  }

  .kb-footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 48px 24px 36px;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 48px;
  }

  /* Brand */
  .kb-footer-logo-row {
    display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
  }
  .kb-footer-badge {
    width: 38px; height: 38px; background: #FFC72C; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    box-shadow: 0 0 18px rgba(255,199,44,0.3);
  }
  .kb-footer-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 3px; color: #fff8e7; display: block; line-height: 1;
  }
  .kb-footer-tagline {
    font-size: 10px; font-weight: 700; color: #FFC72C;
    letter-spacing: 0.18em; text-transform: uppercase; margin-top: 1px;
  }
  .kb-footer-desc {
    font-size: 13px; color: rgba(255,248,231,0.42); line-height: 1.65; margin-bottom: 16px;
    max-width: 320px;
  }
  .kb-footer-contact {
    display: flex; flex-direction: column; gap: 6px;
  }
  .kb-footer-contact-item {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; color: rgba(255,248,231,0.38); font-weight: 600;
  }

  /* Columns */
  .kb-footer-links-col { display: flex; flex-direction: column; gap: 12px; }
  .kb-footer-col-title {
    font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
    text-transform: uppercase; color: #FFC72C; margin-bottom: 4px;
  }
  .kb-footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .kb-footer-link {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 600; color: rgba(255,248,231,0.55);
    text-decoration: none; transition: color 0.2s;
  }
  .kb-footer-link:hover { color: #fff8e7; }

  /* Bottom bar */
  .kb-footer-bottom {
    max-width: 1200px; margin: 0 auto;
    padding: 16px 24px;
    border-top: 1px solid rgba(255,199,44,0.07);
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
  }
  .kb-footer-copy {
    font-size: 12px; color: rgba(255,248,231,0.28); font-weight: 600;
  }

  /* Powered by SwiftMeta */
  .kb-powered {
    display: inline-flex; align-items: center; gap: 7px;
    text-decoration: none;
    background: rgba(255,199,44,0.06);
    border: 1px solid rgba(255,199,44,0.15);
    border-radius: 50px;
    padding: 6px 14px;
    transition: all 0.22s;
  }
  .kb-powered:hover {
    background: rgba(255,199,44,0.12);
    border-color: rgba(255,199,44,0.35);
  }
  .kb-powered-text {
    font-size: 11px; font-weight: 600;
    color: rgba(255,248,231,0.45); letter-spacing: 0.02em;
  }
  .kb-powered-brand {
    display: flex; align-items: center; gap: 5px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 14px; letter-spacing: 2px; color: #FFC72C;
  }
  .kb-powered-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #FFC72C;
    box-shadow: 0 0 8px rgba(255,199,44,0.8);
    animation: kbDotPulse 1.8s ease infinite;
  }
  @keyframes kbDotPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(1.5); }
  }
  .kb-powered-icon { color: rgba(255,248,231,0.35); }

  @media (max-width: 768px) {
    .kb-footer-inner {
      grid-template-columns: 1fr;
      gap: 32px;
      padding: 36px 20px 28px;
    }
    .kb-footer-bottom {
      flex-direction: column; align-items: flex-start;
    }
  }
`;
