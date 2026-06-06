import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Flame, FileText, UserCheck, ShoppingCart,
  Truck, Ban, Scale, Copyright, AlertTriangle, Clock,
  MapPin, CreditCard, Phone
} from "lucide-react";
import Footer from "../components/Footer";

const SECTIONS = [
  {
    id: "acceptance",
    title: "Acceptance & Eligibility",
    icon: UserCheck,
    color: "#a78bfa",
    items: [
      {
        title: "Agreement to Terms",
        text: "By accessing or using KotaBites — including our website, mobile app, or any related services — you agree to be bound by these Terms & Conditions. If you do not agree, please discontinue use immediately."
      },
      {
        title: "Eligibility",
        text: "You must be at least 18 years of age to create an account and place orders. By using our services, you represent and warrant that you meet this age requirement."
      },
      {
        title: "Account Registration",
        text: "You are responsible for maintaining the confidentiality of your account credentials. Any activity occurring under your account is your responsibility. Notify us immediately of any unauthorised use."
      },
      {
        title: "Accuracy of Information",
        text: "You agree to provide accurate, current, and complete information during registration and throughout your use of our services. Providing false information may result in account suspension."
      }
    ]
  },
  {
    id: "ordering",
    title: "Ordering & Payment",
    icon: ShoppingCart,
    color: "#FFC72C",
    items: [
      {
        title: "Order Placement",
        text: "All orders are subject to availability and confirmation. Placing an order constitutes an offer to purchase, which we may accept or decline. You will receive a confirmation notification once an order is accepted."
      },
      {
        title: "Pricing & VAT",
        text: "All prices are listed in South African Rand (ZAR) and are inclusive of VAT at the applicable rate. Prices and menu items are subject to change without prior notice."
      },
      {
        title: "Payment Methods",
        text: "We accept card payments, EFT, and approved mobile payment solutions. Cash payments are accepted for select delivery zones. Payment must be completed before order processing begins."
      },
      {
        title: "Order Modifications",
        text: "Once an order is submitted, modifications may not be possible depending on the preparation stage. Contact KataBot immediately after placing an order if you need to make changes."
      }
    ]
  },
  {
    id: "delivery",
    title: "Delivery Terms",
    icon: Truck,
    color: "#60a5fa",
    items: [
      {
        title: "Delivery Area",
        text: "Delivery is available within our designated service zones. Delivery availability and fees are displayed at checkout. We reserve the right to adjust service zones without notice."
      },
      {
        title: "Estimated Delivery Times",
        text: "Delivery time estimates are indicative only. We are not liable for delays caused by traffic, weather, high demand, or other circumstances beyond our reasonable control."
      },
      {
        title: "Failed Deliveries",
        text: "If a delivery fails due to an incorrect address, unavailability of the recipient, or inaccessible premises, you remain liable for the full order cost. A redelivery fee may apply."
      },
      {
        title: "Order Receipt",
        text: "You are responsible for inspecting your order upon receipt. Any complaints regarding missing items or incorrect orders must be reported within 30 minutes of delivery via KataBot or our support line."
      }
    ]
  },
  {
    id: "cancellations",
    title: "Cancellations & Refunds",
    icon: Ban,
    color: "#f87171",
    items: [
      {
        title: "Free Cancellation Trials",
        text: "Each user receives 5 free cancellation trials per calendar month. These trials allow you to cancel accepted orders without penalty. Trials reset on the 1st of each month and do not roll over."
      },
      {
        title: "Cancellation Charges",
        text: "Once your 5 free trials are exhausted, a R20.00 cancellation fee applies to each subsequent cancellation within that calendar month. This fee is non-negotiable and non-refundable."
      },
      {
        title: "Cancellation Window",
        text: "Orders may only be cancelled before they enter the 'Preparing' stage. Once food preparation has begun, cancellations are not permitted regardless of the reason."
      },
      {
        title: "Refund Eligibility",
        text: "Refunds are considered for incorrect orders, missing items, or unacceptable food quality. All refund requests must be submitted within 24 hours of delivery via KataBot or our support line."
      }
    ]
  },
  {
    id: "conduct",
    title: "User Conduct",
    icon: Scale,
    color: "#4ade80",
    items: [
      {
        title: "Prohibited Activities",
        text: "You may not use our platform to engage in fraud, place false orders, abuse our cancellation or refund policies, harass staff or delivery personnel, or engage in any activity that disrupts our services."
      },
      {
        title: "Account Abuse",
        text: "Creating multiple accounts to circumvent cancellation limits or refund restrictions is strictly prohibited. We reserve the right to merge, suspend, or permanently ban accounts engaged in abuse."
      },
      {
        title: "Consequences of Violations",
        text: "Violations of these conduct terms may result in immediate account suspension, loss of accumulated trials, permanent banning from our platform, and/or legal action where applicable."
      }
    ]
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    icon: AlertTriangle,
    color: "#fb923c",
    items: [
      {
        title: "Service Availability",
        text: "KotaBites is provided on an 'as available' basis. We do not guarantee uninterrupted service and are not liable for losses arising from service downtime, technical errors, or platform unavailability."
      },
      {
        title: "Indirect Damages",
        text: "To the fullest extent permitted by South African law, KotaBites shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services."
      },
      {
        title: "Maximum Liability",
        text: "Our total liability to you for any claim arising from these terms or your use of our services shall not exceed the total value of the specific order in dispute."
      },
      {
        title: "Governing Law",
        text: "These Terms & Conditions are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the exclusive jurisdiction of the South African courts."
      }
    ]
  },
  {
    id: "intellectual",
    title: "Intellectual Property",
    icon: Copyright,
    color: "#38bdf8",
    items: [
      {
        title: "Our Content",
        text: "All content on our platform — including logos, imagery, text, UI designs, and the 'KotaBites' and 'KataBot' names — is the exclusive property of KotaBites (Pty) Ltd and protected by applicable intellectual property law."
      },
      {
        title: "Restricted Use",
        text: "You may not reproduce, distribute, modify, or create derivative works from any of our content without prior written permission. Unauthorised use may result in legal action."
      },
      {
        title: "User Content",
        text: "By submitting reviews, feedback, or other content to our platform, you grant KotaBites a non-exclusive, royalty-free licence to use, display, and distribute such content in connection with our services."
      }
    ]
  }
];

