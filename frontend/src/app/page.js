"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useAnimation, useInView } from 'framer-motion'
import { Target, Zap, User, LayoutDashboard, Link as LinkIcon, Scan, GraduationCap, Network, ShieldAlert, ShieldCheck, AlertTriangle, Search, Puzzle, Clock, Settings, XCircle, CheckCircle2, ArrowRight, Menu, X } from 'lucide-react'
import Link from 'next/link'

/* ─── Parallax Section Wrapper ─── */
function ParallaxSection({ children, className = "", speed = 0.3, ...rest }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })
  const y = useTransform(scrollYProgress, [0, 1], [180 * speed, -180 * speed])

  return (
    <div ref={ref} className={className} {...rest}>
      <motion.div style={{ y }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  )
}

function PageAmbientParallax() {
  const { scrollY } = useScroll()
  const upperGlowY = useTransform(scrollY, [0, 1600], [0, -240])
  const lowerGlowY = useTransform(scrollY, [0, 1600], [0, 300])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        style={{ y: upperGlowY }}
        className="absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.14)_0%,rgba(0,255,156,0.04)_38%,transparent_72%)] blur-3xl"
      />
      <motion.div
        style={{ y: lowerGlowY }}
        className="absolute right-[-10rem] top-[42vh] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.12)_0%,rgba(0,255,156,0.03)_42%,transparent_74%)] blur-3xl"
      />
    </div>
  )
}

function HeroHackerParallax({ targetRef }) {
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"]
  })
  const y = useTransform(scrollYProgress, [0, 1], [-220, 180])
  const scale = useTransform(scrollYProgress, [0, 1], [0.96, 1.14])
  const rotate = useTransform(scrollYProgress, [0, 1], [2, -3])

  return (
    <motion.div
      style={{ y, scale, rotate }}
      className="relative z-30 -mt-2 md:-mt-4 w-full max-w-5xl mx-auto flex justify-center items-center h-full pt-24 md:pt-20 pointer-events-none will-change-transform"
    >
      <img
        src="/hacker.png"
        alt="Hacker silhouette"
        className="h-auto w-[96%] md:w-[82%] lg:w-[68%] object-contain drop-shadow-[0_0_42px_rgba(0,255,156,0.3)] brightness-[0.88] contrast-110 saturate-110"
      />
    </motion.div>
  )
}

function HeroBackdropTextParallax({ targetRef }) {
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"]
  })
  const xTop = useTransform(scrollYProgress, [0, 1], [-720, 680])
  const xMiddle = useTransform(scrollYProgress, [0, 1], [680, -720])
  const xBottom = useTransform(scrollYProgress, [0, 1], [-640, 760])
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1.12])
  const opacity = useTransform(scrollYProgress, [0, 0.35, 1], [0.28, 0.58, 0.34])

  return (
    <motion.div
      style={{ scale, opacity }}
      className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden select-none will-change-transform"
    >
      <motion.h2
        style={{ x: xTop }}
        className="text-[13vw] md:text-[11vw] font-black leading-none text-[#d7ffe4]/25 tracking-[-0.08em] whitespace-nowrap [text-shadow:0_0_22px_rgba(0,255,156,0.28)]"
      >
        CYBER DEFENSE
      </motion.h2>
      <motion.h2
        style={{ x: xMiddle }}
        className="-mt-2 text-[15vw] md:text-[12vw] font-black leading-none text-[#edfff2]/30 tracking-[-0.08em] whitespace-nowrap [text-shadow:0_0_28px_rgba(0,255,156,0.34)]"
      >
        REAL TIME SHIELD
      </motion.h2>
      <motion.h2
        style={{ x: xBottom }}
        className="-mt-2 text-[12vw] md:text-[10vw] font-black leading-none text-[#c9ffd8]/24 tracking-[-0.08em] whitespace-nowrap [text-shadow:0_0_20px_rgba(0,255,156,0.24)]"
      >
        THREAT BLOCKED
      </motion.h2>
    </motion.div>
  )
}

/* ─── Matrix Rain Column ─── */
function seededNoise(seed) {
  const value = Math.sin(seed * 9999) * 10000
  return value - Math.floor(value)
}

