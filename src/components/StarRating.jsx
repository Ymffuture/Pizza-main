// src/components/SocialActions.jsx
// Twitter/X-style likes, comments, bookmarks & shares.
// Drop-in replacement for CommentWithAvatar.jsx
//
// Required props:
//   itemId      string  — MongoDB _id of the item being reacted to (MUST be defined)
//   itemType    string  — e.g. "menu_item" | "order" | "post"
//   currentUser object  — { id, full_name, email, picture } from AuthContext

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Heart, MessageCircle, Bookmark,
  Share2, Send, X, Trash2, MessageCircleHeart,
  Pencil, Check, MoreHorizontal,
  Sparkles, Bell, HeartHandshake, Flame,BookmarkCheck, 
  MessageSquarePlus, MessageSquareDot,
} from 'lucide-react';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaCommentDots, FaRegCommentDots, FaShare, FaFire, FaBolt } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import axiosClient from '../api/axiosClient';
import { useBilling } from '../context/BillingContext';
import { useToast } from './Toast';
import { GoVerified } from "react-icons/go";



// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function SocialActions({
  itemId,
  itemType = 'post',
  initialStats = {},
  currentUser = null,
  className = '',
}) {
  // ── State ─────────────────────────────────────────────────────────────────
  const { isProBite } = useBilling();
  const toast = useToast();
  const [stats, setStats] = useState({
    likes: initialStats.likes ?? 0,
    comments: initialStats.comments ?? 0,
    shares: initialStats.shares ?? 0,
    bookmarks: initialStats.bookmarks ?? 0,
    user_liked: initialStats.user_liked ?? false,
    user_bookmarked: initialStats.user_bookmarked ?? false,
  });
  const [showThread, setShowThread] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null); // { id, text }
  const [newCommentIds, setNewCommentIds] = useState(new Set());
  const [prevCommentCount, setPrevCommentCount] = useState(initialStats.comments ?? 0);
  const inputRef = useRef(null);
  const scrollBoxRef = useRef(null);

  // ── inside SocialActions, after the existing state declarations ──────────
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000); // re-render every 30s
    return () => clearInterval(id);
  }, []);

  // ── Guard: never make API calls without a valid itemId ───────────────────
  const ready = Boolean(itemId);

  // ── Fetch live stats on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    axiosClient
      .get(`/social/stats/${itemId}`, { params: { item_type: itemType } })
      .then(({ data }) => setStats(s => ({ ...s, ...data })))
      .catch(() => {}); // silently keep initialStats on failure
  }, [itemId, itemType, ready]);

  // ── Fetch comments when thread opens ──────────────────────────────────────
  useEffect(() => {
    if (!showThread || !ready) return;
    setLoadingComments(true);
    axiosClient
      .get(`/social/comments/${itemId}`, {
        params: { item_type: itemType, limit: 50 },
      })
      .then(({ data }) => {
        const newComments = data.comments ?? [];
        // Track new comments for dot animation
        if (prevCommentCount > 0 && newComments.length > prevCommentCount) {
          const newOnes = newComments.slice(0, newComments.length - prevCommentCount);
          newOnes.forEach(c => {
            setNewCommentIds(prev => new Set(prev).add(c.id));
            // Remove dot after 5 seconds
            setTimeout(() => {
              setNewCommentIds(prev => {
                const next = new Set(prev);
                next.delete(c.id);
                return next;
              });
            }, 5000);
          });
        }
        setComments(newComments);
        setPrevCommentCount(newComments.length);
      })
      .catch(() => {})
      .finally(() => setLoadingComments(false));
  }, [showThread, itemId, itemType, ready]);

  // ── Auto-focus reply input when thread opens ──────────────────────────────
  useEffect(() => {
    if (showThread) setTimeout(() => inputRef.current?.focus(), 80);
  }, [showThread]);

  // ── Like (item-level) ───────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (!ready || !currentUser) return;
    const prev = stats;
    setStats(s => ({
      ...s,
      user_liked: !s.user_liked,
      likes: s.user_liked ? Math.max(0, s.likes - 1) : s.likes + 1,
    }));
    try {
      const { data } = await axiosClient.post('/social/like', {
        item_id: itemId,
        item_type: itemType,
      });
      setStats(s => ({ ...s, user_liked: data.liked, likes: data.like_count }));
    } catch {
      setStats(prev);
    }
  }, [ready, currentUser, itemId, itemType, stats]);

  // ── Bookmark ──────────────────────────────────────────────────────────────
  const handleBookmark = useCallback(async () => {
    if (!ready || !currentUser) return;
    const prev = stats;
    setStats(s => ({
      ...s,
      user_bookmarked: !s.user_bookmarked,
      bookmarks: s.user_bookmarked ? Math.max(0, s.bookmarks - 1) : s.bookmarks + 1,
    }));
    try {
      const { data } = await axiosClient.post('/social/bookmark', {
        item_id: itemId,
        item_type: itemType,
      });
      setStats(s => ({
        ...s,
        user_bookmarked: data.bookmarked,
        bookmarks: data.bookmark_count,
      }));
    } catch {
      setStats(prev);
    }
  }, [ready, currentUser, itemId, itemType, stats]);

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!ready) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
    try {
      await axiosClient.post('/social/share', {
        item_id: itemId,
        item_type: itemType,
        platform: 'web',
      });
      setStats(s => ({ ...s, shares: s.shares + 1 }));
    } catch {}
  }, [ready, itemId, itemType]);

  // ── Submit comment ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    const text = commentText.trim();
    if (!text || !ready || !currentUser || submitting) return;

    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      id: tempId,
      user_id: currentUser.id ?? '',
      user_name: currentUser.full_name ?? currentUser.name ?? 'You',
      user_avatar_url: currentUser.picture ?? null,
      content: text,
      likes: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
      is_edited: false,
    };

    setComments(prev => [optimistic, ...prev]);
    setStats(s => ({ ...s, comments: s.comments + 1 }));
    setCommentText('');
    setSubmitting(true);
    // Mark as new for dot animation
    setNewCommentIds(prev => new Set(prev).add(tempId));
    setTimeout(() => {
      setNewCommentIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }, 5000);

    // Scroll to top after adding
    setTimeout(() => {
      scrollBoxRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);

    try {
      const { data } = await axiosClient.post('/social/comment', {
        item_id: itemId,
        item_type: itemType,
        content: text,
      });
      setComments(prev => prev.map(c => (c.id === tempId ? data.comment : c)));
      setPrevCommentCount(prev => prev + 1);
    } catch {
      setComments(prev => prev.filter(c => c.id !== tempId));
      setStats(s => ({ ...s, comments: Math.max(0, s.comments - 1) }));
      setCommentText(text);
    } finally {
      setSubmitting(false);
    }
  }, [commentText, ready, currentUser, itemId, itemType, submitting]);

  // ── Delete comment ────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (commentId) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    setStats(s => ({ ...s, comments: Math.max(0, s.comments - 1) }));
    setNewCommentIds(prev => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
    try {
      await axiosClient.delete(`/social/comment/${commentId}`);
      setPrevCommentCount(prev => Math.max(0, prev - 1));
    } catch {}
  }, []);

  // ── Like comment ──────────────────────────────────────────────────────────
  const handleLikeComment = useCallback(async (commentId) => {
    if (!currentUser?.id) return;
    const uid = currentUser.id;

    const toggle = (arr) =>
      arr?.includes(uid) ? arr.filter(id => id !== uid) : [...(arr ?? []), uid];

    setComments(prev =>
      prev.map(c => {
        if (c.id !== commentId) return c;
        const liked = c.liked_by?.includes(uid);
        return {
          ...c,
          likes: liked ? Math.max(0, c.likes - 1) : c.likes + 1,
          liked_by: toggle(c.liked_by),
        };
      })
    );

    try {
      await axiosClient.post(`/social/comment/${commentId}/like`);
    } catch {
      setComments(prev =>
        prev.map(c => {
          if (c.id !== commentId) return c;
          const liked = c.liked_by?.includes(uid);
          return {
            ...c,
            likes: liked ? Math.max(0, c.likes - 1) : c.likes + 1,
            liked_by: toggle(c.liked_by),
          };
        })
      );
    }
  }, [currentUser?.id]);

  // ── Edit comment (ProBite perk) ──────────────────────────────────────────
  const handleSaveEdit = useCallback(async () => {
    if (!editing?.text.trim()) return;
    const { id, text } = editing;

    if (!isProBite) {
      setEditing(null);
      toast.show({
        type: 'info',
        title: 'ProBite perk',
        message: 'Editing comments is a ProBite feature.',
        learnMoreUrl: '/pricing',
      });
      return;
    }

    const previous = comments;
    setComments(prev =>
      prev.map(c => (c.id === id ? { ...c, content: text, is_edited: true } : c))
    );
    setEditing(null);
    try {
      await axiosClient.patch(`/social/comment/${id}`, { content: text });
    } catch (err) {
      setComments(previous); // roll back the optimistic update — it was rejected
      const status = err?.response?.status;
      toast.show({
        type: 'error',
        title: status === 403 ? 'ProBite perk' : "Couldn't save edit",
        message: status === 403
          ? 'Editing comments is a ProBite feature.'
          : 'Please try again.',
      });
    }
  }, [editing, isProBite, comments, toast]);

  const handleEditClick = useCallback((comment) => {
    if (!isProBite) {
      toast.show({
        type: 'info',
        title: 'ProBite perk',
        message: 'Editing comments is a ProBite feature.',
        learnMoreUrl: '/pricing',
      });
      return;
    }
    setEditing({ id: comment.id, text: comment.content });
  }, [isProBite, toast]);

  // ── Formatters ────────────────────────────────────────────────────────────
  const fmt = (n) =>
    n >= 1e6 ? `${(n / 1e6).toFixed(1)}M`
    : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K`
    : n > 0 ? String(n) : '';

  const fmtTime = (iso) => {
    const d = (Date.now() - new Date(iso)) / 1000;
    if (d < 60) return 'now';
    if (d < 3600) return `${Math.floor(d / 60)}m`;
    if (d < 86400) return `${Math.floor(d / 3600)}h`;
    if (d < 604800) return `${Math.floor(d / 86400)}d`;
    return new Date(iso).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  };

  const hasNewComments = newCommentIds.size > 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={className}>

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        <ActionBtn
          onClick={() => setShowThread(t => !t)}
          active={showThread}
          hoverColor="sky"
          activeColor="text-sky-400"
          icon={
            hasNewComments ? (
              <div className="relative">
                <MessageSquareDot className="w-[18px] h-[18px]" />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-sky-400 rounded-full"
                />
              </div>
            ) : (
              <MessageCircleHeart className="w-[18px] h-[18px]" />
            )
          }
          label={fmt(stats.comments)}
          title="Reply"
        />
        <ActionBtn
          onClick={handleLike}
          active={stats.user_liked}
          hoverColor="rose"
          activeColor="text-rose-500"
          icon={
            stats.user_liked ? (
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <HeartHandshake className="w-[16px] h-[16px] text-rose-500" />
              </motion.div>
            ) : (
              <FaRegHeart className="w-[16px] h-[16px]" />
            )
          }
          label={fmt(stats.likes)}
          title="Like"
        />
        <ActionBtn
          onClick={handleBookmark}
          active={stats.user_bookmarked}
          hoverColor="amber"
          activeColor="text-amber-400"
          icon={
            stats.user_bookmarked ? (
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <FaBookmark className="w-[16px] h-[16px] text-amber-400" />
              </motion.div>
            ) : (
              <BookmarkCheck className="w-[16px] h-[16px]" />
            )
          }
          label={fmt(stats.bookmarks)}
          title="Save"
        />
        <ActionBtn
          onClick={handleShare}
          active={false}
          hoverColor="green"
          activeColor="text-green-400"
          icon={<FaShare className="w-[16px] h-[16px]" />}
          label={fmt(stats.shares)}
          title="Share"
        />
      </div>

      {/* ── Reply thread ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showThread && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="mt-3 pt-3 border-t border-white/5 overflow-hidden"
          >
            {/* Compose box */}
            {currentUser ? (
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5"
              >
                <Avatar
                  picture={currentUser.picture}
                  name={currentUser.full_name ?? currentUser.name}
                  email={currentUser.email}
                  size={36}
                />
                <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-full px-4 py-2 focus-within:border-sky-500/60 transition-colors">
                  <input
                    ref={inputRef}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e);
                    }}
                    placeholder="Post your reply…"
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
                    maxLength={2000}
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submitting}
                    className="shrink-0 px-3 py-0.5 text-xs font-bold bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white rounded-full transition-colors"
                  >
                    {submitting ? (
                      <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Reply'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-500 mb-4 text-center">Sign in to reply.</p>
            )}

            {/* Scrollable comment list */}
            <div
              ref={scrollBoxRef}
              className="max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
              style={{ scrollbarWidth: 'thin' }}
            >
              {loadingComments ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-slate-800 border-t-sky-500 rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No replies yet. Start the conversation!</p>
                </div>
              ) : (
                <div>
                  {comments.map((comment, idx) => (
                    <CommentRow
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUser?.id}
                      isLast={idx === comments.length - 1}
                      isNew={newCommentIds.has(comment.id)}
                      isProBite={isProBite}
                      editing={editing?.id === comment.id ? editing : null}
                      onLike={() => handleLikeComment(comment.id)}
                      onDelete={() => handleDelete(comment.id)}
                      onEdit={() => handleEditClick(comment)}
                      onEditChange={text => setEditing(e => ({ ...e, text }))}
                      onEditSave={handleSaveEdit}
                      onEditCancel={() => setEditing(null)}
                      fmtTime={fmtTime}
                      fmt={fmt}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ActionBtn
// ─────────────────────────────────────────────────────────────────────────────

function ActionBtn({ onClick, active, hoverColor, activeColor, icon, label, title }) {
  const hoverMap = {
    sky:   'hover:bg-sky-400/10   hover:text-sky-400',
    rose:  'hover:bg-rose-500/10  hover:text-rose-400',
    amber: 'hover:bg-amber-400/10 hover:text-amber-400',
    green: 'hover:bg-green-400/10 hover:text-green-400',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      title={title}
      className={`
        group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-slate-500
        transition-colors duration-150
        ${hoverMap[hoverColor]}
        ${active ? activeColor : ''}
      `}
    >
      {icon}
      {label && (
        <span className="text-xs font-medium tabular-nums leading-none">{label}</span>
      )}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CommentRow
// ─────────────────────────────────────────────────────────────────────────────

function CommentRow({
  comment,
  currentUserId,
  isLast,
  isNew,
  isProBite,
  editing,
  onLike,
  onDelete,
  onEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
  fmtTime,
  fmt,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isOwn = comment.user_id === currentUserId;
  const userLiked = comment.liked_by?.includes(currentUserId);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -20, scale: 0.98 } : false}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex gap-3 py-3 ${!isLast ? 'border-b border-white/5' : ''} ${isNew ? 'bg-sky-400/5 rounded-xl px-2 -mx-2' : ''}`}
    >
      {/* Avatar + thread connector */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 36 }}>
        <div className="relative">
          <Avatar
            picture={comment.user_avatar_url}
            name={comment.user_name}
            email={comment.user_id?.includes('@') ? comment.user_id : null}
            size={36}
          />
          {isNew && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-sky-400 rounded-full border-2 border-slate-900"
              title="New"
            />
          )}
        </div>
        {!isLast && <div className="w-px flex-1 mt-2 bg-slate-800/80" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">

        {/* Header row */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm font-bold text-white truncate">{comment.user_name}</span>
          <span className="text-slate-600 text-xs shrink-0">·</span>
          <span className="text-xs text-slate-500 shrink-0">{fmtTime(comment.created_at)}</span>
          {comment.is_edited && (
            <span className="text-[10px] text-slate-600 shrink-0">(edited)</span>
          )}
          {isNew && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-1.5 flex items-center gap-0.5 text-[10px] font-bold text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded-full"
            >
              <Sparkles className="w-2.5 h-2.5" />
              NEW
            </motion.span>
          )}

          {/* Owner menu */}
          {isOwn && (
            <div className="relative ml-auto shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(m => !m)}
                className="p-1 text-slate-700 hover:text-slate-300 hover:bg-slate-800 rounded-full transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-7 z-20 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-36 py-1 overflow-hidden"
                  >
                    <button
                      onClick={() => { onEdit(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                      {!isProBite ? (
                        <span className="ml-auto text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                          PRO
                        </span>
                      ):<GoVerified className ="px-1.5 py-0.5" />}
                    </button>
                    <button
                      onClick={() => { onDelete(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Body — edit mode or read mode */}
        {editing ? (
          <div className="flex gap-2 mt-1">
            <input
              autoFocus
              value={editing.text}
              onChange={e => onEditChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onEditSave();
                if (e.key === 'Escape') onEditCancel();
              }}
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-500/50 rounded-xl px-3 py-1.5 text-sm text-white outline-none transition-colors"
            />
            <button
              onClick={onEditSave}
              className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onEditCancel}
              className="p-1.5 text-slate-500 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-300 leading-relaxed break-words">{comment.content}</p>

            {/* Like button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onLike}
              className={`mt-2 flex items-center gap-1 transition-colors ${
                userLiked ? 'text-rose-500' : 'text-slate-600 hover:text-rose-400'
              }`}
            >
              {userLiked ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  <FaHeart className="w-3.5 h-3.5 fill-current" />
                </motion.div>
              ) : (
                <FaRegHeart className="w-3.5 h-3.5" />
              )}
              {comment.likes > 0 && (
                <span className="text-xs tabular-nums">{fmt(comment.likes)}</span>
              )}
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}
