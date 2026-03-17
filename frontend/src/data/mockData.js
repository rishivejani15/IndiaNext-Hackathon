// threatsData - live threat feed
export const threatsData = [
  { id: 'THR-001', type: 'SQL Injection', source: '192.168.4.22', target: 'DB-Server-01', severity: 'Critical', status: 'Blocked', time: '17:02:14', confidence: 97 },
  { id: 'THR-002', type: 'DDoS Attack', source: '45.76.12.88', target: 'Web-Server-03', severity: 'High', status: 'Mitigating', time: '17:01:55', confidence: 91 },
  { id: 'THR-003', type: 'Brute Force', source: '103.45.22.1', target: 'Auth-Service', severity: 'Medium', status: 'Blocked', time: '17:01:33', confidence: 84 },
  { id: 'THR-004', type: 'XSS Attack', source: '210.88.13.77', target: 'Frontend-01', severity: 'Low', status: 'Flagged', time: '17:01:12', confidence: 76 },
  { id: 'THR-005', type: 'Port Scan', source: '77.30.145.2', target: 'Firewall-Main', severity: 'Medium', status: 'Monitoring', time: '17:00:58', confidence: 88 },
  { id: 'THR-006', type: 'Ransomware Probe', source: '190.12.44.9', target: 'File-Server-02', severity: 'Critical', status: 'Blocked', time: '17:00:41', confidence: 99 },
  { id: 'THR-007', type: 'MITM Attack', source: '192.168.1.55', target: 'API-Gateway', severity: 'High', status: 'Blocked', time: '16:59:30', confidence: 93 },
  { id: 'THR-008', type: 'Phishing Attempt', source: '55.44.33.22', target: 'Mail-Server', severity: 'Medium', status: 'Flagged', time: '16:58:44', confidence: 79 },
];

// logsData - terminal logs
export const logsData = [
  { id: 1, time: '17:02:14', level: 'CRITICAL', message: '[SHIELD] Ransomware probe from 190.12.44.9 → BLOCKED. Hash: a3f9b2c1.' },
  { id: 2, time: '17:02:10', level: 'INFO', message: '[KAVACH-AI] Threat model v3.7 re-evaluated. Confidence threshold: 85%.' },
  { id: 3, time: '17:01:55', level: 'WARNING', message: '[NET] DDoS pattern detected on port 443. Rate: 14,200 req/sec. Mitigation ACTIVE.' },
  { id: 4, time: '17:01:33', level: 'ALERT', message: '[AUTH] 347 failed login attempts from 103.45.22.1. IP BLACKLISTED.' },
  { id: 5, time: '17:01:20', level: 'INFO', message: '[SYS] Auto-snapshot taken. Integrity verified. SHA256: 9f3e...d7a.' },
  { id: 6, time: '17:01:12', level: 'WARNING', message: '[WEB] XSS payload in request header on /api/v2/users. sanitized.' },
  { id: 7, time: '17:00:58', level: 'INFO', message: '[FIREWALL] Port scan detected from 77.30.145.2. Tracking initiated.' },
  { id: 8, time: '17:00:41', level: 'CRITICAL', message: '[ENDPOINT] Anomalous file encryption on File-Server-02. QUARANTINED.' },
  { id: 9, time: '17:00:30', level: 'INFO', message: '[KAVACH-AI] Network baseline recalibrated. Anomaly threshold: ±2.3σ.' },
  { id: 10, time: '17:00:12', level: 'SUCCESS', message: '[PATCH] CVE-2024-3812 auto-patched on Web-Server-01. Reboot scheduled.' },
  { id: 11, time: '16:59:50', level: 'WARNING', message: '[DNS] Suspicious DNS query to known C2 domain. Sinkholed.' },
  { id: 12, time: '16:59:30', level: 'ALERT', message: '[NET] MITM attempt on API-Gateway intercepted. Certificate mismatch.' },
  { id: 13, time: '16:59:10', level: 'INFO', message: '[KAVACH-AI] Behavioral model update complete. 2,341 new attack signatures loaded.' },
  { id: 14, time: '16:58:58', level: 'SUCCESS', message: '[AUTH] Zero-trust policy enforced. 12 devices re-authenticated.' },
  { id: 15, time: '16:58:44', level: 'WARNING', message: '[MAIL] Phishing email quarantined. Sender: security@paypa1.net.' },
];

