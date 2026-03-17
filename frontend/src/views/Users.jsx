import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users as UsersIcon, Search, ShieldAlert, ShieldCheck,
  Shield, Clock, Mail
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name }) {
  const initials = name
    ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : '??';
  return (
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-kavach-green/20 group-hover:border-kavach-green/40 transition-all font-orbitron text-lg font-black text-kavach-green"
      style={{ background: 'rgba(0,255,156,0.07)' }}>
      {initials}
    </div>
  );
}

// ── Time helper ───────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return 'Unknown';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

const ROLE_COLORS = {
  admin: '#A855F7', organizer: '#A855F7',
  analyst: '#00B4D8', engineer: '#FFD600',
  developer: '#00B4D8', employee: '#00FF9C',
};

export default function Users() {
  const { userProfile } = useAuth();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Real-time Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => {
      // fallback if createdAt index missing — try without orderBy
      onSnapshot(collection(db, 'users'), snap => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    });
    return unsub;
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.industry?.toLowerCase().includes(q);
  });

  const stats = [
    { label: 'Total Members',   value: users.length,                                         color: '#FFFFFF',  icon: UsersIcon },
    { label: 'Verified',        value: users.filter(u => u.emailVerified || u.provider === 'google.com').length, color: '#00FF9C', icon: ShieldCheck },
    { label: 'Admins',          value: users.filter(u => u.role === 'admin' || u.role === 'organizer').length,   color: '#A855F7', icon: Shield },
    { label: 'Recent (24h)',    value: users.filter(u => {
        if (!u.createdAt) return false;
        const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
        return Date.now() - d.getTime() < 86400000;
      }).length, color: '#60A5FA', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6 pt-20 md:pt-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-kavach-green/20"
            style={{ background: 'rgba(0,255,156,0.08)' }}>
            <UsersIcon size={22} className="text-kavach-green" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-extrabold text-white tracking-tight">USER DIRECTORY</h2>
            <p className="text-xs text-gray-500">
              {loading ? 'Loading...' : `${users.length} registered members · Live`}
            </p>
          </div>
        </div>
        <div className="relative w-80">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter by name, email, or role..."
            className="w-full pl-11 pr-4 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl
              text-white placeholder-gray-600 focus:outline-none focus:border-kavach-green/40 transition-all font-mono"
          />
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5 flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5"
              style={{ background: `${s.color}10` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{s.label}</p>
              <p className="font-orbitron text-xl font-black text-white">{loading ? '—' : s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* User grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass-card p-6 animate-pulse space-y-4">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-white/5 rounded" />
              <div className="h-3 bg-white/5 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <UsersIcon size={48} className="text-kavach-green opacity-20" />
          <p className="font-orbitron text-white text-lg uppercase tracking-widest">No users found</p>
          <p className="text-gray-600 text-sm">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((user, i) => {
              const roleColor = ROLE_COLORS[user.role?.toLowerCase()] ?? '#6b7280';
              return (
                <motion.div key={user.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card p-6 border-white/10 hover:border-kavach-green/20 transition-all group shadow-xl hover:shadow-2xl flex flex-col">

                  {/* User header */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="relative">
                      <Avatar name={user.name || user.email} />
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0B0B0B] bg-kavach-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-base font-extrabold text-white truncate">{user.name || 'Unnamed User'}</h3>
                      {user.email && (
                        <p className="text-[10px] text-gray-500 font-mono truncate flex items-center gap-1 mt-0.5">
                          <Mail size={9} /> {user.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2.5 flex-1 mb-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Role</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider"
                        style={{ color: roleColor }}>
                        {user.role || 'member'}
                      </span>
                    </div>
                    {user.industry && (
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Industry</span>
                        <span className="text-[10px] text-gray-300 font-bold uppercase">{user.industry}</span>
                      </div>
                    )}
                    {user.teamSize && (
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Team Size</span>
                        <span className="text-[10px] text-gray-300 font-bold">{user.teamSize}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Joined</span>
                      <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                        <Clock size={9} /> {timeAgo(user.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-white/5">
                    <p className="font-mono text-[9px] text-gray-700 truncate">UID: {user.id}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}