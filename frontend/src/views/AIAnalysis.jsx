import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight, Target, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { aiAnalysisData } from '../data/mockData';

const riskColors = {
  Critical: '#FF3D3D',
  High: '#FF9500',
  Medium: '#FFD600',
  Low: '#00FF9C',
};

function XaiBar({ name, score, delay }) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay }} className="space-y-1.5">
      <div className="flex items-center justify-between font-heading text-[11px] font-bold uppercase tracking-wider">
        <span className="text-gray-500">{name}</span>
        <span style={{ color: score > 0.9 ? '#FF3D3D' : score > 0.7 ? '#FFD600' : '#00FF9C' }}>
          {(score * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score * 100}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: score > 0.9 ? 'linear-gradient(90deg, #FF6B35, #FF3D3D)' :
              score > 0.7 ? 'linear-gradient(90deg, #FFD600, #FF9500)' :
                'linear-gradient(90deg, #00B4D8, #00FF9C)',
            boxShadow: score > 0.9 ? '0 0 8px rgba(255,61,61,0.6)' : '0 0 6px rgba(0,255,156,0.4)'
          }} />
      </div>
    </motion.div>
  );
}

export default function AIAnalysis() {
  const [selected, setSelected] = useState(aiAnalysisData[0]);

  return (
    <div className="space-y-5 pt-20 md:pt-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/10"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <Brain size={20} className="text-blue-400" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-extrabold text-white tracking-tight">AI ANALYSIS HUB</h2>
          <p className="font-sans text-xs text-gray-500 font-medium">Explainable threat intelligence results</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full status-dot" style={{ background: '#00B4D8', boxShadow: '0 0 6px #00B4D8' }} />
          <span className="font-heading text-[10px] font-bold text-blue-400 uppercase tracking-widest">ENGINE v3.7 LIVE</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Threat Selector */}
        <div className="space-y-3">
          <h3 className="font-heading text-[10px] text-gray-600 font-bold tracking-widest px-2 uppercase mb-4">ACTIVE ANALYSIS QUEUE</h3>
          {aiAnalysisData.map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelected(item)}
              whileHover={{ scale: 1.02, x: 4 }}
              className={`glass-card p-5 cursor-pointer transition-all border ${selected.id === item.id
                ? 'border-kavach-green bg-kavach-green/05 shadow-xl shadow-kavach-green/5' : 'border-white/5 hover:border-white/20'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-[10px] font-bold text-gray-500">{item.id}</span>
                <span className="font-heading text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-widest"
                  style={{ color: riskColors[item.riskLevel], borderColor: `${riskColors[item.riskLevel]}40`,
                    background: `${riskColors[item.riskLevel]}12` }}>
                  {item.riskLevel}
                </span>
              </div>
              <h4 className="font-heading text-sm font-bold text-white mb-2">{item.threatType}</h4>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-gray-500 font-medium">{item.source}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-xs font-extrabold"
                    style={{ color: item.confidence > 90 ? '#FF3D3D' : '#FFD600' }}>
                    {item.confidence}%
                  </span>
                  <Zap size={10} style={{ color: item.confidence > 90 ? '#FF3D3D' : '#FFD600' }} />
                </div>
              </div>
              {selected.id === item.id && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <ChevronRight size={14} className="text-kavach-green" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Main AI Panel */}
        <AnimatePresence mode="wait">
          <motion.div key={selected.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
            className="xl:col-span-2 space-y-4">

            {/* Threat Overview */}
            <div className="glass-card p-6 border-white/10 shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-sans text-[10px] font-bold text-gray-600 uppercase tracking-widest">{selected.id}</span>
                    <span className="font-heading text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider"
                      style={{ color: riskColors[selected.riskLevel], background: `${riskColors[selected.riskLevel]}15`,
                        border: `1px solid ${riskColors[selected.riskLevel]}30` }}>
                      {selected.riskLevel} RISK PROFILE
                    </span>
                  </div>
                  <h3 className="font-heading text-2xl font-extrabold text-white tracking-tight">{selected.threatType}</h3>
                </div>
                <div className="text-right">
                  <p className="font-heading text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">AI CONFIDENCE</p>
                  <div className="font-heading text-4xl font-extrabold"
                    style={{ color: riskColors[selected.riskLevel] }}>
                    {selected.confidence}%
                  </div>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="mb-6">
                <div className="flex justify-between font-heading text-[10px] font-bold text-gray-600 mb-2 uppercase tracking-widest">
                  <span>CERTAINTY INDEX</span><span>{selected.confidence}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/05 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${selected.confidence}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, #00B4D8, ${riskColors[selected.riskLevel]})`,
                      boxShadow: `0 0 10px ${riskColors[selected.riskLevel]}40` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Source Origin', value: selected.source },
                  { label: 'Target Destination', value: selected.target },
                ].map(d => (
                  <div key={d.label} className="bg-white/02 rounded-xl p-4 border border-white/05">
                    <p className="font-heading text-[9px] text-gray-500 font-bold tracking-widest mb-2 uppercase">{d.label}</p>
                    <p className="font-mono text-xs text-white font-bold">{d.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/02 rounded-xl p-5 border border-white/05 mb-6">
                <p className="font-heading text-[9px] text-gray-500 font-bold tracking-widest mb-3 uppercase">AI EXPLANATION (XAI)</p>
                <p className="font-sans text-sm text-gray-300 leading-relaxed font-medium">{selected.reason}</p>
              </div>

              {/* IoC Indicators */}
              <div>
                <p className="font-heading text-[9px] text-gray-500 font-bold tracking-widest mb-3 uppercase">CRITICAL INDICATORS</p>
                <div className="flex flex-wrap gap-2.5">
                  {selected.indicators.map((ind, i) => (
                    <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.07 }}
                      className="font-mono text-[10px] px-3 py-1.5 rounded-lg border font-bold uppercase tracking-wider"
                      style={{ color: '#FF3D3D', background: 'rgba(255,61,61,0.08)', borderColor: 'rgba(255,61,61,0.2)' }}>
                      {ind}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>

            {/* XAI Feature Importance */}
            <div className="glass-card p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <Target size={14} className="text-kavach-green" />
                <h3 className="font-heading text-[10px] font-extrabold text-kavach-green tracking-widest uppercase">EXPLAINABILITY — FEATURE WEIGHTS</h3>
              </div>
              <div className="space-y-4">
                {selected.xaiFeatures.map((f, i) => (
                  <XaiBar key={f.name} name={f.name} score={f.score} delay={i * 0.1} />
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="glass-card p-6 border-kavach-green/20 shadow-2xl shadow-kavach-green/05">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={16} className="text-kavach-green" />
                <h3 className="font-heading text-[10px] font-extrabold text-kavach-green tracking-widest uppercase">PROTOCOL RECOMMENDATION</h3>
              </div>
              <p className="font-sans text-sm text-gray-300 leading-relaxed font-bold">{selected.recommendation}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
