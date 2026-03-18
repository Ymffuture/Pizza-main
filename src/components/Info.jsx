import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Flame, Shield, RefreshCcw, AlertCircle,
  CheckCircle, XCircle, Phone, FileText, HelpCircle,
  Clock, CreditCard, Ban, Info
} from "lucide-react";
import Footer from "../components/Footer";

const SECTIONS = [
  {
    id: "cancellation",
    title: "Cancellation Policy",
    icon: Ban,
    color: "#f87171",
    content: [
      {
        title: "Free Cancellation Allowance",
        text: "Each user receives 5 free cancellation trials per calendar month. These trials allow you to cancel orders without any penalty fees."
      },
      {
        title: "Cancellation Charges",
        text: "Once your 5 free trials are exhausted, each subsequent cancellation will incur a R20.00 charge. This fee helps us manage food waste and operational costs."
      },
      {
        title: "How to Cancel",
        text: "All cancellations must be processed through KataBot only. Navigate to your order status page and use the cancellation option, or contact KataBot directly via WhatsApp."
      },
      {
        title: "Cancellation Window",
        text: "Orders can only be cancelled before they enter the 'Preparing' stage. Once food preparation begins, cancellations are no longer possible."
      }
    ]
  },
  {
    id: "refunds",
    title: "Refund Policy",
    icon: RefreshCcw,
    color: "#60a5fa",
    content: [
      {
        title: "Eligibility for Refunds",
        text: "Refunds are available for: incorrect orders, poor food quality, missing items, or orders not delivered within the promised timeframe."
      },
      {
        title: "Refund Timeframe",
        text: "Refund requests must be submitted within 24 hours of delivery. Requests made after this window may not be honored."
      },
      {
        title: "Non-Refundable Situations",
        text: "We cannot refund: orders cancelled after preparation begins, partially consumed food, dissatisfaction due to personal taste preferences, or delays caused by incorrect delivery information."
      },
      {
        title: "Refund Method",
        text: "Approved refunds will be processed to your original payment method within 7-10 business days. Cash orders will receive store credit or EFT refund."
      }
    ]
  },
  {
    id: "terms",
    title: "Terms & Conditions",
    icon: FileText,
    color: "#a78bfa",
    content: [
      {
        title: "Order Acceptance",
        text: "All orders are subject to availability. We reserve the right to cancel orders if items become unavailable, with a full refund provided."
      },
      {
        title: "Pricing",
        text: "All prices are in South African Rand (ZAR) and include VAT where applicable. Prices are subject to change without notice."
      },
      {
        title: "Delivery",
        text: "Delivery times are estimates. We are not liable for delays due to traffic, weather, or other circumstances beyond our control."
      },
      {
        title: "Account Responsibility",
        text: "Users are responsible for maintaining accurate account information. Orders placed with incorrect details may result in non-refundable delays."
      }
    ]
  },
  {
    id: "support",
    title: "Contact & Support",
    icon: HelpCircle,
    color: "#4ade80",
    content: [
      {
        title: "Cancellation Support",
        text: "For cancellation issues or to dispute charges, contact KataBot directly or call our support line."
      },
      {
        title: "Refund Inquiries",
        text: "Questions about refund status or eligibility? Reach out to our customer care team."
      },
      {
        title: "Technical Issues",
        text: "Problems with the app or website? Contact our technical support team for assistance."
      }
    ],
    highlight: "065 393 5339"
  }
];

