import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Send, CheckCircle, AlertTriangle,
  Activity, Shield, Target, Cpu, MessageSquare,
  Globe, Zap, FileText, Brain, Terminal, X, Info
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getCountFromServer } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// ── Thinking dots animation ───────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="flex items-center gap-3 py-4 px-5 rounded-2xl bg-black/40 border border-white/5 w-fit">
      <div className="relative w-8 h-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-kavach-green/20 animate-ping opacity-30" />
        <Brain size={16} className="text-kavach-green animate-pulse" />
      </div>
      <div className="flex items-center gap-1.5">
        {['LOADING ENGINES', 'SCANNING VECTORS', 'FUSING SIGNALS', 'BUILDING REPORT'].map((label, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.3 }}
            className="flex items-center gap-1"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-kavach-green shadow-[0_0_6px_#00FF9C]" />
          </motion.div>
        ))}
      </div>
      <span className="font-mono text-[9px] text-kavach-green uppercase tracking-widest animate-pulse">
        Kavach Thinking...
      </span>
    </div>
  );
}

// ── Processing steps stream ────────────────────────────────────────────
const PROCESSING_STEPS = [
  { icon: Globe,    text: 'Querying URL threat intelligence databases...' },
  { icon: Brain,    text: 'Running linguistic & semantic pattern analysis...' },
  { icon: Cpu,      text: 'Cross-referencing phishing engine models...' },
  { icon: Activity, text: 'Fusing multi-vector signal scores...' },
  { icon: Target,   text: 'Generating explainable AI report...' },
];

