import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Flame, HelpCircle, MessageCircle, Phone,
  ChevronDown, ChevronUp, Zap, RefreshCcw, MapPin,
  Ban, AlertCircle, Clock, CheckCircle, XCircle,
  Search, Star, LifeBuoy, Send, CreditCard, Package
} from "lucide-react";
import Footer from "../components/Footer";

const QUICK_ACTIONS = [
  {
    icon: Package,
    label: "Track My Order",
    desc: "Live order status",
    color: "#60a5fa",
    href: "/orders"
  },
  {
    icon: Ban,
    label: "Cancel Order",
    desc: "Before preparation",
    color: "#f87171",
    href: "/orders"
  },
  {
    icon: RefreshCcw,
    label: "Request Refund",
    desc: "Within 24 hrs",
    color: "#a78bfa",
    href: null,
    action: "refund"
  },
  {
    icon: AlertCircle,
    label: "Report Issue",
    desc: "Wrong or missing item",
    color: "#4ade80",
    href: null,
    action: "report"
  }
];

const FAQS = [
  {
    category: "Orders",
    color: "#60a5fa",
    icon: Package,
    questions: [
      {
        q: "How do I cancel my order?",
        a: "All cancellations must be done through KataBot or via the order status page in the app. Orders can only be cancelled before they enter the 'Preparing' stage. Each user gets 5 free cancellation trials per calendar month — after that, a R20 fee applies."
      },
      {
        q: "Can I change my order after placing it?",
        a: "Once an order is placed, modifications depend on the preparation stage. Contact KataBot immediately after ordering. If the kitchen hasn't started yet, we'll do our best to accommodate the change — but this is not guaranteed."
      },
      {
        q: "What happens if an item in my order is unavailable?",
        a: "If an item becomes unavailable after your order is accepted, we will contact you promptly. You may choose a replacement or receive a full refund for the unavailable item."
      },
      {
        q: "How do I know when my order is ready?",
        a: "You'll receive real-time status updates via KataBot on WhatsApp, or through push notifications in the app. Updates are sent when your order is confirmed, being prepared, out for delivery, and delivered."
      }
    ]
  },
  {
    category: "Delivery",
    color: "#FFC72C",
    icon: MapPin,
    questions: [
      {
        q: "How long does delivery take?",
        a: "Delivery times vary based on your location and how busy we are. Estimated delivery time is displayed at checkout. During peak hours (lunch and dinner), expect slightly longer wait times. We'll always keep you updated."
      },
      {
        q: "What if my order arrives late?",
        a: "We understand delays are frustrating. If your order is significantly late beyond the estimated time and no communication was sent, please contact KataBot or call us on 065 393 5339 to resolve the situation."
      },
      {
        q: "What if the delivery driver can't find my address?",
        a: "Our drivers will call you if they have trouble locating you. Ensure your contact number is correct on your account. If an order fails due to an incorrect address or unavailability, the standard order cost remains payable."
      },
      {
        q: "Do you deliver to my area?",
        a: "Delivery zones are shown at checkout based on your address. If your area isn't currently served, you'll see a notification. We're continuously expanding our delivery coverage — check back soon!"
      }
    ]
  },
  {
    category: "Refunds & Cancellations",
    color: "#f87171",
    icon: RefreshCcw,
    questions: [
      {
        q: "When am I eligible for a refund?",
        a: "Refunds are considered for incorrect orders, missing items, unacceptable food quality, or orders not delivered within the promised window. Requests must be submitted within 24 hours of delivery via KataBot or our support line."
      },
      {
        q: "How long does a refund take?",
        a: "Approved refunds are processed to your original payment method within 7–10 business days. Cash order refunds are issued as store credit or EFT transfer. You'll receive a confirmation once the refund is initiated."
      },
      {
        q: "I've used all 5 free cancellations. What now?",
        a: "Once your monthly free cancellation trials are exhausted, a R20.00 fee applies to each additional cancellation. This fee is automatically charged. Free trials reset on the 1st of each calendar month and do not roll over."
      },
      {
        q: "Can I dispute a cancellation charge?",
        a: "If you believe a cancellation charge was applied in error, contact our support team within 48 hours. Provide your order ID and a brief explanation. Disputes are reviewed on a case-by-case basis."
      }
    ]
  },
  {
    category: "Account & Payment",
    color: "#4ade80",
    icon: CreditCard,
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept major debit and credit cards, EFT, and selected mobile payment solutions. Cash on delivery is available in certain zones. All card transactions are secured by our PCI-DSS compliant payment processor."
      },
      {
        q: "How do I update my delivery address?",
        a: "Go to your account settings in the app and select 'Addresses'. You can add, edit, or remove saved delivery addresses there. Ensure your primary address is always up to date to avoid delivery issues."
      },
      {
        q: "My account was suspended — what do I do?",
        a: "Accounts may be suspended for violations of our Terms & Conditions, including abuse of cancellation policies or suspected fraudulent activity. Contact our support team on 065 393 5339 to review and appeal a suspension."
      }
    ]
  }
];

