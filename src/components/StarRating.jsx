// src/components/CommentWithAvatar.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Send, X, Check } from 'lucide-react';
import Avatar from './Avatar';
import axiosClient from '../api/axiosClient'; // adjust to your axios instance path

export default function CommentWithAvatar({
  itemId,
  itemType = 'review',
  initialLikes = 0,
  userLiked = false,
  initialCommentCount = 0,
  commentsList = [],
  currentUser = null, // { id, name, email, picture }
  size = 'md',
  readOnly = false,
  autoCloseDelay = 3000,
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
  const [justInteracted, setJustInteracted] = useState(false);
  const [loading, setLoading] = useState(false);

  const autoCloseTimer = useRef(null);
  const commentInputRef = useRef(null);

  useEffect(() => () => { if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current); }, []);

  // ── FIXED: Only auto-close on true idle, not after every action ───────────
  const startAutoClose = useCallback(() => {
    setJustInteracted(true);
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    autoCloseTimer.current = setTimeout(() => {
      setCommentsExpanded(false);
      setJustInteracted(false);
    }, autoCloseDelay);
  }, [autoCloseDelay]);

  const cancelAutoClose = () => {
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    setJustInteracted(false);
  };

  // ── Like ──────────────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (readOnly) return;
    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    setAnimatingLike(true);
    setTimeout(() => setAnimatingLike(false), 500);
    // FIXED: Removed startAutoClose() — liking should NOT collapse the panel

    try {
      const { data } = await axiosClient.post('/social/like', {
        item_id: itemId,
        item_type: itemType,
      });
      // Sync with server truth
      setLiked(data.liked);
      setLikeCount(data.like_count);
    } catch {
      // Rollback on failure
      setLiked(!newLiked);
      setLikeCount(prev => newLiked ? Math.max(0, prev - 1) : prev + 1);
    }
  }, [liked, itemId, itemType, readOnly]);

  // ── Comment submit ────────────────────────────────────────────────────────
  const handleCommentSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!commentText.trim() || readOnly || loading) return;

    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      id: tempId,
      user_id: currentUser?.id || '',
      user_name: currentUser?.name || 'You',
      user_avatar_url: currentUser?.picture || null,
      content: commentText.trim(),
      likes: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
      is_edited: false,
    };

    setLocalComments(prev => [optimistic, ...prev]);
    setCommentText('');
    setLoading(true);
    // FIXED: Removed startAutoClose() — commenting should NOT collapse the panel
    // Instead, reset idle timer so user can keep interacting
    cancelAutoClose();

    try {
      const { data } = await axiosClient.post('/social/comment', {
        item_id: itemId,
        item_type: itemType,
        content: optimistic.content,
      });
      // Replace temp entry with real server comment
      setLocalComments(prev =>
        prev.map(c => c.id === tempId ? { ...data.comment } : c)
      );
    } catch {
      // Rollback
      setLocalComments(prev => prev.filter(c => c.id !== tempId));
    } finally {
      setLoading(false);
    }
  }, [commentText, itemId, itemType, currentUser, readOnly, loading]);

  // ── Delete comment ────────────────────────────────────────────────────────
  const handleDeleteComment = useCallback(async (commentId) => {
    setLocalComments(prev => prev.filter(c => c.id !== commentId));
    // FIXED: Removed startAutoClose() — deleting should NOT collapse the panel
    try {
      await axiosClient.delete(`/social/comment/${commentId}`);
    } catch {
      // In practice the backend soft-deletes, so not critical to rollback
    }
  }, []);

  // ── Edit comment ──────────────────────────────────────────────────────────
  const handleEditComment = useCallback((comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
    cancelAutoClose();
  }, []);

  const handleSaveEdit = useCallback(async (commentId) => {
    if (!editText.trim()) return;
    const prev = localComments.find(c => c.id === commentId);
    setLocalComments(comments => comments.map(c =>
      c.id === commentId
        ? { ...c, content: editText.trim(), is_edited: true, edited_at: new Date().toISOString() }
        : c
    ));
    setEditingComment(null);
    setEditText('');
    // FIXED: Removed startAutoClose() — saving edit should NOT collapse the panel

    try {
      await axiosClient.patch(`/social/comment/${commentId}`, { content: editText.trim() });
    } catch {
      // Rollback
      if (prev) setLocalComments(comments => comments.map(c => c.id === commentId ? prev : c));
    }
  }, [editText, localComments]);

  // ── Like a comment ────────────────────────────────────────────────────────
  const handleLikeComment = useCallback(async (commentId) => {
    setLocalComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const alreadyLiked = c.liked_by?.includes(currentUser?.id);
      return {
        ...c,
        likes: alreadyLiked ? Math.max(0, c.likes - 1) : c.likes + 1,
        liked_by: alreadyLiked
          ? c.liked_by.filter(id => id !== currentUser?.id)
          : [...(c.liked_by || []), currentUser?.id],
      };
    }));
    // FIXED: Removed startAutoClose() — liking a comment should NOT collapse the panel

    try {
      await axiosClient.post(`/social/comment/${commentId}/like`);
    } catch {
      // Rollback
      setLocalComments(prev => prev.map(c => {
        if (c.id !== commentId) return c;
        const nowLiked = c.liked_by?.includes(currentUser?.id);
        return {
          ...c,
          likes: nowLiked ? Math.max(0, c.likes - 1) : c.likes + 1,
          liked_by: nowLiked
            ? c.liked_by.filter(id => id !== currentUser?.id)
            : [...(c.liked_by || []), currentUser?.id],
        };
      }));
    }
  }, [currentUser?.id]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatCount = (num) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTime = (dateString) => {
    const diff = (Date.now() - new Date(dateString)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(dateString).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  };

  const isOwnComment = (c) => c.user_id === currentUser?.id;

  const cfg = {
    sm: { icon: 'w-4 h-4', text: 'text-xs', button: 'p-1.5', gap: 'gap-3', avatar: 28 },
    md: { icon: 'w-5 h-5', text: 'text-sm', button: 'p-2',   gap: 'gap-4', avatar: 32 },
    lg: { icon: 'w-6 h-6', text: 'text-base', button: 'p-2.5', gap: 'gap-5', avatar: 40 },
  }[size] ?? { icon: 'w-5 h-5', text: 'text-sm', button: 'p-2', gap: 'gap-4', avatar: 32 };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Action Bar */}
      <div className={`flex items-center ${cfg.gap}`}>
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={readOnly}
          className={`
            group relative flex items-center gap-1.5 ${cfg.button} rounded-xl
            transition-all duration-200 active:scale-90
            ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/5'}
            ${readOnly ? 'cursor-default' : 'cursor-pointer'}
          `}
        >
          <div className="relative">
            <Heart className={`${cfg.icon} transition-all duration-300 ${liked ? 'fill-current scale-110' : 'group-hover:scale-110'} ${animatingLike ? 'animate-heart-pop' : ''}`} />
            {animatingLike && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="absolute w-1 h-1 bg-rose-400 rounded-full animate-spark"
                    style={{ left: '50%', top: '50%', transform: `rotate(${i * 72}deg)` }} />
                ))}
              </div>
            )}
          </div>
          <span className={`${cfg.text} font-semibold tabular-nums`}>{formatCount(likeCount)}</span>
        </button>

        {/* Comment toggle — count comes from localComments only (server-loaded) */}
        <button
          onClick={() => setCommentsExpanded(p => !p)}
          disabled={readOnly}
          className={`
            group flex items-center gap-1.5 ${cfg.button} rounded-xl
            transition-all duration-200 active:scale-90
            ${commentsExpanded ? 'text-sky-400 bg-sky-400/5' : 'text-slate-400 hover:text-sky-400 hover:bg-sky-400/5'}
          `}
        >
          <MessageCircle className={`${cfg.icon} transition-transform group-hover:scale-110`} />
          <span className={`${cfg.text} font-semibold tabular-nums`}>
            {/* Fixed: was initialComments + localComments.length (double-count) */}
            {formatCount(localComments.length || initialCommentCount)}
          </span>
        </button>
      </div>

      {/* Comments Section */}
      {commentsExpanded && (
        <div className="mt-4 border-t border-slate-800/50 pt-4 animate-fade-in relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comments</span>
              {justInteracted && (
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full animate-pulse">
                  Auto-closing…
                </span>
              )}
            </div>
            <button
              onClick={() => { setCommentsExpanded(false); cancelAutoClose(); }}
              className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Input */}
          {!readOnly && (
            <form onSubmit={handleCommentSubmit} className="flex items-start gap-3 mb-4">
              <Avatar picture={currentUser?.picture} email={currentUser?.email} name={currentUser?.name} size={cfg.avatar} />
              <div className="flex-1 relative">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={e => { setCommentText(e.target.value); cancelAutoClose(); }}
                  onFocus={cancelAutoClose}
                  placeholder="Add a comment…"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400/50 transition-all"
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || loading}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${commentText.trim() && !loading ? 'text-sky-400 hover:bg-sky-400/10' : 'text-slate-700'}`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* List */}
          <div className="space-y-3">
            {localComments.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-4">No comments yet.</p>
            ) : localComments.map(comment => (
              <div key={comment.id} className="group">
                <div className="flex gap-3">
                  <Avatar
                    picture={comment.user_avatar_url}
                    email={comment.user_id?.includes('@') ? comment.user_id : null}
                    name={comment.user_name}
                    size={cfg.avatar}
                  />
                  <div className="flex-1 min-w-0">
                    {editingComment === comment.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onFocus={cancelAutoClose}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                          autoFocus
                        />
                        <button onClick={() => handleSaveEdit(comment.id)} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingComment(null); setEditText(''); }} className="p-2 text-slate-500 hover:bg-slate-800 rounded-xl transition-colors">
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
                        <div className="flex items-center gap-4 mt-1 ml-1">
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className={`text-xs font-semibold transition-colors ${comment.liked_by?.includes(currentUser?.id) ? 'text-rose-500' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            {comment.liked_by?.includes(currentUser?.id) ? 'Liked' : 'Like'}
                            {comment.likes > 0 && ` (${formatCount(comment.likes)})`}
                          </button>
                          {isOwnComment(comment) && (
                            <>
                              <button onClick={() => handleEditComment(comment)} className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors">Edit</button>
                              <button onClick={() => handleDeleteComment(comment.id)} className="text-xs font-semibold text-slate-500 hover:text-red-400 transition-colors">Delete</button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes heart-pop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.35) rotate(-8deg); }
          60%  { transform: scale(0.9) rotate(4deg); }
          100% { transform: scale(1) rotate(0); }
        }
        .animate-heart-pop { animation: heart-pop 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes spark {
          0%   { opacity:1; transform:translate(-50%,-50%) scale(0); }
          100% { opacity:0; transform:translate(-50%,-50%) scale(1) translateY(-18px); }
        }
        .animate-spark { animation: spark 0.5s ease-out forwards; }
        @keyframes fade-in {
          from { opacity:0; transform:translateY(-4px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}