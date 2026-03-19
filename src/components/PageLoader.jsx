export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="flex flex-col items-center gap-6">
        
        {/* Animated Logo Mark */}
        <div className="relative">
          {/* Outer ring pulse */}
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-orange-500/20 animate-ping" />
          
          {/* Spinner with gradient */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-orange-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 border-r-orange-400 animate-spin" />
            
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Brand Text with staggered animation */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-bold text-gray-900 tracking-tight animate-pulse">
            KotaBites
          </p>
          <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
            Loading your experience
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
