import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function DashboardCard({ title, value, unit, subtitle, icon: Icon, color = '#00FF9C', trend, trendValue, glowing = false, delay = 0 }) {
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = trend === 'up' ? '#FF3D3D' : trend === 'down' ? '#00FF9C' : '#6b7280';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.01, y: -1 }}
      className={`glass-card p-6 relative overflow-hidden cursor-pointer ${glowing ? 'pulse-border' : ''}`}
      style={glowing ? { boxShadow: `0 0 15px ${color}15` } : {}}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, ${color}08 0%, transparent 65%)` }} />

      {/* Scan line */}
      <div className="absolute inset-0 scan-effect pointer-events-none" />

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-0 h-0"
          style={{ borderLeft: '48px solid transparent', borderTop: `48px solid ${color}15` }} />
      </div>
      <div className="absolute top-0 right-0 w-1.5 h-8 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <p className="font-heading text-[10px] text-gray-500 font-bold tracking-wider uppercase">{title}</p>
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center border"
            style={{ background: `${color}10`, borderColor: `${color}30` }}>
            <Icon size={16} style={{ color }} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="relative z-10 mb-2 flex items-end gap-1">
        <span className="font-heading text-3xl font-extrabold text-white">
          {value}
        </span>
        {unit && <span className="font-sans text-sm text-gray-400 mb-1 font-medium">{unit}</span>}
      </div>

      {/* Subtitle + Trend */}
      <div className="flex items-center justify-between relative z-10">
        {subtitle && <p className="font-sans text-xs text-gray-500 font-medium">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1 font-heading text-[10px] font-bold"
            style={{ color: trendColor }}>
            <TrendIcon size={11} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
    </motion.div>
  );
}