// chartData - network activity (line chart)
export const networkActivityData = [
  { time: '00:00', normal: 420, suspicious: 12, blocked: 5 },
  { time: '02:00', normal: 280, suspicious: 8, blocked: 2 },
  { time: '04:00', normal: 190, suspicious: 22, blocked: 18 },
  { time: '06:00', normal: 310, suspicious: 35, blocked: 30 },
  { time: '08:00', normal: 580, suspicious: 45, blocked: 39 },
  { time: '10:00', normal: 720, suspicious: 80, blocked: 65 },
  { time: '12:00', normal: 890, suspicious: 120, blocked: 110 },
  { time: '14:00', normal: 760, suspicious: 95, blocked: 87 },
  { time: '16:00', normal: 640, suspicious: 142, blocked: 135 },
  { time: '17:00', normal: 700, suspicious: 180, blocked: 168 },
];

// threatTypesData - bar chart
export const threatTypesData = [
  { type: 'SQL Inj.', count: 38, color: '#FF3D3D' },
  { type: 'DDoS', count: 55, color: '#00FF9C' },
  { type: 'Brute Force', count: 42, color: '#FFD600' },
  { type: 'XSS', count: 27, color: '#00B4D8' },
  { type: 'Ransomware', count: 18, color: '#FF6B35' },
  { type: 'Phishing', count: 31, color: '#A855F7' },
  { type: 'MITM', count: 14, color: '#EC4899' },
  { type: 'Port Scan', count: 63, color: '#6EE7B7' },
];

// riskLevelData - pie chart
export const riskLevelData = [
  { name: 'Critical', value: 12, color: '#FF3D3D' },
  { name: 'High', value: 28, color: '#FF9500' },
  { name: 'Medium', value: 45, color: '#FFD600' },
  { name: 'Low', value: 82, color: '#00FF9C' },
  { name: 'Info', value: 33, color: '#00B4D8' },
];

// usersData
export const usersData = [
  { id: 'USR-001', name: 'Arjun Sharma', role: 'Admin', dept: 'Security Ops', status: 'Active', lastSeen: '2 min ago', threats: 0, avatar: 'AS', risk: 'Low' },
  { id: 'USR-002', name: 'Priya Nair', role: 'Analyst', dept: 'Threat Intel', status: 'Active', lastSeen: '5 min ago', threats: 2, avatar: 'PN', risk: 'Medium' },
  { id: 'USR-003', name: 'Karan Mehta', role: 'Engineer', dept: 'Dev-Ops', status: 'Idle', lastSeen: '22 min ago', threats: 0, avatar: 'KM', risk: 'Low' },
  { id: 'USR-004', name: 'Sneha Patil', role: 'Analyst', dept: 'Threat Intel', status: 'Active', lastSeen: '1 min ago', threats: 5, avatar: 'SP', risk: 'High' },
  { id: 'USR-005', name: 'Dev Verma', role: 'ReadOnly', dept: 'Compliance', status: 'Active', lastSeen: '8 min ago', threats: 0, avatar: 'DV', risk: 'Low' },
  { id: 'USR-006', name: 'Meera Iyer', role: 'Engineer', dept: 'Infra', status: 'Offline', lastSeen: '2 hrs ago', threats: 0, avatar: 'MI', risk: 'Low' },
  { id: 'USR-007', name: 'Rohit Kumar', role: 'Admin', dept: 'Security Ops', status: 'Active', lastSeen: '3 min ago', threats: 1, avatar: 'RK', risk: 'Medium' },
];