export default function TermsPage() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="tos-root">
      <style>{styles}</style>

      {/* ── Header ── */}
      <header className="tos-header">
        <div className="tos-header-inner">
          <button className="tos-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="tos-brand">
            <div className="tos-brand-badge">
              <Flame className="w-4 h-4" style={{ color: "#0e0700" }} />
            </div>
            <div>
              <span className="tos-brand-name">KOTABITES</span>
              <p className="tos-brand-sub">Terms & Conditions</p>
            </div>
          </div>
          <div className="tos-header-spacer" />
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="tos-hero">
        <div className="tos-hero-glow" />
        <div className="tos-hero-content">
          <div className="tos-hero-badge">
            <MapPin className="w-4 h-4" />
            <span>Republic of South Africa</span>
          </div>
          <FileText className="w-12 h-12 tos-hero-icon" />
          <h1 className="tos-hero-title">Terms & Conditions</h1>
          <p className="tos-hero-sub">
            The rules, rights, and responsibilities that govern your use of KotaBites
          </p>
          <div className="tos-hero-meta">
            <Clock className="w-3.5 h-3.5" />
            <span>Effective: 1 June 2026</span>
          </div>
        </div>
      </div>

      {/* ── Quick Nav ── */}
      <div className="tos-quick-nav">
        <div className="tos-nav-container">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className="tos-nav-chip"
              onClick={() => scrollToSection(s.id)}
            >
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <span>{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="tos-body">

        {/* Intro */}
        <div className="tos-intro-card">
          <AlertTriangle className="w-5 h-5" style={{ color: "#FFC72C", flexShrink: 0, marginTop: 2 }} />
          <p className="tos-intro-text">
            Please read these Terms & Conditions carefully before using KotaBites.
            By accessing our platform, you agree to be legally bound by these terms.
            These terms were last updated on <strong>1 June 2026</strong> and supersede all previous versions.
          </p>
        </div>

        {/* Section Cards */}
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="tos-section">
            <div className="tos-section-header" style={{ borderLeftColor: section.color }}>
              <div
                className="tos-section-icon"
                style={{ background: `${section.color}15`, color: section.color }}
              >
                <section.icon className="w-6 h-6" />
              </div>
              <h2 className="tos-section-title">{section.title}</h2>
            </div>
            <div className="tos-section-content">
              {section.items.map((item, i) => (
                <div key={i} className="tos-item">
                  <h3 className="tos-item-title">{item.title}</h3>
                  <p className="tos-item-text">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Changes Notice */}
        <div className="tos-notice-card">
          <div className="tos-notice-icon">
            <Clock className="w-5 h-5" style={{ color: "#FFC72C" }} />
          </div>
          <div>
            <h3 className="tos-notice-title">Changes to These Terms</h3>
            <p className="tos-notice-text">
              KotaBites reserves the right to modify these Terms & Conditions at any time. Changes will be
              communicated via the app, email, or WhatsApp notification at least 7 days before taking effect.
              Continued use of our services after changes take effect constitutes acceptance of the updated terms.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="tos-contact-card">
          <CreditCard className="w-6 h-6" style={{ color: "#a78bfa" }} />
          <div>
            <h3 className="tos-contact-title">Terms & Legal Enquiries</h3>
            <p className="tos-contact-text">
              Questions about these terms or our policies? Reach out to us directly.
            </p>
            <a href="tel:0653935339" className="tos-contact-number">
              <Phone className="w-4 h-4" />
              065 393 5339
            </a>
          </div>
        </div>

        {/* Footer Links */}
        <div className="tos-footer-links">
          <Link to="/privacy" className="tos-footer-link">Privacy Policy</Link>
          <span className="tos-footer-dot">•</span>
          <Link to="/info" className="tos-footer-link">Help Center</Link>
          <span className="tos-footer-dot">•</span>
          <Link to="/support" className="tos-footer-link">Support</Link>
          <span className="tos-footer-dot">•</span>
          <span className="tos-footer-copy">© 2026 KotaBites</span>
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

  .tos-root {
    min-height: 100vh;
    background: radial-gradient(ellipse 80% 35% at 50% 0%, rgba(167, 139, 250, 0.12) 0%, transparent 65%), var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    padding-bottom: 60px;
  }

  /* Header */
  .tos-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(14, 7, 0, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .tos-header-inner {
    max-width: 800px; margin: 0 auto;
    padding: 13px 20px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
  }
  .tos-back-btn {
    width: 36px; height: 36px; flex-shrink: 0;
    background: rgba(255, 248, 231, 0.05);
    border: 1px solid var(--border);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; transition: all 0.2s;
  }
  .tos-back-btn:hover { color: var(--text); border-color: rgba(255, 199, 44, 0.3); }
  .tos-brand { display: flex; align-items: center; gap: 8px; }
  .tos-brand-badge {
    width: 34px; height: 34px;
    background: var(--gold); border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 0 16px rgba(255, 199, 44, 0.25);
  }
  .tos-brand-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 17px; letter-spacing: 3px;
    color: var(--text); line-height: 1; display: block;
  }
  .tos-brand-sub {
    font-size: 10px; font-weight: 800;
    color: var(--muted); letter-spacing: 0.1em; margin-top: 1px;
  }
  .tos-header-spacer { width: 36px; }

  /* Hero */
  .tos-hero {
    position: relative;
    padding: 44px 20px 36px;
    text-align: center; overflow: hidden;
  }
  .tos-hero-glow {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 340px; height: 340px;
    background: radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%);
    pointer-events: none;
  }
  .tos-hero-content {
    position: relative; z-index: 1;
    display: flex; flex-direction: column;
    align-items: center; gap: 12px;
  }
  .tos-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px;
    background: rgba(167, 139, 250, 0.1);
    border: 1px solid rgba(167, 139, 250, 0.25);
    border-radius: 50px;
    font-size: 11px; font-weight: 700;
    color: #c4b5fd; letter-spacing: 0.05em;
  }
  .tos-hero-icon {
    color: #a78bfa;
    filter: drop-shadow(0 0 20px rgba(167, 139, 250, 0.35));
    margin-top: 4px;
  }
  .tos-hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 40px; letter-spacing: 4px;
    color: var(--text); margin: 0;
  }
  .tos-hero-sub {
    font-size: 14px; color: var(--muted);
    max-width: 400px; line-height: 1.65; margin: 0;
  }
  .tos-hero-meta {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: var(--muted);
  }

  /* Quick Nav */
  .tos-quick-nav {
    padding: 0 16px 24px;
    position: sticky; top: 70px; z-index: 90;
    background: linear-gradient(to bottom, var(--dark) 0%, transparent 100%);
  }
  .tos-nav-container {
    max-width: 800px; margin: 0 auto;
    display: flex; gap: 8px;
    overflow-x: auto; padding-bottom: 8px;
    scrollbar-width: none; -ms-overflow-style: none;
  }
  .tos-nav-container::-webkit-scrollbar { display: none; }
  .tos-nav-chip {
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
  .tos-nav-chip:hover {
    background: rgba(167, 139, 250, 0.1);
    border-color: rgba(167, 139, 250, 0.3);
    color: var(--text); transform: translateY(-1px);
  }

  /* Body */
  .tos-body {
    max-width: 800px; margin: 0 auto;
    padding: 0 16px 40px;
    display: flex; flex-direction: column; gap: 20px;
  }

  /* Intro */
  .tos-intro-card {
    display: flex; align-items: flex-start; gap: 14px;
    background: rgba(255, 199, 44, 0.06);
    border: 1px solid rgba(255, 199, 44, 0.15);
    border-radius: 16px; padding: 20px 24px;
  }
  .tos-intro-text {
    font-size: 13px; color: var(--muted);
    line-height: 1.85; margin: 0;
  }
  .tos-intro-text strong { color: var(--text); font-weight: 700; }

  /* Section */
  .tos-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 18px; overflow: hidden;
  }
  .tos-section-header {
    display: flex; align-items: center; gap: 12px;
    padding: 20px 24px;
    background: rgba(255, 248, 231, 0.02);
    border-bottom: 1px solid var(--border);
    border-left: 3px solid;
  }
  .tos-section-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .tos-section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 24px; letter-spacing: 2px;
    color: var(--text); margin: 0;
  }
  .tos-section-content {
    padding: 24px;
    display: flex; flex-direction: column; gap: 20px;
  }
  .tos-item {
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 248, 231, 0.05);
  }
  .tos-item:last-child { padding-bottom: 0; border-bottom: none; }
  .tos-item-title {
    font-size: 14px; font-weight: 800;
    color: var(--text); margin: 0 0 8px 0;
    display: flex; align-items: center; gap: 8px;
  }
  .tos-item-title::before {
    content: '';
    width: 6px; height: 6px;
    background: var(--gold); border-radius: 50%;
    flex-shrink: 0;
  }
  .tos-item-text {
    font-size: 13px; color: var(--muted);
    line-height: 1.75; margin: 0; padding-left: 14px;
  }

  /* Notice Card */
  .tos-notice-card {
    display: flex; align-items: flex-start; gap: 14px;
    background: rgba(255, 199, 44, 0.05);
    border: 1px solid rgba(255, 199, 44, 0.15);
    border-radius: 16px; padding: 22px 24px;
  }
  .tos-notice-icon {
    width: 40px; height: 40px;
    background: rgba(255, 199, 44, 0.1);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .tos-notice-title {
    font-size: 15px; font-weight: 800;
    color: var(--text); margin: 0 0 8px 0;
  }
  .tos-notice-text {
    font-size: 13px; color: var(--muted);
    line-height: 1.75; margin: 0;
  }

  /* Contact */
  .tos-contact-card {
    display: flex; align-items: flex-start; gap: 16px;
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(218, 41, 28, 0.04) 100%);
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 18px; padding: 24px;
  }
  .tos-contact-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 2px;
    color: var(--text); margin: 0 0 8px 0;
  }
  .tos-contact-text {
    font-size: 13px; color: var(--muted);
    margin: 0 0 14px 0; line-height: 1.6;
  }
  .tos-contact-number {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 26px; color: #4ade80;
    text-decoration: none; letter-spacing: 2px;
    transition: all 0.2s;
  }
  .tos-contact-number:hover {
    color: #86efac;
    text-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
  }

  /* Footer */
  .tos-footer-links {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; padding-top: 20px; flex-wrap: wrap;
    font-size: 12px; color: var(--muted);
  }
  .tos-footer-link {
    color: var(--gold); text-decoration: none;
    font-weight: 600; transition: color 0.2s;
  }
  .tos-footer-link:hover { color: var(--text); }
  .tos-footer-dot { opacity: 0.5; }
  .tos-footer-copy { opacity: 0.7; }

  @media (max-width: 600px) {
    .tos-hero-title { font-size: 30px; }
    .tos-intro-card { flex-direction: column; }
    .tos-section-content { padding: 18px; }
    .tos-notice-card { flex-direction: column; }
    .tos-contact-card { flex-direction: column; }
  }
`;
