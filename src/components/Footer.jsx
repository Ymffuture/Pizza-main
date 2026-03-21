import { 
  Flame, 
  ExternalLink, 
  ShoppingBag, 
  MapPin, 
  Phone,
  Facebook,
  Instagram,
  MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";

// Custom Moya App Icon (since it's not in Lucide)
const MoyaIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8h-2V7h2v2z"/>
    <circle cx="12" cy="12" r="3" fill="white" opacity="0.3"/>
  </svg>
);

// WhatsApp Icon (custom styled)
const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Footer() {
  const year = new Date().getFullYear();

  // Social media links
  const socialLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: "https://facebook.com/kotabites",
      color: "hover:bg-blue-600 hover:text-white"
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://instagram.com/kotabites",
      color: "hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 hover:text-white"
    },
    {
      name: "WhatsApp",
      icon: WhatsAppIcon,
      url: "https://wa.me/27634414863",
      color: "hover:bg-emerald-500 hover:text-white"
    },
    {
      name: "Moya App",
      icon: MoyaIcon,
      url: "https://moya.app",
      color: "hover:bg-purple-600 hover:text-white"
    }
  ];

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
          
          {/* Social Media Links */}
          <div className="kb-social-links">
            <p className="kb-social-title">Follow Us</p>
            <div className="kb-social-icons">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`kb-social-icon ${social.color}`}
                  aria-label={social.name}
                  title={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

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

        {/* Powered by SwiftMeta */}
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

  /* Social Media Section */
  .kb-social-links {
    margin-bottom: 16px;
  }
  .kb-social-title {
    font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
    text-transform: uppercase; color: #FFC72C; margin-bottom: 10px;
  }
  .kb-social-icons {
    display: flex; gap: 10px;
  }
  .kb-social-icon {
    display: flex; align-items: center; justify-content: center;
    width: 40px; height: 40px;
    background: rgba(255,248,231,0.05);
    border: 1px solid rgba(255,199,44,0.15);
    border-radius: 12px;
    color: rgba(255,248,231,0.6);
    transition: all 0.3s ease;
  }
  .kb-social-icon:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
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
    .kb-social-icons {
      justify-content: flex-start;
    }
  }
`;
