import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Send, Heart, MessageCircle, Trash2, Shield,
  ChevronDown, ChevronUp, AlertTriangle, Flame, Clock
} from 'lucide-react';
import { db } from '../firebase';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  serverTimestamp, query, orderBy, updateDoc, arrayUnion, arrayRemove, getCountFromServer
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// ── Avatar helper ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 8, ring = false }) {
  const initials = name
    ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : '??';
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center font-orbitron font-black text-xs flex-shrink-0 ${ring ? 'ring-2 ring-kavach-green/40' : ''}`}
      style={{ background: 'rgba(0,255,156,0.1)', color: '#00FF9C', border: '1px solid rgba(0,255,156,0.3)' }}
    >
      {initials}
    </div>
  );
}

// ── Time ago ─────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Comment item ──────────────────────────────────────────────────────────────
function CommentItem({ comment, currentUser, onDelete }) {
  const isOwn = comment.userId === currentUser?.uid;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 py-3 border-b border-white/5 last:border-0"
    >
      <Avatar name={comment.userName} size={7} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-black text-white">{comment.userName}</span>
          <span className="text-[10px] text-gray-600 font-mono">{timeAgo(comment.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed" style={{ wordBreak: 'break-word' }}>{comment.content}</p>
      </div>
      {isOwn && (
        <button onClick={() => onDelete(comment.id)} className="text-gray-700 hover:text-red-500 transition-colors flex-shrink-0 mt-1">
          <Trash2 size={12} />
        </button>
      )}
    </motion.div>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, userProfile }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState([]);
  const [commentText, setCommentText]   = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const textareaRef = useRef(null);

  const isOwn    = post.userId === currentUser?.uid;
  const liked    = post.likes?.includes(currentUser?.uid);
  const likeCount = post.likes?.length ?? 0;

  // Load comments only when expanded
  useEffect(() => {
    if (!showComments) return;
    const q = query(
      collection(db, 'community_posts', post.id, 'comments'),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [showComments, post.id]);

  const toggleLike = async () => {
    const ref = doc(db, 'community_posts', post.id);
    if (liked) {
      await updateDoc(ref, { likes: arrayRemove(currentUser.uid) });
    } else {
      await updateDoc(ref, { likes: arrayUnion(currentUser.uid) });
    }
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'community_posts', post.id, 'comments'), {
        content: text,
        userId: currentUser.uid,
        userName: currentUser.displayName || userProfile?.name || 'Anonymous',
        timestamp: serverTimestamp(),
      });
      await updateDoc(doc(db, 'community_posts', post.id), {
        commentCount: (post.commentCount ?? 0) + 1
      });
      setCommentText('');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId) => {
    await deleteDoc(doc(db, 'community_posts', post.id, 'comments', commentId));
    await updateDoc(doc(db, 'community_posts', post.id), {
      commentCount: Math.max((post.commentCount ?? 1) - 1, 0)
    });
  };

  const deletePost = async () => {
    await deleteDoc(doc(db, 'community_posts', post.id));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl bg-black/40 border border-white/5 overflow-hidden"
    >
      {/* Post header */}
      <div className="flex items-start gap-3 p-5 pb-4">
        <Avatar name={post.userName} size={9} ring />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-white text-sm">{post.userName}</span>
            {post.role && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest"
                style={{ background: 'rgba(0,255,156,0.1)', color: '#00FF9C', border: '1px solid rgba(0,255,156,0.2)' }}>
                {post.role}
              </span>
            )}
            <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1 ml-auto">
              <Clock size={9} /> {timeAgo(post.timestamp)}
            </span>
          </div>
        </div>
        {isOwn && (
          <button onClick={deletePost} className="text-gray-700 hover:text-red-500 transition-colors ml-2 flex-shrink-0">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Post content */}
      <div className="px-5 pb-4">
        <p className="text-sm text-gray-200 leading-relaxed" style={{ wordBreak: 'break-word' }}>{post.content}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-white/5">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-xs font-bold transition-all ${liked ? 'text-kavach-green' : 'text-gray-600 hover:text-white'}`}
        >
          <motion.div whileTap={{ scale: 1.4 }} transition={{ type: 'spring', stiffness: 400 }}>
            <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
          </motion.div>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-white transition-colors"
        >
          <MessageCircle size={14} />
          {(post.commentCount ?? 0) > 0 && <span>{post.commentCount}</span>}
          <span className="ml-0.5">{showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/5 bg-black/20 overflow-hidden"
          >
            <div className="p-4 space-y-1 max-h-64 overflow-y-auto">
              {comments.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-4">No comments yet. Be the first!</p>
              )}
              {comments.map(c => (
                <CommentItem key={c.id} comment={c} currentUser={currentUser} onDelete={deleteComment} />
              ))}
            </div>

            {/* Comment input */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus-within:border-kavach-green/30 transition-all">
                <Avatar name={currentUser?.displayName} size={6} />
                <input
                  ref={textareaRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitComment(); } }}
                  placeholder="Write a comment..."
                  className="flex-1 bg-transparent font-mono text-xs text-gray-300 placeholder:text-gray-700 focus:outline-none"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={submitComment}
                  disabled={!commentText.trim() || submitting}
                  className={`flex-shrink-0 transition-colors ${commentText.trim() ? 'text-kavach-green' : 'text-gray-700'}`}
                >
                  <Send size={14} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main community page ───────────────────────────────────────────────────────