const CONTACT_OPTIONS = [
  {
    icon: MessageCircle,
    title: "KataBot (WhatsApp)",
    desc: "Fastest response · Available 24/7",
    action: "Chat Now",
    color: "#25D366",
    href: "https://wa.me/27653935339"
  },
  {
    icon: Phone,
    title: "Call Us Directly",
    desc: "Mon–Sat · 8:00 AM – 9:00 PM",
    action: "065 393 5339",
    color: "#60a5fa",
    href: "tel:0653935339"
  }
];

export default function SupportPage() {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFAQ = (key) => {
    setOpenFAQ(openFAQ === key ? null : key);
  };

  const allFAQs = FAQS.flatMap((cat, ci) =>
    cat.questions.map((q, qi) => ({ ...q, catIdx: ci, qIdx: qi, key: `${ci}-${qi}` }))
  );

  const filteredFAQs = searchQuery.trim().length > 1
    ? allFAQs.filter(
        (f) =>
          f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const activeCat = FAQS[activeCategory];

  return (
    <div className="sup-root">
      <style>{styles}</style>

      {/* ── Header ── */}
      <header className="sup-header">
        <div className="sup-header-inner">
          <button className="sup-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="sup-brand">
            <div className="sup-brand-badge">
              <Flame className="w-4 h-4" style={{ color: "#0e0700" }} />
            </div>
            <div>
              <span className="sup-brand-name">KOTABITES</span>
              <p className="sup-brand-sub">Support Center</p>
            </div>
          </div>
          <div className="sup-header-spacer" />
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="sup-hero">
        <div className="sup-hero-glow" />
        <div className="sup-hero-content">
          <div className="sup-hero-badge">
            <CheckCircle className="w-4 h-4" />
            <span>We're here to help</span>
          </div>
          <LifeBuoy className="w-12 h-12 sup-hero-icon" />
          <h1 className="sup-hero-title">Support Center</h1>
          <p className="sup-hero-sub">
            Find answers fast, report issues, or get in touch with our team
          </p>

          {/* Search */}
          <div className="sup-search-wrapper">
            <Search className="sup-search-icon w-4 h-4" />
            <input
              className="sup-search"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="sup-search-clear" onClick={() => setSearchQuery("")}>
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="sup-body">

        {/* ── Quick Actions ── */}
        {!searchQuery && (
          <>
            <div className="sup-section-label">
              <Zap className="w-4 h-4" style={{ color: "#FFC72C" }} />
              <span>Quick Actions</span>
            </div>
            <div className="sup-quick-grid">
              {QUICK_ACTIONS.map((action, i) => (
                <a
                  key={i}
                  className="sup-quick-card"
                  href={action.href || "#"}
                  onClick={action.href ? undefined : (e) => e.preventDefault()}
                  style={{ "--action-color": action.color }}
                >
                  <div className="sup-quick-icon" style={{ color: action.color, background: `${action.color}18` }}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="sup-quick-label">{action.label}</span>
                  <span className="sup-quick-desc">{action.desc}</span>
                </a>
              ))}
            </div>
          </>
        )}

        {/* ── Search Results ── */}
        {filteredFAQs && (
          <div className="sup-section">
            <div className="sup-section-label">
              <Search className="w-4 h-4" style={{ color: "#FFC72C" }} />
              <span>{filteredFAQs.length} result{filteredFAQs.length !== 1 ? "s" : ""} for "{searchQuery}"</span>
            </div>
            {filteredFAQs.length === 0 ? (
              <div className="sup-no-results">
                <HelpCircle className="w-10 h-10" style={{ color: "var(--muted)" }} />
                <p>No articles found. Try a different search or contact us directly.</p>
              </div>
            ) : (
              <div className="sup-faq-list">
                {filteredFAQs.map((faq) => {
                  const cat = FAQS[faq.catIdx];
                  const isOpen = openFAQ === faq.key;
                  return (
                    <div key={faq.key} className={`sup-faq-item ${isOpen ? "open" : ""}`}>
                      <button
                        className="sup-faq-q"
                        onClick={() => toggleFAQ(faq.key)}
                      >
                        <div className="sup-faq-q-left">
                          <span className="sup-faq-cat-badge" style={{ color: cat.color, background: `${cat.color}15` }}>
                            {cat.category}
                          </span>
                          <span className="sup-faq-q-text">{faq.q}</span>
                        </div>
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 sup-faq-chevron" />
                          : <ChevronDown className="w-4 h-4 sup-faq-chevron" />
                        }
                      </button>
                      {isOpen && (
                        <div className="sup-faq-a">
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FAQ Accordion ── */}
        {!filteredFAQs && (
          <>
            <div className="sup-section-label">
              <HelpCircle className="w-4 h-4" style={{ color: "#FFC72C" }} />
              <span>Frequently Asked Questions</span>
            </div>

            {/* Category Tabs */}
            <div className="sup-cat-tabs">
              {FAQS.map((cat, i) => (
                <button
                  key={i}
                  className={`sup-cat-tab ${activeCategory === i ? "active" : ""}`}
                  style={{ "--tab-color": cat.color }}
                  onClick={() => {
                    setActiveCategory(i);
                    setOpenFAQ(null);
                  }}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  <span>{cat.category}</span>
                </button>
              ))}
            </div>

            {/* Questions */}
            <div className="sup-faq-list">
              {activeCat.questions.map((faq, qi) => {
                const key = `${activeCategory}-${qi}`;
                const isOpen = openFAQ === key;
                return (
                  <div key={key} className={`sup-faq-item ${isOpen ? "open" : ""}`}>
                    <button
                      className="sup-faq-q"
                      onClick={() => toggleFAQ(key)}
                    >
                      <span className="sup-faq-q-text">{faq.q}</span>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 sup-faq-chevron" />
                        : <ChevronDown className="w-4 h-4 sup-faq-chevron" />
                      }
                    </button>
                    {isOpen && (
                      <div className="sup-faq-a">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Contact Options ── */}
        <div className="sup-section-label">
          <MessageCircle className="w-4 h-4" style={{ color: "#FFC72C" }} />
          <span>Get in Touch</span>
        </div>

        <div className="sup-contact-grid">
          {CONTACT_OPTIONS.map((opt, i) => (
            <a
              key={i}
              href={opt.href}
              target={opt.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="sup-contact-card"
              style={{ "--c-color": opt.color }}
            >
              <div className="sup-contact-icon" style={{ color: opt.color, background: `${opt.color}18` }}>
                <opt.icon className="w-6 h-6" />
              </div>
              <div className="sup-contact-info">
                <span className="sup-contact-title">{opt.title}</span>
                <span className="sup-contact-desc">{opt.desc}</span>
              </div>
              <div className="sup-contact-action" style={{ background: opt.color }}>
                <Send className="w-3.5 h-3.5" />
                <span>{opt.action}</span>
              </div>
            </a>
          ))}
        </div>

        {/* ── Hours Card ── */}
        <div className="sup-hours-card">
          <div className="sup-hours-header">
            <Clock className="w-5 h-5" style={{ color: "#FFC72C" }} />
            <h3 className="sup-hours-title">Support Hours</h3>
          </div>
          <div className="sup-hours-grid">
            <div className="sup-hours-row">
              <span className="sup-hours-day">Monday – Friday</span>
              <span className="sup-hours-time">8:00 AM – 9:00 PM</span>
            </div>
            <div className="sup-hours-row">
              <span className="sup-hours-day">Saturday</span>
              <span className="sup-hours-time">9:00 AM – 9:00 PM</span>
            </div>
            <div className="sup-hours-row">
              <span className="sup-hours-day">Sunday & Public Holidays</span>
              <span className="sup-hours-time">10:00 AM – 6:00 PM</span>
            </div>
          </div>
          <div className="sup-hours-note">
            <Star className="w-3.5 h-3.5" style={{ color: "#FFC72C" }} />
            <span>KataBot is available 24/7 for order tracking and cancellations</span>
          </div>
        </div>

        {/* Footer Links */}
        <div className="sup-footer-links">
          <Link to="/privacy" className="sup-footer-link">Privacy Policy</Link>
          <span className="sup-footer-dot">•</span>
          <Link to="/terms" className="sup-footer-link">Terms of Service</Link>
          <span className="sup-footer-dot">•</span>
          <Link to="/info" className="sup-footer-link">Help Center</Link>
          <span className="sup-footer-dot">•</span>
          <span className="sup-footer-copy">© 2026 KotaBites</span>
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

  .sup-root {
    min-height: 100vh;
    background: radial-gradient(ellipse 80% 35% at 50% 0%, rgba(74, 222, 128, 0.1) 0%, transparent 65%), var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    padding-bottom: 60px;
  }

  /* Header */
  .sup-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(14, 7, 0, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .sup-header-inner {
    max-width: 800px; margin: 0 auto;
    padding: 13px 20px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
  }
  .sup-back-btn {
    width: 36px; height: 36px; flex-shrink: 0;
    background: rgba(255, 248, 231, 0.05);
    border: 1px solid var(--border); border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; transition: all 0.2s;
  }
  .sup-back-btn:hover { color: var(--text); border-color: rgba(255, 199, 44, 0.3); }
  .sup-brand { display: flex; align-items: center; gap: 8px; }
  .sup-brand-badge {
    width: 34px; height: 34px; background: var(--gold);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 0 16px rgba(255, 199, 44, 0.25);
  }
  .sup-brand-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 17px; letter-spacing: 3px;
    color: var(--text); line-height: 1; display: block;
  }
  .sup-brand-sub {
    font-size: 10px; font-weight: 800;
    color: var(--muted); letter-spacing: 0.1em; margin-top: 1px;
  }
  .sup-header-spacer { width: 36px; }

  /* Hero */
  .sup-hero {
    position: relative;
    padding: 40px 20px 28px;
    text-align: center; overflow: hidden;
  }
  .sup-hero-glow {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(74, 222, 128, 0.09) 0%, transparent 70%);
    pointer-events: none;
  }
  .sup-hero-content {
    position: relative; z-index: 1;
    display: flex; flex-direction: column;
    align-items: center; gap: 12px;
  }
  .sup-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px;
    background: rgba(74, 222, 128, 0.1);
    border: 1px solid rgba(74, 222, 128, 0.25);
    border-radius: 50px;
    font-size: 11px; font-weight: 700;
    color: #86efac; letter-spacing: 0.05em;
  }
  .sup-hero-icon {
    color: #4ade80;
    filter: drop-shadow(0 0 20px rgba(74, 222, 128, 0.35));
    margin-top: 4px;
  }
  .sup-hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 40px; letter-spacing: 4px;
    color: var(--text); margin: 0;
  }
  .sup-hero-sub {
    font-size: 14px; color: var(--muted);
    max-width: 380px; line-height: 1.65; margin: 0;
  }

  /* Search */
  .sup-search-wrapper {
    position: relative;
    width: 100%; max-width: 460px;
    margin-top: 4px;
  }
  .sup-search-icon {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%); color: var(--muted);
    pointer-events: none;
  }
  .sup-search {
    width: 100%;
    padding: 12px 42px 12px 40px;
    background: rgba(255, 248, 231, 0.05);
    border: 1px solid var(--border);
    border-radius: 50px;
    color: var(--text);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    outline: none; transition: all 0.2s;
    box-sizing: border-box;
  }
  .sup-search::placeholder { color: var(--muted); }
  .sup-search:focus {
    border-color: rgba(74, 222, 128, 0.4);
    background: rgba(74, 222, 128, 0.04);
    box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.08);
  }
  .sup-search-clear {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    color: var(--muted); cursor: pointer;
    display: flex; align-items: center;
    transition: color 0.2s; padding: 4px;
  }
  .sup-search-clear:hover { color: var(--text); }

  /* Body */
  .sup-body {
    max-width: 800px; margin: 0 auto;
    padding: 24px 16px 40px;
    display: flex; flex-direction: column; gap: 14px;
  }

  /* Section Label */
  .sup-section-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 800;
    color: var(--muted); text-transform: uppercase;
    letter-spacing: 0.12em; margin-top: 8px;
  }

  /* Quick Actions */
  .sup-quick-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .sup-quick-card {
    display: flex; flex-direction: column;
    align-items: flex-start; gap: 6px;
    padding: 16px 18px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    text-decoration: none;
    transition: all 0.22s;
    cursor: pointer;
  }
  .sup-quick-card:hover {
    border-color: var(--action-color);
    background: color-mix(in srgb, var(--action-color) 6%, var(--card));
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }
  .sup-quick-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 2px;
  }
  .sup-quick-label {
    font-size: 13px; font-weight: 800;
    color: var(--text); line-height: 1.2;
  }
  .sup-quick-desc {
    font-size: 11px; color: var(--muted); font-weight: 500;
  }

  /* No Results */
  .sup-no-results {
    display: flex; flex-direction: column;
    align-items: center; gap: 12px;
    padding: 40px 20px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px; text-align: center;
    color: var(--muted); font-size: 14px;
  }

  /* Category Tabs */
  .sup-cat-tabs {
    display: flex; gap: 8px;
    overflow-x: auto; padding-bottom: 4px;
    scrollbar-width: none; -ms-overflow-style: none;
  }
  .sup-cat-tabs::-webkit-scrollbar { display: none; }
  .sup-cat-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    background: rgba(255, 248, 231, 0.05);
    border: 1px solid var(--border);
    border-radius: 50px;
    color: var(--muted);
    font-size: 12px; font-weight: 700;
    white-space: nowrap; cursor: pointer;
    transition: all 0.2s; flex-shrink: 0;
  }
  .sup-cat-tab.active {
    background: color-mix(in srgb, var(--tab-color) 15%, transparent);
    border-color: var(--tab-color);
    color: var(--text);
  }
  .sup-cat-tab:not(.active):hover {
    background: rgba(255, 199, 44, 0.08);
    border-color: rgba(255, 199, 44, 0.25);
    color: var(--text);
  }

  /* FAQ List */
  .sup-faq-list {
    display: flex; flex-direction: column; gap: 8px;
  }
  .sup-faq-item {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden;
    transition: border-color 0.2s;
  }
  .sup-faq-item.open {
    border-color: rgba(255, 199, 44, 0.25);
  }
  .sup-faq-q {
    width: 100%;
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
    padding: 16px 20px;
    background: none; border: none;
    text-align: left; cursor: pointer;
    transition: background 0.2s;
  }
  .sup-faq-q:hover {
    background: rgba(255, 248, 231, 0.03);
  }
  .sup-faq-q-left {
    display: flex; flex-direction: column; gap: 4px;
  }
  .sup-faq-cat-badge {
    display: inline-block;
    font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.08em;
    padding: 2px 8px; border-radius: 50px;
    width: fit-content;
  }
  .sup-faq-q-text {
    font-size: 13px; font-weight: 700;
    color: var(--text); line-height: 1.4;
  }
  .sup-faq-chevron {
    color: var(--muted); flex-shrink: 0; transition: color 0.2s;
  }
  .sup-faq-item.open .sup-faq-chevron {
    color: var(--gold);
  }
  .sup-faq-a {
    padding: 0 20px 18px;
    border-top: 1px solid rgba(255, 248, 231, 0.05);
    animation: faqOpen 0.18s ease;
  }
  .sup-faq-a p {
    font-size: 13px; color: var(--muted);
    line-height: 1.8; margin: 12px 0 0 0;
  }
  @keyframes faqOpen {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Contact Grid */
  .sup-contact-grid {
    display: flex; flex-direction: column; gap: 10px;
  }
  .sup-contact-card {
    display: flex; align-items: center; gap: 14px;
    padding: 18px 20px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    text-decoration: none;
    transition: all 0.22s;
  }
  .sup-contact-card:hover {
    border-color: var(--c-color);
    background: color-mix(in srgb, var(--c-color) 5%, var(--card));
    transform: translateX(3px);
  }
  .sup-contact-icon {
    width: 46px; height: 46px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .sup-contact-info {
    display: flex; flex-direction: column; gap: 3px; flex: 1;
  }
  .sup-contact-title {
    font-size: 14px; font-weight: 800; color: var(--text);
  }
  .sup-contact-desc {
    font-size: 12px; color: var(--muted);
  }
  .sup-contact-action {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    border-radius: 50px;
    font-size: 12px; font-weight: 800;
    color: var(--dark); white-space: nowrap;
    flex-shrink: 0;
  }

  /* Hours Card */
  .sup-hours-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 18px; padding: 22px 24px;
    display: flex; flex-direction: column; gap: 16px;
    position: relative; overflow: hidden;
  }
  .sup-hours-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,199,44,0.4), transparent);
  }
  .sup-hours-header {
    display: flex; align-items: center; gap: 10px;
  }
  .sup-hours-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 2px;
    color: var(--gold); margin: 0;
  }
  .sup-hours-grid {
    display: flex; flex-direction: column; gap: 10px;
  }
  .sup-hours-row {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgba(255, 248, 231, 0.03);
    border: 1px solid rgba(255, 248, 231, 0.05);
    border-radius: 10px;
  }
  .sup-hours-day {
    font-size: 13px; font-weight: 600; color: var(--text);
  }
  .sup-hours-time {
    font-size: 13px; font-weight: 700; color: var(--gold);
  }
  .sup-hours-note {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--muted);
    padding: 10px 14px;
    background: rgba(255, 199, 44, 0.04);
    border: 1px solid rgba(255, 199, 44, 0.1);
    border-radius: 10px;
  }

  /* Footer */
  .sup-footer-links {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; padding-top: 20px; flex-wrap: wrap;
    font-size: 12px; color: var(--muted);
  }
  .sup-footer-link {
    color: var(--gold); text-decoration: none;
    font-weight: 600; transition: color 0.2s;
  }
  .sup-footer-link:hover { color: var(--text); }
  .sup-footer-dot { opacity: 0.5; }
  .sup-footer-copy { opacity: 0.7; }

  @media (max-width: 600px) {
    .sup-hero-title { font-size: 30px; }
    .sup-quick-grid { grid-template-columns: repeat(2, 1fr); }
    .sup-contact-action { display: none; }
    .sup-hours-row { flex-direction: column; align-items: flex-start; gap: 2px; }
  }
`;
