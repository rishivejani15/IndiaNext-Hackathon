import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, UploadCloud, ShieldCheck, Image as ImageIcon, X, Zap, AlertTriangle, Activity, Shield, Target, FileSearch, Layers, MessageSquare, Fingerprint } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getCountFromServer } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function Steganography() {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const fileInputRef = useRef(null);

  const saveToFirestore = async (analysisData) => {
    setSaveStatus('saving');
    try {
      const coll = collection(db, 'stego_logs');
      const snapshot = await getCountFromServer(coll);
      const currentCount = snapshot.data().count;

      await addDoc(coll, {
        ...analysisData,
        detectionCount: currentCount + 1,
        userId: currentUser?.uid || 'anonymous',
        userName: currentUser?.displayName || 'Anonymous User',
        userEmail: currentUser?.email || 'N/A',
        timestamp: serverTimestamp(),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Error logging to Firestore:', err);
      setSaveStatus('error');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const resetFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startAnalysis = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', currentUser?.uid || 'demo');

    try {
      const response = await fetch('https://rudraaaa76-kavach-endpoints.hf.space/api/stego/scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Server responded with ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      await saveToFirestore(data);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Analysis failed. Please check your connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 pt-24 md:pt-0 pb-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center neon-border"
            style={{ background: 'rgba(0,255,156,0.08)', boxShadow: '0 0 20px rgba(0,255,156,0.15)' }}>
            <Eye size={24} className="text-kavach-green" />
          </div>
          <h2 className="font-heading text-3xl font-extrabold text-white tracking-tight">STEGANOGRAPHY SCAN</h2>
        </div>
        <p className="font-sans text-sm text-gray-500 font-medium tracking-wide uppercase">
          Extract Covert Payloads & Hidden Instructions from Media
        </p>
      </motion.div>

      {!result && !isAnalyzing ? (
        /* Upload Area */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-2xl"
        >
          <div 
            className={`glass-card p-12 border-2 border-dashed transition-all duration-300 relative overflow-hidden group
              ${isDragging ? 'border-kavach-green bg-kavach-green/5' : 'border-white/10 hover:border-white/20'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current.click()}
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FF9C]/50 to-transparent scan-effect opacity-30" />
            
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div 
                  key="upload-prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center space-y-6 cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:scale-110 transition-transform duration-500">
                      <UploadCloud size={32} className="text-gray-400 group-hover:text-kavach-green transition-colors" />
                    </div>
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-full bg-kavach-green blur-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-heading text-xl font-bold text-white uppercase tracking-wider">Drag & Drop Image</h3>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">
                      Supports JPG, PNG (MAX 50MB)
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400">
                      <ImageIcon size={12} /> IMAGE
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center space-y-6"
                >
                  <div className="relative w-full max-h-64 rounded-xl overflow-hidden border border-kavach-green/30 shadow-2xl shadow-[#00FF9C]/10 bg-black/50">
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); resetFile(); }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 border border-white/10 text-white hover:bg-red-500 transition-colors z-10"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute inset-0 pointer-events-none border-2 border-kavach-green/20 box-border rounded-xl" />
                  </div>
                  
                  <div className="text-center">
                    <h4 className="font-heading text-white text-sm font-bold truncate max-w-xs">{file.name}</h4>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • READY FOR FORENSIC SCAN
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => handleFile(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest text-center flex flex-col items-center justify-center gap-3 backdrop-blur-md"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} />
                <span>SCAN FAILURE</span>
              </div>
              <p className="text-[10px] opacity-80 normal-case font-medium">{error}</p>
            </motion.div>
          )}

          <AnimatePresence>
            {file && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="mt-8 flex justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,255,156,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startAnalysis}
                  className="flex items-center gap-3 px-10 py-4 rounded-xl text-black font-heading text-sm font-black tracking-[0.2em] uppercase shadow-lg transition-shadow relative overflow-hidden"
                  style={{ background: '#00FF9C' }}
                >
                  <FileSearch size={18} />
                  <span>EXTRACT PAYLOADS</span>
                  <div className="absolute inset-0 scan-effect opacity-30 pointer-events-none" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : isAnalyzing ? (
        /* Analysis Overlay */
        <motion.div 
          key="analyzing"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center space-y-8 glass-card p-20 w-full max-w-2xl border-kavach-green/20"
        >
          <div className="relative w-40 h-40">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-kavach-green/30"
            />
            <div className="absolute inset-4 rounded-full border border-kavach-green/10 radar-sweep" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Layers className="text-kavach-green animate-pulse" size={40} />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h3 className="font-heading text-xl font-black text-white tracking-widest uppercase animate-pulse">Scanning LSB & Metadata</h3>
            <p className="text-gray-500 text-[10px] font-bold tracking-[0.3em] uppercase">Hunting for covert instructions embedded in binary...</p>
          </div>
          <div className="w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 4, ease: 'easeInOut' }}
              className="absolute h-full bg-kavach-green shadow-[0_0_10px_#00FF9C]"
            />
          </div>
        </motion.div>
      ) : (
        /* Results View */
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Verdict Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-8 border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Fingerprint size={80} className={result.severity === 'CRITICAL' || result.severity === 'HIGH' ? 'text-red-500/10' : 'text-kavach-green/10'} />
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className={`px-4 py-2 rounded-lg font-heading text-xs font-black tracking-widest border
                  ${result.severity === 'CRITICAL' || result.severity === 'HIGH'
                    ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                    : 'bg-kavach-green/10 border-kavach-green/30 text-kavach-green shadow-[0_0_15px_rgba(0,255,156,0.2)]'}`}
                >
                  VERDICT: {result.severity === 'CRITICAL' || result.severity === 'HIGH' ? 'PAYLOAD DETECTED' : 'CLEAN'}
                </div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  SEVERITY: <span className={result.severity === 'CRITICAL' || result.severity === 'HIGH' ? 'text-red-500' : 'text-kavach-green'}>{result.severity}</span>
                </div>
                
                {/* Firestore Sync Badge */}
                {saveStatus && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black tracking-tighter uppercase border
                      ${saveStatus === 'saving' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 
                        saveStatus === 'saved' ? 'bg-[#00FF9C]/10 border-[#00FF9C]/30 text-[#00FF9C]' : 
                        'bg-red-500/10 border-red-500/30 text-red-500'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saving' ? 'bg-blue-400 animate-pulse' : saveStatus === 'saved' ? 'bg-[#00FF9C]' : 'bg-red-500'}`} />
                    {saveStatus === 'saving' ? 'SYNCING TO CLOUD...' : saveStatus === 'saved' ? 'LOGGED TO FIREBASE' : 'SYNC FAILED'}
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
                <div>
                  <h3 className="font-heading text-2xl font-black text-white mb-4">Risk Assessment</h3>
                  <div className="flex gap-4 mb-4">
                     <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Layers Scanned</div>
                        <div className="font-heading text-sm text-white font-bold">{result.layers_scanned?.join(', ').toUpperCase() || 'N/A'}</div>
                     </div>
                     <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Layers Triggered</div>
                        <div className="font-heading text-sm text-red-400 font-bold">{result.layers_triggered?.join(', ').toUpperCase() || 'NONE'}</div>
                     </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Overall Risk Score</span>
                  <div className={`text-5xl font-black font-heading ${result.severity === 'CRITICAL' || result.severity === 'HIGH' ? 'text-red-500' : 'text-kavach-green'}`}>
                    {result.risk_score.toFixed(0)}%
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(result.risk_score, 100)}%` }}
                      className={`h-full ${result.severity === 'CRITICAL' || result.severity === 'HIGH' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-kavach-green shadow-[0_0_10px_#00FF9C]'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Layer Results Breakdown */}
              {result.layer_results && (
                <div className="space-y-3 mb-8">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vector Analysis</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.values(result.layer_results).map((layerData, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border ${layerData.payload_found ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-heading text-sm font-black tracking-widest uppercase ${layerData.payload_found ? 'text-red-400' : 'text-kavach-green'}`}>
                            {layerData.layer}
                          </span>
                          {layerData.payload_found && <AlertTriangle size={14} className="text-red-500" />}
                        </div>
                        <p className="text-xs text-gray-400 font-medium mb-2">{layerData.detail}</p>
                        {layerData.payload_found && layerData.is_injection && (
                           <div className="inline-block px-2 py-1 rounded-md bg-red-500/20 text-red-300 text-[9px] font-black uppercase tracking-widest">
                             Injection Attack Detected
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suspicious Payloads Extracted */}
              {result.hidden_payloads && result.hidden_payloads.length > 0 && (
                <div className="bg-red-500/5 rounded-xl border border-red-500/20 p-5 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={16} className="text-red-500" />
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Extracted Hidden Payloads</span>
                  </div>
                  <div className="space-y-4">
                    {result.hidden_payloads.map((payload, i) => (
                      <div key={i} className="p-4 bg-black/50 rounded-lg border border-red-500/10 font-mono text-sm text-gray-300 break-words overflow-wrap-anywhere whitespace-pre-wrap">
                        <span className="text-[9px] text-red-400 uppercase font-black block mb-2 opacity-50">SOURCE: {payload.source}</span>
                        {payload.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Safe Word Challenge (If applicable) */}
            {result.safe_word_challenge && (
              <div className="glass-card p-6 border-yellow-500/30 bg-yellow-500/5 shadow-[0_0_30px_rgba(234,179,8,0.05)] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/50" />
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                    <Shield size={24} className="text-yellow-500" />
                  </div>
                </div>
                <h4 className="font-heading text-lg font-black text-white tracking-widest uppercase mb-2">Human Verification</h4>
                <p className="text-xs text-yellow-500 font-bold mb-4">{result.safe_word_challenge.why}</p>
                <div className="p-4 bg-black/40 rounded-xl border border-yellow-500/20 mb-4">
                  <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Challenge</div>
                  <div className="text-sm text-yellow-400 font-mono">{result.safe_word_challenge.question}</div>
                  <div className="text-[9px] text-gray-500 mt-2 italic">Hint: {result.safe_word_challenge.hint}</div>
                </div>
                <div className="text-[9px] text-gray-500 font-bold uppercase block w-full">Time Remaining: {result.safe_word_challenge.expires_in_seconds}s</div>
              </div>
            )}
            
          </div>

          {/* Media & Actions Panel */}
          <div className="space-y-6">
            <div className="glass-card p-4 border-white/10 ring-1 ring-white/5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Scanned Artifact</span>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                <img src={preview} alt="Analyzed" className="w-full object-contain max-h-48" />
              </div>
              <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Source Information</div>
                <div className="text-xs text-gray-300 font-mono truncate">{file.name}</div>
                <div className="flex justify-between items-center mt-2">
                   <div className="text-[10px] text-gray-500">Scan Time</div>
                   <div className="text-[10px] text-white font-mono">{result.meta?.total_ms}ms</div>
                </div>
              </div>
            </div>

            <button 
              onClick={resetFile}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-heading text-xs font-black tracking-widest uppercase hover:bg-white/10 transition-colors"
            >
              Scan New Artifact
            </button>
          </div>
        </motion.div>
      )}

      {/* Footer Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-8 text-[9px] font-bold text-gray-600 tracking-widest uppercase"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={12} className="text-kavach-green" />
          STEGANOGRAPHY ENGINE ACTIVE
        </div>
        <div className="flex items-center gap-2 text-kavach-green">
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1.5 h-1.5 rounded-full bg-kavach-green"
          />
          LSB & METADATA FORENSICS
        </div>
      </motion.div>
    </div>
  );
}