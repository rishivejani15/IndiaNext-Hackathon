import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Shield, AlertTriangle, Users, Bell, Zap, Server, ShieldAlert,
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import { db } from '../firebase';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * DAY_MS;

const SEVERITY_COLORS = {
  Critical: '#FF3D3D',
  High: '#FF9500',
  Medium: '#FFD600',
  Low: '#00FF9C',
  Info: '#00B4D8',
};

const CHART_COLORS = ['#FF3D3D', '#FF9500', '#FFD600', '#00FF9C', '#00B4D8', '#A855F7', '#F97316', '#38BDF8'];
const SERVICE_META = {
  Deepfake: { color: '#00FF9C', shortLabel: 'Deepfake' },
  Phishing: { color: '#F97316', shortLabel: 'Phishing' },
  Steganography: { color: '#A855F7', shortLabel: 'Stego' },
};

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-xs font-sans border border-white/10 shadow-xl">
        {label ? <p className="text-gray-400 mb-1 font-heading text-[10px] uppercase tracking-wider">{label}</p> : null}
        {payload.map((point) => (
          <p key={point.name} style={{ color: point.color }}>
            {point.name}: <span className="font-bold">{point.value}</span>
          </p>
        ))}
      </div>
    );
  }

  return null;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric <= 1) return clamp01(numeric);
  if (numeric <= 100) return clamp01(numeric / 100);
  return 0;
}

