// src/components/StarRating.jsx
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Premium StarRating Component
 * 
 * Features:
 * - Smooth hover animations with scale and glow effects
 * - Half-star precision support (optional)
 * - Accessibility: keyboard navigation, screen reader support
 * - Customizable size, colors, and read-only mode
 * - Animated fill with spring-like transitions
 * - Optional label and rating count display
 * 
 * @param {number} rating - Current rating value (1-5)
 * @param {function} onRating - Callback when rating changes
 * @param {number} hoverRating - Controlled hover state (optional)
 * @param {function} onHover - Callback on hover change (optional)
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} readOnly - Disable interaction
 * @param {boolean} showValue - Show numeric rating
 * @param {number} totalReviews - Show review count
 * @param {boolean} allowHalf - Enable half-star ratings
 * @param {string} className - Additional classes
 */
export default function StarRating({
  rating = 0,
  onRating,
  hoverRating: controlledHover,
  onHover,
  size = 'md',
  readOnly = false,
  showValue = false,
  totalReviews = null,
  allowHalf = false,
  className = '',
}) {
  const [internalHover, setInternalHover] = useState(0);
  const [animatingStar, setAnimatingStar] = useState(null);
  const containerRef = useRef(null);
  
  const hover = controlledHover !== undefined ? controlledHover : internalHover;
  
  // Size configurations
  const sizeConfig = {
    sm: { star: 'w-4 h-4', gap: 'gap-0.5', text: 'text-xs' },
    md: { star: 'w-6 h-6', gap: 'gap-1', text: 'text-sm' },
    lg: { star: 'w-8 h-8', gap: 'gap-1.5', text: 'text-base' },
    xl: { star: 'w-10 h-10', gap: 'gap-2', text: 'text-lg' },
  };
  
  const config = sizeConfig[size] || sizeConfig.md;
  
  // Calculate fill percentage for each star
  const getFillPercentage = (starIndex) => {
    const value = hover || rating;
    if (starIndex <= Math.floor(value)) return 100;
    if (starIndex === Math.ceil(value) && allowHalf) {
      return (value - Math.floor(value)) * 100;
    }
    return 0;
  };
  
  const handleMouseEnter = useCallback((starValue) => {
    if (readOnly) return;
    setInternalHover(starValue);
    onHover?.(starValue);
  }, [readOnly, onHover]);
  
  const handleMouseLeave = useCallback(() => {
    if (readOnly) return;
    setInternalHover(0);
    onHover?.(0);
  }, [readOnly, onHover]);
  
  const handleClick = useCallback((starValue) => {
    if (readOnly) return;
    setAnimatingStar(starValue);
    onRating?.(starValue);
    
    // Reset animation after it completes
    setTimeout(() => setAnimatingStar(null), 400);
  }, [readOnly, onRating]);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (readOnly) return;
    
    const currentRating = rating || 0;
    let newRating = currentRating;
    
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newRating = Math.min(5, currentRating + (allowHalf ? 0.5 : 1));
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newRating = Math.max(0.5, currentRating - (allowHalf ? 0.5 : 1));
        e.preventDefault();
        break;
      case '1': case '2': case '3': case '4': case '5':
        newRating = parseInt(e.key);
        break;
      default:
        return;
    }
    
    onRating?.(newRating);
  }, [readOnly, rating, allowHalf, onRating]);
  
  // Focus management
  useEffect(() => {
    if (containerRef.current && !readOnly) {
      containerRef.current.focus();
    }
  }, [readOnly]);
  
  const getStarColor = (starIndex) => {
    const fill = getFillPercentage(starIndex);
    if (fill === 100) return 'text-amber-400';
    if (fill > 0) return 'text-amber-400/50';
    return 'text-slate-600';
  };
  
  const getStarLabel = (value) => {
    const labels = {
      1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent'
    };
    return labels[value] || '';
  };
  
  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <div className="flex items-center gap-3">
        {/* Star Container */}
        <div
          ref={containerRef}
          className={`inline-flex ${config.gap} ${readOnly ? '' : 'cursor-pointer'} outline-none`}
          onMouseLeave={handleMouseLeave}
          onKeyDown={handleKeyDown}
          role={readOnly ? 'img' : 'radiogroup'}
          aria-label={readOnly ? `Rated ${rating} out of 5 stars` : 'Rate this item'}
          aria-readonly={readOnly}
          tabIndex={readOnly ? -1 : 0}
        >
          {[1, 2, 3, 4, 5].map((starValue) => {
            const fillPercent = getFillPercentage(starValue);
            const isAnimating = animatingStar === starValue;
            const isHovered = hover === starValue;
            
            return (
              <button
                key={starValue}
                type="button"
                className={`
                  relative ${config.star} transition-all duration-200 ease-out
                  ${readOnly ? '' : 'hover:scale-110 active:scale-95'}
                  ${isAnimating ? 'animate-star-bounce' : ''}
                  ${isHovered && !readOnly ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''}
                  focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-sm
                `}
                onClick={() => handleClick(starValue)}
                onMouseEnter={() => handleMouseEnter(starValue)}
                onFocus={() => handleMouseEnter(starValue)}
                role="radio"
                aria-checked={rating === starValue}
                aria-label={`${starValue} stars: ${getStarLabel(starValue)}`}
                disabled={readOnly}
                tabIndex={-1}
              >
                {/* Background star (empty) */}
                <svg
                  className={`absolute inset-0 ${config.star} ${readOnly ? 'text-slate-700' : 'text-slate-600'}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                
                {/* Filled star with clip */}
                <div 
                  className="absolute inset-0 overflow-hidden transition-all duration-300"
                  style={{ width: `${fillPercent}%` }}
                >
                  <svg
                    className={`${config.star} ${getStarColor(starValue)} drop-shadow-sm`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id={`starGradient-${starValue}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                      fill={`url(#starGradient-${starValue})`}
                    />
                  </svg>
                </div>
                
                {/* Hover glow overlay */}
                {!readOnly && hover >= starValue && (
                  <div className="absolute inset-0 rounded-full bg-amber-400/10 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Rating Value Display */}
        {showValue && (
          <div className="flex items-baseline gap-1.5">
            <span className={`${config.text} font-bold text-amber-400 tabular-nums`}>
              {rating.toFixed(1)}
            </span>
            <span className={`${config.text} text-slate-500`}>/ 5</span>
          </div>
        )}
      </div>
      
      {/* Review Count & Label */}
      {(totalReviews !== null || hover > 0) && (
        <div className="mt-1.5 flex items-center gap-2">
          {hover > 0 && !readOnly && (
            <span className="text-xs font-medium text-amber-400 animate-fade-in">
              {getStarLabel(hover)}
            </span>
          )}
          {totalReviews !== null && (
            <span className="text-xs text-slate-500">
              {totalReviews.toLocaleString()} {totalReviews === 1 ? 'review' : 'reviews'}
            </span>
          )}
        </div>
      )}
      
      {/* Custom styles for animations */}
      <style>{`
        @keyframes star-bounce {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.35) rotate(-5deg); }
          50% { transform: scale(0.9) rotate(3deg); }
          75% { transform: scale(1.15) rotate(-2deg); }
        }
        .animate-star-bounce {
          animation: star-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

// ─── Interactive Review Input Component ─────────────────────────────────────

export function ReviewInput({ 
  onSubmit, 
  maxPhotos = 5,
  productName = 'this product',
  className = '' 
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({ rating, title, content, photos });
      // Reset form
      setRating(0);
      setTitle('');
      setContent('');
      setPhotos([]);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isValid = rating > 0 && content.length >= 10;
  
  return (
    <form 
      onSubmit={handleSubmit}
      className={`bg-slate-900/50 border border-slate-800 rounded-2xl p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-white mb-4">
        Write a review for {productName}
      </h3>
      
      {/* Rating Section */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-400 mb-2">
          Overall Rating <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center gap-4">
          <StarRating
            rating={rating}
            onRating={setRating}
            hoverRating={hoverRating}
            onHover={setHoverRating}
            size="lg"
            showValue
          />
          {hoverRating > 0 && (
            <span className="text-sm font-medium text-amber-400 animate-fade-in">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating]}
            </span>
          )}
        </div>
        {rating === 0 && focused && (
          <p className="text-xs text-red-400 mt-1">Please select a rating</p>
        )}
      </div>
      
      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-400 mb-2">
          Review Title <span className="text-slate-600">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all"
          maxLength={200}
        />
      </div>
      
      {/* Content */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-400 mb-2">
          Your Review <span className="text-red-400">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="What did you like or dislike? How was the quality?"
          rows={4}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all resize-none"
          minLength={10}
          maxLength={5000}
        />
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${content.length < 10 ? 'text-red-400' : 'text-slate-600'}`}>
            Minimum 10 characters
          </span>
          <span className="text-xs text-slate-600">
            {content.length}/5000
          </span>
        </div>
      </div>
      
      {/* Photo Upload Placeholder */}
      {maxPhotos > 0 && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Photos <span className="text-slate-600">(optional, max {maxPhotos})</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {photos.map((photo, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 group">
                <img src={photo} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {photos.length < maxPhotos && (
              <button
                type="button"
                className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-amber-400 hover:border-amber-400/50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">Add</span>
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Submit */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Your review will be visible after moderation
        </p>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`
            px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${isValid && !isSubmitting
              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Review'
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Rating Distribution Bar ────────────────────────────────────────────────

export function RatingDistribution({ distribution = {}, total = 0, onFilter }) {
  const maxCount = Math.max(...Object.values(distribution), 1);
  
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = distribution[stars] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
        
        return (
          <button
            key={stars}
            onClick={() => onFilter?.(stars)}
            className="w-full flex items-center gap-3 group hover:bg-slate-800/50 rounded-lg px-2 py-1.5 transition-colors text-left"
          >
            <span className="text-sm font-medium text-slate-400 w-8">{stars}★</span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out group-hover:bg-amber-300"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="text-sm text-slate-500 w-12 text-right tabular-nums">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Review Card Component ─────────────────────────────────────────────────

export function ReviewCard({ review, onHelpful, onReport, currentUserId }) {
  const [expanded, setExpanded] = useState(false);
  const [showReactionTip, setShowReactionTip] = useState(false);
  const [hasReacted, setHasReacted] = useState(
    review.reactions?.some(r => r.user_id === currentUserId)
  );
  
  const isLong = review.content?.length > 300;
  const displayContent = expanded || !isLong 
    ? review.content 
    : review.content?.slice(0, 300) + '...';
  
  const handleHelpful = async () => {
    if (hasReacted) return;
    await onHelpful?.(review._id);
    setHasReacted(true);
  };
  
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-5 hover:border-slate-700/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-semibold">
            {review.user_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{review.user_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} size="sm" readOnly />
              {review.is_verified_purchase && (
                <span className="text-xs text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-xs text-slate-500">
          {new Date(review.created_at).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>
      
      {/* Title */}
      {review.title && (
        <h4 className="text-base font-semibold text-white mb-2">{review.title}</h4>
      )}
      
      {/* Content */}
      <p className="text-sm text-slate-300 leading-relaxed mb-3">
        {displayContent}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-amber-400 hover:text-amber-300 font-medium ml-1 transition-colors"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </p>
      
      {/* Photos */}
      {review.photos?.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {review.photos.map((photo, i) => (
            <img
              key={i}
              src={photo.url}
              alt={photo.caption || `Review photo ${i + 1}`}
              className="w-24 h-24 rounded-xl object-cover border border-slate-700 hover:border-amber-400/50 transition-colors cursor-pointer"
            />
          ))}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-slate-800/50">
        <button
          onClick={handleHelpful}
          disabled={hasReacted}
          className={`
            flex items-center gap-1.5 text-sm transition-colors
            ${hasReacted 
              ? 'text-amber-400 font-medium' 
              : 'text-slate-500 hover:text-slate-300'
            }
          `}
        >
          <svg className="w-4 h-4" fill={hasReacted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          Helpful ({review.helpful_count || 0})
        </button>
        
        <button
          onClick={() => onReport?.(review._id)}
          className="text-sm text-slate-500 hover:text-red-400 transition-colors"
        >
          Report
        </button>
      </div>
      
      {/* Merchant Reply */}
      {review.replies?.filter(r => r.is_visible).map(reply => (
        <div key={reply.id} className="mt-4 ml-4 pl-4 border-l-2 border-amber-400/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              {reply.author_role === 'merchant' ? 'Merchant' : 'Support'}
            </span>
            <span className="text-xs text-slate-500">{reply.author_name}</span>
          </div>
          <p className="text-sm text-slate-400">{reply.content}</p>
        </div>
      ))}
    </div>
  );
}
