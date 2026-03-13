import React from "react";

// Custom Food-Themed SVG Icons
const Icons = {
  // Spilled soup bowl with steam
  SpilledBowl: ({ className }) => (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bowl */}
      <ellipse cx="100" cy="140" rx="60" ry="25" fill="#DC2626" />
      <path d="M40 140 Q40 170 100 170 Q160 170 160 140" fill="#B91C1C" />
      
      {/* Spilled liquid */}
      <path d="M50 155 Q30 165 25 175 Q20 185 35 180 Q50 175 60 160" fill="#F97316" opacity="0.8" />
      <path d="M150 150 Q170 160 175 170 Q180 180 165 175 Q150 170 140 155" fill="#F97316" opacity="0.6" />
      <ellipse cx="70" cy="175" rx="8" ry="4" fill="#F97316" opacity="0.9" />
      
      {/* Steam lines (broken) */}
      <path d="M80 100 Q85 80 80 60" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <path d="M100 95 Q105 75 95 55" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <path d="M120 100 Q115 80 120 60" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      
      {/* Crack in bowl */}
      <path d="M130 125 L140 135 L135 140" stroke="#7F1D1D" strokeWidth="2" fill="none" />
      
      {/* Floating ingredients (error debris) */}
      <circle cx="45" cy="165" r="4" fill="#22C55E" opacity="0.8" />
      <circle cx="165" cy="168" r="3" fill="#EAB308" opacity="0.8" />
      <rect x="55" y="170" width="6" height="6" rx="1" fill="#EF4444" opacity="0.7" transform="rotate(15 58 173)" />
    </svg>
  ),

  // Chef hat with error symbol
  ChefHatError: ({ className }) => (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hat base */}
      <path d="M20 80 Q20 60 35 55 Q30 40 40 30 Q50 20 60 25 Q70 20 80 30 Q90 40 85 55 Q100 60 100 80 L100 90 Q100 100 60 100 Q20 100 20 90 Z" fill="#FFFFFF" stroke="#DC2626" strokeWidth="3" />
      
      {/* Hat pleats */}
      <path d="M40 55 L40 90" stroke="#E5E7EB" strokeWidth="2" />
      <path d="M60 50 L60 95" stroke="#E5E7EB" strokeWidth="2" />
      <path d="M80 55 L80 90" stroke="#E5E7EB" strokeWidth="2" />
      
      {/* Error X mark */}
      <circle cx="90" cy="35" r="15" fill="#DC2626" />
      <path d="M84 29 L96 41 M96 29 L84 41" stroke="white" strokeWidth="3" strokeLinecap="round" />
      
      {/* Band */}
      <rect x="20" y="85" width="80" height="10" rx="2" fill="#DC2626" />
    </svg>
  ),

  // Refresh/Retry arrow
  Refresh: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),

  // Home icon
  Home: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),

  // Support/chat icon
  Support: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
};

// Error Fallback UI Component
const ErrorFallback = ({ error, resetError }) => {
  const [isWiggling, setIsWiggling] = React.useState(false);

  const handleRetry = () => {
    setIsWiggling(true);
    setTimeout(() => {
      setIsWiggling(false);
      resetError();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute text-4xl select-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          >
            {['🍔', '🍕', '🌭', '🍟', '🥤', '🥗', '🌮', '🍜'][i % 8]}
          </div>
        ))}
      </div>

      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-orange-100">
        {/* Header Strip */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

        <div className="p-8 md:p-12 text-center">
          {/* Animated Illustration Container */}
          <div className={`relative mx-auto w-48 h-48 mb-8 ${isWiggling ? 'animate-wiggle' : ''}`}>
            {/* Background glow */}
            <div className="absolute inset-0 bg-red-100 rounded-full blur-3xl opacity-50 animate-pulse" />
            
            {/* Main illustration */}
            <div className="relative animate-float">
              <Icons.SpilledBowl className="w-full h-full drop-shadow-xl" />
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-2 -right-2 animate-bounce" style={{ animationDelay: '0.2s' }}>
              <Icons.ChefHatError className="w-16 h-16 drop-shadow-lg" />
            </div>
          </div>

          {/* Error Code Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full mb-6">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-600 font-mono text-sm font-bold tracking-wider">
              ERROR 500
            </span>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
            Oops! We spilled the <span className="text-red-500">soup</span>.
          </h1>
          
          <p className="text-lg text-gray-600 mb-2 max-w-md mx-auto leading-relaxed">
            Something went wrong in our kitchen. Our chefs are already cleaning up the mess!
          </p>
          
          {error?.message && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 max-w-lg mx-auto">
              <p className="text-sm text-gray-500 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={handleRetry}
              className="group relative px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3 overflow-hidden"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
              
              <Icons.Refresh className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Try Again</span>
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-4 bg-white text-gray-700 font-bold rounded-2xl border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <Icons.Home className="w-5 h-5" />
              <span>Back to Menu</span>
            </button>
          </div>

          {/* Support Link */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <a 
              href="/support" 
              className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors text-sm font-medium"
            >
              <Icons.Support className="w-4 h-4" />
              <span>Need help? Contact our support team</span>
            </a>
          </div>
        </div>

        {/* Footer Strip */}
        <div className="bg-gray-50 px-8 py-4 flex items-center justify-between text-xs text-gray-400">
          <span>FreshFood Co.</span>
          <span>Error ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

// Main Error Boundary Class
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Optional: Send to analytics/monitoring
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `${error.toString()} ${errorInfo.componentStack}`,
        fatal: true
      });
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}
