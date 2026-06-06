import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Flame, Shield, Eye, Database, Share2,
  Lock, UserCheck, Globe, Clock, AlertCircle, Mail, Phone
} from "lucide-react";
import Footer from "../components/Footer";

const SECTIONS = [
  {
    id: "collect",
    title: "Information We Collect",
    icon: Database,
    color: "#60a5fa",
    items: [
      {
        title: "Personal Information",
        text: "When you create an account, we collect your name, email address, phone number, and delivery address. This information is essential for processing and delivering your orders accurately."
      },
      {
        title: "Order History",
        text: "We maintain a record of all orders you place, including items ordered, timestamps, delivery locations, and payment methods. This history helps us personalise your experience and resolve disputes."
      },
      {
        title: "Location Data",
        text: "With your explicit permission, we collect your precise location to enable accurate delivery tracking and suggest nearby options. You may disable location access at any time via your device settings."
      },
      {
        title: "Device & Usage Information",
        text: "We collect data about the device you use, browser type, operating system, and how you interact with our app. This helps us diagnose technical issues and continuously improve performance."
      }
    ]
  },
  {
    id: "usage",
    title: "How We Use Your Data",
    icon: Eye,
    color: "#a78bfa",
    items: [
      {
        title: "Order Processing & Fulfilment",
        text: "Your data is primarily used to process and fulfil your food orders, manage deliveries, and send you real-time order status updates via SMS, email, or WhatsApp through KataBot."
      },
      {
        title: "Service Improvement",
        text: "We analyse aggregated usage patterns to improve our menu offerings, app experience, delivery efficiency, and the quality of our customer support interactions."
      },
      {
        title: "Marketing Communications",
        text: "With your consent, we may send you promotional offers, new menu announcements, and loyalty rewards notifications. You may opt out of all marketing communications at any time."
      },
      {
        title: "Fraud Prevention & Security",
        text: "We use your data to detect and prevent fraudulent activity, protect against unauthorised account access, and ensure ongoing compliance with our terms of service."
      }
    ]
  },
  {
    id: "sharing",
    title: "Data Sharing & Third Parties",
    icon: Share2,
    color: "#f87171",
    items: [
      {
        title: "Delivery Partners",
        text: "We share your name, phone number, and delivery address with our delivery staff solely for the purpose of completing your order. This data is not used by delivery partners for any other purpose."
      },
      {
        title: "Payment Processors",
        text: "Payment information is handled by secure, PCI-DSS compliant third-party processors. We do not store your full card details on our servers at any time."
      },
      {
        title: "We Never Sell Your Data",
        text: "KotaBites does not sell, rent, or trade your personal information to any third party for their marketing, advertising, or commercial purposes — ever."
      },
      {
        title: "Legal Requirements",
        text: "We may disclose your information when required by South African law, a valid court order, or to protect the rights, property, or safety of KotaBites, our users, or the general public."
      }
    ]
  },
  {
    id: "security",
    title: "Data Security & Retention",
    icon: Lock,
    color: "#4ade80",
    items: [
      {
        title: "Encryption in Transit & at Rest",
        text: "All data transmitted between your device and our servers is encrypted using TLS 1.3. Sensitive data stored on our servers is further encrypted at rest using AES-256 industry-standard protocols."
      },
      {
        title: "Access Controls",
        text: "Access to your personal data within our organisation is strictly restricted on a need-to-know basis. All staff with data access undergo regular privacy and security training."
      },
      {
        title: "Data Retention Policy",
        text: "We retain your personal data for as long as your account is active or as needed to provide services. Order records are kept for 7 years as required by South African tax legislation."
      },
      {
        title: "Breach Notification",
        text: "In the unlikely event of a data breach affecting your personal information, we will notify you and the Information Regulator within 72 hours as required under POPIA."
      }
    ]
  },
  {
    id: "rights",
    title: "Your POPIA Rights",
    icon: UserCheck,
    color: "#FFC72C",
    items: [
      {
        title: "Right to Access",
        text: "You may request a copy of all personal information we hold about you. Submit your request via our support page and we will respond within 30 calendar days."
      },
      {
        title: "Right to Correction",
        text: "If any of your personal information is inaccurate or outdated, you have the right to request correction. You can also update most details directly in your app account settings."
      },
      {
        title: "Right to Deletion",
        text: "You may request deletion of your personal data at any time. Please note that some data may be retained for legal or tax compliance reasons even after an account deletion request."
      },
      {
        title: "Right to Object",
        text: "You have the right to object to the processing of your personal data for marketing purposes at any time. Submit your objection via the contact details below and we will act within 5 business days."
      }
    ]
  }
];

