import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, Pause, Play, XCircle, AlertCircle,
  CheckCircle, Info, ScanFace, ShieldAlert, Eye,
  Wifi, WifiOff, AlertTriangle, X, Radio, Zap,
} from 'lucide-react';
import { db } from '../firebase';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, setDoc, increment, getDocs, deleteDoc,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// â”€â”€ Log-level config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const levelConfig = {
  CRITICAL: { color: '#FF3D3D', bg: 'rgba(255,61,61,0.12)', icon: XCircle,      prefix: 'CRITICAL' },
  ALERT:    { color: '#FF9500', bg: 'rgba(255,149,0,0.08)', icon: AlertCircle,   prefix: 'ALERT   ' },
  WARNING:  { color: '#FFD600', bg: 'rgba(255,214,0,0.08)', icon: AlertCircle,   prefix: 'WARNING ' },
  SUCCESS:  { color: '#00FF9C', bg: 'rgba(0,255,156,0.06)', icon: CheckCircle,   prefix: 'SUCCESS ' },
  INFO:     { color: '#00B4D8', bg: 'rgba(0,180,216,0.06)', icon: Info,          prefix: 'INFO    ' },
  NETWORK:  { color: '#A855F7', bg: 'rgba(168,85,247,0.06)', icon: Radio,        prefix: 'NETWORK ' },
  FLAGGED:  { color: '#FF3D3D', bg: 'rgba(255,61,61,0.15)', icon: AlertTriangle, prefix: 'FLAGGED ' },
};

const SEVERITY_LEVEL = { CRITICAL: 'CRITICAL', HIGH: 'ALERT', MEDIUM: 'WARNING', INFO: 'INFO' };

// â”€â”€ Toast notification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ThreatToast({ toast, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{    opacity: 0, x: 80, scale: 0.95 }}
      className="relative flex items-start gap-3 p-4 rounded-xl border shadow-2xl w-80 backdrop-blur-sm"
      style={{
        background: 'rgba(10,3,3,0.95)',
        borderColor: toast.severity === 'CRITICAL' ? '#FF3D3D66' : '#FF950066',
      }}
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0"
        style={{ color: toast.severity === 'CRITICAL' ? '#FF3D3D' : '#FF9500' }} />
      <div className="flex-1 min-w-0">
        <p className="font-heading text-[10px] font-extrabold tracking-widest uppercase"
          style={{ color: toast.severity === 'CRITICAL' ? '#FF3D3D' : '#FF9500' }}>
          {toast.threatType}{' | '}{toast.severity}
        </p>
        <p className="text-[10px] text-gray-300 mt-1 leading-relaxed font-mono">{toast.detail}</p>
        <p className="text-[9px] text-gray-600 mt-1 font-mono">
          {toast.srcIp}:{toast.srcPort}{' -> '}{toast.dstIp}:{toast.dstPort}
        </p>
      </div>
      <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors shrink-0">
        <X size={12} />
      </button>
      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 6, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-0.5 rounded-b-xl origin-left"
        style={{ width: '100%', background: toast.severity === 'CRITICAL' ? '#FF3D3D' : '#FF9500' }}
      />
    </motion.div>
  );
}