function MatrixRain() {
  const columns = Array.from({ length: 50 }, (_, i) => {
    const leftOffset = seededNoise(i + 1)
    const delayOffset = seededNoise(i + 101)
    const durationOffset = seededNoise(i + 201)
    const charLength = 40 + Math.floor(seededNoise(i + 301) * 20)

    return {
      left: `${(((i / 50) * 100) + (leftOffset - 0.5) * 2).toFixed(5)}%`,
      delay: `${(delayOffset * 8).toFixed(3)}s`,
      duration: `${(6 + durationOffset * 10).toFixed(3)}s`,
      chars: Array.from({ length: charLength }, (_, index) =>
        seededNoise(i * 100 + index + 401) > 0.5 ? '0' : '1'
      ).join(''),
    }
  })

  return (
    <div className="matrix-rain">
      {columns.map((col, i) => (
        <span
          key={i}
          className="col"
          style={{
            left: col.left,
            animationDelay: col.delay,
            animationDuration: col.duration,
          }}
        >
          {col.chars}
        </span>
      ))}
    </div>
  )
}

/* ─── Live Threat Notification Toast ─── */
const THREATS = [
  { ip: "192.168.0.87", type: "SQL Injection", status: "BLOCKED" },
  { ip: "10.0.42.19", type: "Phishing URL", status: "NEUTRALIZED" },
  { ip: "172.16.5.201", type: "XSS Payload", status: "BLOCKED" },
  { ip: "203.0.113.42", type: "Deepfake Upload", status: "FLAGGED" },
  { ip: "198.51.100.77", type: "Brute Force", status: "BLOCKED" },
  { ip: "45.33.32.156", type: "Port Scan", status: "BLOCKED" },
  { ip: "185.220.101.3", type: "Ransomware C2", status: "NEUTRALIZED" },
  { ip: "91.134.10.45", type: "Credential Stuffing", status: "BLOCKED" },
]

const TIMELINE_STEPS = [
  {
    num: "01",
    title: "Create Account",
    desc: "Initiate your journey by securing your digital identity. Our multi-factor authentication setup ensures your command center remains impenetrable from day one.",
    icon: User,
  },
  {
    num: "02",
    title: "Dashboard Login",
    desc: "Access your unified security overview. Monitor real-time threats, device health, and network stability from a single, encrypted interface.",
    icon: LayoutDashboard,
  },
  {
    num: "03",
    title: "URL Analysis",
    desc: "Scrutinize every link before you click. Our neural network analyzes domains for phishing patterns, malware signatures, and credential harvesting risks.",
    icon: LinkIcon,
  },
  {
    num: "04",
    title: "Deepfake Detection",
    desc: "Verify media authenticity with AI-powered forensic analysis. Detect synthetic manipulations in video and audio files to prevent social engineering.",
    icon: Scan,
  },
  {
    num: "05",
    title: "Awareness Modules",
    desc: "Train your instincts with gamified learning. Stay ahead of evolving cyber tactics through interactive modules updated weekly by security experts.",
    icon: GraduationCap,
  },
  {
    num: "06",
    title: "Community Reports",
    desc: "Join the global defense network. Report suspicious activities and benefit from crowd-sourced threat intelligence to protect the entire Kavach community.",
    icon: Network,
  }
]

const FAQ_ITEMS = [
  {
    q: 'How does Kavach detect phishing in real time?',
    a: 'Kavach uses URL intelligence, behavioral heuristics, and AI pattern matching to score links before user interaction. Suspicious links are blocked or isolated instantly.'
  },
  {
    q: 'Does Kavach slow down my system?',
    a: 'No. The scanning pipeline is optimized for low-latency execution and runs with lightweight telemetry, so protection remains active without noticeable performance drop.'
  },
  {
    q: 'Can Kavach detect deepfake media?',
    a: 'Yes. Kavach runs media forensics checks across visual and audio artifacts to flag manipulated content and provide risk confidence before sharing or execution.'
  },
  {
    q: 'Is my data private while using Kavach?',
    a: 'Kavach is designed with privacy-first principles. Threat analysis is scoped to security signals, and sensitive user content is not exposed for unrelated processing.'
  },
]

