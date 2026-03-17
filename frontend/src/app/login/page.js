"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Login from '../../views/Login';
import Signup from '../../views/Signup';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Home } from 'lucide-react';

/* ── same seeded noise the landing page uses ── */
function seededNoise(seed) {
  const v = Math.sin(seed * 9999) * 10000;
  return v - Math.floor(v);
}

function MatrixRain() {
  const columns = Array.from({ length: 40 }, (_, i) => ({
    left: `${(((i / 40) * 100) + (seededNoise(i + 1) - 0.5) * 2).toFixed(5)}%`,
    delay: `${(seededNoise(i + 101) * 8).toFixed(3)}s`,
    duration: `${(6 + seededNoise(i + 201) * 10).toFixed(3)}s`,
    chars: Array.from({ length: 35 }, (_, j) =>
      seededNoise(i * 100 + j + 401) > 0.5 ? '0' : '1'
    ).join(''),
  }));

  return (
    <div className="matrix-rain">
      {columns.map((col, i) => (
        <span
          key={i}
          className="col"
          style={{
            left: col.left,
            animationDelay: col.delay,
            animationDuration: col.duration,
          }}
        >
          {col.chars}
        </span>
      ))}
    </div>
  );
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { currentUser, loading, needsOnboarding } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      router.push(needsOnboarding ? '/onboarding' : '/dashboard');
    }
  }, [currentUser, loading, needsOnboarding, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center cyber-grid">
        <div className="text-[#00FF9C] font-heading tracking-widest animate-pulse text-sm">
          CHECKING CREDENTIALS...
        </div>
      </div>
    );
  }

  if (currentUser) return null;

  return (
    <div className="relative min-h-screen bg-[#0B0B0B] cyber-grid overflow-hidden">
      {/* Matrix rain background */}
      <MatrixRain />

      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.12)_0%,rgba(0,255,156,0.03)_40%,transparent_70%)] blur-3xl" />
        <div className="absolute right-[-8rem] bottom-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.10)_0%,rgba(0,255,156,0.02)_40%,transparent_70%)] blur-3xl" />
      </div>

      {/* Home button — top left */}
      <div className="fixed top-5 left-5 z-50">
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-full border border-[#00FF9C]/30 bg-black/60 px-4 py-2 text-[#00FF9C] text-xs font-heading tracking-widest backdrop-blur-md hover:border-[#00FF9C]/70 hover:shadow-[0_0_12px_rgba(0,255,156,0.35)] transition-all"
          >
            <Home size={13} />
            HOME
          </motion.div>
        </Link>
      </div>

      {/* Auth card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center pt-16 pb-8 px-4">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full"
            >
              <Login onSwitchToSignup={() => setIsLogin(false)} />
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full"
            >
              <Signup onSwitchToLogin={() => setIsLogin(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

