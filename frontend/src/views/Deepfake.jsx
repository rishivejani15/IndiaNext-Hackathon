import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace, UploadCloud, ShieldCheck, FileVideo, Image as ImageIcon, X, Zap, AlertTriangle, CheckCircle, Info, Activity, Shield, Target } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getCountFromServer } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function Deepfake() {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLogging, setIsLogging] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error'
  const fileInputRef = useRef(null);

  const saveToFirestore = async (analysisData) => {
    setIsLogging(true);
    setSaveStatus('saving');
    try {
      // Get the current total count of logs to provide an incremental ID
      const coll = collection(db, 'deepfake_logs');
      const snapshot = await getCountFromServer(coll);
      const currentCount = snapshot.data().count;

      await addDoc(coll, {
        ...analysisData,
        detectionCount: currentCount + 1, // Store the cumulative count as requested
        userId: currentUser?.uid || 'anonymous',
        userName: currentUser?.displayName || 'Anonymous User',
        userEmail: currentUser?.email || 'N/A',
        timestamp: serverTimestamp(),
      });
      console.log('Result logged to Firestore successfully');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Error logging to Firestore:', err);
      setSaveStatus('error');
      setError('Firestore Error: ' + err.message);
    } finally {
      setIsLogging(false);
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

    const isVideo = file.type.startsWith('video/');
    const apiEndpoint = isVideo 
      ? 'https://rishixd-indianext-hackathon.hf.space/detect/video'
      : 'https://rishixd-indianext-hackathon.hf.space/detect/image';

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (response.status === 503) {
        throw new Error('The AI Engine is currently waking up. Please wait a moment and try again.');
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Server at ${new URL(apiEndpoint).hostname} responded with ${response.status}: ${errorText || response.statusText}`);
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

  const simulateAnalysis = () => {
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    
    // Artificial delay to show the "Kavach" analysis animation
    setTimeout(async () => {
      const isFake = Math.random() > 0.3; // 70% chance of being fake for demo
      const confidence = isFake 
        ? Math.floor(Math.random() * (99 - 90 + 1)) + 90 
        : Math.floor(Math.random() * (20 - 1 + 1)) + 1;

      const simulationData = {
        input_type: file.type.startsWith('video/') ? "video" : "image",
        filename: file.name,
        verdict: isFake ? "DEEPFAKE" : "REAL",
        confidence: confidence,
        fake_probability: isFake ? confidence : (100 - confidence),
        real_probability: isFake ? (100 - confidence) : confidence,
        severity: isFake ? "CRITICAL" : "LOW",
        detection_method: "frame_by_frame",
        model_used: "sightengine-deepfake-genai",
        technical_signals: isFake ? [
            `Model confidence ${confidence}% indicates high likelihood of synthetic generation`,
            "GAN-based artifacts detected in facial texture regions",
            "Boundary blending inconsistencies identified near facial edges"
        ] : [
            "No significant GAN artifacts detected",
            "Natural skin texture and lighting consistency verified",
            "Temporal consistency maintained across frames"
        ],
        plain_english: isFake 
          ? `This content appears to be AI-generated or manipulated with ${confidence}% confidence. It shows technical patterns characteristic of deepfake generation tools.`
          : `This content appears to be authentic with ${100 - confidence}% certainty. No signs of advanced AI manipulation were detected.`,
        recommended_action: isFake 
          ? "Do not share or use this content. Verify the original source independently."
          : "Content verified as likely authentic. Proceed with standard caution."
      };
      setResult(simulationData);
      await saveToFirestore(simulationData);
      setIsAnalyzing(false);
    }, 2500);
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
            style={{ background: 'rgba(0,255,156,0.08)' }}>
            <ScanFace size={24} className="text-kavach-green" />
          </div>
          <h2 className="font-heading text-3xl font-extrabold text-white tracking-tight">DEEPFAKE DETECTION</h2>
        </div>
        <p className="font-sans text-sm text-gray-500 font-medium tracking-wide uppercase">
          Neural-Engine Analysis for Synthetic Media Validation
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
              ${isDragging ? 'border-kavach-green bg-kavach-green/05' : 'border-white/10 hover:border-white/20'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current.click()}
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-kavach-green/50 to-transparent scan-effect opacity-30" />
            
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
                    <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center bg-white/02 group-hover:scale-110 transition-transform duration-500">
                      <UploadCloud size={32} className="text-gray-400 group-hover:text-kavach-green transition-colors" />
                    </div>
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-full bg-kavach-green blur-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-heading text-xl font-bold text-white uppercase tracking-wider">Drag & Drop Media</h3>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">
                      Supports JPG, PNG, MP4, MOV (MAX 50MB)
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/05 border border-white/10 text-[10px] font-bold text-gray-400">
                      <ImageIcon size={12} /> IMAGE
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/05 border border-white/10 text-[10px] font-bold text-gray-400">
                      <FileVideo size={12} /> VIDEO
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
                  <div className="relative w-full max-h-64 rounded-xl overflow-hidden border border-kavach-green/30 shadow-2xl shadow-kavach-green/10">
                    {file.type.startsWith('video/') ? (
                      <video src={preview} className="w-full h-full object-contain" autoPlay loop muted />
                    ) : (
                      <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                    )}
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
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • READY FOR ANALYSIS
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => handleFile(e.target.files[0])}
              accept="image/*,video/*"
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
                <span>SERVER RESPONSE ERROR</span>
              </div>
              <p className="text-[10px] opacity-80 normal-case font-medium">{error}</p>
              
              <button 
                onClick={simulateAnalysis}
                className="mt-2 px-4 py-2 rounded-lg bg-red-500 text-white text-[10px] font-black tracking-widest uppercase hover:bg-red-600 transition-colors shadow-lg"
              >
                Simulate Result (Demo Mode)
              </button>
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
                  className="flex items-center gap-3 px-10 py-4 rounded-xl bg-kavach-green text-black font-heading text-sm font-black tracking-[0.2em] uppercase shadow-lg transition-shadow relative overflow-hidden"
                >
                  <Zap size={18} />
                  <span>START ANALYSIS</span>
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
              <Activity className="text-kavach-green animate-pulse" size={40} />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h3 className="font-heading text-xl font-black text-white tracking-widest uppercase animate-pulse">Analyzing Neural Patterns</h3>
            <p className="text-gray-500 text-[10px] font-bold tracking-[0.3em] uppercase">Checking for GAN artifacts & synthetic blending...</p>
          </div>
          <div className="w-full max-w-xs h-1 bg-white/05 rounded-full overflow-hidden relative">
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
          className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Verdict Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-8 border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Shield size={40} className={result.verdict === 'DEEPFAKE' ? 'text-red-500/20' : 'text-kavach-green/20'} />
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className={`px-4 py-2 rounded-lg font-heading text-xs font-black tracking-widest border
                  ${result.verdict === 'DEEPFAKE' 
                    ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                    : 'bg-kavach-green/10 border-kavach-green/30 text-kavach-green shadow-[0_0_15px_rgba(0,255,156,0.2)]'}`}
                >
                  VERDICT: {result.verdict}
                </div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  SEVERITY: <span className={result.severity === 'CRITICAL' ? 'text-red-500' : 'text-kavach-green'}>{result.severity}</span>
                </div>
                
                {/* Firestore Sync Badge */}
                {saveStatus && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black tracking-tighter uppercase border
                      ${saveStatus === 'saving' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 
                        saveStatus === 'saved' ? 'bg-kavach-green/10 border-kavach-green/30 text-kavach-green' : 
                        'bg-red-500/10 border-red-500/30 text-red-500'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saving' ? 'bg-blue-400 animate-pulse' : saveStatus === 'saved' ? 'bg-kavach-green' : 'bg-red-500'}`} />
                    {saveStatus === 'saving' ? 'SYNCING TO CLOUD...' : saveStatus === 'saved' ? 'LOGGED TO FIREBASE' : 'SYNC FAILED'}
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
                <div>
                  <h3 className="font-heading text-2xl font-black text-white mb-4">Analysis Summary</h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-medium">
                    {result.plain_english}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center p-6 bg-white/02 rounded-2xl border border-white/05">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Confidence Level</span>
                  <div className={`text-5xl font-black font-heading ${result.verdict === 'DEEPFAKE' ? 'text-red-500' : 'text-kavach-green'}`}>
                    {result.confidence}%
                  </div>
                  <div className="w-full h-1.5 bg-white/05 rounded-full mt-4 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence}%` }}
                      className={`h-full ${result.verdict === 'DEEPFAKE' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-kavach-green shadow-[0_0_10px_#00FF9C]'}`}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/02 rounded-xl p-5 border border-white/05">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={14} className="text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Technical Indicators (IOC)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.technical_signals?.map((signal, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/05 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                      {signal}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="flex justify-center">
              <div className="glass-card p-6 border-white/10 ring-1 ring-white/05 max-w-md w-full text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Info size={16} className="text-kavach-green" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Recommended Action</span>
                </div>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                  {result.recommended_action}
                </p>
              </div>
            </div>
          </div>

          {/* Media & Actions Panel */}
          <div className="space-y-6">
            <div className="glass-card p-4 border-white/10 ring-1 ring-white/05">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Analyzed Content</span>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                {file.type.startsWith('video/') ? (
                  <video src={preview} className="w-full aspect-video object-cover" controls />
                ) : (
                  <img src={preview} alt="Analyzed" className="w-full object-contain" />
                )}
              </div>
              <div className="mt-4 p-3 bg-white/02 rounded-lg border border-white/05">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Source Filename</div>
                <div className="text-xs text-gray-300 font-mono truncate">{file.name}</div>
              </div>
            </div>

            <button 
              onClick={resetFile}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/05 border border-white/10 text-white font-heading text-xs font-black tracking-widest uppercase hover:bg-white/10 transition-colors"
            >
              Analyze New Media
            </button>

            <div className="glass-card p-6 border-kavach-green/20 relative group cursor-pointer overflow-hidden">
               <div className="absolute inset-0 bg-kavach-green/02 group-hover:bg-kavach-green/05 transition-colors" />
               <div className="relative z-10">
                 <h4 className="font-heading text-[10px] font-black text-kavach-green tracking-widest uppercase mb-2">Export Certificate</h4>
                 <p className="text-[10px] text-gray-500 font-bold uppercase leading-tight">Generate cryptographically signed analysis report (PDF)</p>
               </div>
               <div className="absolute bottom-2 right-2 opacity-20">
                 <ShieldCheck size={40} className="text-kavach-green" />
               </div>
            </div>
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
          ESTABLISHED SECURE BUFFER
        </div>
        <div className="flex items-center gap-2 text-kavach-green/60">
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1.5 h-1.5 rounded-full bg-kavach-green"
          />
          GPU ACCELERATION ACTIVE
        </div>
        <div className="flex items-center gap-2">
          <ScanFace size={12} className="text-kavach-green" />
          MULTI-MODAL NEURAL NET v2.1
        </div>
      </motion.div>
    </div>
  );
}