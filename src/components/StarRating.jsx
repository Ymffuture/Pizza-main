// src/components/SocialActions.jsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Heart, MessageCircle, Share2, Send, MoreHorizontal, 
  Bookmark, Flag, Link2, Twitter, Facebook, Copy, Check,
  ChevronDown, ChevronUp, X
} from 'lucide-react';

/**
 * SocialActions Component
 * Like, Comment, Share interactions for reviews/posts
 * 
 * @param {string} itemId - Unique ID of the item being interacted with
 * @param {number} initialLikes - Initial like count
 * @param {boolean} userLiked - Whether current user liked
 * @param {number} initialComments - Initial comment count
 * @param {Array} commentsList - Array of comment objects
 * @param {number} initialShares - Initial share count
 * @param {function} onLike - (itemId, liked) => void
 * @param {function} onComment - (itemId, content, parentId?) => void
 * @param {function} onShare - (itemId, platform) => void
 * @param {function} onBookmark - (itemId, bookmarked) => void
 * @param {boolean} showComments - Default expand comments
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} readOnly - Disable interactions
 * @param {string} className - Additional classes
 */
export default function SocialActions({
  itemId,
  initialLikes = 0,
  userLiked = false,
  initialComments = 0,
  commentsList = [],
  initialShares = 0,
  onLike,
  onComment,
  onShare,
  onBookmark,
  showComments = false,
  size = 'md',
  readOnly = false,
  className = '',
}) {
  const [liked, setLiked] = useState(userLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(showComments);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [animatingLike, setAnimatingLike] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [localComments, setLocalComments] = useState(commentsList);
  const shareRef = useRef(null);
  const commentInputRef = useRef(null);

  // Close share menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = useCallback(() => {
    if (readOnly) return;
    
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    setAnimatingLike(true);
    
    setTimeout(() => setAnimatingLike(false), 600);
    onLike?.(itemId, newLiked);
  }, [liked, itemId, readOnly, onLike]);

  const handleBookmark = useCallback(() => {
    if (readOnly) return;
    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);
    onBookmark?.(itemId, newBookmarked);
  }, [bookmarked, itemId, readOnly, onBookmark]);

  const handleCommentSubmit = useCallback((e) => {
    e.preventDefault();
    if (!commentText.trim() || readOnly) return;
    
    const newComment = {
      id: `temp_${Date.now()}`,
      user_id: 'current_user',
      user_name: 'You',
      user_avatar: null,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
      likes: 0,
      replies: [],
      isNew: true
    };
    
    if (replyingTo) {
      // Add as reply
      setLocalComments(prev => prev.map(c => 
        c.id === replyingTo 
          ? { ...c, replies: [...(c.replies || []), { ...newComment, parent_id: replyingTo }] }
          : c
      ));
    } else {
      setLocalComments(prev => [...prev, newComment]);
    }
    
    onComment?.(itemId, commentText.trim(), replyingTo || null);
    setCommentText('');
    setReplyingTo(null);
  }, [commentText, itemId, replyingTo, readOnly, onComment]);

  const handleShare = useCallback((platform) => {
    onShare?.(itemId, platform);
    setShareMenuOpen(false);
    
    if (platform === 'copy') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [itemId, onShare]);

  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now - date) / 1000;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  };

  const sizeConfig = {
    sm: { icon: 'w-4 h-4', text: 'text-xs', button: 'p-1.5', gap: 'gap-3' },
    md: { icon: 'w-5 h-5', text: 'text-sm', button: 'p-2', gap: 'gap-4' },
    lg: { icon: 'w-6 h-6', text: 'text-base', button: 'p-2.5', gap: 'gap-5' },
  };

  const cfg = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Main Action Bar */}
      <div className={`flex items-center justify-between ${cfg.gap}`}>
        <div className={`flex items-center ${cfg.gap}`}>
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={readOnly}
            className={`
              group relative flex items-center ${cfg.gap} ${cfg.button} rounded-xl
              transition-all duration-200 active:scale-90
              ${liked 
                ? 'text-rose-500' 
                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/5'
              }
              ${readOnly ? 'cursor-default' : 'cursor-pointer'}
            `}
            aria-label={liked ? 'Unlike' : 'Like'}
            aria-pressed={liked}
          >
            <div className="relative">
              <Heart 
                className={`${cfg.icon} transition-all duration-300 ${
                  liked ? 'fill-current scale-110' : 'group-hover:scale-110'
                } ${animatingLike ? 'animate-heart-burst' : ''}`}
              />
              {/* Particle burst effect */}
              {animatingLike && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-rose-400 rounded-full animate-particle"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `rotate(${i * 60}deg)`,
                        animationDelay: `${i * 0.05}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <span className={`${cfg.text} font-semibold tabular-nums`}>
              {formatCount(likeCount)}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => setCommentsExpanded(!commentsExpanded)}
            disabled={readOnly}
            className={`
              group flex items-center ${cfg.gap} ${cfg.button} rounded-xl
              transition-all duration-200 active:scale-90
              ${commentsExpanded 
                ? 'text-sky-400 bg-sky-400/5' 
                : 'text-slate-400 hover:text-sky-400 hover:bg-sky-400/5'
              }
              ${readOnly ? 'cursor-default' : 'cursor-pointer'}
            `}
            aria-label="Comments"
            aria-expanded={commentsExpanded}
          >
            <MessageCircle className={`${cfg.icon} transition-transform group-hover:scale-110`} />
            <span className={`${cfg.text} font-semibold tabular-nums`}>
              {formatCount(initialComments + localComments.length)}
            </span>
          </button>

          {/* Share Button */}
          <div className="relative" ref={shareRef}>
            <button
              onClick={() => setShareMenuOpen(!shareMenuOpen)}
              disabled={readOnly}
              className={`
                group flex items-center ${cfg.gap} ${cfg.button} rounded-xl
                transition-all duration-200 active:scale-90
                ${shareMenuOpen 
                  ? 'text-emerald-400 bg-emerald-400/5' 
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/5'
                }
                ${readOnly ? 'cursor-default' : 'cursor-pointer'}
              `}
              aria-label="Share"
              aria-expanded={shareMenuOpen}
            >
              <Share2 className={`${cfg.icon} transition-transform group-hover:scale-110 ${shareMenuOpen ? 'animate-bounce-subtle' : ''}`} />
              <span className={`${cfg.text} font-semibold tabular-nums`}>
                {formatCount(initialShares)}
              </span>
            </button>

            {/* Share Menu Dropdown */}
            {shareMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 p-2 min-w-[200px] z-50 animate-slide-up">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                  Share to
                </div>
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  {copiedLink ? 'Link copied!' : 'Copy link'}
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <Twitter className="w-4 h-4 text-sky-400" />
                  Twitter / X
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <Facebook className="w-4 h-4 text-blue-500" />
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('native')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  More options
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleBookmark}
            disabled={readOnly}
            className={`
              ${cfg.button} rounded-xl transition-all duration-200 active:scale-90
              ${bookmarked 
                ? 'text-amber-400 bg-amber-400/5' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }
            `}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Bookmark className={`${cfg.icon} ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {commentsExpanded && (
        <div className="mt-4 border-t border-slate-800/50 pt-4 animate-fade-in">
          {/* Comment Input */}
          {!readOnly && (
            <form onSubmit={handleCommentSubmit} className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-slate-400">
                Y
              </div>
              <div className="flex-1 relative">
                {replyingTo && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-sky-400 bg-sky-400/5 px-2 py-1 rounded-lg">
                    <span>Replying to comment</span>
                    <button 
                      onClick={() => setReplyingTo(null)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="relative">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400/50 transition-all"
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className={`
                      absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all
                      ${commentText.trim() 
                        ? 'text-sky-400 hover:bg-sky-400/10' 
                        : 'text-slate-700'
                      }
                    `}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {localComments.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              localComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={(id) => {
                    setReplyingTo(id);
                    commentInputRef.current?.focus();
                  }}
                  onLike={(id) => onLike?.(id, true)}
                  formatTime={formatTime}
                  size={size}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style>{`
        @keyframes heart-burst {
          0% { transform: scale(1); }
          25% { transform: scale(1.4) rotate(-10deg); }
          50% { transform: scale(0.9) rotate(5deg); }
          75% { transform: scale(1.2) rotate(-5deg); }
          100% { transform: scale(1) rotate(0); }
        }
        .animate-heart-burst {
          animation: heart-burst 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes particle {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1) translateY(-20px); }
        }
        .animate-particle {
          animation: particle 0.6s ease-out forwards;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up {
          animation: slide-up 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 0.3s ease;
        }
      `}</style>
    </div>
  );
}

// ─── Comment Item Component ─────────────────────────────────────────────

function CommentItem({ comment, onReply, onLike, formatTime, size }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    onLike?.(comment.id);
  };

  const cfg = size === 'sm' 
    ? { avatar: 'w-6 h-6', text: 'text-xs', gap: 'gap-2' }
    : { avatar: 'w-8 h-8', text: 'text-sm', gap: 'gap-3' };

  return (
    <div className="group">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={`${cfg.avatar} rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-slate-400 overflow-hidden`}>
          {comment.user_avatar ? (
            <img src={comment.user_avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            comment.user_name?.[0]?.toUpperCase() || 'U'
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-slate-950/50 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`${cfg.text} font-semibold text-white`}>{comment.user_name}</span>
              <span className="text-xs text-slate-600">{formatTime(comment.created_at)}</span>
              {comment.isNew && (
                <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded-full">
                  NEW
                </span>
              )}
            </div>
            <p className={`${cfg.text} text-slate-300 leading-relaxed`}>{comment.content}</p>
          </div>

          {/* Comment Actions */}
          <div className={`flex items-center ${cfg.gap} mt-1 ml-1`}>
            <button
              onClick={handleLike}
              className={`
                text-xs font-semibold transition-colors
                ${liked ? 'text-rose-500' : 'text-slate-500 hover:text-slate-300'}
              `}
            >
              {liked ? 'Liked' : 'Like'}
            </button>
            <button
              onClick={() => onReply?.(comment.id)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
            >
              Reply
            </button>
            <span className="text-xs text-slate-600 tabular-nums">
              {likeCount > 0 && `${likeCount} likes`}
            </span>
          </div>
        </div>

        {/* Menu */}
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-slate-600 hover:text-slate-300 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1 min-w-[140px] z-50">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                <Flag className="w-3.5 h-3.5" />
                Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies?.length > 0 && (
        <div className="ml-4 mt-2 pl-4 border-l-2 border-slate-800">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium mb-2 flex items-center gap-1 transition-colors"
          >
            {showReplies ? (
              <><ChevronUp className="w-3 h-3" /> Hide replies</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> {comment.replies.length} replies</>
            )}
          </button>
          {showReplies && (
            <div className="space-y-2">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  formatTime={formatTime}
                  size="sm"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Social Stats Bar (for product cards) ─────────────────────────────────

export function SocialStatsBar({ likes, comments, shares, className = '' }) {
  return (
    <div className={`flex items-center gap-4 text-xs text-slate-500 ${className}`}>
      {likes > 0 && (
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
          {likes >= 1000 ? `${(likes/1000).toFixed(1)}K` : likes}
        </span>
      )}
      {comments > 0 && (
        <span>{comments} comments</span>
      )}
      {shares > 0 && (
        <span>{shares} shares</span>
      )}
    </div>
  );
}

// ─── Engagement Summary (for analytics) ─────────────────────────────────

export function EngagementSummary({ data, className = '' }) {
  const { totalLikes, totalComments, totalShares, engagementRate } = data;
  
  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Heart className="w-5 h-5 text-rose-500" />
          <span className="text-2xl font-bold text-white">{totalLikes?.toLocaleString()}</span>
        </div>
        <p className="text-xs text-slate-500">Total Likes</p>
      </div>
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <MessageCircle className="w-5 h-5 text-sky-400" />
          <span className="text-2xl font-bold text-white">{totalComments?.toLocaleString()}</span>
        </div>
        <p className="text-xs text-slate-500">Comments</p>
      </div>
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Share2 className="w-5 h-5 text-emerald-400" />
          <span className="text-2xl font-bold text-white">{totalShares?.toLocaleString()}</span>
        </div>
        <p className="text-xs text-slate-500">Shares</p>
      </div>
    </div>
  );
}
