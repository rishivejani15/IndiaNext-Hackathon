"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, User, KeyRound, Briefcase } from 'lucide-react';
import { collection, doc, getDocs, limit, query, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

function generateOrgCode() {
  const seed = Math.random().toString(36).slice(2, 8).toUpperCase();
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `ORG-${seed}-${stamp}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, userProfile, loading, needsOnboarding } = useAuth();

  const [accountType, setAccountType] = useState('individual');
  const [profession, setProfession] = useState('');
  const [organizationMode, setOrganizationMode] = useState('create');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!needsOnboarding) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, needsOnboarding, router]);

  useEffect(() => {
    if (!userProfile) return;
    setAccountType(userProfile.accountType || 'individual');
    setProfession(userProfile.profession || '');
    setOrganizationMode(userProfile.organizationMode || 'create');
    setOrganizationName(userProfile.organizationName || '');
    setOrganizationCode(userProfile.organizationCode || '');
  }, [userProfile]);

  const canSubmit = useMemo(() => {
    if (accountType === 'individual') return Boolean(profession.trim());
    if (organizationMode === 'join') return Boolean(organizationCode.trim());
    return Boolean(organizationName.trim() && organizationCode.trim());
  }, [accountType, profession, organizationMode, organizationName, organizationCode]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser || !canSubmit) return;

    setSaving(true);
    setError('');
    try {
      let finalOrgName = organizationName.trim();
      const finalOrgCode = organizationCode.trim().toUpperCase();

      if (accountType === 'organization' && organizationMode === 'join') {
        const q = query(
          collection(db, 'users'),
          where('accountType', '==', 'organization'),
          where('organizationMode', '==', 'create'),
          where('organizationCode', '==', finalOrgCode),
          limit(1),
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setError('Invalid organization code. Please check with your admin.');
          setSaving(false);
          return;
        }
        const orgOwner = snap.docs[0].data();
        finalOrgName = orgOwner.organizationName || finalOrgName;
      }

      const role = accountType === 'organization' && organizationMode === 'create'
        ? 'organizer'
        : accountType === 'organization'
        ? 'member'
        : 'individual';

      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        name: currentUser.displayName || userProfile?.name || 'Operative',
        email: currentUser.email,
        role,
        accountType,
        profession: accountType === 'individual' ? profession.trim() : '',
        organizationMode: accountType === 'organization' ? organizationMode : null,
        organizationName: accountType === 'organization' ? finalOrgName : '',
        organizationCode: accountType === 'organization' ? finalOrgCode : '',
        provider: currentUser.providerData?.[0]?.providerId || 'google.com',
        emailVerified: currentUser.emailVerified,
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }, { merge: true });

      router.push('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center px-4">
      <motion.form
        onSubmit={saveProfile}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card neon-border w-full max-w-2xl p-8 md:p-10 space-y-7"
      >
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-kavach-green tracking-wider uppercase">
            Complete Account Setup
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Tell us whether you are an individual or organization member before entering dashboard.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300 font-medium">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType('individual')}
            className={`rounded-xl border p-4 text-left transition-all ${
              accountType === 'individual'
                ? 'border-kavach-green/60 bg-kavach-green/10'
                : 'border-white/10 bg-white/5 hover:border-kavach-green/30'
            }`}
          >
            <div className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wider">
              <User size={14} /> Individual
            </div>
            <p className="text-xs text-gray-400 mt-2">Single user account with profession profile.</p>
          </button>

          <button
            type="button"
            onClick={() => setAccountType('organization')}
            className={`rounded-xl border p-4 text-left transition-all ${
              accountType === 'organization'
                ? 'border-kavach-green/60 bg-kavach-green/10'
                : 'border-white/10 bg-white/5 hover:border-kavach-green/30'
            }`}
          >
            <div className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wider">
              <Building2 size={14} /> Organization
            </div>
            <p className="text-xs text-gray-400 mt-2">Create or join an organization workspace.</p>
          </button>
        </div>

        {accountType === 'individual' ? (
          <div className="space-y-2">
            <label className="text-[11px] font-heading font-bold tracking-widest uppercase text-gray-400">
              Profession
            </label>
            <div className="relative">
              <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. Software Engineer, Analyst"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-kavach-green/50 outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrganizationMode('create')}
                className={`rounded-xl border px-4 py-3 text-sm font-heading font-bold uppercase tracking-wider transition-all ${
                  organizationMode === 'create'
                    ? 'border-kavach-green/60 bg-kavach-green/10 text-kavach-green'
                    : 'border-white/10 text-gray-300 hover:border-kavach-green/30'
                }`}
              >
                Create Organization
              </button>
              <button
                type="button"
                onClick={() => setOrganizationMode('join')}
                className={`rounded-xl border px-4 py-3 text-sm font-heading font-bold uppercase tracking-wider transition-all ${
                  organizationMode === 'join'
                    ? 'border-kavach-green/60 bg-kavach-green/10 text-kavach-green'
                    : 'border-white/10 text-gray-300 hover:border-kavach-green/30'
                }`}
              >
                Join Organization
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-heading font-bold tracking-widest uppercase text-gray-400">
                Organization Name
              </label>
              <input
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Enter organization name"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-kavach-green/50 outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-heading font-bold tracking-widest uppercase text-gray-400">
                  Organization Code
                </label>
                {organizationMode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setOrganizationCode(generateOrgCode())}
                    className="text-[10px] font-heading font-bold uppercase tracking-wider text-kavach-green"
                  >
                    Generate Code
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={organizationCode}
                  onChange={(e) => setOrganizationCode(e.target.value.toUpperCase())}
                  placeholder={organizationMode === 'create' ? 'Generate organization code' : 'Enter invite code'}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-kavach-green/50 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="w-full rounded-xl py-3.5 font-heading text-xs font-extrabold tracking-widest uppercase border border-kavach-green/50 bg-kavach-green/10 text-kavach-green hover:bg-kavach-green/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Continue to Dashboard'}
        </button>
      </motion.form>
    </div>
  );
}
