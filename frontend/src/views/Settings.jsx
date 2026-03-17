import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Shield, Bell, Lock, Server, Eye, EyeOff,
  ToggleLeft, ToggleRight, Moon, Globe, Cpu, Wifi, Save, Trash2, ShieldCheck, Zap
} from 'lucide-react';

function Toggle({ active, onChange, label, description, color = '#00FF9C' }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/05 last:border-0">
      <div className="pr-10">
        <p className="font-heading text-sm font-extrabold text-white tracking-tight mb-0.5">{label}</p>
        {description && <p className="font-sans text-xs text-gray-500 font-medium leading-relaxed">{description}</p>}
      </div>
      <motion.button whileTap={{ scale: 0.95 }} onClick={() => onChange(!active)}
        className="relative min-w-[44px] h-6 rounded-full border transition-all"
        style={{ background: active ? `${color}20` : 'rgba(255,255,255,0.05)',
          borderColor: active ? `${color}40` : 'rgba(255,255,255,0.1)',
          boxShadow: active ? `0 0 10px ${color}20` : 'none' }}>
        <motion.div animate={{ x: active ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-5 h-5 rounded-full"
          style={{ background: active ? color : '#4b5563' }} />
      </motion.button>
    </div>
  );
}

function SettingSection({ title, icon: Icon, children, iconColor = '#00FF9C' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 shadow-xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 shadow-inner"
          style={{ background: `${iconColor}08` }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        <h3 className="font-heading text-[10px] font-extrabold tracking-[0.2em] text-gray-500 uppercase">{title}</h3>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </motion.div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({
    autoBlock: true, aiMonitor: true, darkMode: true, notifications: true,
    twoFA: true, vpnTunnel: false, autoUpdate: true, threatFeed: true,
    geoBlocking: false, encryptLogs: true,
  });
  const [threshold, setThreshold] = useState(85);
  const [sensitivity, setSensitivity] = useState(72);
  const [saved, setSaved] = useState(false);

  const toggle = key => setSettings(s => ({ ...s, [key]: !s[key] }));
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-8 pt-24 md:pt-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center neon-border"
            style={{ background: 'rgba(0,180,216,0.08)' }}>
            <SettingsIcon size={24} className="text-blue-400" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-extrabold text-white tracking-tight leading-tight">CONTROL PANEL</h2>
            <p className="font-sans text-xs text-gray-500 font-medium">KAVACH system configuration & core preferences</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-heading text-xs font-black transition-all shadow-xl ${
              saved ? 'bg-kavach-green text-black shadow-kavach-green/40' : 'bg-white/05 text-white hover:bg-white/10 border border-white/10'
            }`}>
            {saved ? <ShieldCheck size={16} /> : <Save size={16} />}
            <span>{saved ? 'Settings applied' : 'Synchronize Config'}</span>
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Security Policy */}
        <SettingSection title="DEFENSE POLICIES" icon={Shield} iconColor="#FF3D3D">
          <Toggle active={settings.autoBlock} onChange={() => toggle('autoBlock')}
            label="Automated Containment" description="AI will automatically isolate critical threats detected on system nodes" color="#FF3D3D" />
          <Toggle active={settings.geoBlocking} onChange={() => toggle('geoBlocking')}
            label="Regional Geo-Fencing" description="Restrict incoming traffic from high-risk geopolitical zones" color="#FF9500" />
          <Toggle active={settings.twoFA} onChange={() => toggle('twoFA')}
            label="Multi-Factor Auth" description="Enforce RSA-4096 hardware token verification for all administrative access" />
          <Toggle active={settings.encryptLogs} onChange={() => toggle('encryptLogs')}
            label="Quantum Log Encryption" description="Post-quantum cryptographic protection for all system audit trails" />
        </SettingSection>

        {/* AI Analytics */}
        <SettingSection title="AI ENGINE TUNING" icon={Cpu} iconColor="#00B4D8">
          <Toggle active={settings.aiMonitor} onChange={() => toggle('aiMonitor')}
            label="Neural Threat Analysis" description="Real-time explainable AI processing of all network packet payloads" />
          
          <div className="py-6 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between font-heading text-[10px] font-extrabold tracking-widest text-gray-500">
                <span>CONFIDENCE THRESHOLD</span>
                <span className="text-kavach-green">{threshold}%</span>
              </div>
              <input type="range" min={50} max={99} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-kavach-green" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between font-heading text-[10px] font-extrabold tracking-widest text-gray-500">
                <span>MODEL SENSITIVITY</span>
                <span className="text-yellow-400">{sensitivity}%</span>
              </div>
              <input type="range" min={10} max={99} value={sensitivity}
                onChange={e => setSensitivity(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-yellow-400" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/02 border border-white/05 flex items-start gap-4">
            <Zap size={16} className="text-kavach-green mt-1" />
            <p className="font-sans text-xs text-gray-500 leading-relaxed font-medium">
              Current model <strong>Titan-v4</strong> is optimized for low-latency edge detection. Tuning thresholds may impact CPU overhead on satellite nodes.
            </p>
          </div>
        </SettingSection>

        {/* Communications */}
        <SettingSection title="ALERT CHANNELS" icon={Bell} iconColor="#FFD600">
          <Toggle active={settings.notifications} onChange={() => toggle('notifications')}
            label="Real-time UI Alerts" description="Visual overlay and haptic feedback on threat detection" color="#FFD600" />
          <div className="space-y-4 mt-4">
            {[
              { label: 'Secure Email Relay', val: 'ops@kavach.hq', status: 'Connected' },
              { label: 'Terminal Webhook', val: 'https://hooks.kavach.ai/v1/events', status: 'Standby' },
              { label: 'Crisis SMS Gateway', val: '+91-XXX-XXX-900', status: 'Connected' },
            ].map(item => (
              <div key={item.label} className="bg-white/02 p-4 rounded-2xl border border-white/05 flex items-center justify-between group hover:border-white/10 transition-all">
                <div>
                  <p className="font-heading text-[11px] font-extrabold text-white tracking-tight mb-0.5">{item.label}</p>
                  <p className="font-mono text-[10px] text-gray-600 font-bold">{item.val}</p>
                </div>
                <div className={`px-3 py-1 rounded-lg border font-heading text-[9px] font-bold ${
                  item.status === 'Connected' ? 'border-kavach-green/20 text-kavach-green bg-kavach-green/05' : 'border-white/10 text-gray-600'
                }`}>
                  {item.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </SettingSection>

        {/* Network & Infrastructure */}
        <SettingSection title="INFRASTRUCTURE" icon={Wifi} iconColor="#A855F7">
          <Toggle active={settings.vpnTunnel} onChange={() => toggle('vpnTunnel')}
            label="Quantum VPN Link" description="Global encrypted backhaul for all node communications" color="#A855F7" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            {[
              { label: 'Cloud Node', val: 'IN-WEST-01' },
              { label: 'Latency', val: '4.8ms' },
              { label: 'Uptime', val: '99.999%' },
              { label: 'Protocol', val: 'IPv12-T7' },
              { label: 'Security', val: 'Level-5' },
              { label: 'ID', val: 'KV-ND-001' },
            ].map(s => (
              <div key={s.label} className="p-3 bg-white/02 border border-white/05 rounded-xl">
                <p className="font-heading text-[9px] text-gray-600 font-bold tracking-widest uppercase mb-1">{s.label}</p>
                <p className="font-heading text-[11px] text-white font-extrabold tracking-tight">{s.val}</p>
              </div>
            ))}
          </div>
        </SettingSection>
      </div>
    </div>
  );
}