function ThreatToast() {
  const [currentThreat, setCurrentThreat] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = () => {
      const threat = THREATS[Math.floor(Math.random() * THREATS.length)]
      setCurrentThreat(threat)
      setVisible(true)
      setTimeout(() => setVisible(false), 3500)
    }

    // First toast after 3s
    const initialTimeout = setTimeout(show, 3000)
    // Subsequent toasts every 7s
    const interval = setInterval(show, 7000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {visible && currentThreat && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20 }}
            className="bg-black/90 border border-[#00FF9C]/40 rounded-lg p-4 min-w-[320px] backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,156,0.15)]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <ShieldCheck className="w-5 h-5 text-[#00FF9C]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#00FF9C] text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-[#00FF9C]/10 rounded">
                    {currentThreat.status}
                  </span>
                  <span className="text-gray-500 text-[10px] font-heading">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-white text-sm font-semibold">
                  {currentThreat.type} detected
                </p>
                <p className="text-gray-500 text-xs font-heading mt-0.5">
                  Source: {currentThreat.ip}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Threat Ticker Bar ─── */
function ThreatTicker() {
  const tickerItems = [
    "⚠ CVE-2026-0142 PATCHED",
    "⬢ 14,203 THREATS BLOCKED TODAY",
    "◉ SHIELD STATUS: ACTIVE",
    "▲ FIREWALL: ALL PORTS SECURED",
    "⬡ NEURAL ENGINE v4.2 ONLINE",
    "◈ PHISHING DOMAINS BLACKLISTED: 890",
    "⚡ AVG RESPONSE TIME: 0.003ms",
    "⬢ DEEPFAKE DETECTIONS: 47 THIS HOUR",
  ]

  const doubledItems = [...tickerItems, ...tickerItems]

  return (
    <div className="w-full bg-[#00FF9C]/5 border-y border-[#00FF9C]/10 py-2 threat-ticker">
      <div className="threat-ticker-content">
        {doubledItems.map((item, i) => (
          <span key={i} className="text-[#00FF9C]/60 text-[11px] font-heading tracking-wider mx-8 uppercase">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function HowItWorksStepCard({ step, index, timelineColor }) {
  const cardRef = useRef(null)
  const controls = useAnimation()
  const isInView = useInView(cardRef, { once: false, margin: '-120px' })

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    } else {
      controls.start('hidden')
    }
  }, [isInView, controls])

  const isOddStep = index % 2 === 0
  const Icon = step.icon
  const cardVariants = {
    hidden: {
      opacity: 0,
      x: isOddStep ? -60 : 60,
      y: 24,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.55, ease: 'easeOut' },
    },
  }

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate={controls}
      className={`relative mb-10 flex items-start md:mb-14 ${isOddStep ? 'md:flex-row' : 'md:flex-row-reverse'}`}
    >
      <div className={`w-full pl-[88px] md:w-1/2 md:pl-0 ${isOddStep ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
        <div className="rounded-xl border border-[#00FF9C]/12 bg-[#050805]/90 p-6 shadow-[0_0_24px_rgba(0,255,156,0.04)] transition-all hover:border-[#00FF9C]/30 hover:shadow-[0_0_28px_rgba(0,255,156,0.1)] md:p-8">
          <div className="mb-2 font-heading text-[10px] tracking-[0.2em] text-[#00FF9C]/45">{`> STEP_${step.num}`}</div>
          <h3 className="mb-3 text-2xl font-bold text-[#00FF9C] md:text-3xl">{step.title}</h3>
          <p className="text-base leading-relaxed text-gray-400 md:text-lg">{step.desc}</p>
        </div>
      </div>

      <div className="absolute left-[36px] top-6 md:static md:flex md:w-10 md:justify-center md:pt-5">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-[#040704] shadow-[0_0_22px_rgba(0,255,156,0.2)] transition-colors duration-700"
          style={{ borderColor: timelineColor }}
        >
          <Icon className="h-5 w-5 text-[#00FF9C]/80" />
        </div>
      </div>

      <div className="hidden md:block md:w-1/2" />
    </motion.div>
  )
}

function HowItWorksTimeline() {
  const [timelineColor, setTimelineColor] = useState('#00FF9C')
  const colorSteps = ['#00FF9C', '#58ff8a', '#2eff7b', '#88ffab']

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      index = (index + 1) % colorSteps.length
      setTimelineColor(colorSteps[index])
    }, 1800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <div
        className="absolute left-[36px] top-0 bottom-0 w-[2px] md:left-1/2 md:-translate-x-1/2"
        style={{ backgroundColor: timelineColor }}
      />
      <div
        className="absolute left-[36px] top-0 bottom-0 w-[8px] -translate-x-[3px] blur-[6px] opacity-60 md:left-1/2 md:-translate-x-1/2"
        style={{ backgroundColor: timelineColor }}
      />

      <div className="space-y-0">
        {TIMELINE_STEPS.map((step, index) => (
          <HowItWorksStepCard
            key={step.num}
            step={step}
            index={index}
            timelineColor={timelineColor}
          />
        ))}
      </div>
    </div>
  )
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="w-full">
      <motion.h2
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center text-3xl font-bold md:text-4xl"
      >
        Frequently Asked <span className="text-[#00FF9C]">Questions</span>
      </motion.h2>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index
          return (
            <motion.button
              key={item.q}
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="w-full rounded-xl border border-[#00FF9C]/14 bg-[#040704]/85 px-5 py-4 text-left transition-all hover:border-[#00FF9C]/32"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-semibold text-white md:text-lg">{item.q}</h3>
                <ArrowRight className={`mt-0.5 h-4 w-4 text-[#00FF9C] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </div>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key={`faq-answer-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 text-sm leading-relaxed text-gray-400 md:text-base">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default function Home() {
  const heroSectionRef = useRef(null)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const navItems = [
    { href: '#mission', id: 'mission', label: 'Mission' },
    { href: '#features', id: 'features', label: 'What is Kavach?' },
    { href: '#how-it-works', id: 'how-it-works', label: 'How it Works' },
    { href: '#faq', id: 'faq', label: 'FAQ' },
  ]

  const handleNavScroll = (event, sectionId) => {
    event.preventDefault()
    setIsMobileNavOpen(false)
    const target = document.getElementById(sectionId)
    if (!target) return

    const offset = 110
    const top = target.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
    window.history.replaceState(null, '', `#${sectionId}`)
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-black text-white font-sans selection:bg-neon-green/30 cyber-grid scan-line relative">
      <PageAmbientParallax />
      
      {/* Matrix Rain Background */}
      <MatrixRain />

      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="fixed top-3 left-1/2 z-[60] w-[calc(100%-0.5rem)] sm:w-[calc(100%-1rem)] max-w-6xl -translate-x-1/2 rounded-[1.35rem] border border-[#8dffb0]/30 bg-[linear-gradient(180deg,rgba(12,30,20,0.82)_0%,rgba(6,14,10,0.72)_100%)] px-2.5 py-2.5 shadow-[0_0_0_1px_rgba(180,255,205,0.08),0_0_24px_rgba(0,255,156,0.18),0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl overflow-visible md:top-4 md:w-[calc(100%-1.25rem)] md:rounded-full md:px-7 md:py-3 md:flex md:items-center md:justify-between"
      >
        <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] border border-[#00FF9C]/10 md:rounded-full" />

        <div className="relative flex items-center justify-between gap-2 md:gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#b7ffcb]/20 bg-[#0a1b12]/70 shadow-[0_0_18px_rgba(0,255,156,0.18)] md:h-12 md:w-12">
              <img
                src="/kavach-logo.svg"
                alt="Kavach logo"
                className="h-7 w-7 object-contain drop-shadow-[0_0_10px_rgba(160,255,190,0.35)] md:h-9 md:w-9"
              />
            </div>
            <div className="flex min-w-0 flex-col leading-none">
              <span className="truncate text-xs sm:text-sm md:text-lg font-bold tracking-[0.12em] md:tracking-[0.22em] text-white uppercase">Kavach</span>
              <span className="hidden md:block text-[10px] font-heading uppercase tracking-[0.3em] text-[#9dffb8]/65">Digital Armor</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            className="md:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#b8ffcc]/35 bg-black/35 text-[#bfffd0]"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileNavOpen}
          >
            {isMobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

        </div>

        <div className="relative hidden flex-1 items-center justify-center gap-3 rounded-full border border-white/6 bg-black/15 px-3 py-2 md:flex md:mx-6 md:mt-0">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={(event) => handleNavScroll(event, item.id)}
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-[#00FF9C]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <Link href="/login" className="hidden md:inline-block relative rounded-full border border-[#b8ffcc]/50 bg-[#00FF9C] px-6 py-2.5 text-sm font-bold text-black shadow-[0_0_16px_rgba(0,255,156,0.35)] transition-all hover:border-[#d6ffe0] hover:bg-[#78ff9b] hover:shadow-[0_0_28px_rgba(0,255,156,0.5)] text-center">
          Get Protected
        </Link>

        <AnimatePresence>
          {isMobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full mt-2 md:hidden rounded-2xl border border-[#8dffb0]/25 bg-[#07110c]/95 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
            >
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(event) => handleNavScroll(event, item.id)}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-gray-200 transition-colors hover:bg-[#00FF9C]/10 hover:text-[#00FF9C]"
                >
                  {item.label}
                </a>
              ))}

              <Link
                href="/login"
                onClick={() => setIsMobileNavOpen(false)}
                className="mt-2 block rounded-xl border border-[#b8ffcc]/50 bg-[#00FF9C] px-4 py-3 text-center text-sm font-bold text-black"
              >
                Get Protected
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ═══ IMMERSIVE HACKER PARALLAX SECTION ═══ */}
      <section id="mission" ref={heroSectionRef} className="relative w-full min-h-screen overflow-hidden flex items-center justify-center pt-16 pb-10 md:pt-20">
        
        {/* Static background copy behind the hacker visual */}
        <HeroBackdropTextParallax targetRef={heroSectionRef} />

        <div className="absolute inset-x-0 top-28 md:top-36 z-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mx-auto flex max-w-4xl flex-col items-center text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00FF9C]/20 bg-black/40 px-4 py-1.5 font-heading text-[11px] uppercase tracking-[0.35em] text-[#00FF9C]/80 backdrop-blur-md">
              Live Threat Surface
            </span>
          </motion.div>
        </div>
        
        {/* Scroll-driven parallax on the hacker image */}
        <HeroHackerParallax targetRef={heroSectionRef} />

        {/* Overlay Gradients to blend it into the black background seamlessly */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-transparent to-black/60" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.45)_100%)]" />

        {/* Floating Code Snippets around the hacker */}
        <motion.div 
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[15%] top-[40%] z-20 text-[#00FF9C] font-heading text-xs hidden md:block"
        >
          {`> connection_established`} <br/>
          {`> bypassing_firewall...`} <br/>
          <span className="text-red-500">{`[ ACCESS DENIED ]`}</span>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 20, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute right-[15%] top-[30%] z-20 text-[#00FF9C] font-heading text-xs hidden md:block text-right"
        >
          {`analyzing_payload...`} <br/>
          {`signature_match: null`} <br/>
          <span className="text-[#00FF9C]">{`[ THREAT NEUTRALIZED ]`}</span>
        </motion.div>
      </section>

      {/* Threat Ticker */}
      <ParallaxSection speed={0.35} className="w-full relative z-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <ThreatTicker />
      </motion.div>
      </ParallaxSection>

      {/* Hero Section Container */}
      <ParallaxSection speed={0.6} className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-8 mb-20 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="w-full"
      >
        <div className="relative w-full rounded-3xl overflow-hidden border border-[#00FF9C]/10 bg-[#030503] p-12 md:p-24 flex flex-col items-center text-center">
          
          {/* Subtle green glow background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00FF9C]/5 blur-[120px] rounded-full pointer-events-none" />
          
          {/* Corner decorations - like HUD brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#00FF9C]/30" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#00FF9C]/30" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#00FF9C]/30" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#00FF9C]/30" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#00FF9C] border border-[#00FF9C]/30 bg-[#00FF9C]/5 px-4 py-1.5 rounded-full mb-8"
            >
              <ShieldAlert className="w-3 h-3" />
              AI-Powered Cyber Defense
            </motion.div>

            {/* Headline with Glitch */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] glitch"
              data-text="Securing the Digital Human Experience"
            >
              Securing the Digital <br />
              <span className="text-[#00FF9C] text-glow-green">Human Experience</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="max-w-2xl text-gray-400 text-lg leading-relaxed mb-8"
            >
              Kavach is more than a tool. It&apos;s an AI-driven digital armor designed to restore privacy and security to the modern internet user.
            </motion.p>

            {/* Terminal-style status line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="font-heading text-[11px] text-[#00FF9C]/60 tracking-wider flex items-center gap-2"
            >
              <span className="w-2 h-2 bg-[#00FF9C] rounded-full animate-pulse" />
              KAVACH SHIELD ACTIVE — MONITORING 2.4M ENDPOINTS
              <span className="cursor-blink">█</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
      </ParallaxSection>

      {/* Live Stats Bar */}
      <ParallaxSection speed={0.75} className="w-full max-w-7xl mx-auto px-4 md:px-8 mb-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Threats Blocked", value: "14.2M", icon: ShieldCheck },
            { label: "Response Time", value: "0.003ms", icon: Zap },
            { label: "Active Users", value: "2.4M", icon: User },
            { label: "Uptime", value: "99.99%", icon: Target },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-[#050805] border border-[#00FF9C]/10 rounded-xl p-5 text-center hover:border-[#00FF9C]/30 transition-all group"
            >
              <stat.icon className="w-5 h-5 text-[#00FF9C]/50 mx-auto mb-3 group-hover:text-[#00FF9C] transition-colors" />
              <div className="text-2xl md:text-3xl font-bold text-[#00FF9C] text-glow-green font-heading">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      </ParallaxSection>



      {/* "What is Kavach" Section */}
      <ParallaxSection id="features" speed={0.3} className="w-full max-w-7xl mx-auto px-4 md:px-8 pb-32 relative z-10 scroll-mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Text Column */}
          <div className="flex flex-col pt-4">
            <h2 className="text-4xl font-bold mb-6">What is <span className="text-[#00FF9C]">Kavach</span>?</h2>
            
            <p className="text-gray-400 text-lg leading-relaxed mb-10">
              Kavach (Sanskrit for &quot;Armor&quot;) is an advanced AI-driven cybersecurity layer designed to provide military-grade protection to everyday digital citizens. Unlike traditional antivirus software that reacts to threats, Kavach uses predictive behavioral analysis to neutralize attacks before they even manifest.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0a0c0a] border border-white/5 rounded-xl p-5 hover:border-[#00FF9C]/30 transition-all group hover:shadow-[0_0_20px_rgba(0,255,156,0.08)]">
                <div className="w-8 h-8 rounded-lg bg-[#00FF9C]/10 flex items-center justify-center mb-4 group-hover:bg-[#00FF9C]/20 transition-colors">
                  <Target className="text-[#00FF9C] w-5 h-5" />
                </div>
                <h3 className="font-bold mb-1">AI Engine</h3>
                <p className="text-sm text-gray-400">Neural network threat detection</p>
              </div>

              <div className="bg-[#0a0c0a] border border-white/5 rounded-xl p-5 hover:border-[#00FF9C]/30 transition-all border-l-2 border-l-[#00FF9C] group hover:shadow-[0_0_20px_rgba(0,255,156,0.08)]">
                <div className="w-8 h-8 rounded-lg bg-[#00FF9C]/10 flex items-center justify-center mb-4 group-hover:bg-[#00FF9C]/20 transition-colors">
                  <Zap className="text-[#00FF9C] w-5 h-5" />
                </div>
                <h3 className="font-bold mb-1">Low Latency</h3>
                <p className="text-sm text-gray-400">Security that doesn&apos;t slow you down</p>
              </div>
            </div>
          </div>

          {/* Right Command Graph Column */}
          <div className="relative w-full aspect-video lg:aspect-[4/3] overflow-hidden rounded-2xl border border-[#00FF9C]/15 bg-[radial-gradient(circle_at_30%_18%,rgba(0,255,156,0.09),rgba(3,7,4,0.92)_48%,#020302_100%)] shadow-[0_0_55px_rgba(0,255,156,0.08)]">
            <div className="absolute inset-[10px] rounded-xl border border-[#00FF9C]/10 z-10 pointer-events-none" />
            <div className="absolute inset-0 z-0 opacity-18 bg-[linear-gradient(rgba(0,255,156,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,156,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />

            <div className="absolute top-5 left-5 z-20 rounded-md border border-[#00FF9C]/20 bg-black/70 px-3 py-2 backdrop-blur-sm">
              <div className="font-heading text-[10px] tracking-[0.2em] text-[#8fffb0]">LIVE THREAT GRAPH</div>
              <div className="mt-1 font-heading text-[10px] text-gray-400">NODES: 14  |  EVENTS: 348/s  |  STATUS: ACTIVE</div>
            </div>

            <div className="absolute right-5 top-5 z-20 flex items-center gap-2 rounded border border-[#00FF9C]/25 bg-black/70 px-3 py-1.5 font-heading text-[10px] text-[#00FF9C]">
              <AlertTriangle className="w-3 h-3" />
              SCANNING...
            </div>

            <svg viewBox="0 0 760 520" className="absolute inset-0 z-10 h-full w-full">
              <defs>
                <linearGradient id="threatLink" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FF9C" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#00FF9C" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#00FF9C" stopOpacity="0.14" />
                </linearGradient>
                <radialGradient id="hotspot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00FF9C" stopOpacity="0.22" />
                  <stop offset="60%" stopColor="#00FF9C" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#00FF9C" stopOpacity="0" />
                </radialGradient>
              </defs>

              {[
                'M88 420 Q220 350 320 300',
                'M320 300 Q430 240 520 205',
                'M320 300 Q470 330 620 365',
                'M520 205 Q600 165 668 118',
                'M320 300 Q250 200 180 140',
                'M180 140 Q300 120 430 150',
                'M430 150 Q540 180 620 365',
                'M88 420 Q150 280 180 140',
                'M620 365 Q680 300 700 230',
                'M320 300 Q360 390 450 448',
              ].map((d, i) => (
                <motion.path
                  key={d}
                  d={d}
                  fill="none"
                  stroke="url(#threatLink)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0.1, opacity: 0.25 }}
                  animate={{ pathLength: [0.1, 1, 0.1], opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 3.2 + i * 0.35, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}

              {[
                { x: 320, y: 300, r: 85 },
                { x: 520, y: 205, r: 62 },
                { x: 620, y: 365, r: 70 },
              ].map((spot, i) => (
                <circle key={`spot-${i}`} cx={spot.x} cy={spot.y} r={spot.r} fill="url(#hotspot)" />
              ))}

              {[
                { x: 88, y: 420, s: 9 },
                { x: 180, y: 140, s: 8 },
                { x: 320, y: 300, s: 12 },
                { x: 520, y: 205, s: 10 },
                { x: 620, y: 365, s: 9 },
                { x: 668, y: 118, s: 8 },
                { x: 430, y: 150, s: 7 },
                { x: 700, y: 230, s: 7 },
                { x: 450, y: 448, s: 7 },
                { x: 250, y: 242, s: 6 },
                { x: 390, y: 256, s: 6 },
                { x: 565, y: 278, s: 6 },
                { x: 145, y: 300, s: 6 },
                { x: 255, y: 376, s: 6 },
              ].map((node, i) => (
                <g key={`node-${i}`}>
                  <circle cx={node.x} cy={node.y} r={node.s} fill="rgba(0,0,0,0.72)" stroke="#00FF9C" strokeWidth="1.8" />
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={node.s + 4}
                    fill="none"
                    stroke="#65ff99"
                    strokeWidth="1"
                    animate={{ scale: [0.85, 1.35], opacity: [0.7, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.25 }}
                  />
                </g>
              ))}

              {[
                { x: [88, 190, 320], y: [420, 354, 300], d: 0 },
                { x: [320, 430, 520], y: [300, 240, 205], d: 0.6 },
                { x: [320, 470, 620], y: [300, 330, 365], d: 1.1 },
                { x: [520, 598, 668], y: [205, 162, 118], d: 1.6 },
                { x: [430, 520, 620], y: [150, 185, 365], d: 2.1 },
              ].map((packet, i) => (
                <motion.circle
                  key={`packet-${i}`}
                  r="3"
                  fill="#8effb2"
                  animate={{ cx: packet.x, cy: packet.y, opacity: [0, 1, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', delay: packet.d }}
                />
              ))}
            </svg>

            <motion.div
              className="absolute left-0 top-0 z-10 h-full w-[24%] bg-[linear-gradient(90deg,rgba(0,255,156,0.12),transparent)] blur-md"
              animate={{ x: ['-20%', '390%'] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />

            <div className="absolute bottom-5 left-5 z-20 flex flex-wrap gap-2">
              <div className="rounded bg-[#00FF9C] px-3 py-1.5 text-[11px] font-bold text-black shadow-[0_0_14px_rgba(0,255,156,0.4)]">LIVE ANALYSIS</div>
              <div className="rounded border border-[#00FF9C]/30 bg-black/70 px-3 py-1.5 text-[11px] font-bold text-[#b9ffce]">THREAT LEVEL: LOW</div>
            </div>

            <div className="absolute bottom-5 right-5 z-20 hidden w-44 rounded border border-[#00FF9C]/20 bg-black/65 p-2 md:block">
              <div className="mb-1 font-heading text-[9px] tracking-[0.18em] text-[#8fffb0]">INCIDENT FEED</div>
              <div className="space-y-1 font-heading text-[9px] text-gray-400">
                <div className="flex justify-between"><span>PHISH KIT</span><span className="text-[#9cffbf]">BLOCKED</span></div>
                <div className="flex justify-between"><span>MALWARE IOC</span><span className="text-[#9cffbf]">QUAR.</span></div>
                <div className="flex justify-between"><span>DNS SPOOF</span><span className="text-[#9cffbf]">DENIED</span></div>
              </div>
            </div>
          </div>
          
        </div>
      </ParallaxSection>

      {/* Timeline Section */}
      <ParallaxSection speed={0.5} className="w-full max-w-4xl mx-auto px-4 md:px-8 pb-2 relative z-10">
      <div id="how-it-works" className="w-full relative">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold mb-20 text-center"
        >
          How It <span className="text-[#00FF9C]">Works</span>
        </motion.h2>

        <HowItWorksTimeline />
      </div>
      </ParallaxSection>

      {/* FAQ Section */}
      <ParallaxSection id="faq" speed={0.4} className="w-full max-w-4xl mx-auto px-4 md:px-8 pb-12 relative z-10 scroll-mt-28">
        <FaqSection />
      </ParallaxSection>

      {/* CTA Box */}
      <ParallaxSection speed={0.65} className="w-full max-w-4xl mx-auto px-4 md:px-8 pb-32 relative z-10">
      <div className="w-full relative">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative rounded-2xl border border-[#00FF9C]/10 hover:border-[#00FF9C]/50 bg-[#030503] p-10 md:p-16 text-center shadow-[0_0_30px_rgba(0,255,156,0.05)] overflow-hidden transition-all duration-500"
        >
          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#00FF9C]/20" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#00FF9C]/20" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#00FF9C]/20" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#00FF9C]/20" />

          <div className="absolute inset-0 bg-gradient-to-t from-[#00FF9C]/5 to-transparent pointer-events-none" />
          
          <div className="font-heading text-[10px] text-[#00FF9C]/40 tracking-widest uppercase mb-4 relative z-10">
            {'// INITIATE_PROTOCOL'}
          </div>
          <h2 className="relative z-10 text-3xl md:text-4xl font-bold mb-10 text-white">
            Ready to secure your future?
          </h2>
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto bg-[#00FF9C] hover:bg-[#00cc33] text-black px-8 py-3.5 rounded text-sm font-bold shadow-[0_0_20px_rgba(0,255,156,0.3)] hover:shadow-[0_0_30px_rgba(0,255,156,0.5)] transition-all text-center">
              Launch Dashboard
            </Link>
            <button className="w-full sm:w-auto bg-transparent hover:bg-[#00FF9C]/5 text-gray-300 hover:text-[#00FF9C] border border-[#00FF9C]/20 hover:border-[#00FF9C]/50 px-8 py-3.5 rounded text-sm font-bold transition-all">
              View Documentation
            </button>
          </div>
        </motion.div>
      </div>
      </ParallaxSection>

      {/* Footer Ticker */}
      <ParallaxSection speed={0.3} className="w-full relative z-10">
        <ThreatTicker />
      </ParallaxSection>

    </main>
  )
}

