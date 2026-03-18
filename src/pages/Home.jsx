import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import Footer from "../components/Footer";
import { Info, AlertCircle, XCircle, Phone, FileText, ChevronRight } from "lucide-react";

export default function Home() {
  const [floatItems, setFloatItems] = useState([]);
  const [trackId, setTrackId]       = useState("");
  const [trackErr, setTrackErr]     = useState("");
  const [tracking, setTracking]     = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const navigate = useNavigate();
  const { isAuth } = useAuth();

  useEffect(() => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      emoji: ["🍔", "🍟", "🥤", "🌯", "🍕", "🥪"][i % 6],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${10 + Math.random() * 10}s`,
    }));
    setFloatItems(items);
  }, []);

  const handleTrack = async (e) => {
    e.preventDefault();
    const raw = trackId.trim();
    if (!raw) return;

    setTrackErr("");

    if (!isAuth) {
      navigate(`/login?redirect=/order/${encodeURIComponent(raw)}`);
      return;
    }

    const isFullId = /^[0-9a-fA-F]{24}$/.test(raw);

    if (isFullId) {
      navigate(`/order/${raw}`);
      return;
    }

    setTracking(true);
    try {
      const res = await axiosClient.get("/orders/search", { params: { short_id: raw } });
      const fullId = res.data?.id;
      if (fullId) {
        navigate(`/order/${fullId}`);
      } else {
        setTrackErr("Order not found. Try the full Order ID.");
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setTrackErr("Order not found. Check the ID and try again.");
      } else if (status === 401) {
        navigate(`/login?redirect=/order/${encodeURIComponent(raw)}`);
      } else {
        setTrackErr("Could not look up order. Try again in a moment.");
      }
    } finally {
      setTracking(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-yellow-400 relative overflow-hidden flex items-center justify-center">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[length:20px_20px]" />
      </div>

      {/* Floating emojis */}
      {floatItems.map((item) => (
        <div key={item.id} className="absolute text-4xl opacity-20 animate-float"
          style={{ left: item.left, animationDelay: item.delay, animationDuration: item.duration, top: "-50px" }}>
          {item.emoji}
        </div>
      ))}

      {/* Info Button - Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <div className="relative">
          <button 
            onClick={() => navigate("/info")}
            onMouseEnter={() => setShowInfoTooltip(true)}
            onMouseLeave={() => setShowInfoTooltip(false)}
            className="group relative w-12 h-12 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-full flex items-center justify-center hover:bg-white/30 hover:border-white/50 hover:scale-110 transition-all duration-300 shadow-lg"
          >
            <Info className="w-6 h-6 text-white group-hover:text-yellow-300 transition-colors" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping opacity-30"></span>
          </button>
          
          {/* Tooltip */}
          <div className={`absolute right-0 top-14 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 transform transition-all duration-300 ${showInfoTooltip ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">Important Policies</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  5 free cancellations/month. R20 charge after limit. Click to read full terms.
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-red-600">Learn more</span>
              <ChevronRight className="w-4 h-4 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Logo */}
        <div className="mb-8 inline-block">
          <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:rotate-12 transition-transform duration-500 border-4 border-white/20">
            <span className="text-red-600 font-black text-5xl">K</span>
          </div>
        </div>

        <h1 className="text-6xl md:text-7xl font-black text-white mb-4 tracking-tight drop-shadow-2xl">
          KOTA<span className="text-yellow-300 inline-block transform -rotate-2">BITES</span>
        </h1>

        <p className="text-xl md:text-2xl text-yellow-100 mb-8 font-medium drop-shadow-md">
          Where flavor meets speed. Order now, taste the difference.
        </p>

        {/* Info Card - Important Notice */}
        <div className="mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-left hover:bg-white/15 transition-all duration-300 group cursor-pointer" onClick={() => navigate("/info")}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-yellow-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Cancellation Policy</h3>
                <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-300 text-[10px] font-bold rounded-full">NEW</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-3">
                You have <span className="text-yellow-300 font-bold">5 free trials</span> per month. After that, each cancellation costs <span className="text-yellow-300 font-bold">R20</span>. Cancellations only via KataBot.
              </p>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-white/60">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>5 Free/Month</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <Phone className="w-3.5 h-3.5" />
                  <span>065 393 5339</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/menu"
            className="group relative inline-flex items-center gap-3 bg-yellow-400 text-red-700 px-10 py-4 rounded-full font-black text-lg shadow-2xl hover:bg-yellow-300 hover:scale-105 transition-all duration-300 overflow-hidden">
            <span className="relative z-10">View Menu</span>
            <svg className="w-5 h-5 relative z-10 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Link>

          {/* Track Order form */}
          <div className="flex flex-col items-center gap-1">
            <form onSubmit={handleTrack} className="flex items-center gap-2">
              <div className="flex flex-col items-start">
                <input
                  type="text"
                  placeholder="Paste Order ID to track…"
                  value={trackId}
                  onChange={(e) => { setTrackId(e.target.value); setTrackErr(""); }}
                  className="px-4 py-2 rounded-full text-sm text-gray-800 bg-white/90 backdrop-blur-sm border-2 border-white/40 focus:outline-none focus:border-yellow-300 w-52"
                />
              </div>
              <button type="submit" disabled={tracking}
                className="inline-flex items-center gap-2 text-white font-bold text-lg hover:text-yellow-300 transition-colors duration-300 border-b-2 border-transparent hover:border-yellow-300 pb-1 disabled:opacity-60">
                {tracking ? (
                  <span className="inline-block animate-spin text-base">↻</span>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Track
              </button>
            </form>
            {trackErr ? (
              <p className="text-xs text-red-200 bg-red-900/40 px-3 py-1 rounded-full">{trackErr}</p>
            ) : (
              <p className="text-xs text-white/60">
                Use the full Order ID or short code from your confirmation
              </p>
            )}
          </div>
        </div>

        {/* Feature icons */}
        <div className="mt-12 flex justify-center gap-8 text-white/80">
          {[
            { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Fast Delivery" },
            { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "Fresh Quality" },
            { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Best Prices" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
              </div>
              <span className="text-sm font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgba(255,255,255,0.1)" />
        </svg>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        .animate-float { animation: float linear infinite; }
      `}</style>
      
    </div>
      <Footer />
    </>
  );
}
