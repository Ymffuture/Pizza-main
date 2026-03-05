// 1. Liquid Morphing Blob
export default function Loader() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full blur-xl opacity-70 animate-pulse" />
        <div className="relative w-16 h-16 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full animate-[morph_3s_ease-in-out_infinite]" 
             style={{
               boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)',
               animation: 'morph 3s ease-in-out infinite, spin 8s linear infinite'
             }}>
          <style>{`
            @keyframes morph {
              0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
              50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

// 2. Orbital Rings System
export default function Loader() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="relative w-20 h-20">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 border-2 border-transparent rounded-full"
            style={{
              borderTopColor: i === 0 ? '#06b6d4' : i === 1 ? '#8b5cf6' : '#ec4899',
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              animation: `orbit ${2 + i * 0.5}s linear infinite`,
              transform: `rotate(${i * 45}deg) scale(${1 - i * 0.15})`,
              boxShadow: `0 0 20px ${i === 0 ? 'rgba(6,182,212,0.5)' : i === 1 ? 'rgba(139,92,246,0.5)' : 'rgba(236,72,153,0.5)'}`
            }}
          />
        ))}
        <style>{`
          @keyframes orbit {
            0% { transform: rotate(0deg) scale(var(--scale, 1)); }
            100% { transform: rotate(360deg) scale(var(--scale, 1)); }
          }
        `}</style>
      </div>
    </div>
  );
}

// 3. Pulsing Geometric Shapes
export default function Loader() {
  return (
    <div className="flex justify-center items-center py-10 gap-2">
      {['bg-cyan-400', 'bg-purple-500', 'bg-pink-500'].map((color, i) => (
        <div
          key={i}
          className={`w-4 h-4 ${color} rounded-sm animate-[geometric_1.5s_ease-in-out_infinite]`}
          style={{
            animationDelay: `${i * 0.2}s`,
            boxShadow: `0 0 20px currentColor`
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
  );
}

// 4. DNA Helix Wave
export default function Loader() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="flex gap-1">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-12 bg-gradient-to-b from-cyan-400 to-purple-600 rounded-full"
            style={{
              animation: `helix 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
              transform: `scaleY(${0.3 + Math.sin(i * 0.5) * 0.7})`
            }}
          />
        ))}
        <style>{`
          @keyframes helix {
            0%, 100% { transform: scaleY(0.3) translateY(0); opacity: 0.5; }
            50% { transform: scaleY(1.2) translateY(-10px); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

// 5. Glitch Text Effect
export default function Loader() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="relative font-bold text-2xl tracking-widest text-white">
        <span className="relative z-10 animate-[glitch_2s_infinite]">LOADING</span>
        <span className="absolute top-0 left-0 -ml-1 text-cyan-400 opacity-70 animate-[glitch_2s_infinite_0.1s]">LOADING</span>
        <span className="absolute top-0 left-0 ml-1 text-pink-500 opacity-70 animate-[glitch_2s_infinite_0.2s]">LOADING</span>
        <style>{`
          @keyframes glitch {
            0%, 90%, 100% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
          }
        `}</style>
      </div>
    </div>
  );
}

// 6. Neon Pulse Ring
export default function Loader() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="relative">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 border-2 border-cyan-400 rounded-full"
            style={{
              animation: `ripple 2s ease-out infinite`,
              animationDelay: `${i * 0.6}s`,
              opacity: 0
            }}
          />
        ))}
        <div className="w-12 h-12 bg-cyan-400 rounded-full animate-[pulse-glow_1.5s_ease-in-out_infinite]" 
             style={{ boxShadow: '0 0 30px rgba(34, 211, 238, 0.8), inset 0 0 20px rgba(255,255,255,0.5)' }} />
        <style>{`
          @keyframes ripple {
            0% { transform: scale(1); opacity: 0.8; border-width: 2px; }
            100% { transform: scale(3); opacity: 0; border-width: 0; }
          }
          @keyframes pulse-glow {
            0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(34, 211, 238, 0.8); }
            50% { transform: scale(1.1); box-shadow: 0 0 50px rgba(34, 211, 238, 1), 0 0 80px rgba(168, 85, 247, 0.6); }
          }
        `}</style>
      </div>
    </div>
  );
}

// 7. 3D Cube Rotation
export default function Loader() {
  return (
    <div className="flex justify-center items-center py-10 perspective-200">
      <div className="relative w-12 h-12 animate-[cube-rotate_3s_linear_infinite]" style={{ transformStyle: 'preserve-3d' }}>
        {['front', 'back', 'right', 'left', 'top', 'bottom'].map((face, i) => (
          <div
            key={face}
            className="absolute w-12 h-12 border-2 border-cyan-400 bg-purple-500/20 backdrop-blur-sm"
            style={{
              transform: {
                front: 'translateZ(24px)',
                back: 'rotateY(180deg) translateZ(24px)',
                right: 'rotateY(90deg) translateZ(24px)',
                left: 'rotateY(-90deg) translateZ(24px)',
                top: 'rotateX(90deg) translateZ(24px)',
                bottom: 'rotateX(-90deg) translateZ(24px)'
              }[face],
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
            }}
          />
        ))}
        <style>{`
          @keyframes cube-rotate {
            0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
            100% { transform: rotateX(360deg) rotateY(720deg) rotateZ(360deg); }
          }
          .perspective-200 { perspective: 200px; }
        `}</style>
      </div>
    </div>
  );
}

// 8. Magnetic Dots
export default function Loader() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="relative w-20 h-20">
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * 90) * Math.PI / 180;
          return (
            <div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: '-6px',
                marginTop: '-6px',
                animation: `magnetic 2s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.6)'
              }}
            />
          );
        })}
        <style>{`
          @keyframes magnetic {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(30px, 0) scale(1.2); }
            50% { transform: translate(0, 30px) scale(1); }
            75% { transform: translate(-30px, 0) scale(0.8); }
          }
        `}</style>
      </div>
    </div>
  );
}
