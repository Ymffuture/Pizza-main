// src/pages/DeliverSignup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Flame, Bike, ChevronRight, ChevronDown,
  Star, Shield, Clock, Zap, MapPin,
  Phone, Mail, User, Car, CheckCircle2,
  ArrowRight, Loader, DollarSign,
  TrendingUp, Award, Users
} from "lucide-react";

const BENEFITS = [
  {
    icon: DollarSign,
    title: "Earn Big",
    sub: "Up to R800/day during peak hours",
    color: "#4ade80",
  },
  {
    icon: Clock,
    title: "Work Anytime",
    sub: "You set your own schedule, 100%",
    color: "#FFC72C",
  },
  {
    icon: Zap,
    title: "Instant Payouts",
    sub: "Cash out earnings same day",
    color: "#60a5fa",
  },
  {
    icon: Shield,
    title: "Full Support",
    sub: "24/7 driver support & insurance",
    color: "#a78bfa",
  },
];

const STEPS = [
  { num: "01", title: "Sign Up",       sub: "Complete your driver profile online" },
  { num: "02", title: "Get Verified",  sub: "We verify your ID & vehicle in 24 hrs" },
  { num: "03", title: "Start Earning", sub: "Accept orders and earn from day one"  },
];

const FAQS = [
  {
    q: "What vehicle do I need?",
    a: "Any bicycle, motorbike, or car works. As long as you can deliver food safely and on time.",
  },
  {
    q: "How do I get paid?",
    a: "Earnings are calculated per delivery + tips. You can cash out daily via EFT or Instant Pay.",
  },
  {
    q: "What areas do you operate in?",
    a: "Currently in the Johannesburg area within a 1.3km radius of our kitchen. Expanding soon.",
  },
  {
    q: "Is there a minimum hours requirement?",
    a: "None. Work as little or as much as you want. No commitments, no penalties.",
  },
];

