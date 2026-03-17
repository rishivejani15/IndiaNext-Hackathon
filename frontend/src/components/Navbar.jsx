import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Bell, Lock, Menu, X } from 'lucide-react';

const BASE_NAV_ITEMS = ['Dashboard', 'ThreatGuard', 'Steganography', 'Deepfake', 'Logs', 'News', 'Community', 'Settings'];

export default function Navbar({ activePage, setActivePage, user, profile, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getUserInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const currentRole = profile?.role || 'individual';
  const accountType = profile?.accountType || 'individual';
  const canSeeUsers = currentRole === 'admin' || currentRole === 'organizer' || accountType === 'organization';
  const navItems = canSeeUsers ? [...BASE_NAV_ITEMS.slice(0, 9), 'Users', 'Settings'] : BASE_NAV_ITEMS;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 overflow-visible"
      style={{ background: 'rgba(11,11,11,0.9)', backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-between gap-3 px-3 py-3 md:gap-4 md:px-6 md:py-4">

        {/* Logo */}
        <div className="flex items-center gap-2 min-w-0 shrink-0 md:gap-2.5">
          <div
            className="relative flex h-9 w-9 items-center justify-center rounded-lg neon-border scan-effect md:h-10 md:w-10"
            style={{ background: 'rgba(0,255,156,0.08)' }}
          >
            <Image
              src="/kavach-logo.svg"
              alt="Kavach logo"
              width={28}
              height={28}
              className="h-6 w-6 object-contain md:h-7 md:w-7"
              priority
            />
          </div>
          <div className="min-w-0 leading-none">
            <h1 className="truncate font-heading text-sm font-extrabold text-white tracking-tight md:text-lg">KAVACH</h1>
            <p className="mt-0.5 hidden font-sans text-[10px] font-medium uppercase tracking-wide text-gray-500 md:block">Explainable AI Defense</p>
          </div>
        </div>

        {/* Nav items — center */}
        <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
          {navItems.map((item, i) => (
            <button
              key={item}
              onClick={() => setActivePage(item)}
              className={`nav-btn whitespace-nowrap ${activePage === item ? 'active' : ''}`}
              style={{ padding: '9px 16px', fontSize: '0.75rem' }}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Right: Bell + Avatar + Logout */}
        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <button
            className="relative w-9 h-9 rounded-lg flex items-center justify-center border border-white/10 hover:border-kavach-green/40 transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <Bell size={16} className="text-gray-400" />
            <span
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-black flex items-center justify-center font-orbitron"
              style={{ background: '#FF3D3D', color: '#fff', boxShadow: '0 0 6px rgba(255,61,61,0.6)' }}
            >
              7
            </span>
          </button>

          <div
            title={currentRole.toUpperCase()}
            className="relative w-9 h-9 rounded-full flex items-center justify-center cursor-pointer font-heading text-[11px] font-bold border"
            style={{
              background: 'rgba(0,255,156,0.1)',
              borderColor: 'rgba(0,255,156,0.4)',
              color: '#00FF9C',
              boxShadow: '0 0 10px rgba(0,255,156,0.2)',
            }}
          >
            {getUserInitials(profile?.name || user?.displayName || user?.email)}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0B0B0B]"
              style={{
                background: currentRole === 'organizer' ? '#FFD600' : '#00FF9C',
                boxShadow: `0 0 4px ${currentRole === 'organizer' ? '#FFD600' : '#00FF9C'}`,
              }}
            />
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
            title="Logout session"
          >
            <Lock size={15} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <div
            title={currentRole.toUpperCase()}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border font-heading text-[10px] font-bold"
            style={{
              background: 'rgba(0,255,156,0.1)',
              borderColor: 'rgba(0,255,156,0.4)',
              color: '#00FF9C',
              boxShadow: '0 0 10px rgba(0,255,156,0.2)',
            }}
          >
            {getUserInitials(profile?.name || user?.displayName || user?.email)}
            <div
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#0B0B0B]"
              style={{
                background: currentRole === 'organizer' ? '#FFD600' : '#00FF9C',
                boxShadow: `0 0 4px ${currentRole === 'organizer' ? '#FFD600' : '#00FF9C'}`,
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-300 transition-colors hover:border-kavach-green/40 hover:text-kavach-green"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="mx-3 mb-3 rounded-2xl border border-white/10 bg-[#0b0f0d]/95 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.45)] md:hidden"
          >
            <div className="mb-2 grid grid-cols-1 gap-1">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setActivePage(item);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${activePage === item
                    ? 'bg-kavach-green/10 text-kavach-green border border-kavach-green/20'
                    : 'text-gray-200 hover:bg-white/5 hover:text-white border border-transparent'}`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <button
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <Bell size={15} />
                  <span
                    className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full font-orbitron text-[8px] font-black"
                    style={{ background: '#FF3D3D', color: '#fff', boxShadow: '0 0 6px rgba(255,61,61,0.6)' }}
                  >
                    7
                  </span>
                </button>
                <div className="leading-none">
                  <p className="font-heading text-[11px] font-bold uppercase text-white">{currentRole}</p>
                  <p className="text-[10px] text-gray-500">Secure session active</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400"
                title="Logout session"
              >
                <Lock size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
