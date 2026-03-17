import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Clock, Activity, Filter, RefreshCw, Eye } from 'lucide-react';
import { threatsData, networkActivityData } from '../data/mockData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const severityConfig = {
  Critical: { color: '#FF3D3D', bg: 'rgba(255,61,61,0.1)', border: 'rgba(255,61,61,0.3)' },
  High: { color: '#FF9500', bg: 'rgba(255,149,0,0.1)', border: 'rgba(255,149,0,0.3)' },
  Medium: { color: '#FFD600', bg: 'rgba(255,214,0,0.1)', border: 'rgba(255,214,0,0.3)' },
  Low: { color: '#00B4D8', bg: 'rgba(0,180,216,0.1)', border: 'rgba(0,180,216,0.3)' },
};

const statusConfig = {
  Blocked: { color: '#00FF9C' },
  Mitigating: { color: '#FFD600' },
  Flagged: { color: '#FF9500' },
  Monitoring: { color: '#00B4D8' },
};

export default function ThreatMonitor() {
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const filters = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const filtered = filter === 'All' ? threatsData : threatsData.filter(t => t.severity === filter);

  return (
    <div className="space-y-5 pt-20 md:pt-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/10"
            style={{ background: 'rgba(255,61,61,0.1)' }}>
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-extrabold text-white tracking-tight">THREAT MONITOR</h2>
            <p className="font-sans text-xs text-gray-500 font-medium">Live threat intelligence feed</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full status-dot" style={{ background: '#FF3D3D', boxShadow: '0 0 6px #FF3D3D' }} />
            <span className="font-heading text-[10px] font-bold text-red-500 uppercase tracking-widest">LIVE FEED</span>
          </div>
          <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 text-gray-400 hover:text-kavach-green hover:border-kavach-green/40 transition-colors">
            <RefreshCw size={14} />
          </motion.button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-gray-500" />
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <motion.button key={f} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f)}
              className={`font-heading text-[10px] font-bold px-4 py-2 rounded-lg border transition-all tracking-wider uppercase ${filter === f
                ? 'border-kavach-green text-kavach-green bg-kavach-green/10 shadow-lg shadow-kavach-green/5'
                : 'border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300'}`}>
              {f}
              {f !== 'All' && (
                <span className="ml-2 opacity-60">({threatsData.filter(t => t.severity === f).length})</span>
              )}
            </motion.button>
          ))}
        </div>
        <span className="ml-auto font-sans text-xs text-gray-500 font-medium">{filtered.length} threats shown</span>
      </div>

      {/* Threat Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/02">
                {['ID', 'TYPE', 'SOURCE', 'TARGET', 'SEVERITY', 'STATUS', 'CONFIDENCE', 'TIME', ''].map(h => (
                  <th key={h} className="text-left p-4 font-heading text-[10px] font-bold tracking-widest text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((t, i) => {
                  const sev = severityConfig[t.severity] || severityConfig.Low;
                  const st = statusConfig[t.status] || statusConfig.Monitoring;
                  return (
                    <motion.tr key={t.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelected(selected?.id === t.id ? null : t)}
                      className={`border-b border-white/5 cursor-pointer transition-all hover:bg-white/02 ${selected?.id === t.id ? 'bg-kavach-green/5' : ''}`}>
                      <td className="p-4 font-sans text-[10px] font-bold text-gray-400">{t.id}</td>
                      <td className="p-4 font-heading text-sm font-bold text-white">{t.type}</td>
                      <td className="p-4 font-mono text-xs text-gray-400 font-medium">{t.source}</td>
                      <td className="p-4 font-mono text-xs text-gray-400 font-medium">{t.target}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md font-heading text-[10px] font-extrabold border uppercase tracking-wider"
                          style={{ color: sev.color, background: sev.bg, borderColor: sev.border }}>
                          {t.severity}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: st.color }} />
                          <span className="font-heading text-[11px] font-bold" style={{ color: st.color }}>{t.status}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-white/10 w-20 overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ width: `${t.confidence}%`, background: t.confidence > 90 ? '#FF3D3D' : t.confidence > 75 ? '#FFD600' : '#00FF9C' }} />
                          </div>
                          <span className="font-heading text-[10px] font-bold text-gray-400">{t.confidence}%</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-500">{t.time}</td>
                      <td className="p-4">
                        <motion.button whileHover={{ scale: 1.1 }}
                          className="w-7 h-7 rounded-md flex items-center justify-center border border-white/10 hover:border-kavach-green/40 transition-colors">
                          <Eye size={12} className="text-gray-400" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Expanded detail row */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-6 border-white/10 mt-2 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-sm font-extrabold text-kavach-green tracking-tight">THREAT ANALYSIS — {selected.id}</h3>
              <span className="font-heading text-[10px] font-bold text-gray-500 uppercase tracking-widest">{selected.type}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Source IP', value: selected.source },
                { label: 'Target System', value: selected.target },
                { label: 'Confidence Score', value: `${selected.confidence}%` },
                { label: 'Detection Time', value: selected.time },
              ].map(d => (
                <div key={d.label}>
                  <p className="font-heading text-[10px] text-gray-500 font-bold tracking-widest mb-2 uppercase">{d.label}</p>
                  <p className="font-sans text-sm font-bold text-white">{d.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini line chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-card p-6">
        <h3 className="font-heading text-sm font-extrabold text-white tracking-tight mb-6">BLOCK RATE PERFORMANCE (24H)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={networkActivityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'Inter', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'Inter', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontFamily: 'Inter', fontSize: '11px' }} />
            <Line type="monotone" dataKey="blocked" stroke="#FF3D3D" strokeWidth={3} dot={false} name="Blocked" />
            <Line type="monotone" dataKey="suspicious" stroke="#FFD600" strokeWidth={2} dot={false} name="Flagged" strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
