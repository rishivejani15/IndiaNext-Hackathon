import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Chrome, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, googleLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError('Access Denied: Invalid credentials or protocol failure.');
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
        <div className="absolute top-2 right-2 opacity-10 pointer-events-none">
          <img src="/kavach-logo.svg" alt="Kavach" className="w-28 h-28 object-contain" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-8">
            <img src="/kavach-logo.svg" alt="Kavach logo" className="w-20 h-20 mb-4 object-contain drop-shadow-[0_0_18px_rgba(0,255,156,0.35)]" />
            <h1 className="font-heading text-2xl font-bold tracking-widest text-kavach-green">KAVACH</h1>
            <p className="text-gray-400 text-xs mt-1 font-heading tracking-tighter">SECURE ACCESS PROTOCOL</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
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
              </div>

              <div className="space-y-4">
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

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full max-w-xs bg-neon/10 border border-neon/50 text-neon font-heading text-xs tracking-widest py-3.5 rounded-lg hover:bg-neon/20 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-neon/10 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Initialize Session'}
              </button>
            </div>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-heading tracking-widest">
              <span className="bg-[#121212] px-4 text-gray-500">OR PROVIDE EXTERNAL SYNC</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 text-gray-300 font-heading text-[10px] tracking-widest py-3 rounded-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Chrome size={16} className="text-neon" />
            Integrate with Google
          </button>

          <p className="mt-8 text-center text-xs text-gray-500 font-medium">
            New operative?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-neon hover:underline cursor-pointer font-heading tracking-tighter"
            >
              REGISTER CREDENTIALS
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