function titleCase(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function classifySeverity(score) {
  if (score >= 0.85) return 'Critical';
  if (score >= 0.65) return 'High';
  if (score >= 0.4) return 'Medium';
  if (score >= 0.18) return 'Low';
  return 'Info';
}

function getDeepfakeRisk(log) {
  const candidates = [
    normalizeScore(log.ai_generated_score),
    normalizeScore(log.fake_probability),
    normalizeScore(log.deepfake_score),
    log.real_probability !== undefined ? 1 - normalizeScore(log.real_probability) : 0,
  ];
  const baseRisk = Math.max(...candidates, 0);
  const confidence = log.confidence !== undefined ? normalizeScore(log.confidence) : 1;
  return clamp01(baseRisk * (confidence || 1));
}

function getPhishingRisk(log) {
  return Math.max(
    normalizeScore(log.fusion?.final_score),
    normalizeScore(log.engines?.phishing?.score ?? log.phishing?.score),
    normalizeScore(log.engines?.url?.score ?? log.url?.score),
    normalizeScore(log.engines?.injection?.score ?? log.injection?.score),
    0,
  );
}

function getStegoRisk(log) {
  const layerScores = Object.values(log.layer_results || {}).map((layer) => normalizeScore(layer?.risk_score));
  const hasPayload = Array.isArray(log.hidden_payloads) && log.hidden_payloads.length > 0;
  return Math.max(normalizeScore(log.risk_score), ...layerScores, hasPayload ? 0.75 : 0);
}

function getPhishingType(log) {
  const firstSignal =
    log.engines?.phishing?.signals?.[0]?.name ||
    log.phishing?.signals?.[0]?.name ||
    log.engines?.url?.signals?.[0]?.name ||
    log.phishing?.attack_type ||
    'Phishing';

  return titleCase(firstSignal);
}

function getStegoType(log) {
  if (log.layer_results?.lsb?.is_injection) return 'Prompt Injection';
  if (Array.isArray(log.hidden_payloads) && log.hidden_payloads.length > 0) return 'Hidden Payload';
  return 'Stego Scan';
}

function buildEvent(service, log, index) {
  const createdAt = toDate(log.timestamp);

  if (service === 'deepfake') {
    const score = getDeepfakeRisk(log);
    return {
      id: log.incident_id || log.filename || `deepfake-${index}`,
      service: 'Deepfake',
      typeLabel: log.input_type === 'video' ? 'Deepfake Video' : 'Deepfake Image',
      score,
      severity: classifySeverity(score),
      date: createdAt,
    };
  }

  if (service === 'phishing') {
    const score = getPhishingRisk(log);
    return {
      id: log.incident_id || `phishing-${index}`,
      service: 'Phishing',
      typeLabel: getPhishingType(log),
      score,
      severity: classifySeverity(score),
      date: createdAt,
    };
  }

  const score = getStegoRisk(log);
  return {
    id: log.incident_id || log.filename || `stego-${index}`,
    service: 'Steganography',
    typeLabel: getStegoType(log),
    score,
    severity: classifySeverity(score),
    date: createdAt,
  };
}

function formatDelta(delta, suffix = 'vs prev 24h') {
  if (!delta) return `0 ${suffix}`;
  return `${delta > 0 ? '+' : ''}${delta} ${suffix}`;
}

function timeAgoFromDate(date) {
  if (!date) return 'No recent scans';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function createLineSeries(events) {
  const bucketSize = 2 * 60 * 60 * 1000;
  const now = new Date();
  const end = new Date(now);
  end.setMinutes(0, 0, 0);
  const startTime = end.getTime() - (11 * bucketSize);

  const buckets = Array.from({ length: 12 }, (_, index) => {
    const bucketTime = new Date(startTime + (index * bucketSize));
    return {
      time: bucketTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      normal: 0,
      suspicious: 0,
      blocked: 0,
    };
  });

  events.forEach((event) => {
    if (!event.date) return;
    const timestamp = event.date.getTime();
    if (timestamp < startTime || timestamp >= startTime + (12 * bucketSize)) return;

    const bucketIndex = Math.min(11, Math.floor((timestamp - startTime) / bucketSize));
    if (event.score < 0.25) buckets[bucketIndex].normal += 1;
    else if (event.score < 0.65) buckets[bucketIndex].suspicious += 1;
    else buckets[bucketIndex].blocked += 1;
  });

  return buckets;
}

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const [time, setTime] = useState(new Date());
  const [deepfakeLogs, setDeepfakeLogs] = useState([]);
  const [phishingLogs, setPhishingLogs] = useState([]);
  const [stegoLogs, setStegoLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [criticalVitals, setCriticalVitals] = useState(null);

  const userName = userProfile?.name || currentUser?.displayName || 'Operative';

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(query(collection(db, 'deepfake_logs')), (snapshot) => {
        setDeepfakeLogs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }),
      onSnapshot(query(collection(db, 'phishing_logs')), (snapshot) => {
        setPhishingLogs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }),
      onSnapshot(query(collection(db, 'stego_logs')), (snapshot) => {
        setStegoLogs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }),
      onSnapshot(query(collection(db, 'users')), (snapshot) => {
        setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  useEffect(() => {
    const userId = currentUser?.uid || 'anonymous';
    const docRef = doc(db, 'critical_activities', userId);

    return onSnapshot(docRef, (snapshot) => {
      if (!snapshot.exists()) {
        setCriticalVitals(null);
        return;
      }
      setCriticalVitals(snapshot.data());
    });
  }, [currentUser]);

  const criticalLastSeen = useMemo(() => {
    if (!criticalVitals?.lastCriticalAt) return 'No critical activity';
    const date = toDate(criticalVitals.lastCriticalAt);
    return date ? timeAgoFromDate(date) : 'No critical activity';
  }, [criticalVitals]);

  const analytics = useMemo(() => {
    const deepfakeEvents = deepfakeLogs.map((log, index) => buildEvent('deepfake', log, index));
    const phishingEvents = phishingLogs.map((log, index) => buildEvent('phishing', log, index));
    const stegoEvents = stegoLogs.map((log, index) => buildEvent('stego', log, index));
    const allEvents = [...deepfakeEvents, ...phishingEvents, ...stegoEvents];

    const now = Date.now();
    const last24hStart = now - DAY_MS;
    const previous24hStart = now - (2 * DAY_MS);
    const last30dStart = now - THIRTY_DAYS_MS;

    const recent24hEvents = allEvents.filter((event) => event.date && event.date.getTime() >= last24hStart);
    const previous24hEvents = allEvents.filter((event) => {
      if (!event.date) return false;
      const timestamp = event.date.getTime();
      return timestamp >= previous24hStart && timestamp < last24hStart;
    });

    const scoringWindow = allEvents.filter((event) => event.date && event.date.getTime() >= last30dStart);
    const scoringBase = recent24hEvents.length ? recent24hEvents : (scoringWindow.length ? scoringWindow : allEvents);

    const computeExposureScore = (events) => {
      if (!events.length) return 0;

      const averageRisk = events.reduce((total, event) => total + event.score, 0) / events.length;
      const highRiskShare = events.filter((event) => event.score >= 0.65).length / events.length;
      const criticalShare = events.filter((event) => event.score >= 0.85).length / events.length;
      const volumePressure = Math.min(1, events.length / 12);

      return Math.round(clamp01((averageRisk * 0.55) + (highRiskShare * 0.2) + (criticalShare * 0.15) + (volumePressure * 0.1)) * 100);
    };

    const riskScore = computeExposureScore(scoringBase);
    const previousRiskScore = computeExposureScore(previous24hEvents.length ? previous24hEvents : scoringWindow);
    const systemSafety = Math.max(0, 100 - riskScore);
    const previousSystemSafety = Math.max(0, 100 - previousRiskScore);

    const alerts24h = recent24hEvents.filter((event) => event.score >= 0.4).length;
    const highRisk24h = recent24hEvents.filter((event) => event.score >= 0.65).length;

    const riskDistributionData = ['Critical', 'High', 'Medium', 'Low', 'Info'].map((severity) => ({
      name: severity,
      value: allEvents.filter((event) => event.severity === severity).length,
      color: SEVERITY_COLORS[severity],
    }));

    const threatTypeMap = new Map();
    allEvents.forEach((event) => {
      threatTypeMap.set(event.typeLabel, (threatTypeMap.get(event.typeLabel) || 0) + 1);
    });

    const threatTypesData = Array.from(threatTypeMap.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8)
      .map(([type, count], index) => ({
        type,
        count,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));

    const lineData = createLineSeries(recent24hEvents);

    const buildServiceSummary = (serviceName, events) => {
      const recentEvents = events.filter((event) => event.date && event.date.getTime() >= last24hStart);
      const previousEvents = events.filter((event) => {
        if (!event.date) return false;
        const timestamp = event.date.getTime();
        return timestamp >= previous24hStart && timestamp < last24hStart;
      });
      const activeWindow = recentEvents.length ? recentEvents : events;
      const averageRisk = activeWindow.length
        ? Math.round((activeWindow.reduce((total, event) => total + event.score, 0) / activeWindow.length) * 100)
        : 0;
      const criticalCount = activeWindow.filter((event) => event.score >= 0.65).length;
      const lastSeen = activeWindow
        .map((event) => event.date)
        .filter(Boolean)
        .sort((left, right) => right.getTime() - left.getTime())[0] || null;

      return {
        service: serviceName,
        color: SERVICE_META[serviceName].color,
        shortLabel: SERVICE_META[serviceName].shortLabel,
        scans: events.length,
        scans24h: recentEvents.length,
        delta24h: recentEvents.length - previousEvents.length,
        averageRisk,
        criticalCount,
        lastSeen,
      };
    };

    const serviceSummaries = [
      buildServiceSummary('Deepfake', deepfakeEvents),
      buildServiceSummary('Phishing', phishingEvents),
      buildServiceSummary('Steganography', stegoEvents),
    ];

    const recentFindings = [...recent24hEvents]
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return (right.date?.getTime() || 0) - (left.date?.getTime() || 0);
      })
      .slice(0, 5)
      .map((event) => ({
        ...event,
        scoreLabel: `${Math.round(event.score * 100)}/100`,
        ago: timeAgoFromDate(event.date),
        color: SEVERITY_COLORS[event.severity],
      }));

    const totalUsers = users.length;
    const systemSafetyColor = systemSafety >= 75 ? '#00FF9C' : systemSafety >= 50 ? '#FFD600' : '#FF3D3D';
    const systemSafetyLabel = systemSafety >= 75 ? 'Stable posture' : systemSafety >= 50 ? 'Needs attention' : 'High exposure';

    return {
      cards: [
        {
          title: 'Total Signals',
          value: allEvents.length,
          subtitle: 'All service scans logged',
          icon: AlertTriangle,
          color: '#FF3D3D',
          trend: 'minus',
          trendValue: `${alerts24h} alerts / 24h`,
          glowing: false,
        },
        {
          title: 'Deepfake Scans',
          value: deepfakeEvents.length,
          subtitle: 'AI media authenticity checks',
          icon: Shield,
          color: '#00FF9C',
          trend: 'minus',
          trendValue: formatDelta(
            recent24hEvents.filter((event) => event.service === 'Deepfake').length -
            previous24hEvents.filter((event) => event.service === 'Deepfake').length,
          ),
          glowing: false,
        },
        {
          title: 'Phishing Scans',
          value: phishingEvents.length,
          subtitle: 'Social engineering analysis',
          icon: ShieldAlert,
          color: '#F97316',
          trend: 'minus',
          trendValue: formatDelta(
            recent24hEvents.filter((event) => event.service === 'Phishing').length -
            previous24hEvents.filter((event) => event.service === 'Phishing').length,
          ),
          glowing: false,
        },
        {
          title: 'Stego Scans',
          value: stegoEvents.length,
          subtitle: 'Hidden payload inspections',
          icon: Bell,
          color: '#A855F7',
          trend: 'minus',
          trendValue: formatDelta(
            recent24hEvents.filter((event) => event.service === 'Steganography').length -
            previous24hEvents.filter((event) => event.service === 'Steganography').length,
          ),
          glowing: false,
        },
        {
          title: 'Unified Risk',
          value: riskScore,
          unit: '/100',
          subtitle: 'Current exposure from recent scans',
          icon: Zap,
          color: '#FFD600',
          trend: riskScore > previousRiskScore ? 'up' : riskScore < previousRiskScore ? 'down' : 'minus',
          trendValue: `${Math.abs(riskScore - previousRiskScore)} pts`,
          glowing: false,
        },
        {
          title: 'System Safety',
          value: systemSafety,
          unit: '/100',
          subtitle: systemSafetyLabel,
          icon: Users,
          color: systemSafetyColor,
          trend: systemSafety > previousSystemSafety ? 'up' : systemSafety < previousSystemSafety ? 'down' : 'minus',
          trendValue: `${Math.abs(systemSafety - previousSystemSafety)} pts`,
          glowing: false,
        },
      ],
      lineData,
      riskDistributionData,
      threatTypesData,
      serviceSummaries,
      recentFindings,
      alerts24h,
    };
  }, [deepfakeLogs, phishingLogs, stegoLogs, users]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between glass-card px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full status-dot" style={{ background: '#00FF9C', boxShadow: '0 0 6px #00FF9C' }} />
          <span className="font-heading text-[11px] text-kavach-green font-bold tracking-wider">SYSTEM ACTIVE: WELCOME back, {userName.toUpperCase()}</span>
        </div>
        <div className="font-heading text-[11px] text-gray-400 font-bold uppercase tracking-wider">
          {time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} &nbsp;|&nbsp;
          <span className="text-white ml-2">{time.toLocaleTimeString('en-IN', { hour12: false })}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-heading font-bold text-gray-500">
          <Server size={11} className="text-kavach-green" />
          <span>ALERTS 24H: <span className="text-kavach-green">{analytics.alerts24h}</span></span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {analytics.cards.map((card, index) => (
          <DashboardCard key={card.title} {...card} delay={index * 0.07} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-sm font-bold text-white tracking-tight">VITAL SECURITY INFO</h3>
            <p className="font-sans text-xs text-gray-500 font-medium">Live per-user critical activity snapshot</p>
          </div>
          <div className="font-heading text-[10px] uppercase tracking-widest font-bold" style={{ color: criticalVitals ? '#FF3D3D' : '#00FF9C' }}>
            {criticalVitals ? 'Critical tracked' : 'No critical activity'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/5 bg-black/25 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-heading">Critical Count</p>
            <p className="mt-1 font-heading text-2xl font-extrabold text-red-400">{criticalVitals?.criticalCount ?? 0}</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/25 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-heading">Last Source</p>
            <p className="mt-1 text-sm font-bold text-white">{criticalVitals?.lastSource || 'N/A'}</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/25 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-heading">Last Threat</p>
            <p className="mt-1 text-sm font-bold text-white truncate">{criticalVitals?.lastThreatType || 'N/A'}</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/25 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-heading">Last Seen</p>
            <p className="mt-1 text-sm font-bold text-white">{criticalLastSeen}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading text-sm font-bold text-white tracking-tight">SIGNAL ACTIVITY</h3>
              <p className="font-sans text-xs text-gray-500 font-medium mt-0.5">Last 24 hours grouped by normalized risk band</p>
            </div>
            <div className="flex items-center gap-4 font-sans text-[10px] font-bold uppercase tracking-wider">
              {[{ color: '#00FF9C', label: 'Normal' }, { color: '#FFD600', label: 'Suspicious' }, { color: '#FF3D3D', label: 'Blocked' }].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics.lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'Inter', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'Inter', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="normal" stroke="#00FF9C" strokeWidth={2} dot={false} name="Normal" />
              <Line type="monotone" dataKey="suspicious" stroke="#FFD600" strokeWidth={2} dot={false} name="Suspicious" strokeDasharray="5 3" />
              <Line type="monotone" dataKey="blocked" stroke="#FF3D3D" strokeWidth={2} dot={false} name="Blocked" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h3 className="font-heading text-sm font-bold text-white tracking-tight mb-0.5">RISK DISTRIBUTION</h3>
          <p className="font-sans text-xs text-gray-500 font-medium mb-4">Live severity breakdown across all service logs</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={analytics.riskDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {analytics.riskDistributionData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2.5 mt-2">
            {analytics.riskDistributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between font-sans text-[11px] font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-gray-400 uppercase tracking-wider font-heading text-[10px]">{item.name}</span>
                </div>
                <span style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="glass-card p-6 border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-sm font-bold text-white tracking-tight">SERVICE RISK OVERVIEW</h3>
              <p className="font-sans text-xs text-gray-500 font-medium">Per-service exposure, activity, and latest high-risk findings</p>
            </div>
            <div className="flex items-center gap-3 font-heading font-bold uppercase tracking-wider">
              {analytics.serviceSummaries.map((item) => (
                <div key={item.service} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-gray-500 text-[9px]">{item.shortLabel}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {analytics.serviceSummaries.map((item) => (
              <div key={item.service} className="rounded-2xl border border-white/5 bg-black/25 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-heading text-sm font-bold text-white">{item.service}</h4>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                      {item.scans} total scans · {item.scans24h} in 24h · {timeAgoFromDate(item.lastSeen)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-heading text-2xl font-extrabold" style={{ color: item.color }}>{item.averageRisk}</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Risk / 100</div>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.averageRisk}%`, background: `linear-gradient(90deg, ${item.color}99, ${item.color})` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-gray-400">High-risk findings: <span style={{ color: item.color }}>{item.criticalCount}</span></span>
                  <span style={{ color: item.delta24h >= 0 ? '#00FF9C' : '#FF3D3D' }}>{formatDelta(item.delta24h, '24h')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/5 bg-black/25 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-heading text-sm font-bold text-white tracking-tight">RECENT HIGH-RISK FINDINGS</h4>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Top 24h signals</span>
            </div>

            <div className="space-y-3">
              {analytics.recentFindings.length === 0 ? (
                <p className="text-sm text-gray-500">No recent high-risk findings yet.</p>
              ) : analytics.recentFindings.map((finding) => (
                <div key={finding.id} className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: finding.color }} />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">{finding.service}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-bold text-white">{finding.typeLabel}</p>
                    <p className="mt-1 text-[11px] text-gray-500">{finding.severity} · {finding.ago}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-heading text-lg font-extrabold" style={{ color: finding.color }}>{finding.scoreLabel}</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card p-6">
          <h3 className="font-heading text-sm font-bold text-white tracking-tight mb-0.5">ATTACK VECTORS</h3>
          <p className="font-sans text-xs text-gray-500 font-medium mb-4">Derived from live service outputs and top scoring signals</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={analytics.threatTypesData} barSize={14} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'Inter', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="type" tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'Plus Jakarta Sans', fontWeight: 700 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                {analytics.threatTypesData.map((entry) => (
                  <Cell key={entry.type} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
