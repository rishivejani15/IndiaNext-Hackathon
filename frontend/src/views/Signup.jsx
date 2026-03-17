import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Shield, ChevronDown, Chrome, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Signup({ onSwitchToLogin }) {
  const [role, setRole] = useState('individual');
  const [accountType, setAccountType] = useState('individual');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, googleLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signup(email, password, name, role, accountType);
      // Success will trigger App.jsx update via useAuth hook
    } catch (err) {
      setError('Registration Failed: Security protocols rejected credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await googleLogin();
    } catch (err) {
      setError('Sync Failed: Google authentication rejected.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card neon-border p-10 w-full max-w-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <UserPlus size={120} className="text-neon" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-xl border border-neon/30 flex items-center justify-center mb-4 bg-neon/5 pulse-border">
              <UserPlus className="text-neon" size={32} />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-widest gradient-text">KAVACH AI</h1>
            <p className="text-gray-400 text-xs mt-1 font-heading tracking-tighter">CREATE DEFENDER IDENTITY</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-xs font-medium"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-heading text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      disabled={loading}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-neon/50 outline-none transition-all font-medium disabled:opacity-50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-heading text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">
                    Access Identity
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Shield size={18} />
                    </div>
                    <select
                      value={accountType}
                      onChange={(e) => {
                        setAccountType(e.target.value);
                        // Map account type to role
                        if (e.target.value === 'admin') setRole('organizer');
                        else setRole(e.target.value);
                      }}
                      disabled={loading}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-10 text-sm focus:border-neon/50 outline-none transition-all appearance-none font-medium cursor-pointer disabled:opacity-50"
                    >
                      <option value="individual" className="bg-neutral-900">Individual Agent</option>
                      <option value="organization" className="bg-neutral-900">Organization</option>
                      <option value="admin" className="bg-neutral-900">System Organizer (Admin)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-heading text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="agent@kavach.ai"
                      disabled={loading}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-neon/50 outline-none transition-all font-medium disabled:opacity-50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-heading text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">
                    Access Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-neon/50 outline-none transition-all font-medium disabled:opacity-50"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neon/10 border border-neon/50 text-neon font-heading text-xs tracking-widest py-3.5 rounded-lg hover:bg-neon/20 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-neon/10 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Onboard Operative'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-heading tracking-widest">
              <span className="bg-[#121212] px-4 text-gray-500">OR JOIN VIA EXTERNAL SYNC</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 text-gray-300 font-heading text-[10px] tracking-widest py-3 rounded-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Chrome size={16} className="text-neon" />
            Sign Up with Google
          </button>

          <p className="mt-8 text-center text-xs text-gray-500 font-medium">
            Existing operative?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-neon hover:underline cursor-pointer font-heading tracking-tighter"
            >
              ESTABLISH SESSION
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