// AI analysis data
export const aiAnalysisData = [
  {
    id: 'AI-001',
    threatType: 'SQL Injection',
    confidence: 97,
    riskLevel: 'Critical',
    source: '192.168.4.22',
    target: 'DB-Server-01',
    reason: 'Malformed query structure detected with UNION SELECT patterns. Payload matches 14 known injection signatures. Target is a high-value database endpoint.',
    indicators: ['UNION SELECT', '--', 'OR 1=1', 'DROP TABLE'],
    recommendation: 'Block IP. Rotate DB credentials. Review query parameterization.',
    xaiFeatures: [
      { name: 'Query Anomaly', score: 0.94 },
      { name: 'IP Reputation', score: 0.87 },
      { name: 'Behavior Pattern', score: 0.78 },
      { name: 'Payload Signature', score: 0.99 },
      { name: 'Temporal Anomaly', score: 0.62 },
    ],
  },
  {
    id: 'AI-002',
    threatType: 'DDoS Attack',
    confidence: 91,
    riskLevel: 'High',
    source: '45.76.12.88',
    target: 'Web-Server-03',
    reason: 'Volumetric flood exceeding 14,200 req/sec. Traffic profile matches Mirai botnet signature. Multiple source IPs in synchronized burst pattern.',
    indicators: ['High packet rate', 'Botnet pattern', 'SYN flood', 'UDP amplification'],
    recommendation: 'Activate CDN scrubbing. Implement rate limiting. Alert upstream ISP.',
    xaiFeatures: [
      { name: 'Traffic Volume', score: 0.98 },
      { name: 'Source Diversity', score: 0.82 },
      { name: 'Packet Pattern', score: 0.91 },
      { name: 'Geo Anomaly', score: 0.74 },
      { name: 'Protocol Abuse', score: 0.88 },
    ],
  },
  {
    id: 'AI-003',
    threatType: 'Ransomware Probe',
    confidence: 99,
    riskLevel: 'Critical',
    source: '190.12.44.9',
    target: 'File-Server-02',
    reason: 'Rapid file enumeration detected. Encryption-like access pattern on shared directories. Binary hash matches LockBit 3.0 variant.',
    indicators: ['Mass file access', 'Encryption header', 'LockBit signature', 'Shadow copy deletion'],
    recommendation: 'Isolate endpoint. Restore from backup. Run full forensic scan.',
    xaiFeatures: [
      { name: 'File Access Rate', score: 0.99 },
      { name: 'Entropy Analysis', score: 0.96 },
      { name: 'Process Behavior', score: 0.92 },
      { name: 'Network C2', score: 0.85 },
      { name: 'Known Hash', score: 1.0 },
    ],
  },
];

// Dashboard stats
export const dashboardStats = {
  totalThreats: 287,
  riskScore: 74,
  activeUsers: 142,
  systemHealth: 91,
  alertsToday: 38,
  blockedToday: 168,
  criticalThreats: 12,
  uptime: '99.7%',
};

// Attack globe points (lat/lng for Three.js)
export const attackPoints = [
  { lat: 40.7, lng: -74.0, label: 'New York', intensity: 0.9 },
  { lat: 51.5, lng: -0.1, label: 'London', intensity: 0.7 },
  { lat: 35.7, lng: 139.7, label: 'Tokyo', intensity: 0.8 },
  { lat: 28.6, lng: 77.2, label: 'Delhi', intensity: 0.6 },
  { lat: 55.7, lng: 37.6, label: 'Moscow', intensity: 0.95 },
  { lat: 31.2, lng: 121.5, label: 'Shanghai', intensity: 0.85 },
  { lat: 48.8, lng: 2.3, label: 'Paris', intensity: 0.5 },
  { lat: -23.5, lng: -46.6, label: 'São Paulo', intensity: 0.4 },
  { lat: 1.3, lng: 103.8, label: 'Singapore', intensity: 0.75 },
  { lat: 19.1, lng: 72.9, label: 'Mumbai', intensity: 0.65 },
];
