import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import Footer from "../components/Footer";
export default function Home() {
  const [floatItems, setFloatItems] = useState([]);
  const [trackId, setTrackId]       = useState("");
  const [trackErr, setTrackErr]     = useState("");
  const [tracking, setTracking]     = useState(false);
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

    // If user is not logged in, send them to login with redirect
    if (!isAuth) {
      navigate(`/login?redirect=/order/${encodeURIComponent(raw)}`);
      return;
    }

    // ✅ FIX: Old code just navigated to /order/<whatever the user typed>.
    // If user typed the short 8-char display code (e.g. "ABC123DE") it
    // navigated to /order/ABC123DE → Beanie.get("ABC123DE") → invalid ObjectId → 500.
    //
    // New flow:
    //   1. If input is 24 hex chars → it's a full ObjectId → navigate directly
    //   2. Otherwise → call /orders/search?short_id=<input> to resolve the full id first,
    //      then navigate to /order/<full_id>
    //
    const isFullId = /^[0-9a-fA-F]{24}$/.test(raw);

    if (isFullId) {
      navigate(`/order/${raw}`);
      return;
    }

    // Short code path — resolve to full id via search endpoint
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
            {/* ✅ FIX: show both a hint and any errors inline */}
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
      <Footer />
    </div>
  );
}
