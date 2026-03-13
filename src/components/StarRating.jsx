import { useState } from 'react';

export default function StarRating({ rating, onRating }) {
  const [hover, setHover] = useState(0);
  const [animatingStar, setAnimatingStar] = useState(null);

  const handleClick = (starValue) => {
    setAnimatingStar(starValue);
    onRating(starValue);
    setTimeout(() => setAnimatingStar(null), 600);
  };

  // Chili pepper SVG path
  const ChiliPepper = ({ filled, isAnimating }) => (
    <svg
      viewBox="0 0 24 24"
      className={`h-8 w-8 transition-all duration-300 ${
        filled ? 'drop-shadow-lg' : ''
      } ${isAnimating ? 'animate-bounce-chili' : ''}`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
    >
      {/* Pepper body */}
      <path
        d="M12 2C12 2 8 4 6 8C4 12 5 16 8 18C11 20 15 20 17 17C19 14 20 10 18 7C16 4 12 2 12 2Z"
        className={filled ? 'text-red-500' : 'text-gray-300'}
      />
      {/* Pepper highlight */}
      {filled && (
        <path
          d="M9 6C9 6 7 8 7 11"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {/* Stem */}
      <path
        d="M12 2C12 2 13 1 14 1C15 1 16 2 16 3C16 4 15 4 14 4C13 4 12 2 12 2Z"
        className={filled ? 'text-green-600' : 'text-gray-400'}
      />
      {/* Leaf */}
      <path
        d="M14 1C14 1 16 0 17 1C18 2 17 3 16 3"
        className={filled ? 'text-green-500' : 'text-gray-400'}
        fill={filled ? 'currentColor' : 'none'}
        strokeWidth={1.5}
      />
    </svg>
  );

  // Alternative: Burger stars
  const BurgerStar = ({ filled, isAnimating }) => (
    <svg
      viewBox="0 0 24 24"
      className={`h-9 w-9 transition-all duration-300 ${
        isAnimating ? 'animate-bounce-burger' : ''
      }`}
      fill="none"
    >
      {/* Bottom bun */}
      <ellipse
        cx="12"
        cy="18"
        rx="8"
        ry="3"
        className={filled ? 'text-amber-600' : 'text-gray-300'}
        fill="currentColor"
      />
      {/* Meat patty */}
      <rect
        x="5"
        y="13"
        width="14"
        height="3"
        rx="1"
        className={filled ? 'text-amber-800' : 'text-gray-400'}
        fill="currentColor"
      />
      {/* Cheese */}
      <path
        d="M5 13 L7 11 L17 11 L19 13 Z"
        className={filled ? 'text-yellow-400' : 'text-gray-300'}
        fill="currentColor"
      />
      {/* Lettuce */}
      <path
        d="M4 11 Q6 9 8 11 Q10 9 12 11 Q14 9 16 11 Q18 9 20 11"
        className={filled ? 'text-green-500' : 'text-gray-400'}
        fill="currentColor"
      />
      {/* Tomato */}
      <rect x="6" y="9" width="12" height="2" rx="0.5" className={filled ? 'text-red-500' : 'text-gray-300'} fill="currentColor" />
      {/* Top bun */}
      <path
        d="M4 9 Q4 4 12 4 Q20 4 20 9 Z"
        className={filled ? 'text-amber-500' : 'text-gray-300'}
        fill="currentColor"
      />
      {/* Sesame seeds */}
      {filled && (
        <>
          <circle cx="8" cy="6" r="0.5" fill="rgba(255,255,255,0.6)" />
          <circle cx="12" cy="5" r="0.5" fill="rgba(255,255,255,0.6)" />
          <circle cx="16" cy="6" r="0.5" fill="rgba(255,255,255,0.6)" />
          <circle cx="10" cy="7" r="0.5" fill="rgba(255,255,255,0.6)" />
          <circle cx="14" cy="7" r="0.5" fill="rgba(255,255,255,0.6)" />
        </>
      )}
    </svg>
  );

  // Fire flame stars
  const FlameStar = ({ filled, isAnimating, intensity }) => (
    <svg
      viewBox="0 0 24 24"
      className={`h-8 w-8 transition-all duration-300 ${
        isAnimating ? 'animate-flame-flicker' : ''
      }`}
      fill="currentColor"
    >
      <defs>
        <linearGradient id={`flameGradient${intensity}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={filled ? '#DC2626' : '#9CA3AF'} />
          <stop offset="50%" stopColor={filled ? '#F97316' : '#D1D5DB'} />
          <stop offset="100%" stopColor={filled ? '#FBBF24' : '#E5E7EB'} />
        </linearGradient>
      </defs>
      <path
        d="M12 2C12 2 6 8 6 14C6 18 9 21 12 21C15 21 18 18 18 14C18 8 12 2 12 2Z"
        fill={`url(#flameGradient${intensity})`}
      />
      {/* Inner flame */}
      <path
        d="M12 6C12 6 9 10 9 14C9 16 10 18 12 18C14 18 15 16 15 14C15 10 12 6 12 6Z"
        fill={filled ? '#FEF3C7' : 'none'}
        opacity={filled ? 0.9 : 0}
      />
    </svg>
  );

  const activeRating = hover || rating;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Rating label */}
      <div className="text-sm font-bold text-gray-600 uppercase tracking-wider">
        {activeRating === 0 && 'Not rated'}
        {activeRating === 1 && 'Mild 🌶️'}
        {activeRating === 2 && 'Medium 🌶️🌶️'}
        {activeRating === 3 && 'Hot 🔥'}
        {activeRating === 4 && 'Extra Hot 🔥🔥'}
        {activeRating === 5 && 'Inferno 🔥🔥🔥'}
      </div>

      {/* Stars container */}
      <div className="flex items-center gap-1 bg-white px-4 py-3 rounded-2xl shadow-lg border border-orange-100">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= activeRating;
          const isAnimating = animatingStar === starValue;

          return (
            <button
              type="button"
              key={starValue}
              className={`
                relative p-1 rounded-xl transition-all duration-200
                hover:scale-110 hover:-translate-y-1
                active:scale-95
                ${isFilled ? 'text-orange-500' : 'text-gray-300'}
                ${isAnimating ? 'z-10' : ''}
              `}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => setHover(starValue)}
              onMouseLeave={() => setHover(0)}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Choose your icon: ChiliPepper, BurgerStar, or FlameStar */}
              <FlameStar 
                filled={isFilled} 
                isAnimating={isAnimating}
                intensity={starValue}
              />

              {/* Sparkle effect on click */}
              {isAnimating && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-sparkle"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * 60}deg) translateY(-20px)`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Hover tooltip */}
              <div className={`
                absolute -top-8 left-1/2 -translate-x-1/2 
                px-2 py-1 bg-gray-800 text-white text-xs rounded-md
                opacity-0 transition-opacity duration-200 pointer-events-none
                ${hover === starValue ? 'opacity-100' : ''}
                whitespace-nowrap
              `}>
                {starValue} {starValue === 1 ? 'star' : 'stars'}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Rating text */}
      <p className="text-xs text-gray-500 font-medium">
        {rating > 0 ? `You rated this ${rating} out of 5` : 'Click to rate your experience'}
      </p>

      <style>{`
        @keyframes bounce-chili {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          25% { transform: translateY(-8px) rotate(-10deg) scale(1.1); }
          50% { transform: translateY(0) rotate(5deg) scale(1.05); }
          75% { transform: translateY(-4px) rotate(-5deg) scale(1.02); }
        }
        @keyframes bounce-burger {
          0%, 100% { transform: translateY(0) scale(1); }
          25% { transform: translateY(-12px) scale(1.15); }
          50% { transform: translateY(0) scale(0.95); }
          75% { transform: translateY(-6px) scale(1.05); }
        }
        @keyframes flame-flicker {
          0%, 100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
          25% { transform: scale(1.15) rotate(-3deg) translateY(-2px); filter: brightness(1.2); }
          50% { transform: scale(1.1) rotate(2deg); filter: brightness(1.1); }
          75% { transform: scale(1.2) rotate(-2deg) translateY(-3px); filter: brightness(1.3); }
        }
        @keyframes sparkle {
          0% { opacity: 1; transform: rotate(var(--rotation)) translateY(-20px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--rotation)) translateY(-40px) scale(0); }
        }
        .animate-bounce-chili {
          animation: bounce-chili 0.6s ease-out;
        }
        .animate-bounce-burger {
          animation: bounce-burger 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-flame-flicker {
          animation: flame-flicker 0.6s ease-out;
        }
        .animate-sparkle {
          animation: sparkle 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
