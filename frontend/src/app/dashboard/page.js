"use client";

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import dynamic from 'next/dynamic';

/* Minimal floating particle background — matches the original Vite CyberBackground */
const PARTICLES = [
  { left: '8.3%',  top: '14%', color: '#00FF9C', size: 2.4, dur: 7.2, delay: 0.8 },
  { left: '21.6%', top: '63%', color: '#00B4D8', size: 1.8, dur: 5.5, delay: 2.1 },
  { left: '35.5%', top: '31%', color: '#FFD600', size: 1.4, dur: 8.0, delay: 0.3 },
  { left: '49.8%', top: '77%', color: '#00FF9C', size: 2.0, dur: 6.4, delay: 1.5 },
  { left: '63.1%', top: '22%', color: '#00B4D8', size: 1.6, dur: 9.1, delay: 3.2 },
  { left: '74.4%', top: '55%', color: '#FFD600', size: 2.2, dur: 5.8, delay: 0.6 },
  { left: '85.7%', top: '40%', color: '#00FF9C', size: 1.5, dur: 7.6, delay: 2.8 },
  { left: '93.2%', top: '82%', color: '#00B4D8', size: 1.9, dur: 6.9, delay: 1.0 },
];

function CyberBackground() {
  return (
    <>
      {/* Grid */}
      <div className="fixed inset-0 cyber-grid pointer-events-none z-0" style={{ opacity: 0.5 }} />
      {/* Gradient glows */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,255,156,0.05) 0%, transparent 60%)' }} />
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 100% 100%, rgba(0,180,216,0.03) 0%, transparent 60%)' }} />
      {/* Floating dots */}
      {PARTICLES.map((p, i) => (
        <div key={i} className="fixed pointer-events-none z-0 rounded-full"
          style={{
            width: p.size + 'px',
            height: p.size + 'px',
            background: p.color,
            left: p.left,
            top: p.top,
            opacity: 0.35,
            animation: `particle ${p.dur}s ease-in-out ${p.delay}s infinite`,
            boxShadow: `0 0 4px ${p.color}`,
          }}
        />
      ))}
    </>
  );
}

const DashboardView = dynamic(() => import('../../views/Dashboard'), { ssr: false });
const PhishingView = dynamic(() => import('../../views/Phishing'), { ssr: false });
const ThreatMonitorView = dynamic(() => import('../../views/ThreatMonitor'), { ssr: false });
const DeepfakeView = dynamic(() => import('../../views/Deepfake'), { ssr: false });
const SteganographyView = dynamic(() => import('../../views/Steganography'), { ssr: false });
const AIAnalysisView = dynamic(() => import('../../views/AIAnalysis'), { ssr: false });
const LogsView = dynamic(() => import('../../views/Logs'), { ssr: false });
const NewsView = dynamic(() => import('../../views/News'), { ssr: false });
const CommunityView = dynamic(() => import('../../views/Community'), { ssr: false });
const UsersView = dynamic(() => import('../../views/Users'), { ssr: false });
const SettingsView = dynamic(() => import('../../views/Settings'), { ssr: false });

function DashboardLoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-[#00ff41] font-mono tracking-widest animate-pulse">
        INITIALIZING SECURE CONNECTION...
      </div>
    </div>
  );
}

function DashboardPageContent() {
  const [activePage, setActivePage] = useState('Dashboard');
  const { currentUser, userProfile, logout, loading, needsOnboarding } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const PAGE_VIEW_MAP = {
    Dashboard: DashboardView,
    Deepfake: DeepfakeView,
    ThreatGuard: PhishingView,
    Threats: ThreatMonitorView,
    Steganography: SteganographyView,
    AI: AIAnalysisView,
    Logs: LogsView,
    News: NewsView,
    Community: CommunityView,
    Users: UsersView,
    Settings: SettingsView,
  };

  const PAGE_ALIASES = {
    ThreatMonitor: 'Threats',
    Ai: 'AI',
  };

  const normalizePage = (page) => {
    if (!page) return 'Dashboard';
    const decoded = decodeURIComponent(String(page)).trim();
    const resolved = PAGE_ALIASES[decoded] || decoded;
    return Object.prototype.hasOwnProperty.call(PAGE_VIEW_MAP, resolved) ? resolved : 'Dashboard';
  };

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace('/login');
      return;
    }
    if (!loading && currentUser && needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [currentUser, loading, needsOnboarding, router]);

  useEffect(() => {
    const requestedPage = normalizePage(searchParams.get('page'));
    if (requestedPage !== activePage) {
      setActivePage(requestedPage);
    }
  }, [searchParams, activePage]);

  useEffect(() => {
    const urlPage = normalizePage(searchParams.get('page'));
    if (urlPage !== activePage) {
      router.replace(`/dashboard?page=${encodeURIComponent(activePage)}`);
    }
  }, [activePage, searchParams, router]);

  if (loading || !currentUser || needsOnboarding) {
    return <DashboardLoadingScreen />;
  }

  const renderActivePage = () => {
    const ActiveView = PAGE_VIEW_MAP[activePage] || DashboardView;
    return <ActiveView />;
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white font-sans overflow-x-hidden pt-0">
      <CyberBackground />
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        user={currentUser}
        profile={userProfile}
        onLogout={() => {
          logout();
          router.push('/');
        }}
      />
      <main className="p-6 max-w-[1600px] mx-auto">
        {renderActivePage()}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingScreen />}>
      <DashboardPageContent />
    </Suspense>
  );
}