function ProcessingStream({ step }) {
  return (
    <div className="flex flex-col gap-1.5 py-3 px-5 rounded-2xl bg-black/30 border border-white/5 w-fit max-w-lg">
      {PROCESSING_STEPS.slice(0, step + 1).map((s, i) => {
        const Icon = s.icon;
        const done = i < step;
        const active = i === step;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0 }}
            className={`flex items-center gap-2 text-[10px] font-mono ${done ? 'text-kavach-green' : active ? 'text-white' : 'text-gray-600'}`}
          >
            {done ? (
              <CheckCircle size={11} className="text-kavach-green flex-shrink-0" />
            ) : active ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
                <Icon size={11} className="text-kavach-green flex-shrink-0" />
              </motion.div>
            ) : (
              <Icon size={11} className="opacity-30 flex-shrink-0" />
            )}
            <span className={active ? 'text-kavach-green animate-pulse' : ''}>{s.text}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Compact result card ───────────────────────────────────────────────
function ResultCard({ result, inputText, onNewScan, saveStatus, onSelectEngine, selectedEngine, setSelectedEngine }) {
  const fusionScore = result.fusion?.final_score ?? 0;
  const severity = result.fusion?.severity ?? 'UNKNOWN';
  const isThreat = severity === 'CRITICAL' || severity === 'HIGH';

  const engines = [
    { id: 'phishing', label: 'PHISHING', data: result.engines?.phishing, meta: result.fusion?.breakdown?.phishing, color: 'text-kavach-green', barColor: 'bg-kavach-green' },
    { id: 'url',      label: 'URL',      data: result.engines?.url,      meta: result.fusion?.breakdown?.url,      color: 'text-blue-400',   barColor: 'bg-blue-400' },
    { id: 'injection',label: 'INJECTION',data: result.engines?.injection, meta: result.fusion?.breakdown?.injection, color: 'text-purple-400', barColor: 'bg-purple-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl flex flex-col gap-5"
    >
      {/* ── Verdict banner ── */}
      <div className={`flex items-center justify-between px-6 py-4 rounded-2xl border ${
        isThreat ? 'bg-red-500/10 border-red-500/30' : 'bg-kavach-green/10 border-kavach-green/30'
      }`}>
        <div className="flex items-center gap-3">
          {isThreat
            ? <AlertTriangle size={22} className="text-red-400" />
            : <Shield size={22} className="text-kavach-green" />}
          <div>
            <div className={`font-orbitron font-black text-xl tracking-widest uppercase ${isThreat ? 'text-red-400' : 'text-kavach-green'}`}>
              {severity}
            </div>
            <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Threat Level · Incident {result.incident_id?.slice(0,8)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-orbitron font-black text-3xl text-white">{(fusionScore * 100).toFixed(0).slice(0, 2)}<span className="text-base text-gray-500">%</span></div>
          <div className="text-[9px] text-gray-500 uppercase tracking-widest">Fusion Score</div>
        </div>
      </div>

      {/* ── Executive summary ── */}
      {result.explanation?.executive_summary && (
        <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/5">
          <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <FileText size={11} /> Executive Summary
          </div>
          <p className="text-sm text-gray-200 leading-relaxed italic">"{result.explanation.executive_summary}"</p>
        </div>
      )}

      {/* ── Engine scores ── */}
      <div className="grid grid-cols-3 gap-3">
        {engines.map(eng => (
          <div
            key={eng.id}
            onClick={() => eng.data?.score > 0 && setSelectedEngine(eng.id)}
            className={`rounded-2xl p-4 border bg-black/40 flex flex-col gap-2 transition-all
              ${eng.data?.score > 0 ? 'border-white/10 cursor-pointer hover:border-white/25 hover:scale-[1.02]' : 'border-white/5 opacity-40 cursor-default'}`}
          >
            <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{eng.label}</div>
            <div className={`font-orbitron font-black text-2xl ${eng.color}`}>{((eng.data?.score ?? 0) * 100).toFixed(0)}%</div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(eng.data?.score ?? 0) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full ${eng.barColor}`}
              />
            </div>
            {eng.data?.score > 0 && (
              <div className={`text-[8px] uppercase tracking-widest opacity-40 ${eng.color}`}>Click to inspect</div>
            )}
          </div>
        ))}
      </div>

      {/* ── XAI & Guidance ── */}
      {result.explanation?.employee_explanation && (
        <div className="rounded-2xl border border-white/5 bg-black/30 p-5">
          <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <MessageSquare size={11} /> Employee Guidance
          </div>
          <div className="space-y-2">
            {result.explanation.employee_explanation.split('\n').filter(s => s.trim()).map((step, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-[9px] font-black text-blue-400">
                  {idx + 1}
                </div>
                <p className="text-xs text-gray-300 font-mono leading-relaxed pt-0.5" style={{ wordBreak: 'break-word' }}>
                  {step.replace('• ', '').trim()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Explainable AI section ── */}
      {(result.explanation?.attack_objective || result.explanation?.psychological_technique || result.explanation?.if_clicked_consequence || result.explanation?.personal_risk_vs_average) && (
        <div className="rounded-2xl border border-white/5 bg-black/30 p-5">
          <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Brain size={11} /> Explainable AI (XAI) Intelligence
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Attack Objective */}
            {result.explanation?.attack_objective && (
              <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                <div className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Target size={10} /> Attack Objective
                </div>
                <p className="text-xs text-gray-300 font-bold uppercase tracking-wide">
                  {result.explanation.attack_objective}
                </p>
              </div>
            )}

            {/* Psychological Technique */}
            {result.explanation?.psychological_technique && (
              <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Zap size={10} /> Psychological Technique
                </div>
                <span className="px-2 py-1 rounded bg-white/5 text-xs text-white font-black uppercase tracking-wide underline decoration-purple-500/50">
                  {result.explanation.psychological_technique}
                </span>
              </div>
            )}

            {/* Consequence Simulator */}
            {result.explanation?.if_clicked_consequence && (
              <div className="p-4 rounded-xl border border-white/5 bg-white/5 md:col-span-2">
                <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Activity size={10} /> Consequence Simulator — If You Click
                </div>
                <div className="flex flex-col gap-2.5">
                  {result.explanation.if_clicked_consequence
                    .split(/\n|(?<=\.)\s+/)
                    .map(s => s.replace(/^\d+\.\s*/, '').trim())
                    .filter(s => s.length > 0)
                    .map((step, idx) => (
                    <div key={idx} className="flex gap-3 items-start w-full">
                      <div className="w-5 h-5 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-[9px] font-black text-purple-400 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-gray-300 font-mono leading-relaxed flex-1" style={{ wordBreak: 'break-word' }}>{step.endsWith('.') ? step : step + '.'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Risk Delta */}
            {result.explanation?.personal_risk_vs_average && (
              <div className="p-4 rounded-xl border border-white/5 bg-red-500/5 text-center">
                <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Individual Risk Delta</div>
                <div className="text-2xl font-black text-red-500 font-orbitron">
                  {result.explanation.personal_risk_vs_average}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Recommended action ── */}
      {result.explanation?.recommended_action && (
        <div className="rounded-2xl border border-kavach-green/20 bg-kavach-green/5 p-5">
          <div className="text-[9px] font-black text-kavach-green uppercase tracking-widest mb-2 flex items-center gap-2">
            <Shield size={11} /> Defense Protocol
          </div>
          <p className="text-sm text-kavach-green font-bold leading-relaxed">{result.explanation.recommended_action}</p>
        </div>
      )}

      {/* ── Analyst log terminal ── */}
      {result.explanation?.analyst_log && (
        <div className="bg-black/80 rounded-xl p-4 font-mono text-xs leading-relaxed border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-kavach-green uppercase text-[9px] font-bold tracking-widest">SECURE_GATEWAY // AUDIT_STREAM</span>
          </div>
          <p className="text-gray-400 border-l border-kavach-green/20 pl-3 py-1 text-[11px]">
            {result.explanation.analyst_log}
          </p>
        </div>
      )}

      {/* ── New scan ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNewScan}
          className="px-5 py-2.5 rounded-xl bg-kavach-green text-black font-orbitron text-[10px] font-black tracking-widest uppercase hover:shadow-[0_0_20px_#00FF9C] transition-all"
        >
          New Scan
        </button>
        {saveStatus && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase border
            ${saveStatus === 'saving' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
              saveStatus === 'saved'  ? 'bg-kavach-green/10 border-kavach-green/30 text-kavach-green' :
              'bg-red-500/10 border-red-500/30 text-red-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saving' ? 'bg-blue-400 animate-pulse' : saveStatus === 'saved' ? 'bg-kavach-green' : 'bg-red-500'}`} />
            {saveStatus === 'saving' ? 'SYNCING...' : saveStatus === 'saved' ? 'LOG SAVED' : 'SYNC ERROR'}
          </div>
        )}
      </div>

      {/* ── Engine X-Ray modal ── */}
      <AnimatePresence>
        {selectedEngine && (() => {
          const activeEngine = engines.find(e => e.id === selectedEngine);
          if (!activeEngine) return null;
          return (
            <motion.div
              key="modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEngine(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '3rem 1.5rem', overflowY: 'auto' }}
            >
              <motion.div
                initial={{ scale: 0.97, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.97, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                className={`relative w-full max-w-5xl rounded-3xl bg-[#0d0d0d] p-10 shadow-2xl border-2 overflow-hidden ${
                  activeEngine.id === 'phishing' ? 'border-kavach-green/50' :
                  activeEngine.id === 'url' ? 'border-blue-400/50' : 'border-purple-400/50'
                }`}
              >
                <button onClick={() => setSelectedEngine(null)} className="absolute top-6 right-6 p-3 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <X size={22} />
                </button>
                <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">{activeEngine.label} ENGINE · X-RAY</div>
                <div className={`text-4xl font-orbitron font-black mb-8 ${activeEngine.color}`}>
                  {((activeEngine.data?.score ?? 0) * 100).toFixed(0)}% · {activeEngine.data?.verdict}
                </div>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Raw Score</div>
                    <div className="font-orbitron text-2xl text-white">{parseFloat(activeEngine.meta?.raw_score ?? 0).toFixed(0)}%</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Engine Weight</div>
                    <div className="font-orbitron text-2xl text-white">×{((activeEngine.meta?.weight ?? 0) * 100).toFixed(0)}</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Impact Pts</div>
                    <div className={`font-orbitron text-2xl ${activeEngine.color}`}>+{((activeEngine.meta?.weighted ?? 0)).toFixed(0)}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Handle URL/Phishing Signals Array */}
                  {activeEngine.data?.signals?.length > 0 ? activeEngine.data.signals.map((sig, idx) => (
                    <motion.div key={idx} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.07 }}
                      className="p-6 rounded-2xl bg-white/[0.04] border border-white/10">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <span className={`text-lg font-black uppercase ${activeEngine.color}`}>{sig.name}</span>
                        <span className="text-[9px] font-mono text-white/40 border border-white/10 px-2 py-1 rounded">W: {(parseFloat(sig.weight) * 100).toFixed(0)}</span>
                      </div>
                      <p className="text-sm text-gray-300 font-mono leading-relaxed pl-4 border-l-2 border-white/10" style={{ wordBreak: 'break-word' }}>"{sig.detail}"</p>
                    </motion.div>
                  )) : 
                  /* Handle Injection Details Object */
                  activeEngine.data?.details && Object.keys(activeEngine.data.details).length > 0 ? Object.entries(activeEngine.data.details).map(([key, value], idx) => (
                    <motion.div key={idx} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.07 }}
                      className="p-6 rounded-2xl bg-white/[0.04] border border-white/10">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <span className={`text-lg font-black uppercase ${activeEngine.color}`}>{key.replace(/_/g, ' ')}</span>
                      </div>
                      {typeof value === 'object' && value !== null ? (
                         <div className="space-y-2 mt-3">
                           {Object.entries(value).map(([subKey, subValue]) => (
                             <div key={subKey} className="flex flex-col pl-4 border-l-2 border-white/10 mb-2">
                               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{subKey.replace(/_/g, ' ')}</span>
                               {Array.isArray(subValue) ? (
                                  <ul className="list-disc pl-5 text-sm text-gray-300 font-mono">
                                    {subValue.map((item, i) => <li key={i}>{String(item)}</li>)}
                                  </ul>
                               ) : (
                                  <span className="text-sm text-gray-300 font-mono">{String(subValue)}</span>
                               )}
                             </div>
                           ))}
                         </div>
                      ) : (
                         <p className="text-sm text-gray-300 font-mono leading-relaxed pl-4 border-l-2 border-white/10" style={{ wordBreak: 'break-word' }}>{String(value)}</p>
                      )}
                    </motion.div>
                  )) : (
                    <div className="flex items-center justify-center py-16 border border-dashed border-white/10 rounded-2xl opacity-20">
                      <Shield size={48} />
                      <p className="ml-4 font-orbitron uppercase tracking-widest">No anomalies detected</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────
export default function Phishing() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]); // { type: 'user'|'thinking'|'result'|'error', content, result? }
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [selectedEngine, setSelectedEngine] = useState(null);
  const [processingStep, setProcessingStep] = useState(0);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, processingStep]);

  const saveToFirestore = async (inputText, analysisData) => {
    try {
      setSaveStatus('saving');
      const coll = collection(db, 'phishing_logs');
      const snapshot = await getCountFromServer(coll);
      await addDoc(coll, {
        text: inputText,
        ...analysisData,
        detectionCount: snapshot.data().count + 1,
        userId: currentUser?.uid || 'anonymous',
        userName: currentUser?.displayName || 'Anonymous User',
        timestamp: serverTimestamp(),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err) {
      console.error('Firestore Error:', err);
      setSaveStatus('error');
    }
  };

  const startAnalysis = async () => {
    const text = inputText.trim();
    if (!text || isScanning) return;

    const userMessage = text;
    setInputText('');
    setIsScanning(true);
    setProcessingStep(0);

    // Add user bubble + thinking bubble
    setMessages(prev => [
      ...prev,
      { type: 'user', content: userMessage },
      { type: 'thinking', id: Date.now() }
    ]);

    // Animate processing steps
    const stepInterval = setInterval(() => {
      setProcessingStep(prev => {
        if (prev >= PROCESSING_STEPS.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 900);

    try {
      const response = await fetch('https://rudraaaa76-kavach-endpoints.hf.space/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMessage,
          profile: { role: 'Developer', industry: 'Technology', tools: ['Gmail', 'GitHub'], team_size: 'Just me' },
          user_id: currentUser?.uid || 'demo',
        }),
      });

      clearInterval(stepInterval);
      setProcessingStep(PROCESSING_STEPS.length - 1);

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();

      // Replace thinking bubble with result bubble
      setMessages(prev => [
        ...prev.filter(m => m.type !== 'thinking'),
        { type: 'result', result: data, inputText: userMessage }
      ]);

      await saveToFirestore(userMessage, data);
    } catch (err) {
      clearInterval(stepInterval);
      setMessages(prev => [
        ...prev.filter(m => m.type !== 'thinking'),
        { type: 'error', content: err.message || 'Analysis failed. Please check your connection.' }
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      startAnalysis();
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)] max-w-4xl mx-auto pt-24 md:pt-0">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-2 pb-4 border-b border-white/5 flex-shrink-0"
      >
        <div className="p-2.5 rounded-xl bg-kavach-green/10 border border-kavach-green/20">
          <ShieldAlert size={20} className="text-kavach-green" />
        </div>
        <div>
          <h1 className="font-orbitron font-black text-white tracking-tight text-lg uppercase">ThreatGuard <span className="text-kavach-green">AI</span></h1>
          <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Social Engineering Intelligence · Multi-Vector Threat Fusion</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[9px] font-mono text-kavach-green/60">
          <div className="w-1.5 h-1.5 rounded-full bg-kavach-green animate-pulse" />
          LIVE
        </div>
      </motion.div>

      {/* Chat transcript */}
      <div className="py-6 space-y-6">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[52vh] text-center gap-6 py-12"
          >
            <div className="p-5 rounded-3xl bg-kavach-green/5 border border-kavach-green/10">
              <Brain size={40} className="text-kavach-green opacity-50" />
            </div>
            <div>
              <p className="font-orbitron font-bold text-white text-lg uppercase tracking-wide mb-2">Analyze any threat</p>
              <p className="text-gray-600 font-mono text-xs">Paste email content, suspicious URLs, or social engineering text below.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-md mt-2">
              {[
                { icon: Globe, label: 'URL Analysis', detail: 'Threat databases' },
                { icon: Brain, label: 'Psych Techniques', detail: 'Urgency & authority flags' },
                { icon: Cpu, label: 'Linguistic AI', detail: 'Semantic pattern match' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/3 border border-white/5">
                  <item.icon className="text-kavach-green opacity-40" size={18} />
                  <div className="text-[8px] font-black text-white/60 uppercase tracking-widest text-center">{item.label}</div>
                  <div className="text-[7px] text-gray-600 text-center">{item.detail}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx}>
            {/* User bubble — right aligned */}
            {msg.type === 'user' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-end"
              >
                <div className="max-w-lg px-5 py-3 rounded-2xl bg-kavach-green/15 border border-kavach-green/25 text-sm text-white font-mono leading-relaxed" style={{ wordBreak: 'break-word' }}>
                  {msg.content}
                </div>
              </motion.div>
            )}

            {/* Thinking / processing stream — left aligned */}
            {msg.type === 'thinking' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
                <ProcessingStream step={processingStep} />
                <ThinkingDots />
              </motion.div>
            )}

            {/* Error bubble */}
            {msg.type === 'error' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 w-fit max-w-lg">
                  <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400 font-bold">{msg.content}</p>
                </div>
              </motion.div>
            )}

            {/* Result card — left aligned */}
            {msg.type === 'result' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-kavach-green/10 border border-kavach-green/20">
                    <ShieldAlert size={13} className="text-kavach-green" />
                  </div>
                  <span className="text-[9px] font-black text-kavach-green/60 uppercase tracking-widest font-orbitron">Kavach AI · Analysis Complete</span>
                </div>
                <ResultCard
                  result={msg.result}
                  inputText={msg.inputText}
                  onNewScan={() => setMessages([])}
                  saveStatus={saveStatus}
                  selectedEngine={selectedEngine}
                  setSelectedEngine={setSelectedEngine}
                />
              </motion.div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Fixed bottom input bar ──────────────────────────────────── */}
      <div className="flex-shrink-0 pt-4 border-t border-white/5">
        <div className="flex items-end gap-3 px-4 py-3 rounded-2xl bg-black/50 border border-white/10 focus-within:border-kavach-green/30 transition-all shadow-lg">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={e => {
              setInputText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Paste email content, URLs, or suspicious text… (Enter to scan)"
            disabled={isScanning}
            rows={1}
            className="flex-1 bg-transparent font-mono text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none resize-none min-h-[24px] max-h-40 leading-6 disabled:opacity-40"
            style={{ height: '24px' }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startAnalysis}
            disabled={!inputText.trim() || isScanning}
            className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-all ${
              inputText.trim() && !isScanning
                ? 'bg-kavach-green text-black shadow-[0_0_12px_rgba(0,255,156,0.3)]'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
          >
            {isScanning
              ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}><Zap size={16} /></motion.div>
              : <Send size={16} />}
          </motion.button>
        </div>
        <p className="text-center text-[8px] text-gray-700 font-mono mt-2 uppercase tracking-widest">
          Kavach AI · Multi-Vector Threat Fusion Engine · All scans are logged
        </p>
      </div>
    </div>
  );
}