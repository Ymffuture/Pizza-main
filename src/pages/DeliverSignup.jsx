// src/pages/DeliverSignup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { driverSignup } from "../api/delivery.api";
import {
  Flame, Bike, ChevronRight, ChevronDown,
  Star, Shield, Clock, Zap, MapPin,
  Phone, Mail, User, Car, CheckCircle2,
  ArrowRight, Loader, DollarSign,
  TrendingUp, Award, Upload, X, AlertCircle
} from "lucide-react";

const BENEFITS = [
  {
    icon: DollarSign,
    title: "Earn Big",
    sub: "Up to R200/day during peak hours",
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
    a: "Earnings are calculated per delivery (R15 base). You can withdraw to your bank account anytime with a minimum of R50.",
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
  const { isAuth, user, token } = useAuth();
  
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    id_number: "",
    vehicle_type: "",
    vehicle_registration: "",
    drivers_license: "",
    street_address: "",
    suburb: "",
    postal_code: "",
    bank_name: "",
    account_number: "",
    account_holder: "",
  });
  
  const [files, setFiles] = useState({
    id_document: null,
    license_document: null,
    vehicle_document: null,
    profile_photo: null,
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^0\d{9}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Must be 10 digits starting with 0";
    if (!form.id_number.trim()) e.id_number = "ID number is required";
    else if (!/^\d{13}$/.test(form.id_number))
      e.id_number = "Must be 13 digits";
    if (!form.vehicle_type) e.vehicle_type = "Select your vehicle type";
    if (!form.street_address.trim()) e.street_address = "Address is required";
    if (!form.suburb.trim()) e.suburb = "Suburb is required";
    if (!form.postal_code.trim()) e.postal_code = "Postal code is required";
    
    // Banking details
    if (!form.bank_name.trim()) e.bank_name = "Bank name is required";
    if (!form.account_number.trim()) e.account_number = "Account number is required";
    if (!form.account_holder.trim()) e.account_holder = "Account holder is required";
    
    // File validation
    if (!files.id_document) e.id_document = "ID document required";
    if (!files.license_document) e.license_document = "License document required";
    if (!files.vehicle_document) e.vehicle_document = "Vehicle document required";
    if (!files.profile_photo) e.profile_photo = "Profile photo required";
    
    return e;
  };

  const handleChange = (field) => (ev) => {
    setForm((p) => ({ ...p, [field]: ev.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleFileChange = (field) => (ev) => {
    const file = ev.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((p) => ({ ...p, [field]: "File too large (max 5MB)" }));
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors((p) => ({ ...p, [field]: "Must be an image file" }));
        return;
      }
      setFiles((p) => ({ ...p, [field]: file }));
      if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
    }
  };

  const removeFile = (field) => {
    setFiles((p) => ({ ...p, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuth) {
      navigate('/login?redirect=/deliver');
      return;
    }
    
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    
    setLoading(true);
    setApiError(null);
    
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Add files
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });
      
      await driverSignup(formData);
      setDone(true);
      
    } catch (error) {
      setApiError(error?.response?.data?.detail || error.message || 'Application failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
            {isAuth ? (
              <Link to="/driver-dashboard" className="ds-header-btn">Dashboard</Link>
            ) : (
              <Link to="/login" className="ds-header-btn">Sign In</Link>
            )}
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
                <span className="ds-stat-num">R100+</span>
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

            <div className="ds-drivers-row">
              <div className="ds-driver-avatars">
                {["🙎‍♂️","👩🏻‍🦱","👨🏾‍🦲","👱🏾‍♀️","👨🏻‍🦳"].map((em, i) => (
                  <div key={i} className="ds-driver-avatar" style={{ zIndex: 5 - i }}>
                    {em}
                  </div>
                ))}
              </div>
              <p className="ds-drivers-text">
                <strong>11+ active drivers</strong> already earning
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
                  Check your email for next steps.
                </p>
                <Link to="/driver-dashboard" className="ds-done-btn">View Dashboard</Link>
              </div>
            ) : (
              <>
                <div className="ds-form-header">
                  <h2 className="ds-form-title">Become a Driver</h2>
                  <p className="ds-form-sub">Takes less than 5 minutes</p>
                </div>

                {apiError && (
                  <div className="ds-error-banner">
                    <AlertCircle className="w-4 h-4" />
                    <span>{apiError}</span>
                  </div>
                )}

                {!isAuth && (
                  <div className="ds-info-banner">
                    <Shield className="w-4 h-4" />
                    <span>Please <Link to="/login?redirect=/deliver" className="ds-form-link">sign in</Link> to apply</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="ds-form">
                  {/* Personal Info */}
                  <div className="ds-section-title">Personal Information</div>
                  
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

                  <div className="ds-field">
                    <label className="ds-label">ID Number</label>
                    <div className={`ds-input-wrap${errors.id_number ? " ds-input-err" : ""}`}>
                      <User className="ds-icon" />
                      <input
                        className="ds-input" placeholder="9501015800080"
                        value={form.id_number} onChange={handleChange("id_number")}
                        maxLength={13}
                      />
                    </div>
                    {errors.id_number && <p className="ds-err">{errors.id_number}</p>}
                  </div>

                  {/* Vehicle Info */}
                  <div className="ds-section-title">Vehicle Information</div>

                  <div className="ds-field">
                    <label className="ds-label">Vehicle Type</label>
                    <div className={`ds-input-wrap${errors.vehicle_type ? " ds-input-err" : ""}`}>
                      <Car className="ds-icon" />
                      <select
                        className="ds-input ds-select"
                        value={form.vehicle_type} onChange={handleChange("vehicle_type")}
                      >
                        <option value="">Select your vehicle</option>
                        <option value="bicycle">🚲 Bicycle</option>
                        <option value="motorcycle">🏍️ Motorcycle</option>
                        <option value="car">🚗 Car</option>
                        <option value="scooter">🛴 Scooter</option>
                      </select>
                    </div>
                    {errors.vehicle_type && <p className="ds-err">{errors.vehicle_type}</p>}
                  </div>

                  <div className="ds-field">
                    <label className="ds-label">Vehicle Registration <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
                    <div className="ds-input-wrap">
                      <Car className="ds-icon" />
                      <input
                        className="ds-input" placeholder="ABC123GP"
                        value={form.vehicle_registration} onChange={handleChange("vehicle_registration")}
                      />
                    </div>
                  </div>

                  <div className="ds-field">
                    <label className="ds-label">Driver's License <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
                    <div className="ds-input-wrap">
                      <User className="ds-icon" />
                      <input
                        className="ds-input" placeholder="DL123456"
                        value={form.drivers_license} onChange={handleChange("drivers_license")}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="ds-section-title">Address</div>

                  <div className="ds-field">
                    <label className="ds-label">Street Address</label>
                    <div className={`ds-input-wrap${errors.street_address ? " ds-input-err" : ""}`}>
                      <MapPin className="ds-icon" />
                      <input
                        className="ds-input" placeholder="123 Main St"
                        value={form.street_address} onChange={handleChange("street_address")}
                      />
                    </div>
                    {errors.street_address && <p className="ds-err">{errors.street_address}</p>}
                  </div>

                  <div className="ds-field">
                    <label className="ds-label">Suburb</label>
                    <div className={`ds-input-wrap${errors.suburb ? " ds-input-err" : ""}`}>
                      <MapPin className="ds-icon" />
                      <input
                        className="ds-input" placeholder="Soweto"
                        value={form.suburb} onChange={handleChange("suburb")}
                      />
                    </div>
                    {errors.suburb && <p className="ds-err">{errors.suburb}</p>}
                  </div>

                  <div className="ds-field">
                    <label className="ds-label">Postal Code</label>
                    <div className={`ds-input-wrap${errors.postal_code ? " ds-input-err" : ""}`}>
                      <MapPin className="ds-icon" />
                      <input
                        className="ds-input" placeholder="1809"
                        value={form.postal_code} onChange={handleChange("postal_code")}
                      />
                    </div>
                    {errors.postal_code && <p className="ds-err">{errors.postal_code}</p>}
                  </div>

                  {/* Banking */}
                  <div className="ds-section-title">Banking Details</div>

                  <div className="ds-field">
                    <label className="ds-label">Bank Name</label>
                    <div className={`ds-input-wrap${errors.bank_name ? " ds-input-err" : ""}`}>
                      <DollarSign className="ds-icon" />
                      <select
                        className="ds-input ds-select"
                        value={form.bank_name} onChange={handleChange("bank_name")}
                      >
                        <option value="">Select bank</option>
                        <option value="FNB">FNB</option>
                        <option value="Standard Bank">Standard Bank</option>
                        <option value="Capitec">Capitec</option>
                        <option value="Nedbank">Nedbank</option>
                        <option value="ABSA">ABSA</option>
                      </select>
                    </div>
                    {errors.bank_name && <p className="ds-err">{errors.bank_name}</p>}
                  </div>

                  <div className="ds-field">
                    <label className="ds-label">Account Number</label>
                    <div className={`ds-input-wrap${errors.account_number ? " ds-input-err" : ""}`}>
                      <DollarSign className="ds-icon" />
                      <input
                        className="ds-input" placeholder="1234567890"
                        value={form.account_number} onChange={handleChange("account_number")}
                      />
                    </div>
                    {errors.account_number && <p className="ds-err">{errors.account_number}</p>}
                  </div>

                  <div className="ds-field">
                    <label className="ds-label">Account Holder Name</label>
                    <div className={`ds-input-wrap${errors.account_holder ? " ds-input-err" : ""}`}>
                      <User className="ds-icon" />
                      <input
                        className="ds-input" placeholder="Thabo Nkosi"
                        value={form.account_holder} onChange={handleChange("account_holder")}
                      />
                    </div>
                    {errors.account_holder && <p className="ds-err">{errors.account_holder}</p>}
                  </div>

                  {/* Documents */}
                  <div className="ds-section-title">Required Documents</div>

                  {[
                    { key: 'id_document', label: 'ID Document' },
                    { key: 'license_document', label: 'Driver\'s License' },
                    { key: 'vehicle_document', label: 'Vehicle Document' },
                    { key: 'profile_photo', label: 'Profile Photo' },
                  ].map(({ key, label }) => (
                    <div key={key} className="ds-field">
                      <label className="ds-label">{label}</label>
                      <div className={`ds-file-upload${errors[key] ? " ds-input-err" : ""}`}>
                        {files[key] ? (
                          <div className="ds-file-preview">
                            <span className="ds-file-name">{files[key].name}</span>
                            <button type="button" onClick={() => removeFile(key)} className="ds-file-remove">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange(key)}
                              className="ds-file-input"
                              id={key}
                            />
                            <label htmlFor={key} className="ds-file-label">
                              <Upload className="w-4 h-4" />
                              <span>Choose file</span>
                            </label>
                          </>
                        )}
                      </div>
                      {errors[key] && <p className="ds-err">{errors[key]}</p>}
                    </div>
                  ))}

                  <button type="submit" disabled={loading || !isAuth} className="ds-submit-btn">
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
                <h3 className="ds-step-title">{s.title}</h3>
                <p className="ds-step-sub">{s.sub}</p>
              </div>
            ))}
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

  .ds-root {
    min-height: 100vh;
    background: var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    overflow-x: hidden;
  }

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
    display: grid; grid-template-columns: 1fr 480px;
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

  .ds-form-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 32px 28px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,199,44,0.06);
    animation: dsFadeUp 0.6s ease 0.2s both;
    max-height: 80vh;
    overflow-y: auto;
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
  .ds-section-title {
    font-size: 11px; font-weight: 900; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--gold);
    margin: 16px 0 8px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  .ds-section-title:first-of-type {
    margin-top: 0; padding-top: 0; border-top: none;
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
  
  .ds-error-banner {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; border-radius: 12px;
    background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3);
    color: #f87171; font-size: 12px; font-weight: 700;
    margin-bottom: 16px;
  }
  
  .ds-info-banner {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; border-radius: 12px;
    background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.3);
    color: #60a5fa; font-size: 12px; font-weight: 700;
    margin-bottom: 16px;
  }
  
  .ds-file-upload {
    background: rgba(255,248,231,0.04);
    border: 1.5px dashed var(--border);
    border-radius: 12px;
    padding: 16px;
    transition: all 0.2s;
  }
  .ds-file-upload:hover { border-color: rgba(255,199,44,0.3); }
  .ds-file-input {
    display: none;
  }
  .ds-file-label {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    color: var(--muted); font-size: 13px; font-weight: 700;
    cursor: pointer; transition: color 0.2s;
  }
  .ds-file-label:hover { color: var(--text); }
  .ds-file-preview {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px;
  }
  .ds-file-name {
    font-size: 13px; color: var(--text); font-weight: 600;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ds-file-remove {
    background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.3);
    border-radius: 6px; padding: 4px;
    color: #f87171; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center;
  }
  .ds-file-remove:hover { background: rgba(248,113,113,0.25); }
  
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
  .ds-done-sub { font-size: 13px; color: var(--muted); line-height: 1.6; max-width: 300px; }
  .ds-done-btn {
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 14px;
    padding: 12px 28px; border-radius: 50px; text-decoration: none;
    margin-top: 4px; transition: all 0.2s;
  }
  .ds-done-btn:hover { background: var(--red2); }

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

  @media (max-width: 1024px) {
    .ds-hero-inner { grid-template-columns: 1fr; gap: 40px; }
    .ds-benefits-grid { grid-template-columns: repeat(2, 1fr); }
    .ds-steps { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .ds-hero { padding: 48px 16px 64px; }
    .ds-benefits-grid { grid-template-columns: 1fr; }
    .ds-section-inner { padding: 0 16px; }
    .ds-hero-stats { flex-wrap: wrap; gap: 16px; }
  }
`;