export default function InfoPage() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="info-root">
      <style>{styles}</style>

      {/* ── Header ── */}
      <header className="info-header">
        <div className="info-header-inner">
          <button className="info-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="info-brand">
            <div className="info-brand-badge">
              <Flame className="w-4 h-4" style={{ color: "#0e0700" }} />
            </div>
            <div>
              <span className="info-brand-name">KOTABITES</span>
              <p className="info-brand-sub">Help Center & Policies</p>
            </div>
          </div>
          <div className="info-header-spacer" />
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="info-hero">
        <div className="info-hero-glow" />
        <div className="info-hero-content">
          <Shield className="w-12 h-12 info-hero-icon" />
          <h1 className="info-hero-title">Policies & Information</h1>
          <p className="info-hero-sub">
            Everything you need to know about cancellations, refunds, and using KotaBites
          </p>
        </div>
      </div>

      {/* ── Quick Nav ── */}
      <div className="info-quick-nav">
        <div className="info-nav-container">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              className="info-nav-chip"
              onClick={() => scrollToSection(section.id)}
              style={{ "--chip-color": section.color }}
            >
              <section.icon className="w-4 h-4" />
              <span>{section.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="info-body">
        
        {/* ── Trial Counter Card ── */}
        <div className="info-trial-card">
          <div className="info-trial-header">
            <Clock className="w-5 h-5" style={{ color: "#FFC72C" }} />
            <h2 className="info-trial-title">Your Cancellation Allowance</h2>
          </div>
          <div className="info-trial-grid">
            <div className="info-trial-stat">
              <span className="info-trial-number">5</span>
              <span className="info-trial-label">Free Trials / Month</span>
            </div>
            <div className="info-trial-divider" />
            <div className="info-trial-stat">
              <span className="info-trial-number">R20</span>
              <span className="info-trial-label">Charge After Limit</span>
            </div>
          </div>
          <p className="info-trial-note">
            <AlertCircle className="w-4 h-4" />
            Free trials reset on the 1st of each month. Unused trials do not roll over.
          </p>
        </div>

        {/* ── Sections ── */}
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="info-section">
            <div 
              className="info-section-header" 
              style={{ borderLeftColor: section.color }}
            >
              <div 
                className="info-section-icon" 
                style={{ background: `${section.color}15`, color: section.color }}
              >
                <section.icon className="w-6 h-6" />
              </div>
              <h2 className="info-section-title">{section.title}</h2>
            </div>

            <div className="info-section-content">
              {section.content.map((item, idx) => (
                <div key={idx} className="info-item">
                  <h3 className="info-item-title">{item.title}</h3>
                  <p className="info-item-text">{item.text}</p>
                </div>
              ))}

              {section.highlight && (
                <div className="info-highlight-box">
                  <Phone className="w-5 h-5" style={{ color: "#4ade80" }} />
                  <div>
                    <p className="info-highlight-label">Contact Number</p>
                    <a 
                      href={`tel:${section.highlight.replace(/\s/g, "")}`} 
                      className="info-highlight-value"
                    >
                      {section.highlight}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>
        ))}

        {/* ── Contact Banner ── */}
        <div className="info-contact-banner">
          <div className="info-contact-content">
            <Info className="w-6 h-6" style={{ color: "#FFC72C" }} />
            <div>
              <h3 className="info-contact-title">Need Immediate Help?</h3>
              <p className="info-contact-text">
                For urgent cancellations or disputes, contact KataBot or call directly
              </p>
            </div>
          </div>
          <a 
            href="tel:0653935339" 
            className="info-contact-btn"
          >
            <Phone className="w-4 h-4" />
            065 393 5339
          </a>
        </div>

        {/* ── Footer Links ── */}
        <div className="info-footer-links">
          <Link to="/privacy" className="info-footer-link">Privacy Policy</Link>
          <span className="info-footer-dot">•</span>
          <Link to="/terms" className="info-footer-link">Terms of Service</Link>
          <span className="info-footer-dot">•</span>
          <span className="info-footer-copyright">© 2026 KotaBites</span>
        </div>
      </div>

      <Footer />
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  
  :root {
    --red: #DA291C;
    --red2: #b91c1c;
    --gold: #FFC72C;
    --dark: #0e0700;
    --card: #1a0e00;
    --border: rgba(255, 199, 44, 0.1);
    --text: #fff8e7;
    --muted: rgba(255, 248, 231, 0.42);
  }

  .info-root {
    min-height: 100vh;
    background: radial-gradient(ellipse 80% 35% at 50% 0%, rgba(218, 41, 28, 0.15) 0%, transparent 65%), var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    padding-bottom: 60px;
  }

  /* Header */
  .info-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(14, 7, 0, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }

  .info-header-inner {
    max-width: 800px;
    margin: 0 auto;
    padding: 13px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .info-back-btn {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    background: rgba(255, 248, 231, 0.05);
    border: 1px solid var(--border);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s;
  }

  .info-back-btn:hover {
    color: var(--text);
    border-color: rgba(255, 199, 44, 0.3);
  }

  .info-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .info-brand-badge {
    width: 34px;
    height: 34px;
    background: var(--gold);
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 16px rgba(255, 199, 44, 0.25);
  }

  .info-brand-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 17px;
    letter-spacing: 3px;
    color: var(--text);
    line-height: 1;
    display: block;
  }

  .info-brand-sub {
    font-size: 10px;
    font-weight: 800;
    color: var(--muted);
    letter-spacing: 0.1em;
    margin-top: 1px;
  }

  .info-header-spacer {
    width: 36px;
  }

  /* Hero */
  .info-hero {
    position: relative;
    padding: 40px 20px 30px;
    text-align: center;
    overflow: hidden;
  }

  .info-hero-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 199, 44, 0.1) 0%, transparent 70%);
    pointer-events: none;
  }

  .info-hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .info-hero-icon {
    color: var(--gold);
    filter: drop-shadow(0 0 20px rgba(255, 199, 44, 0.3));
  }

  .info-hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 36px;
    letter-spacing: 3px;
    color: var(--text);
    margin: 0;
  }

  .info-hero-sub {
    font-size: 14px;
    color: var(--muted);
    max-width: 400px;
    line-height: 1.6;
    margin: 0;
  }

  /* Quick Nav */
  .info-quick-nav {
    padding: 0 16px 24px;
    position: sticky;
    top: 70px;
    z-index: 90;
    background: linear-gradient(to bottom, var(--dark) 0%, transparent 100%);
  }

  .info-nav-container {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .info-nav-container::-webkit-scrollbar {
    display: none;
  }

  .info-nav-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255, 248, 231, 0.05);
    border: 1px solid var(--border);
    border-radius: 50px;
    color: var(--muted);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .info-nav-chip:hover {
    background: rgba(255, 199, 44, 0.1);
    border-color: rgba(255, 199, 44, 0.3);
    color: var(--text);
    transform: translateY(-1px);
  }

  /* Body */
  .info-body {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 16px 40px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Trial Card */
  .info-trial-card {
    background: linear-gradient(135deg, rgba(255, 199, 44, 0.1) 0%, rgba(218, 41, 28, 0.05) 100%);
    border: 1px solid rgba(255, 199, 44, 0.2);
    border-radius: 20px;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .info-trial-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }

  .info-trial-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .info-trial-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 2px;
    color: var(--gold);
    margin: 0;
  }

  .info-trial-grid {
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 20px;
    margin-bottom: 20px;
  }

  .info-trial-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .info-trial-number {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 42px;
    color: var(--text);
    line-height: 1;
  }

  .info-trial-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .info-trial-divider {
    width: 1px;
    height: 50px;
    background: var(--border);
  }

  .info-trial-note {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--muted);
    margin: 0;
    padding: 12px;
    background: rgba(255, 248, 231, 0.03);
    border-radius: 10px;
    border: 1px solid var(--border);
  }

  /* Sections */
  .info-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 18px;
    overflow: hidden;
  }

  .info-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px;
    background: rgba(255, 248, 231, 0.02);
    border-bottom: 1px solid var(--border);
    border-left: 3px solid;
  }

  .info-section-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .info-section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 24px;
    letter-spacing: 2px;
    color: var(--text);
    margin: 0;
  }

  .info-section-content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .info-item {
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 248, 231, 0.05);
  }

  .info-item:last-of-type {
    padding-bottom: 0;
    border-bottom: none;
  }

  .info-item-title {
    font-size: 14px;
    font-weight: 800;
    color: var(--text);
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .info-item-title::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--gold);
    border-radius: 50%;
  }

  .info-item-text {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.7;
    margin: 0;
    padding-left: 14px;
  }

  /* Highlight Box */
  .info-highlight-box {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(74, 222, 128, 0.08);
    border: 1px solid rgba(74, 222, 128, 0.2);
    border-radius: 14px;
    padding: 20px 24px;
    margin-top: 4px;
  }

  .info-highlight-label {
    font-size: 11px;
    font-weight: 800;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 4px 0;
  }

  .info-highlight-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    color: #4ade80;
    text-decoration: none;
    letter-spacing: 2px;
    transition: all 0.2s;
  }

  .info-highlight-value:hover {
    color: #86efac;
    text-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
  }

  /* Contact Banner */
  .info-contact-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    background: linear-gradient(90deg, rgba(218, 41, 28, 0.1) 0%, rgba(255, 199, 44, 0.05) 100%);
    border: 1px solid rgba(218, 41, 28, 0.2);
    border-radius: 16px;
    padding: 24px;
    flex-wrap: wrap;
  }

  .info-contact-content {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
  }

  .info-contact-title {
    font-size: 16px;
    font-weight: 800;
    color: var(--text);
    margin: 0 0 4px 0;
  }

  .info-contact-text {
    font-size: 13px;
    color: var(--muted);
    margin: 0;
  }

  .info-contact-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--red);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 50px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 14px;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(218, 41, 28, 0.3);
  }

  .info-contact-btn:hover {
    background: var(--red2);
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(218, 41, 28, 0.4);
  }

  /* Footer Links */
  .info-footer-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding-top: 20px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--muted);
  }

  .info-footer-link {
    color: var(--gold);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
  }

  .info-footer-link:hover {
    color: var(--text);
  }

  .info-footer-dot {
    opacity: 0.5;
  }

  .info-footer-copyright {
    opacity: 0.7;
  }

  @media (max-width: 600px) {
    .info-hero-title {
      font-size: 28px;
    }
    
    .info-trial-grid {
      flex-direction: column;
      gap: 16px;
    }
    
    .info-trial-divider {
      width: 100%;
      height: 1px;
    }
    
    .info-contact-banner {
      flex-direction: column;
      text-align: center;
    }
    
    .info-contact-content {
      flex-direction: column;
    }
    
    .info-section-content {
      padding: 20px;
    }
  }
`;