export default function DeliverSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", vehicle: "", area: "",
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.phone.trim())     e.phone     = "Phone number is required";
    else if (!/^0\d{9}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Must be 10 digits starting with 0";
    if (!form.email.trim())     e.email     = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.vehicle)          e.vehicle   = "Select your vehicle type";
    return e;
  };

  const handleChange = (field) => (ev) => {
    setForm((p) => ({ ...p, [field]: ev.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    setDone(true);
  };

  return (
    <div className="ds-root">
      <style>{styles}</style>

      {/* ── Header ── */}
      <header className="ds-header">
        <div className="ds-header-inner">
          <Link to="/" className="ds-logo-wrap">
            <div className="ds-logo"><Flame className="w-5 h-5" style={{ color: "#0e0700" }} /></div>
            <span className="ds-brand">KOTABITES</span>
          </Link>
          <div className="ds-header-right">
            <Link to="/menu" className="ds-header-link">Browse Menu</Link>
            <Link to="/login" className="ds-header-btn">Sign In</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="ds-hero">
        <div className="ds-hero-glow ds-hero-glow-1" />
        <div className="ds-hero-glow ds-hero-glow-2" />

        <div className="ds-hero-inner">
          {/* Left: Copy */}
          <div className="ds-hero-copy">
            <div className="ds-hero-badge">
              <Bike className="w-4 h-4" />
              <span>Now Hiring Drivers</span>
            </div>

            <h1 className="ds-hero-title">
              Deliver.<br />
              <span className="ds-hero-title-accent">Earn More.</span><br />
              Live Free.
            </h1>

            <p className="ds-hero-sub">
              Join KotaBites drivers and earn on your own terms. 
              No boss, no fixed hours — just you, your wheels, and the city.
            </p>

            <div className="ds-hero-stats">
              <div className="ds-stat">
                <span className="ds-stat-num">R800+</span>
                <span className="ds-stat-label">Daily potential</span>
              </div>
              <div className="ds-stat-divider" />
              <div className="ds-stat">
                <span className="ds-stat-num">24hr</span>
                <span className="ds-stat-label">Approval time</span>
              </div>
              <div className="ds-stat-divider" />
              <div className="ds-stat">
                <span className="ds-stat-num">100%</span>
                <span className="ds-stat-label">Flexible hours</span>
              </div>
            </div>

            <a href="#signup-form" className="ds-hero-cta">
              Start Earning Today
              <ArrowRight className="w-5 h-5" />
            </a>

            {/* Avatars strip */}
            <div className="ds-drivers-row">
              <div className="ds-driver-avatars">
                {["🧑🏾‍🦱","👩🏽","🧑🏿","👨🏾‍🦲","👩🏼"].map((em, i) => (
                  <div key={i} className="ds-driver-avatar" style={{ zIndex: 5 - i }}>
                    {em}
                  </div>
                ))}
              </div>
              <p className="ds-drivers-text">
                <strong>200+ active drivers</strong> already earning
              </p>
            </div>
          </div>

          {/* Right: Signup form */}
          <div className="ds-form-card" id="signup-form">
            {done ? (
              <div className="ds-done">
                <div className="ds-done-icon">
                  <CheckCircle2 className="w-10 h-10" style={{ color: "#4ade80" }} />
                </div>
                <h3 className="ds-done-title">Application Received!</h3>
                <p className="ds-done-sub">
                  We'll review your details and reach out within <strong>24 hours</strong> to get you started.
                </p>
                <Link to="/menu" className="ds-done-btn">Back to Menu</Link>
              </div>
            ) : (
              <>
                <div className="ds-form-header">
                  <h2 className="ds-form-title">Become a Driver</h2>
                  <p className="ds-form-sub">Takes less than 2 minutes</p>
                </div>

                <form onSubmit={handleSubmit} className="ds-form">
                  {/* Full Name */}
                  <div className="ds-field">
                    <label className="ds-label">Full Name</label>
                    <div className={`ds-input-wrap${errors.full_name ? " ds-input-err" : ""}`}>
                      <User className="ds-icon" />
                      <input
                        className="ds-input" placeholder="Thabo Nkosi"
                        value={form.full_name} onChange={handleChange("full_name")}
                      />
                    </div>
                    {errors.full_name && <p className="ds-err">{errors.full_name}</p>}
                  </div>

                  {/* Phone */}
                  <div className="ds-field">
                    <label className="ds-label">Phone Number</label>
                    <div className={`ds-input-wrap${errors.phone ? " ds-input-err" : ""}`}>
                      <Phone className="ds-icon" />
                      <input
                        className="ds-input" placeholder="082 123 4567"
                        value={form.phone} onChange={handleChange("phone")}
                      />
                    </div>
                    {errors.phone && <p className="ds-err">{errors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div className="ds-field">
                    <label className="ds-label">Email Address</label>
                    <div className={`ds-input-wrap${errors.email ? " ds-input-err" : ""}`}>
                      <Mail className="ds-icon" />
                      <input
                        className="ds-input" placeholder="you@example.com"
                        value={form.email} onChange={handleChange("email")}
                      />
                    </div>
                    {errors.email && <p className="ds-err">{errors.email}</p>}
                  </div>

                  {/* Vehicle */}
                  <div className="ds-field">
                    <label className="ds-label">Vehicle Type</label>
                    <div className={`ds-input-wrap${errors.vehicle ? " ds-input-err" : ""}`}>
                      <Car className="ds-icon" />
                      <select
                        className="ds-input ds-select"
                        value={form.vehicle} onChange={handleChange("vehicle")}
                      >
                        <option value="">Select your vehicle</option>
                        <option value="bicycle">🚲 Bicycle</option>
                        <option value="motorbike">🏍️ Motorbike</option>
                        <option value="car">🚗 Car</option>
                        <option value="bakkie">🛻 Bakkie</option>
                      </select>
                    </div>
                    {errors.vehicle && <p className="ds-err">{errors.vehicle}</p>}
                  </div>

                  {/* Area */}
                  <div className="ds-field">
                    <label className="ds-label">Your Area <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
                    <div className="ds-input-wrap">
                      <MapPin className="ds-icon" />
                      <input
                        className="ds-input" placeholder="e.g. Soweto, Johannesburg"
                        value={form.area} onChange={handleChange("area")}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="ds-submit-btn">
                    {loading
                      ? <><Loader className="w-5 h-5 ds-spin" /> Submitting…</>
                      : <><Bike className="w-5 h-5" /> Apply to Drive</>}
                  </button>

                  <p className="ds-form-note">
                    By applying you agree to our <Link to="/info" className="ds-form-link">Driver Terms</Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="ds-benefits-section">
        <div className="ds-section-inner">
          <h2 className="ds-section-title">Why Drive with KotaBites?</h2>
          <p className="ds-section-sub">Everything you need to earn well and work freely</p>
          <div className="ds-benefits-grid">
            {BENEFITS.map((b, i) => (
              <div key={i} className="ds-benefit-card" style={{ "--accent": b.color, animationDelay: `${i * 100}ms` }}>
                <div className="ds-benefit-icon" style={{ background: `${b.color}18`, border: `1px solid ${b.color}30` }}>
                  <b.icon className="w-6 h-6" style={{ color: b.color }} />
                </div>
                <h3 className="ds-benefit-title">{b.title}</h3>
                <p className="ds-benefit-sub">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="ds-steps-section">
        <div className="ds-section-inner">
          <h2 className="ds-section-title">How It Works</h2>
          <p className="ds-section-sub">Three steps to your first delivery</p>
          <div className="ds-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="ds-step-card">
                <div className="ds-step-num">{s.num}</div>
                <div className="ds-step-connector" />
                <h3 className="ds-step-title">{s.title}</h3>
                <p className="ds-step-sub">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Earnings Calculator ── */}
      <section className="ds-calc-section">
        <div className="ds-section-inner">
          <div className="ds-calc-card">
            <div className="ds-calc-left">
              <div className="ds-calc-badge">
                <TrendingUp className="w-4 h-4" />
                <span>Earnings Estimate</span>
              </div>
              <h2 className="ds-calc-title">What Can You Earn?</h2>
              <p className="ds-calc-sub">
                Average KotaBites driver earns <strong style={{ color: "#4ade80" }}>R350–R800/day</strong> doing 8–15 deliveries.
                Peak hours (lunch & dinner) pay up to <strong style={{ color: "#FFC72C" }}>2× more</strong>.
              </p>
              <div className="ds-calc-rows">
                <div className="ds-calc-row">
                  <span className="ds-calc-row-label">🌅 Morning shift (4 hrs)</span>
                  <span className="ds-calc-row-val">~R180</span>
                </div>
                <div className="ds-calc-row">
                  <span className="ds-calc-row-label">☀️ Full day (8 hrs)</span>
                  <span className="ds-calc-row-val">~R420</span>
                </div>
                <div className="ds-calc-row ds-calc-row-peak">
                  <span className="ds-calc-row-label">🔥 Peak day (10 hrs)</span>
                  <span className="ds-calc-row-val" style={{ color: "#FFC72C" }}>~R800+</span>
                </div>
              </div>
            </div>
            <div className="ds-calc-right">
              <div className="ds-earnings-visual">
                {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="ds-bar-wrap">
                    <div
                      className="ds-bar"
                      style={{
                        height: `${h}%`,
                        background: i === 5 ? "#FFC72C" : "rgba(255,199,44,0.3)",
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                    <span className="ds-bar-label">{["M","T","W","T","F","S","S"][i]}</span>
                  </div>
                ))}
              </div>
              <p className="ds-chart-label">Weekly earnings (sample driver)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="ds-faq-section">
        <div className="ds-section-inner">
          <h2 className="ds-section-title">Common Questions</h2>
          <div className="ds-faq-list">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`ds-faq-item${openFaq === i ? " ds-faq-open" : ""}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="ds-faq-q">
                  <span>{faq.q}</span>
                  <ChevronDown className={`ds-faq-chevron${openFaq === i ? " ds-faq-chevron-open" : ""}`} />
                </div>
                {openFaq === i && <p className="ds-faq-a">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="ds-bottom-cta">
        <div className="ds-section-inner ds-bottom-cta-inner">
          <div className="ds-bottom-glow" />
          <Award className="ds-bottom-icon" />
          <h2 className="ds-bottom-title">Ready to Start Earning?</h2>
          <p className="ds-bottom-sub">Join 200+ drivers already making money with KotaBites</p>
          <a href="#signup-form" className="ds-hero-cta" style={{ marginTop: 0 }}>
            Apply Now — It's Free
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* ── Footer strip ── */}
      <div className="ds-footer-strip">
        <span>© 2026 KotaBites</span>
        <div className="ds-footer-links">
          <Link to="/info" className="ds-footer-link">Policies</Link>
          <Link to="/menu" className="ds-footer-link">Menu</Link>
          <Link to="/login" className="ds-footer-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --red:    #DA291C;
    --red2:   #b91c1c;
    --gold:   #FFC72C;
    --dark:   #0e0700;
    --card:   #1a0e00;
    --card2:  #140900;
    --border: rgba(255,199,44,0.1);
    --text:   #fff8e7;
    --muted:  rgba(255,248,231,0.42);
  }

  /* ── Root ── */
  .ds-root {
    min-height: 100vh;
    background: var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    overflow-x: hidden;
  }

  /* ── Header ── */
  .ds-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(14,7,0,0.96);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .ds-header-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .ds-logo-wrap {
    display: flex; align-items: center; gap: 10px; text-decoration: none;
  }
  .ds-logo {
    width: 36px; height: 36px; background: var(--gold); border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 18px rgba(255,199,44,0.3);
  }
  .ds-brand {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px; letter-spacing: 3px; color: var(--text);
  }
  .ds-header-right { display: flex; align-items: center; gap: 12px; }
  .ds-header-link {
    font-size: 13px; font-weight: 700; color: var(--muted);
    text-decoration: none; transition: color 0.2s;
  }
  .ds-header-link:hover { color: var(--text); }
  .ds-header-btn {
    padding: 8px 18px; border-radius: 50px;
    background: rgba(255,199,44,0.1); border: 1px solid rgba(255,199,44,0.25);
    color: var(--gold); font-size: 13px; font-weight: 800;
    text-decoration: none; transition: all 0.2s;
  }
  .ds-header-btn:hover { background: rgba(255,199,44,0.18); }

  /* ── Hero ── */
  .ds-hero {
    position: relative; overflow: hidden;
    padding: 80px 24px 100px;
    background: radial-gradient(ellipse 100% 60% at 50% 0%,rgba(218,41,28,0.15) 0%,transparent 65%);
  }
  .ds-hero-glow {
    position: absolute; border-radius: 50%;
    pointer-events: none; filter: blur(80px);
  }
  .ds-hero-glow-1 {
    width: 600px; height: 600px; top: -200px; left: -100px;
    background: radial-gradient(circle, rgba(218,41,28,0.12) 0%, transparent 70%);
  }
  .ds-hero-glow-2 {
    width: 500px; height: 500px; bottom: -150px; right: -100px;
    background: radial-gradient(circle, rgba(255,199,44,0.08) 0%, transparent 70%);
  }
  .ds-hero-inner {
    position: relative; z-index: 1;
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 440px;
    gap: 60px; align-items: center;
  }
  .ds-hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 50px;
    background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.2);
    font-size: 11px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: #4ade80;
    margin-bottom: 24px;
    animation: dsFadeUp 0.6s ease both;
  }
  .ds-hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(56px, 7vw, 88px);
    letter-spacing: 3px; color: var(--text);
    line-height: 1; margin: 0 0 20px 0;
    animation: dsFadeUp 0.6s ease 0.1s both;
  }
  .ds-hero-title-accent { color: var(--gold); }
  .ds-hero-sub {
    font-size: 16px; color: var(--muted); line-height: 1.7;
    max-width: 480px; margin-bottom: 36px;
    animation: dsFadeUp 0.6s ease 0.2s both;
  }
  .ds-hero-stats {
    display: flex; align-items: center; gap: 24px;
    margin-bottom: 36px;
    animation: dsFadeUp 0.6s ease 0.3s both;
  }
  .ds-stat { display: flex; flex-direction: column; gap: 2px; }
  .ds-stat-num {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px; letter-spacing: 1px; color: var(--text); line-height: 1;
  }
  .ds-stat-label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
  .ds-stat-divider { width: 1px; height: 40px; background: var(--border); }

  .ds-hero-cta {
    display: inline-flex; align-items: center; gap: 10px;
    background: var(--red); color: white;
    padding: 16px 32px; border-radius: 50px;
    font-weight: 900; font-size: 15px; text-decoration: none;
    box-shadow: 0 8px 28px rgba(218,41,28,0.45), 0 0 0 2px rgba(255,199,44,0.15);
    transition: all 0.22s; margin-top: 4px;
    animation: dsFadeUp 0.6s ease 0.35s both;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .ds-hero-cta:hover { background: var(--red2); transform: scale(1.03); }

  .ds-drivers-row {
    display: flex; align-items: center; gap: 14px;
    margin-top: 28px;
    animation: dsFadeUp 0.6s ease 0.45s both;
  }
  .ds-driver-avatars { display: flex; }
  .ds-driver-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,199,44,0.12);
    border: 2px solid rgba(255,199,44,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; margin-left: -8px;
  }
  .ds-driver-avatar:first-child { margin-left: 0; }
  .ds-drivers-text { font-size: 13px; color: var(--muted); font-weight: 600; }
  .ds-drivers-text strong { color: var(--text); }

  @keyframes dsFadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: none; }
  }

  /* ── Form Card ── */
  .ds-form-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 32px 28px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,199,44,0.06);
    animation: dsFadeUp 0.6s ease 0.2s both;
  }
  .ds-form-header { margin-bottom: 24px; }
  .ds-form-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px; letter-spacing: 2px; color: var(--text); line-height: 1;
  }
  .ds-form-sub { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .ds-form { display: flex; flex-direction: column; gap: 14px; }
  .ds-field { display: flex; flex-direction: column; gap: 6px; }
  .ds-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
  }
  .ds-input-wrap {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,248,231,0.04);
    border: 1.5px solid var(--border); border-radius: 12px;
    padding: 0 14px; transition: border-color 0.2s;
  }
  .ds-input-wrap:focus-within { border-color: rgba(255,199,44,0.4); }
  .ds-input-err { border-color: rgba(218,41,28,0.5) !important; }
  .ds-icon { width: 15px; height: 15px; color: var(--muted); flex-shrink: 0; }
  .ds-input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text); font-size: 14px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif; padding: 12px 0;
  }
  .ds-input::placeholder { color: var(--muted); }
  .ds-select { cursor: pointer; appearance: none; }
  .ds-select option { background: #1a0e00; color: var(--text); }
  .ds-err { font-size: 11px; font-weight: 700; color: #f87171; }
  .ds-submit-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 15px;
    padding: 15px; border-radius: 14px; margin-top: 4px;
    box-shadow: 0 6px 20px rgba(218,41,28,0.4); transition: all 0.2s;
  }
  .ds-submit-btn:hover:not(:disabled) { background: var(--red2); transform: scale(1.02); }
  .ds-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  @keyframes dsSpin { to { transform: rotate(360deg); } }
  .ds-spin { animation: dsSpin 0.8s linear infinite; }
  .ds-form-note { text-align: center; font-size: 11px; color: var(--muted); }
  .ds-form-link { color: var(--gold); font-weight: 700; text-decoration: none; }

  /* Done state */
  .ds-done {
    display: flex; flex-direction: column; align-items: center;
    gap: 16px; text-align: center; padding: 16px 0;
  }
  .ds-done-icon {
    width: 72px; height: 72px; border-radius: 20px;
    background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.25);
    display: flex; align-items: center; justify-content: center;
  }
  .ds-done-title { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 2px; }
  .ds-done-sub { font-size: 13px; color: var(--muted); line-height: 1.6; max-width: 260px; }
  .ds-done-btn {
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 14px;
    padding: 12px 28px; border-radius: 50px; text-decoration: none;
    margin-top: 4px; transition: all 0.2s;
  }
  .ds-done-btn:hover { background: var(--red2); }

  /* ── Shared section styles ── */
  .ds-section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
  .ds-section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(32px, 4vw, 48px);
    letter-spacing: 3px; color: var(--text);
    text-align: center; margin-bottom: 10px;
  }
  .ds-section-sub {
    text-align: center; font-size: 14px; color: var(--muted);
    margin-bottom: 48px; line-height: 1.6;
  }

  /* ── Benefits ── */
  .ds-benefits-section { padding: 80px 0; background: rgba(255,248,231,0.015); }
  .ds-benefits-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .ds-benefit-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 20px; padding: 28px 22px;
    display: flex; flex-direction: column; gap: 12px;
    transition: all 0.25s;
    animation: dsFadeUp 0.5s ease both;
  }
  .ds-benefit-card:hover {
    border-color: rgba(255,199,44,0.25);
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.4);
  }
  .ds-benefit-icon {
    width: 52px; height: 52px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
  }
  .ds-benefit-title { font-size: 16px; font-weight: 800; color: var(--text); }
  .ds-benefit-sub { font-size: 13px; color: var(--muted); line-height: 1.5; }

  /* ── Steps ── */
  .ds-steps-section { padding: 80px 0; }
  .ds-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .ds-step-card {
    position: relative; background: var(--card);
    border: 1px solid var(--border); border-radius: 20px; padding: 32px 24px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .ds-step-num {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 48px; letter-spacing: 2px; color: rgba(255,199,44,0.15);
    line-height: 1;
  }
  .ds-step-title { font-size: 18px; font-weight: 800; color: var(--text); }
  .ds-step-sub { font-size: 13px; color: var(--muted); line-height: 1.6; }

  /* ── Earnings calc ── */
  .ds-calc-section { padding: 80px 0; background: rgba(255,248,231,0.015); }
  .ds-calc-card {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 48px; align-items: center;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 28px; padding: 48px;
    position: relative; overflow: hidden;
  }
  .ds-calc-card::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }
  .ds-calc-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 6px 14px; border-radius: 50px;
    background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2);
    font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: #4ade80; margin-bottom: 16px;
  }
  .ds-calc-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 36px; letter-spacing: 2px; color: var(--text);
    margin-bottom: 14px;
  }
  .ds-calc-sub { font-size: 14px; color: var(--muted); line-height: 1.7; margin-bottom: 24px; }
  .ds-calc-rows { display: flex; flex-direction: column; gap: 8px; }
  .ds-calc-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-radius: 10px;
    background: rgba(255,248,231,0.03); border: 1px solid var(--border);
    font-size: 13px;
  }
  .ds-calc-row-label { color: var(--muted); font-weight: 600; }
  .ds-calc-row-val   { font-weight: 900; color: var(--text); }
  .ds-calc-row-peak  { background: rgba(255,199,44,0.06); border-color: rgba(255,199,44,0.2); }

  .ds-calc-right { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .ds-earnings-visual {
    display: flex; align-items: flex-end; gap: 8px;
    height: 200px; width: 100%; padding: 0 8px;
  }
  .ds-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; }
  .ds-bar {
    width: 100%; border-radius: 6px 6px 0 0;
    animation: dsBarGrow 0.8s ease both;
    transition: all 0.3s;
  }
  @keyframes dsBarGrow { from { transform: scaleY(0); transform-origin: bottom; } to { transform: scaleY(1); } }
  .ds-bar-label { font-size: 10px; font-weight: 700; color: var(--muted); }
  .ds-chart-label { font-size: 11px; font-weight: 600; color: var(--muted); }

  /* ── FAQ ── */
  .ds-faq-section { padding: 80px 0; }
  .ds-faq-list { display: flex; flex-direction: column; gap: 10px; max-width: 720px; margin: 0 auto; }
  .ds-faq-item {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 14px; padding: 18px 20px; cursor: pointer;
    transition: all 0.22s;
  }
  .ds-faq-item:hover { border-color: rgba(255,199,44,0.25); }
  .ds-faq-open { border-color: rgba(255,199,44,0.3) !important; }
  .ds-faq-q {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    font-size: 14px; font-weight: 700; color: var(--text);
  }
  .ds-faq-chevron {
    width: 18px; height: 18px; color: var(--muted); flex-shrink: 0;
    transition: transform 0.3s;
  }
  .ds-faq-chevron-open { transform: rotate(180deg); color: var(--gold); }
  .ds-faq-a {
    font-size: 13px; color: var(--muted); line-height: 1.65;
    margin-top: 12px; padding-top: 12px;
    border-top: 1px solid var(--border);
    animation: dsFadeUp 0.25s ease;
  }

  /* ── Bottom CTA ── */
  .ds-bottom-cta { padding: 100px 0; }
  .ds-bottom-cta-inner {
    position: relative;
    display: flex; flex-direction: column; align-items: center;
    gap: 16px; text-align: center;
  }
  .ds-bottom-glow {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 500px; height: 300px; border-radius: 50%;
    background: radial-gradient(ellipse, rgba(218,41,28,0.15) 0%, transparent 70%);
    pointer-events: none;
  }
  .ds-bottom-icon {
    width: 48px; height: 48px; color: var(--gold);
    filter: drop-shadow(0 0 20px rgba(255,199,44,0.4));
    position: relative; z-index: 1;
  }
  .ds-bottom-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(32px, 5vw, 52px);
    letter-spacing: 3px; color: var(--text); position: relative; z-index: 1;
  }
  .ds-bottom-sub { font-size: 15px; color: var(--muted); position: relative; z-index: 1; }

  /* ── Footer strip ── */
  .ds-footer-strip {
    padding: 20px 24px;
    border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; color: var(--muted);
    max-width: 1200px; margin: 0 auto;
    flex-wrap: wrap; gap: 12px;
  }
  .ds-footer-links { display: flex; gap: 20px; }
  .ds-footer-link { color: var(--muted); text-decoration: none; font-weight: 600; transition: color 0.2s; }
  .ds-footer-link:hover { color: var(--gold); }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .ds-hero-inner { grid-template-columns: 1fr; gap: 40px; }
    .ds-benefits-grid { grid-template-columns: repeat(2, 1fr); }
    .ds-steps { grid-template-columns: 1fr; }
    .ds-calc-card { grid-template-columns: 1fr; padding: 32px 24px; }
  }
  @media (max-width: 640px) {
    .ds-hero { padding: 48px 16px 64px; }
    .ds-benefits-grid { grid-template-columns: 1fr; }
    .ds-section-inner { padding: 0 16px; }
    .ds-hero-stats { flex-wrap: wrap; gap: 16px; }
  }
`;