export default function PrivacyPage() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="priv-root">
      <style>{styles}</style>

      {/* ── Header ── */}
      <header className="priv-header">
        <div className="priv-header-inner">
          <button className="priv-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="priv-brand">
            <div className="priv-brand-badge">
              <Flame className="w-4 h-4" style={{ color: "#0e0700" }} />
            </div>
            <div>
              <span className="priv-brand-name">KOTABITES</span>
              <p className="priv-brand-sub">Privacy Policy</p>
            </div>
          </div>
          <div className="priv-header-spacer" />
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="priv-hero">
        <div className="priv-hero-glow" />
        <div className="priv-hero-content">
          <div className="priv-hero-badge">
            <Globe className="w-4 h-4" />
            <span>POPIA Compliant · South Africa</span>
          </div>
          <Shield className="w-12 h-12 priv-hero-icon" />
          <h1 className="priv-hero-title">Privacy Policy</h1>
          <p className="priv-hero-sub">
            How KotaBites collects, uses, and protects your personal information
          </p>
          <div className="priv-hero-meta">
            <Clock className="w-3.5 h-3.5" />
            <span>Last updated: 1 June 2026</span>
          </div>
        </div>
      </div>

      {/* ── Quick Nav ── */}
      <div className="priv-quick-nav">
        <div className="priv-nav-container">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className="priv-nav-chip"
              onClick={() => scrollToSection(s.id)}
            >
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <span>{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="priv-body">

        {/* Intro Notice */}
        <div className="priv-intro-card">
          <AlertCircle className="w-5 h-5" style={{ color: "#60a5fa", flexShrink: 0, marginTop: 2 }} />
          <p className="priv-intro-text">
            This Privacy Policy explains how <strong>KotaBites (Pty) Ltd</strong> collects, uses, and
            safeguards your personal information in accordance with the <strong>Protection of Personal
            Information Act (POPIA)</strong> of South Africa. By using our services, you consent to
            the practices described herein.
          </p>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="priv-section">
            <div className="priv-section-header" style={{ borderLeftColor: section.color }}>
              <div
                className="priv-section-icon"
                style={{ background: `${section.color}15`, color: section.color }}
              >
                <section.icon className="w-6 h-6" />
              </div>
              <h2 className="priv-section-title">{section.title}</h2>
            </div>
            <div className="priv-section-content">
              {section.items.map((item, i) => (
                <div key={i} className="priv-item">
                  <h3 className="priv-item-title">{item.title}</h3>
                  <p className="priv-item-text">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Contact Card */}
        <div className="priv-contact-card">
          <div className="priv-contact-glow" />
          <div className="priv-contact-inner">
            <Mail className="w-6 h-6" style={{ color: "#FFC72C" }} />
            <div>
              <h3 className="priv-contact-title">Privacy Enquiries</h3>
              <p className="priv-contact-text">
                For any privacy-related queries, data access requests, or to exercise your POPIA rights,
                contact our Information Officer directly.
              </p>
              <a href="tel:0653935339" className="priv-contact-number">
                <Phone className="w-4 h-4" />
                065 393 5339
              </a>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="priv-footer-links">
          <Link to="/terms" className="priv-footer-link">Terms of Service</Link>
          <span className="priv-footer-dot">•</span>
          <Link to="/info" className="priv-footer-link">Help Center</Link>
          <span className="priv-footer-dot">•</span>
          <Link to="/support" className="priv-footer-link">Support</Link>
          <span className="priv-footer-dot">•</span>
          <span className="priv-footer-copy">© 2026 KotaBites</span>
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

  .priv-root {
    min-height: 100vh;
    background: radial-gradient(ellipse 80% 35% at 50% 0%, rgba(96, 165, 250, 0.13) 0%, transparent 65%), var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    padding-bottom: 60px;
  }

  /* Header */
  .priv-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(14, 7, 0, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .priv-header-inner {
    max-width: 800px;
    margin: 0 auto;
    padding: 13px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .priv-back-btn {
    width: 36px; height: 36px;
    flex-shrink: 0;
    background: rgba(255, 248, 231, 0.05);
    border: 1px solid var(--border);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s;
  }
  .priv-back-btn:hover { color: var(--text); border-color: rgba(255, 199, 44, 0.3); }
  .priv-brand { display: flex; align-items: center; gap: 8px; }
  .priv-brand-badge {
    width: 34px; height: 34px;
    background: var(--gold);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 16px rgba(255, 199, 44, 0.25);
  }
  .priv-brand-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 17px; letter-spacing: 3px;
    color: var(--text); line-height: 1; display: block;
  }
  .priv-brand-sub {
    font-size: 10px; font-weight: 800;
    color: var(--muted); letter-spacing: 0.1em; margin-top: 1px;
  }
  .priv-header-spacer { width: 36px; }

  /* Hero */
  .priv-hero {
    position: relative;
    padding: 44px 20px 36px;
    text-align: center;
    overflow: hidden;
  }
  .priv-hero-glow {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 340px; height: 340px;
    background: radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%);
    pointer-events: none;
  }
  .priv-hero-content {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .priv-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px;
    background: rgba(96, 165, 250, 0.1);
    border: 1px solid rgba(96, 165, 250, 0.25);
    border-radius: 50px;
    font-size: 11px; font-weight: 700;
    color: #93c5fd; letter-spacing: 0.05em;
  }
  .priv-hero-icon {
    color: #60a5fa;
    filter: drop-shadow(0 0 20px rgba(96, 165, 250, 0.35));
    margin-top: 4px;
  }
  .priv-hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 40px; letter-spacing: 4px;
    color: var(--text); margin: 0;
  }
  .priv-hero-sub {
    font-size: 14px; color: var(--muted);
    max-width: 380px; line-height: 1.65; margin: 0;
  }
  .priv-hero-meta {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: var(--muted);
  }

  /* Quick Nav */
  .priv-quick-nav {
    padding: 0 16px 24px;
    position: sticky; top: 70px; z-index: 90;
    background: linear-gradient(to bottom, var(--dark) 0%, transparent 100%);
  }
  .priv-nav-container {
    max-width: 800px; margin: 0 auto;
    display: flex; gap: 8px;
    overflow-x: auto; padding-bottom: 8px;
    scrollbar-width: none; -ms-overflow-style: none;
  }
  .priv-nav-container::-webkit-scrollbar { display: none; }
  .priv-nav-chip {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    background: rgba(255, 248, 231, 0.05);
    border: 1px solid var(--border);
    border-radius: 50px;
    color: var(--muted);
    font-size: 12px; font-weight: 700;
    white-space: nowrap; cursor: pointer;
    transition: all 0.2s; flex-shrink: 0;
  }
  .priv-nav-chip:hover {
    background: rgba(96, 165, 250, 0.1);
    border-color: rgba(96, 165, 250, 0.3);
    color: var(--text); transform: translateY(-1px);
  }

  /* Body */
  .priv-body {
    max-width: 800px; margin: 0 auto;
    padding: 0 16px 40px;
    display: flex; flex-direction: column; gap: 20px;
  }

  /* Intro Card */
  .priv-intro-card {
    display: flex; align-items: flex-start; gap: 14px;
    background: rgba(96, 165, 250, 0.06);
    border: 1px solid rgba(96, 165, 250, 0.18);
    border-radius: 16px; padding: 20px 24px;
  }
  .priv-intro-text {
    font-size: 13px; color: var(--muted);
    line-height: 1.85; margin: 0;
  }
  .priv-intro-text strong { color: var(--text); font-weight: 700; }

  /* Section */
  .priv-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 18px; overflow: hidden;
  }
  .priv-section-header {
    display: flex; align-items: center; gap: 12px;
    padding: 20px 24px;
    background: rgba(255, 248, 231, 0.02);
    border-bottom: 1px solid var(--border);
    border-left: 3px solid;
  }
  .priv-section-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .priv-section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 24px; letter-spacing: 2px;
    color: var(--text); margin: 0;
  }
  .priv-section-content {
    padding: 24px;
    display: flex; flex-direction: column; gap: 20px;
  }
  .priv-item {
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 248, 231, 0.05);
  }
  .priv-item:last-child { padding-bottom: 0; border-bottom: none; }
  .priv-item-title {
    font-size: 14px; font-weight: 800;
    color: var(--text); margin: 0 0 8px 0;
    display: flex; align-items: center; gap: 8px;
  }
  .priv-item-title::before {
    content: '';
    width: 6px; height: 6px;
    background: var(--gold); border-radius: 50%;
    flex-shrink: 0;
  }
  .priv-item-text {
    font-size: 13px; color: var(--muted);
    line-height: 1.75; margin: 0; padding-left: 14px;
  }

  /* Contact Card */
  .priv-contact-card {
    position: relative;
    background: linear-gradient(135deg, rgba(255, 199, 44, 0.08) 0%, rgba(218, 41, 28, 0.04) 100%);
    border: 1px solid rgba(255, 199, 44, 0.2);
    border-radius: 18px; padding: 24px; overflow: hidden;
  }
  .priv-contact-glow {
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }
  .priv-contact-inner {
    display: flex; align-items: flex-start; gap: 16px; position: relative;
  }
  .priv-contact-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 2px;
    color: var(--text); margin: 0 0 8px 0;
  }
  .priv-contact-text {
    font-size: 13px; color: var(--muted);
    margin: 0 0 16px 0; line-height: 1.65;
  }
  .priv-contact-number {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 26px; color: #4ade80;
    text-decoration: none; letter-spacing: 2px;
    transition: all 0.2s;
  }
  .priv-contact-number:hover {
    color: #86efac;
    text-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
  }

  /* Footer */
  .priv-footer-links {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; padding-top: 20px; flex-wrap: wrap;
    font-size: 12px; color: var(--muted);
  }
  .priv-footer-link {
    color: var(--gold); text-decoration: none;
    font-weight: 600; transition: color 0.2s;
  }
  .priv-footer-link:hover { color: var(--text); }
  .priv-footer-dot { opacity: 0.5; }
  .priv-footer-copy { opacity: 0.7; }

  @media (max-width: 600px) {
    .priv-hero-title { font-size: 30px; }
    .priv-intro-card { flex-direction: column; }
    .priv-section-content { padding: 18px; }
    .priv-contact-inner { flex-direction: column; }
  }
`;