export default function Logs() {
  const { currentUser } = useAuth();

  /* â”€â”€ Firestore logs â”€â”€ */
  const [dbLogs,       setDbLogs]       = useState([]);
  const [phishingLogs, setPhishingLogs] = useState([]);
  const [stegoLogs,    setStegoLogs]    = useState([]);

  /* â”€â”€ Network stream â”€â”€ */
  const [networkLogs,  setNetworkLogs]  = useState([]);   // rolling buffer (last 200)
  const [wsStatus,     setWsStatus]     = useState('connecting'); // connecting | live | offline
  const wsRef = useRef(null);

  /* â”€â”€ UI state â”€â”€ */
  const [paused,    setPaused]    = useState(false);
  const [filter,    setFilter]    = useState('NETWORK');
  const [typingLog, setTypingLog] = useState('');
  const [toasts,    setToasts]    = useState([]);
  const [simulating, setSimulating] = useState(false);
  const bottomRef = useRef(null);
  const pausedRef = useRef(false);   // non-stale copy for WS callback
  const processedCriticalIdsRef = useRef(new Set());

  /* keep pausedRef in sync */
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // â”€â”€ Save flagged packet to Firestore â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const saveFlaggedToFirestore = useCallback(async (pkt) => {
    const userId = currentUser?.uid;
    if (!userId) return;

    const isCritical =
      String(pkt?.severity || '').toUpperCase() === 'CRITICAL' ||
      Number(pkt?.max_score || 0) >= 0.85;

    if (!isCritical) return;

    try {
      await addDoc(collection(db, 'network_alerts'), {
        userId,
        userEmail: currentUser?.email || null,
        packet_id:   pkt.id,
        timestamp:   serverTimestamp(),
        src_ip:      pkt.src_ip,
        src_port:    pkt.src_port,
        dst_ip:      pkt.dst_ip,
        dst_port:    pkt.dst_port,
        protocol:    pkt.protocol,
        bytes:       pkt.bytes,
        severity:    pkt.severity,
        max_score:   pkt.max_score,
        threat_type: pkt.threats?.[0]?.type  ?? 'Unknown',
        detail:      pkt.threats?.[0]?.detail ?? '',
        all_threats: JSON.stringify(pkt.threats ?? []),
        process:     pkt.process ?? null,
        pid:         pkt.pid     ?? null,
        synthetic:   Boolean(pkt.synthetic),
      });
    } catch (_) {
      // silently ignore write failures (e.g. offline / rules)
    }
  }, [currentUser]);

  // â”€â”€ One-time cleanup: delete previously generated network alerts â”€â”€
  useEffect(() => {
    if (!currentUser?.uid) return;
    const key = `network-alerts-purged-${currentUser.uid}`;
    if (sessionStorage.getItem(key) === '1') return;

    (async () => {
      try {
        const snap = await getDocs(collection(db, 'network_alerts'));
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
      } catch (_) {
        // ignore purge failures
      } finally {
        sessionStorage.setItem(key, '1');
      }
    })();
  }, [currentUser]);

  const saveCriticalActivityToFirestore = useCallback(async (logEntry) => {
    const userId = currentUser?.uid || 'anonymous';
    const userName = currentUser?.displayName || 'Anonymous User';
    const userEmail = currentUser?.email || 'N/A';

    const source = logEntry?.isNetwork
      ? 'Network'
      : logEntry?.isReal
      ? 'Deepfake'
      : logEntry?.isPhishing
      ? 'Phishing'
      : logEntry?.isStego
      ? 'Steganography'
      : 'System';

    const pkt = logEntry?.pkt || {};
    const threatType = pkt?.threats?.[0]?.type || 'Critical Activity';
    const detail = pkt?.threats?.[0]?.detail || logEntry?.message || 'Critical event detected';

    try {
      await setDoc(doc(db, 'critical_activities', userId), {
        userId,
        userName,
        userEmail,
        criticalCount: increment(1),
        lastCriticalAt: serverTimestamp(),
        lastEventId: logEntry?.id || null,
        lastLevel: logEntry?.level || 'CRITICAL',
        lastSource: source,
        lastThreatType: threatType,
        lastDetail: detail,
        lastMessage: logEntry?.message || '',
        lastSeverity: pkt?.severity || 'CRITICAL',
        lastSrcIp: pkt?.src_ip || null,
        lastDstIp: pkt?.dst_ip || null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (_) {
      // silently ignore write failures
    }
  }, [currentUser]);

  // â”€â”€ WebSocket connection to backend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    let isMounted = true;
    let retryTimer = null;

    function connect() {
      try {
        const ws = new WebSocket('wss://samyak000-logs.hf.space/ws/network');
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) {
            setWsStatus('live');
            setNetworkLogs([]);
          }
        };

        ws.onmessage = (e) => {
          if (!isMounted || pausedRef.current) return;
          try {
            const pkt = JSON.parse(e.data);
            const ts  = new Date(pkt.timestamp * 1000);
            const timeStr = ts.toLocaleTimeString('en-IN', {
              timeZone: 'Asia/Kolkata',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            });

            const level = pkt.is_suspicious
              ? (SEVERITY_LEVEL[pkt.severity] ?? 'ALERT')
              : 'NETWORK';

            const primaryThreat = pkt.threats?.[0];
            const tag = pkt.synthetic ? '[SIM]' : '[REMOTE]';
            const stateSuffix = pkt.state ? ` state=${pkt.state}` : '';
            const message = pkt.is_suspicious
              ? `[NET-PROBE]${tag} !! FLAGGED -- ${primaryThreat?.type ?? 'Anomaly'} ` +
                `(score ${((pkt.max_score ?? 0) * 100).toFixed(0)}%): ` +
                `${pkt.src_ip}:${pkt.src_port} -> ${pkt.dst_ip}:${pkt.dst_port} ` +
                `[${pkt.protocol}]${stateSuffix} | ${primaryThreat?.detail ?? ''}`
              : `[NET-PROBE]${tag} ${pkt.src_ip}:${pkt.src_port} -> ` +
                `${pkt.dst_ip}:${pkt.dst_port} ` +
                `[${pkt.protocol}]${stateSuffix}` +
                (pkt.process ? ` proc=${pkt.process}` : '');

            const entry = {
              id:          pkt.id,
              time:        timeStr,
              timestampMs: pkt.timestamp * 1000,
              level,
              message,
              isNetwork:   true,
              isFlagged:   pkt.is_suspicious,
              pkt,
            };

            setNetworkLogs(prev => {
              const updated = [...prev, entry];
              return updated.length > 200 ? updated.slice(-200) : updated;
            });

            // Toast for flagged packets; Firebase write only for CRITICAL packets
            if (pkt.is_suspicious) {
              setToasts(prev => [...prev.slice(-4), {
                id:         pkt.id,
                severity:   pkt.severity,
                threatType: primaryThreat?.type  ?? 'Anomaly',
                detail:     primaryThreat?.detail ?? '',
                srcIp:      pkt.src_ip,
                srcPort:    pkt.src_port,
                dstIp:      pkt.dst_ip,
                dstPort:    pkt.dst_port,
              }]);
              const isCriticalPacket =
                String(pkt?.severity || '').toUpperCase() === 'CRITICAL' ||
                Number(pkt?.max_score || 0) >= 0.85;

              if (isCriticalPacket) {
                saveFlaggedToFirestore(pkt);
              }
            }
          } catch (_) {}
        };

        ws.onerror = () => {
          if (isMounted) setWsStatus('offline');
        };

        ws.onclose = () => {
          if (isMounted) {
            setWsStatus('offline');
            retryTimer = setTimeout(() => {
              if (isMounted) { setWsStatus('connecting'); connect(); }
            }, 3000);
          }
        };
      } catch (_) {
        if (isMounted) setWsStatus('offline');
      }
    }

    connect();
    return () => {
      isMounted = false;
      clearTimeout(retryTimer);
      wsRef.current?.close();
    };
  }, [saveFlaggedToFirestore]);

  // â”€â”€ Firestore: deepfake_logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const q = query(collection(db, 'deepfake_logs'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, snap => {
      setDbLogs(snap.docs.flatMap(doc => {
        const d = doc.data();
        if (!d.timestamp) return [];
        const ts = new Date(d.timestamp.toDate()).toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit',
          second: '2-digit', hour12: false,
        });
        return [{
          id: doc.id, time: ts,
          timestampMs: d.timestamp.toMillis(),
          level: d.verdict === 'DEEPFAKE' ? 'ALERT' : 'SUCCESS',
          message: `[KAVACH-DEEPFAKE] ${d.verdict} detected in ${d.filename}. Confidence: ${d.confidence}%. User: ${d.userName}`,
          isReal: true,
        }];
      }));
    });
  }, []);

  // â”€â”€ Firestore: phishing_logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const q = query(collection(db, 'phishing_logs'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, snap => {
      setPhishingLogs(snap.docs.flatMap(doc => {
        const d = doc.data();
        if (!d.timestamp) return [];
        const ts = new Date(d.timestamp.toDate()).toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit',
          second: '2-digit', hour12: false,
        });
        const isBad = d.fusion?.severity === 'CRITICAL' || d.fusion?.severity === 'HIGH';
        return [{
          id: doc.id, time: ts,
          timestampMs: d.timestamp.toMillis(),
          level: isBad ? 'ALERT' : 'INFO',
          message: `[KAVACH-PHISHING] Incident ${d.fusion?.severity} detected. Fusion Score: ${d.fusion?.final_score?.toFixed(2) ?? '?'}. Target: ${d.userName}`,
          isPhishing: true,
        }];
      }));
    });
  }, []);

  // â”€â”€ Firestore: stego_logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const q = query(collection(db, 'stego_logs'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, snap => {
      setStegoLogs(snap.docs.flatMap(doc => {
        const d = doc.data();
        if (!d.timestamp) return [];
        const ts = new Date(d.timestamp.toDate()).toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit',
          second: '2-digit', hour12: false,
        });
        const isBad = d.severity === 'CRITICAL' || d.severity === 'HIGH';
        return [{
          id: doc.id, time: ts,
          timestampMs: d.timestamp.toMillis(),
          level: isBad ? 'ALERT' : 'SUCCESS',
          message: `[KAVACH-STEGO] Payload scan ${d.severity}. Score: ${d.risk_score?.toFixed(0) ?? 0}%. User: ${d.userName}`,
          isStego: true,
        }];
      }));
    });
  }, []);

  // â”€â”€ Merge all logs chronologically â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const allLogs = [...dbLogs, ...phishingLogs, ...stegoLogs, ...networkLogs]
    .sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0));

  // â”€â”€ Persist latest NETWORK CRITICAL event per user â”€â”€
  useEffect(() => {
    const latest = allLogs[allLogs.length - 1];
    if (!latest || latest.level !== 'CRITICAL' || !latest.isNetwork) return;

    const eventId = latest.id || `${latest.time}-${latest.message}`;
    if (processedCriticalIdsRef.current.has(eventId)) return;

    processedCriticalIdsRef.current.add(eventId);
    saveCriticalActivityToFirestore(latest);
  }, [allLogs.length, saveCriticalActivityToFirestore]); // eslint-disable-line react-hooks/exhaustive-deps

  // â”€â”€ Typing animation for newest entry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const last = allLogs[allLogs.length - 1];
    if (!last) return;
    let i = 0;
    setTypingLog('');
    const t = setInterval(() => {
      setTypingLog(last.message.slice(0, i + 1));
      i++;
      if (i >= last.message.length) clearInterval(t);
    }, 14);
    return () => clearInterval(t);
  }, [allLogs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // â”€â”€ Filtered view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filters   = ['ALL', 'CRITICAL', 'ALERT', 'WARNING', 'SUCCESS', 'INFO', 'NETWORK', 'FLAGGED'];
  const displayed = filter === 'ALL'     ? allLogs
                  : filter === 'FLAGGED' ? allLogs.filter(l => l.isFlagged)
                  : filter === 'NETWORK' ? allLogs.filter(l => l.isNetwork)
                  : allLogs.filter(l => l.level === filter);

  const analyzer = useMemo(() => {
    const now = Date.now();
    const flagged = networkLogs.filter(l => l.isFlagged);
    const recent = flagged.filter(l => now - (l.timestampMs || 0) < 5 * 60 * 1000);

    const threatCount = {};
    const sourceCount = {};
    flagged.forEach(l => {
      const t = l.pkt?.threats?.[0]?.type || 'Unknown';
      const s = l.pkt?.src_ip || 'Unknown';
      threatCount[t] = (threatCount[t] || 0) + 1;
      sourceCount[s] = (sourceCount[s] || 0) + 1;
    });

    const topThreat = Object.entries(threatCount).sort((a, b) => b[1] - a[1])[0];
    const topSource = Object.entries(sourceCount).sort((a, b) => b[1] - a[1])[0];

    let status = 'Stable';
    let color = '#00FF9C';
    if (recent.length >= 6) {
      status = 'Elevated';
      color = '#FF3D3D';
    } else if (recent.length >= 3) {
      status = 'Watch';
      color = '#FF9500';
    }

    return {
      recentCount: recent.length,
      status,
      color,
      topThreat: topThreat ? `${topThreat[0]} (${topThreat[1]})` : 'None',
      topSource: topSource ? `${topSource[0]} (${topSource[1]})` : 'None',
    };
  }, [networkLogs]);

  // ── Simulate critical packet ─────────────────────────────────
  const runSimulation = useCallback(async () => {
    if (simulating) return;
    setSimulating(true);

    const DEMO_THREATS = [
      { type: 'Suspicious Port',   detail: 'Outbound TCP to port 4444 -- Metasploit default C2',      port: 4444 },
      { type: 'SYN Flood',         detail: 'Burst of SYN_SENT states detected from internal host',    port: 80   },
      { type: 'DNS Tunneling',     detail: 'Abnormally large DNS payload to external resolver',        port: 53   },
      { type: 'Data Exfiltration', detail: 'Large outbound transfer (>40 KB) to untrusted public IP', port: 8443 },
    ];
    const threat = DEMO_THREATS[Math.floor(Math.random() * DEMO_THREATS.length)];
    const now    = Date.now();
    const pktId  = `sim-${now}`;

    const simPkt = {
      id:               pktId,
      timestamp:        now / 1000,
      src_ip:           `192.168.${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 200) + 10}`,
      src_port:         Math.floor(Math.random() * 30000) + 30000,
      dst_ip:           `${Math.floor(Math.random() * 99) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 253) + 1}`,
      dst_port:         threat.port,
      protocol:         'TCP',
      bytes:            Math.floor(Math.random() * 80000) + 40000,
      ttl:              64,
      flags:            'SYN',
      state:            'SYN_SENT',
      size_trustworthy: true,
      pid:              null,
      process:          '[simulation]',
      synthetic:        true,
      is_suspicious:    true,
      severity:         'CRITICAL',
      max_score:        0.92 + Math.random() * 0.07,
      threats:          [{ type: threat.type, score: 0.95, detail: threat.detail }],
    };

    const timeStr = new Date(now).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const message =
      `[SIM] !! CRITICAL -- ${threat.type} (score ${Math.round(simPkt.max_score * 100)}%): ${simPkt.src_ip}:${simPkt.src_port} -> ${simPkt.dst_ip}:${simPkt.dst_port} ` +
      `[TCP] state=SYN_SENT | ${threat.detail}`;

    const logEntry = {
      id: pktId, time: timeStr, timestampMs: now,
      level: 'CRITICAL', message,
      isNetwork: true, isFlagged: true, pkt: simPkt,
    };

    setNetworkLogs(prev => [...prev, logEntry].slice(-200));
    setToasts(prev => [...prev.slice(-4), {
      id:         pktId,
      severity:   'CRITICAL',
      threatType: threat.type,
      detail:     threat.detail,
      srcIp:      simPkt.src_ip,
      srcPort:    simPkt.src_port,
      dstIp:      simPkt.dst_ip,
      dstPort:    simPkt.dst_port,
    }]);

    await saveFlaggedToFirestore(simPkt);
    await saveCriticalActivityToFirestore(logEntry);
    setTimeout(() => setSimulating(false), 2000);
  }, [simulating, saveFlaggedToFirestore, saveCriticalActivityToFirestore]);

  // â”€â”€ Export CSV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const downloadAudit = () => {
    if (allLogs.length === 0) return;
    let csv = 'data:text/csv;charset=utf-8,ID,Time,Level,Message,Engine\n';
    allLogs.forEach(log => {
      const type = log.isReal ? 'Deepfake' : log.isPhishing ? 'Phishing'
                 : log.isStego ? 'Steganography' : log.isNetwork ? 'NetworkMonitor' : 'System';
      csv += `${log.id},${log.time},${log.level},"${log.message.replace(/"/g, '""')}",${type}\n`;
    });
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `kavach_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // â”€â”€ WS status indicator helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const WsIcon  = wsStatus === 'live' ? Wifi : wsStatus === 'connecting' ? Radio : WifiOff;
  const wsColor = wsStatus === 'live' ? '#00FF9C' : wsStatus === 'connecting' ? '#FFD600' : '#FF3D3D';
  const wsLabel = wsStatus === 'live' ? 'NET SCAN LIVE'
                : wsStatus === 'connecting' ? 'CONNECTING...' : 'BACKEND OFFLINE';

  return (
    <div className="space-y-6 pt-20 md:pt-24">

      {/* â”€â”€ Toast stack â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ThreatToast toast={t} onClose={() =>
                setToasts(prev => prev.filter(x => x.id !== t.id))} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center neon-border"
            style={{ background: 'rgba(0,255,156,0.08)' }}>
            <Terminal size={24} className="text-kavach-green" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-extrabold text-white tracking-tight leading-tight">
              SYSTEM AUDIT
            </h2>
            <p className="font-sans text-xs text-gray-500 font-medium">
              Real-time security events Â· network packet scanner Â· kernel logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Network scan status badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/5
            font-heading text-[10px] font-bold" style={{ color: wsColor }}>
            <WsIcon size={12} style={{ color: wsColor }}
              className={wsStatus === 'live' ? 'animate-pulse' : ''} />
            {wsLabel}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/5
            font-heading text-[10px] font-bold text-gray-400">
            <span className={`w-2 h-2 rounded-full ${paused ? 'bg-yellow-500' : 'bg-kavach-green animate-pulse'}`} />
            {paused ? 'PAUSED' : 'LIVE RECORDING'}
          </div>

          <div className="h-7 w-[1px] bg-white/10 hidden sm:block" />

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setPaused(p => !p)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-heading text-[11px]
              font-bold transition-all tracking-wider uppercase ${
              paused ? 'border-yellow-500/40 text-yellow-500 bg-yellow-500/5'
                     : 'border-kavach-green/40 text-kavach-green bg-kavach-green/5'
            }`}>
            {paused ? <Play size={13} /> : <Pause size={13} />}
            {paused ? 'Resume' : 'Pause'}
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} onClick={downloadAudit}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10
              font-heading text-[11px] font-extrabold text-white tracking-wide uppercase transition-all">
            Export CSV
          </motion.button>
        </div>
      </motion.div>

      {/* â”€â”€ Main layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">

        {/* â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="space-y-5">

          {/* Filters */}
          <div className="glass-card p-5 shadow-xl">
            <h3 className="font-heading text-[10px] text-gray-600 font-bold tracking-widest px-1 uppercase mb-3">
              LOG FILTERS
            </h3>
            <div className="space-y-1">
              {filters.map(f => {
                const cfg = levelConfig[f] || { color: '#9ca3af' };
                const count = f === 'ALL'     ? allLogs.length
                            : f === 'FLAGGED' ? allLogs.filter(l => l.isFlagged).length
                            : f === 'NETWORK' ? allLogs.filter(l => l.isNetwork).length
                            : allLogs.filter(l => l.level === f).length;
                return (
                  <motion.button key={f} whileHover={{ x: 3 }}
                    onClick={() => setFilter(f)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border
                      transition-all ${filter === f
                        ? 'border-white/10 bg-white/5' : 'border-transparent hover:bg-white/2'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{ background: f === 'ALL' ? '#00FF9C' : cfg.color }} />
                      <span className={`font-heading text-[11px] font-bold tracking-tight ${
                        filter === f ? 'text-white' : 'text-gray-500'}`}>
                        {f}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-gray-600">{count}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Network stats card */}
          <div className="glass-card p-5 shadow-xl space-y-4">
            <h3 className="font-heading text-[10px] text-gray-600 font-bold tracking-widest uppercase">
              NET SCANNER
            </h3>
            {[
              { label: 'Packets captured', value: networkLogs.length },
              { label: 'Flagged',          value: networkLogs.filter(l => l.isFlagged).length, color: '#FF3D3D' },
              { label: 'Scan interval',    value: '800 ms' },
              { label: 'Backend',          value: wsStatus === 'live' ? 'Connected' : 'Offline', color: wsColor },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center">
                <span className="font-sans text-[11px] text-gray-500 font-medium">{s.label}</span>
                <span className="font-mono text-[11px] font-bold" style={{ color: s.color || '#ffffff' }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Terminal status */}
          <div className="glass-card p-5 shadow-xl space-y-4">
            <h3 className="font-heading text-[10px] text-gray-600 font-bold tracking-widest uppercase">
              TERMINAL STATUS
            </h3>
            {[
              { label: 'Encryption', value: 'AES-256' },
              { label: 'Protocol',   value: 'WS/TLS' },
              { label: 'SIEM',       value: 'ACTIVE' },
              { label: 'DB Events',  value: dbLogs.length + phishingLogs.length + stegoLogs.length },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center">
                <span className="font-sans text-[11px] text-gray-500 font-medium">{s.label}</span>
                <span className="font-mono text-[11px] text-white font-bold">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Analyzer summary */}
          <div className="glass-card p-5 shadow-xl space-y-4">
            <h3 className="font-heading text-[10px] text-gray-600 font-bold tracking-widest uppercase">
              ANALYZER
            </h3>
            <div className="flex justify-between items-center">
              <span className="font-sans text-[11px] text-gray-500 font-medium">Status (5m)</span>
              <span className="font-mono text-[11px] font-bold" style={{ color: analyzer.color }}>
                {analyzer.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-sans text-[11px] text-gray-500 font-medium">Flagged (5m)</span>
              <span className="font-mono text-[11px] text-white font-bold">{analyzer.recentCount}</span>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="font-sans text-[11px] text-gray-500 font-medium">Top threat</span>
              <span className="font-mono text-[10px] text-gray-300 text-right truncate">{analyzer.topThreat}</span>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="font-sans text-[11px] text-gray-500 font-medium">Top source</span>
              <span className="font-mono text-[10px] text-gray-300 text-right truncate">{analyzer.topSource}</span>
            </div>
          </div>
        </div>

        {/* â”€â”€ Terminal console â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}
          className="xl:col-span-3 glass-card bg-black/80 border-white/10 min-h-[640px] flex flex-col
            shadow-2xl overflow-hidden ring-1 ring-white/5">

          {/* Title bar */}
          <div className="bg-white/5 border-b border-white/5 px-5 py-3 flex items-center justify-between">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/10" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/10" />
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/10" />
            </div>
            <span className="font-heading text-[10px] font-extrabold text-gray-500 tracking-widest uppercase">
              KAVACH SYSTEM TERMINAL v4.2.1 Â· NETWORK PROBE ENABLED
            </span>
            <div className="flex items-center gap-3 text-gray-500">
              <span className="font-heading text-[9px] font-extrabold tracking-widest">SIEM: CONNECTED</span>
              <Terminal size={13} className="text-gray-600" />
            </div>
          </div>

          {/* Log body */}
          <div className="flex-1 p-6 font-mono text-xs overflow-y-auto space-y-1.5 custom-scrollbar"
            style={{ background: '#020503' }}>

            {/* Boot banner */}
            <p className="text-gray-600 mb-4 opacity-40 leading-relaxed">
              [root@kavach-core ~]# systemctl status dshield-ai.service<br />
              â— dshield-ai.service â€“ Kavach Explainable AI Threat Engine<br />
              &nbsp;&nbsp;&nbsp;Loaded: loaded (/lib/systemd/system/dshield-ai.service; enabled)<br />
              &nbsp;&nbsp;&nbsp;Active: active (running) | net-probe: active (streaming)
            </p>

            <AnimatePresence initial={false}>
              {displayed.map((log, i) => {
                const cfg    = levelConfig[log.level] ?? levelConfig.INFO;
                const isLast = i === displayed.length - 1;
                return (
                  <motion.div key={log.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-4 group py-0.5 rounded-lg px-1 transition-colors"
                    style={log.isFlagged ? { background: 'rgba(255,61,61,0.05)' } : undefined}
                  >
                    {/* Timestamp */}
                    <span className="text-gray-700 select-none font-bold w-16 text-[10px] shrink-0">
                      [{log.time}]
                    </span>

                    {/* Level badge */}
                    <span className="shrink-0 font-extrabold w-20 text-[10px] tracking-tight"
                      style={{ color: cfg.color }}>
                      {cfg.prefix}
                    </span>

                    {/* Message */}
                    <span className="text-gray-300 group-hover:text-white transition-colors leading-relaxed min-w-0">
                      {log.isReal     && <ScanFace    size={11} className="inline mr-1.5 text-kavach-green opacity-70" />}
                      {log.isPhishing && <ShieldAlert  size={11} className="inline mr-1.5 text-orange-500 opacity-70" />}
                      {log.isStego    && <Eye          size={11} className="inline mr-1.5 text-[#00B4D8]  opacity-70" />}
                      {log.isNetwork && !log.isFlagged && (
                        <Radio size={11} className="inline mr-1.5 opacity-40" style={{ color: '#A855F7' }} />
                      )}
                      {log.isFlagged && (
                        <AlertTriangle size={11} className="inline mr-1.5 text-red-400 opacity-90" />
                      )}
                      <span style={log.isFlagged ? { color: '#FF9090' } : undefined}>
                        {isLast ? typingLog : log.message}
                      </span>
                      {isLast && typingLog.length < log.message.length && (
                        <span className="inline-block w-2 h-3.5 bg-kavach-green align-middle ml-1 animate-pulse" />
                      )}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {displayed.length === 0 && (
              <p className="text-gray-700 font-mono text-[11px] pt-4">
                No events match the current filter. Waiting for dataâ€¦
                <span className="inline-block w-2 h-3.5 bg-gray-700 align-middle ml-1 animate-pulse" />
              </p>
            )}

            <div ref={bottomRef} className="h-4" />
          </div>

          {/* Footer bar */}
          <div className="px-6 py-3 border-t border-white/5 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-kavach-green font-mono text-xs select-none">$</span>
              <span className="text-gray-500 font-mono text-xs">
                {wsStatus === 'live'
                  ? 'net-probe streaming Â· awaiting kernel eventsâ€¦'
                  : wsStatus === 'connecting'
                  ? 'net-probe connecting to localhost:8000â€¦'
                  : 'net-probe offline Â· start backend to enable scanning'}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="font-heading text-[9px] text-gray-600 font-bold tracking-widest uppercase hidden sm:block">
                ENCODING: <span className="text-gray-400">UTF-8</span>
              </span>
              <span className="font-heading text-[9px] text-gray-600 font-bold tracking-widest uppercase">
                EVENTS: <span className="text-kavach-green">{allLogs.length}</span>
              </span>
              <span className="font-heading text-[9px] text-gray-600 font-bold tracking-widest uppercase">
                FLAGGED: <span className="text-red-400">{allLogs.filter(l => l.isFlagged).length}</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
