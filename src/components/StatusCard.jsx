// eslint-disable-next-line react/prop-types
function StatusCard({ color = "blue", icon, title, message, trend, trendUp }) {
  // Color palette configurations
  const colorSchemes = {
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      iconBg: "bg-gradient-to-br from-blue-400 to-blue-600",
      iconShadow: "shadow-blue-500/30",
      glow: "group-hover:shadow-blue-500/20",
      text: "text-blue-100",
      subtext: "text-blue-300/70",
    },
    green: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      iconShadow: "shadow-emerald-500/30",
      glow: "group-hover:shadow-emerald-500/20",
      text: "text-emerald-100",
      subtext: "text-emerald-300/70",
    },
    red: {
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      iconBg: "bg-gradient-to-br from-rose-400 to-rose-600",
      iconShadow: "shadow-rose-500/30",
      glow: "group-hover:shadow-rose-500/20",
      text: "text-rose-100",
      subtext: "text-rose-300/70",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      iconBg: "bg-gradient-to-br from-amber-400 to-amber-600",
      iconShadow: "shadow-amber-500/30",
      glow: "group-hover:shadow-amber-500/20",
      text: "text-amber-100",
      subtext: "text-amber-300/70",
    },
    purple: {
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      iconBg: "bg-gradient-to-br from-violet-400 to-violet-600",
      iconShadow: "shadow-violet-500/30",
      glow: "group-hover:shadow-violet-500/20",
      text: "text-violet-100",
      subtext: "text-violet-300/70",
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;

  return (
    <div 
      className={`
        group relative overflow-hidden
        ${scheme.bg} ${scheme.border}
        backdrop-blur-xl
        rounded-2xl p-6 
        flex flex-col items-center text-center
        border 
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:-translate-y-1
        hover:shadow-2xl ${scheme.glow}
        cursor-default
      `}
    >
      {/* Animated gradient background on hover */}
      <div 
        className={`
          absolute inset-0 opacity-0 group-hover:opacity-100
          transition-opacity duration-700
          bg-gradient-to-br ${scheme.iconBg.replace('from-', 'from-').replace('to-', 'to-').replace('400', '500/5').replace('600', '600/5')}
        `}
      />

      {/* Top accent line */}
      <div 
        className={`
          absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5
          bg-gradient-to-r from-transparent via-current to-transparent
          ${scheme.text} opacity-50
        `}
      />

      {/* Icon container with enhanced styling */}
      <div 
        className={`
          relative mb-5
          w-16 h-16 rounded-2xl
          ${scheme.iconBg}
          flex items-center justify-center
          shadow-lg ${scheme.iconShadow}
          transform transition-all duration-500
          group-hover:scale-110 group-hover:rotate-3
          group-hover:shadow-xl
        `}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Icon with size and color */}
        <div className="relative text-white text-2xl drop-shadow-md">
          {icon}
        </div>

        {/* Pulse animation ring */}
        <div 
          className={`
            absolute inset-0 rounded-2xl
            ${scheme.iconBg}
            opacity-0 group-hover:opacity-40
            animate-ping
          `}
          style={{ animationDuration: '2s' }}
        />
      </div>

      {/* Content section */}
      <div className="relative z-10 space-y-2">
        {/* Title with enhanced typography */}
        <h3 
          className={`
            text-lg font-bold tracking-tight
            ${scheme.text}
            group-hover:tracking-wide
            transition-all duration-300
          `}
        >
          {title}
        </h3>

        {/* Message with better readability */}
        <p 
          className={`
            text-sm leading-relaxed max-w-[200px]
            ${scheme.subtext}
            group-hover:text-opacity-100
            transition-colors duration-300
          `}
        >
          {message}
        </p>

        {/* Optional trend indicator */}
        {trend && (
          <div 
            className={`
              inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold
              ${trendUp 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }
              transform transition-all duration-300
              group-hover:scale-105
            `}
          >
            <span className={`text-xs ${trendUp ? '↗' : '↘'}`}>
              {trendUp ? '↑' : '↓'}
            </span>
            {trend}
          </div>
        )}
      </div>

      {/* Bottom decorative element */}
      <div 
        className={`
          absolute bottom-0 left-0 right-0 h-1
          bg-gradient-to-r from-transparent via-current to-transparent
          ${scheme.text} opacity-0 group-hover:opacity-30
          transition-opacity duration-500
        `}
      />
    </div>
  );
}

export default StatusCard;
