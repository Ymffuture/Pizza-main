export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0700]">
      <div className="flex flex-col items-center gap-6">
        
        {/* Animated Logo Mark */}
        <div className="relative">
          {/* Outer ring pulse */}
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-[#DA291C]/20 animate-ping" />
          
          {/* Spinner with gradient */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-[#FFC72C]/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#DA291C] border-r-[#FFC72C] animate-spin" />
            
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-[#DA291C] rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Brand Text with staggered animation */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-bold text-[#fff8e7] tracking-tight animate-pulse font-['Bebas_Neue'] tracking-[3px]">
            KotaGO
          </p>
          <p className="text-sm text-[rgba(255,248,231,0.42)] font-medium tracking-wide uppercase">
            Fresh · Fast · Fire
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#FFC72C] animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