export default function Community() {
  const { currentUser, userProfile } = useAuth();
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [postText, setPostText]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [memberCount, setMemberCount] = useState(null);
  const textareaRef = useRef(null);
  const bottomRef   = useRef(null);

  // Real-time posts feed
  useEffect(() => {
    const q = query(collection(db, 'community_posts'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Live member count from users collection
  useEffect(() => {
    getCountFromServer(collection(db, 'users')).then(snap => {
      setMemberCount(snap.data().count);
    }).catch(() => {});
  }, []);

  const submitPost = async () => {
    const text = postText.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'community_posts'), {
        content: text,
        userId: currentUser.uid,
        userName: currentUser.displayName || userProfile?.name || 'Anonymous',
        role: userProfile?.role || 'member',
        likes: [],
        commentCount: 0,
        timestamp: serverTimestamp(),
      });
      setPostText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Guard — only for logged in users (already handled by App.jsx auth, but belt & suspenders)
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="p-5 rounded-3xl bg-kavach-green/5 border border-kavach-green/10">
          <Shield size={48} className="text-kavach-green opacity-40" />
        </div>
        <div>
          <h2 className="font-orbitron font-black text-white text-2xl uppercase tracking-wide mb-2">Members Only</h2>
          <p className="text-gray-500 text-sm">You must be logged in to access the community.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/5">
          <AlertTriangle size={14} className="text-red-400" />
          <span className="text-xs text-red-400 font-bold uppercase tracking-widest">Access Restricted</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-24 md:pt-0">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-kavach-green/10 border border-kavach-green/20">
            <Users size={20} className="text-kavach-green" />
          </div>
          <div>
            <h1 className="font-orbitron font-black text-white text-xl uppercase tracking-tight">
              Kavach <span className="text-kavach-green">Community</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
              {memberCount !== null ? `${memberCount} members` : 'Loading...'} · Real-time · Members Only
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-kavach-green/60">
          <div className="w-1.5 h-1.5 rounded-full bg-kavach-green animate-pulse" />
          LIVE
        </div>
      </motion.div>

      {/* Trending badge */}
      {posts.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/30 border border-white/5 w-fit">
          <Flame size={13} className="text-orange-400" />
          <span className="text-xs text-gray-400 font-bold">{posts.length} discussions · Join the conversation</span>
        </div>
      )}

      {/* Post composer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="rounded-2xl bg-black/40 border border-white/10 focus-within:border-kavach-green/30 transition-all p-4">
        <div className="flex gap-3">
          <Avatar name={currentUser.displayName || userProfile?.name} size={9} ring />
          <div className="flex-1 space-y-3">
            <textarea
              ref={textareaRef}
              value={postText}
              onChange={e => {
                setPostText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submitPost(); }}
              placeholder="Share a threat intel tip, ask a question, or start a discussion... (Ctrl+Enter to post)"
              rows={2}
              className="w-full bg-transparent font-mono text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none resize-none min-h-[48px] leading-6"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-600 font-mono">{postText.length} chars</span>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={submitPost}
                disabled={!postText.trim() || submitting}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-orbitron text-[10px] font-black uppercase tracking-widest transition-all ${
                  postText.trim() && !submitting
                    ? 'bg-kavach-green text-black shadow-[0_0_12px_rgba(0,255,156,0.2)]'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
              >
                <Send size={12} />
                {submitting ? 'Posting...' : 'Post'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Posts feed */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl bg-black/40 border border-white/5 p-5 animate-pulse space-y-3">
              <div className="flex gap-3 items-center">
                <div className="w-9 h-9 rounded-full bg-white/5" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 bg-white/5 rounded" />
                  <div className="h-2.5 w-16 bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-3/4 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Users size={48} className="text-kavach-green opacity-20" />
          <p className="font-orbitron text-white text-lg uppercase tracking-widest">No posts yet</p>
          <p className="text-gray-600 text-sm">Be the first to share something with the community!</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                userProfile={userProfile}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      <div ref={bottomRef} className="h-8" />
    </div>
  );
}