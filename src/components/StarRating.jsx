// src/components/SocialActions.jsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, MoreHorizontal, Trash2, Edit2, X, Check } from 'lucide-react';

/**
 * SocialActions Component
 * Like, Comment, Delete + Like comments
 * No replies, no shares, no bookmarks
 */
export default function SocialActions({
  itemId,
  itemType = 'review',
  initialLikes = 0,
  userLiked = false,
  initialComments = 0,
  commentsList = [],
  onLike,
  onComment,
  onDeleteComment,
  onEditComment,
  onLikeComment,
  currentUserId,
  currentUserName = 'You',
  size = 'md',
  readOnly = false,
  className = '',
}) {
  const [liked, setLiked] = useState(userLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState(commentsList);
  const [animatingLike, setAnimatingLike] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const commentInputRef = useRef(null);

  const handleLike = useCallback(() => {
    if (readOnly) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    setAnimatingLike(true);
    setTimeout(() => setAnimatingLike(false), 500);
    onLike?.(itemId, newLiked);
  }, [liked, itemId, readOnly, onLike]);

  const handleCommentSubmit = useCallback((e) => {
    e.preventDefault();
    if (!commentText.trim() || readOnly) return;

    const newComment = {
      id: `temp_${Date.now()}`,
      user_id: currentUserId || 'current_user',
      user_name: currentUserName,
      user_avatar_url: null,
      content: commentText.trim(),
      likes: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
      is_edited: false,
    };

    setLocalComments(prev => [newComment, ...prev]);
    onComment?.(itemId, commentText.trim());
    setCommentText('');
  }, [commentText, itemId, currentUserId, currentUserName, readOnly, onComment]);

  const handleDeleteComment = useCallback((commentId) => {
    setLocalComments(prev => prev.filter(c => c.id !== commentId));
    onDeleteComment?.(itemId, commentId);
  }, [itemId, onDeleteComment]);

  const handleEditComment = useCallback((comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  }, []);

  const handleSaveEdit = useCallback((commentId) => {
    if (!editText.trim()) return;
    setLocalComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, content: editText.trim(), is_edited: true, edited_at: new Date().toISOString() }
        : c
    ));
    onEditComment?.(itemId, commentId, editText.trim());
    setEditingComment(null);
    setEditText('');
  }, [editText, itemId, onEditComment]);

  const handleLikeComment = useCallback((commentId) => {
    setLocalComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const userLikedIt = c.liked_by?.includes(currentUserId);
      const newLikedBy = userLikedIt
        ? c.liked_by.filter(id => id !== currentUserId)
        : [...(c.liked_by || []), currentUserId];
      return {
        ...c,
        likes: userLikedIt ? c.likes - 1 : c.likes + 1,
        liked_by: newLikedBy,
        user_liked: !userLikedIt
      };
    }));
    onLikeComment?.(itemId, commentId);
  }, [itemId, currentUserId, onLikeComment]);

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

  const isOwnComment = (comment) => comment.user_id === currentUserId;

  const cfg = {
    sm: { icon: 'w-4 h-4', text: 'text-xs', button: 'p-1.5', gap: 'gap-3' },
    md: { icon: 'w-5 h-5', text: 'text-sm', button: 'p-2', gap: 'gap-4' },
    lg: { icon: 'w-6 h-6', text: 'text-base', button: 'p-2.5', gap: 'gap-5' },
  }[size] || { icon: 'w-5 h-5', text: 'text-sm', button: 'p-2', gap: 'gap-4' };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Action Bar */}
      <div className={`flex items-center ${cfg.gap}`}>
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={readOnly}
          className={`
            group relative flex items-center ${cfg.gap} ${cfg.button} rounded-xl
            transition-all duration-200 active:scale-90
            ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/5'}
            ${readOnly ? 'cursor-default' : 'cursor-pointer'}
          `}
        >
          <div className="relative">
            <Heart
              className={`${cfg.icon} transition-all duration-300 ${liked ? 'fill-current scale-110' : 'group-hover:scale-110'} ${animatingLike ? 'animate-heart-pop' : ''}`}
            />
            {animatingLike && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-rose-400 rounded-full animate-spark"
                    style={{ left: '50%', top: '50%', transform: `rotate(${i * 72}deg)` }}
                  />
                ))}
              </div>
            )}
          </div>
          <span className={`${cfg.text} font-semibold tabular-nums`}>{formatCount(likeCount)}</span>
        </button>

        {/* Comment Toggle */}
        <button
          onClick={() => setCommentsExpanded(!commentsExpanded)}
          disabled={readOnly}
          className={`
            group flex items-center ${cfg.gap} ${cfg.button} rounded-xl
            transition-all duration-200 active:scale-90
            ${commentsExpanded ? 'text-sky-400 bg-sky-400/5' : 'text-slate-400 hover:text-sky-400 hover:bg-sky-400/5'}
          `}
        >
          <MessageCircle className={`${cfg.icon} transition-transform group-hover:scale-110`} />
          <span className={`${cfg.text} font-semibold tabular-nums`}>
            {formatCount(initialComments + localComments.length)}
          </span>
        </button>
      </div>

      {/* Comments Section */}
      {commentsExpanded && (
        <div className="mt-4 border-t border-slate-800/50 pt-4 animate-fade-in">
          {/* Comment Input */}
          {!readOnly && (
            <form onSubmit={handleCommentSubmit} className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-slate-400">
                {currentUserName[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 relative">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400/50 transition-all"
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${commentText.trim() ? 'text-sky-400 hover:bg-sky-400/10' : 'text-slate-700'}`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {localComments.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4">No comments yet.</p>
            ) : (
              localComments.map((comment) => (
                <div key={comment.id} className="group">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-slate-400 overflow-hidden">
                      {comment.user_avatar_url ? (
                        <img src={comment.user_avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        comment.user_name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingComment === comment.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingComment(null); setEditText(''); }}
                            className="p-2 text-slate-500 hover:bg-slate-800 rounded-xl transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="bg-slate-950/50 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-white">{comment.user_name}</span>
                              <span className="text-xs text-slate-600">{formatTime(comment.created_at)}</span>
                              {comment.is_edited && <span className="text-[10px] text-slate-600">(edited)</span>}
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{comment.content}</p>
                          </div>

                          {/* Comment Actions */}
                          <div className="flex items-center gap-4 mt-1 ml-1">
                            <button
                              onClick={() => handleLikeComment(comment.id)}
                              className={`text-xs font-semibold transition-colors ${comment.liked_by?.includes(currentUserId) ? 'text-rose-500' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                              {comment.liked_by?.includes(currentUserId) ? 'Liked' : 'Like'}
                              {comment.likes > 0 && ` (${formatCount(comment.likes)})`}
                            </button>

                            {isOwnComment(comment) && (
                              <>
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-xs font-semibold text-slate-500 hover:text-red-400 transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes heart-pop {
          0% { transform: scale(1); }
          30% { transform: scale(1.35) rotate(-8deg); }
          60% { transform: scale(0.9) rotate(4deg); }
          100% { transform: scale(1) rotate(0); }
        }
        .animate-heart-pop { animation: heart-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes spark {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1) translateY(-18px); }
        }
        .animate-spark { animation: spark 0.5s ease-out forwards; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
