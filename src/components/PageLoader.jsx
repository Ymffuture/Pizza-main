export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0700]">
      
    <div className="flex justify-center items-center py-10 gap-2">
      {['bg-cyan-400', 'bg-yellow-500', 'bg-red-500'].map((color, i) => (
        <div
          key={i}
          className={`w-4 h-4 ${color} rounded-sm animate-[geometric_1.5s_ease-in-out_infinite]`}
          style={{
            animationDelay: `${i * 0.2}s`,
            boxShadow: `0 0 1px currentColor`
          }}
        />
      ))}
      <style>{`
        @keyframes geometric {
          0%, 100% { transform: scale(1) rotate(0deg); border-radius: 4px; }
          25% { transform: scale(1.5) rotate(90deg); border-radius: 50%; }
          50% { transform: scale(1) rotate(180deg); border-radius: 4px; }
          75% { transform: scale(0.5) rotate(270deg); border-radius: 0; }
        }
      `}</style>
    </div>
  
    
        </div>

        {/* Brand Text with staggered animation */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-bold text-[#fff8e7] tracking-tight animate-pulse font-['Bebas_Neue'] tracking-[3px]">
            Fresh · Fast · Fire
          </p>
          <p className="text-sm text-[rgba(255,248,231,0.42)] font-medium tracking-wide uppercase">
          .      .      . 
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
