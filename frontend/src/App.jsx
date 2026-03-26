import React, { useState, useRef, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CASE_STUDIES } from './caseStudies';
import { generatePDF } from './pdfExport';
import EcosystemBuilder from './EcosystemBuilder';
import CaseStudiesModal from './CaseStudiesModal';
import { RecoveryModal, SensitivityModal, RiskScoresModal, MultiCascadeModal } from './Tier2Modals';

/* ── PRESETS ── */
const PRESETS = {
  "Serengeti Savanna": {
    bg: "/bg-savanna.png", accent: "#F59E0B",
    speciesList: [
      { name: "Grass", population: 100, icon: "🌾" },
      { name: "Grasshopper", population: 50, icon: "🦗" },
      { name: "Frog", population: 20, icon: "🐸" },
      { name: "Snake", population: 10, icon: "🐍" },
      { name: "Hawk", population: 5, icon: "🦅" }
    ],
    interactions: [
      { predator: "Grasshopper", prey: "Grass", rate: 0.02 },
      { predator: "Frog", prey: "Grasshopper", rate: 0.03 },
      { predator: "Snake", prey: "Frog", rate: 0.02 },
      { predator: "Hawk", prey: "Snake", rate: 0.01 }
    ]
  },
  "Arctic Tundra": {
    bg: "/bg-arctic.png", accent: "#818CF8",
    speciesList: [
      { name: "Lichen", population: 120, icon: "🌿" },
      { name: "Caribou", population: 40, icon: "🦌" },
      { name: "Arctic Fox", population: 15, icon: "🦊" },
      { name: "Wolf", population: 8, icon: "🐺" },
      { name: "Polar Bear", population: 3, icon: "🐻‍❄️" }
    ],
    interactions: [
      { predator: "Caribou", prey: "Lichen", rate: 0.015 },
      { predator: "Arctic Fox", prey: "Caribou", rate: 0.02 },
      { predator: "Wolf", prey: "Caribou", rate: 0.025 },
      { predator: "Polar Bear", prey: "Wolf", rate: 0.01 }
    ]
  },
  "Coral Reef": {
    bg: "/bg-coral.png", accent: "#2DD4BF",
    speciesList: [
      { name: "Algae", population: 150, icon: "🪸" },
      { name: "Clownfish", population: 60, icon: "🐠" },
      { name: "Parrotfish", population: 30, icon: "🐟" },
      { name: "Moray Eel", population: 12, icon: "🐍" },
      { name: "Reef Shark", population: 4, icon: "🦈" }
    ],
    interactions: [
      { predator: "Clownfish", prey: "Algae", rate: 0.01 },
      { predator: "Parrotfish", prey: "Algae", rate: 0.015 },
      { predator: "Moray Eel", prey: "Clownfish", rate: 0.025 },
      { predator: "Reef Shark", prey: "Parrotfish", rate: 0.02 }
    ]
  }
};

const COLORS = ['#4ADE80', '#60A5FA', '#F97316', '#FACC15', '#EC4899', '#A78BFA', '#2DD4BF'];

/* ── ANIMATED FOOD WEB ── */
function FoodWebCanvas({ ecosystem, accent, selectedSpecies, onClickSpecies }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const posRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function draw() {
      const W = canvas.width = canvas.parentElement.clientWidth;
      const H = canvas.height = canvas.parentElement.clientHeight;
      ctx.clearRect(0, 0, W, H);
      timeRef.current += 0.008;
      const sp = ecosystem.speciesList, n = sp.length;
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.3;
      const pos = sp.map((s, i) => {
        const a = (2 * Math.PI * i) / n - Math.PI / 2;
        const w = Math.sin(timeRef.current + i * 1.2) * 3;
        return { x: cx + (R + w) * Math.cos(a), y: cy + (R + w) * Math.sin(a), ...s };
      });
      posRef.current = pos;
      ecosystem.interactions.forEach((inter, idx) => {
        const from = pos.find(p => p.name === inter.prey);
        const to = pos.find(p => p.name === inter.predator);
        if (!from || !to) return;
        const g = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
        g.addColorStop(0, accent + '44'); g.addColorStop(1, accent + '22');
        ctx.beginPath(); ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]); ctx.lineDashOffset = -timeRef.current * 40 + idx * 10;
        ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); ctx.setLineDash([]);
        const pp = ((timeRef.current * 0.5 + idx * 0.3) % 1);
        const px = from.x + (to.x - from.x) * pp, py = from.y + (to.y - from.y) * pp;
        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = accent; ctx.shadowColor = accent; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
        const ang = Math.atan2(to.y - from.y, to.x - from.x);
        const mx = to.x - 28 * Math.cos(ang), my = to.y - 28 * Math.sin(ang);
        ctx.beginPath(); ctx.fillStyle = accent + 'BB';
        ctx.moveTo(mx, my); ctx.lineTo(mx - 8 * Math.cos(ang - 0.5), my - 8 * Math.sin(ang - 0.5));
        ctx.lineTo(mx - 8 * Math.cos(ang + 0.5), my - 8 * Math.sin(ang + 0.5)); ctx.closePath(); ctx.fill();
      });
      pos.forEach((p, i) => {
        const r = 22 + Math.log(p.population + 1) * 2.5;
        const pulse = 1 + Math.sin(timeRef.current * 2 + i) * 0.06;
        const sel = selectedSpecies === p.name;
        const gg = ctx.createRadialGradient(p.x, p.y, r * 0.5, p.x, p.y, r * 2);
        gg.addColorStop(0, (sel ? '#EF4444' : COLORS[i % COLORS.length]) + '33'); gg.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2 * pulse, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172aCC'; ctx.fill();
        ctx.strokeStyle = sel ? '#EF4444' : COLORS[i % COLORS.length] + '99'; ctx.lineWidth = sel ? 3 : 2; ctx.stroke();
        ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.icon || '●', p.x, p.y - 5);
        ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.fillText(p.name, p.x, p.y + 14);
        ctx.fillStyle = COLORS[i % COLORS.length]; ctx.font = '9px Inter,sans-serif'; ctx.fillText(p.population.toFixed(0), p.x, p.y + 24);
      });
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [ecosystem, accent, selectedSpecies]);

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    for (const p of posRef.current) { if (Math.hypot(mx - p.x, my - p.y) < 30) { onClickSpecies(p.name); return; } }
  };
  return <canvas ref={canvasRef} className="w-full h-full cursor-pointer" onClick={handleClick} />;
}

/* ── IMPACT REPORT ── */
function ImpactReport({ report, accent, onClose, presetName }) {
  if (!report) return null;
  const sc = { EXTINCT: '#EF4444', CRITICAL: '#F97316', DECLINING: '#FACC15', SURGING: '#60A5FA', STABLE: '#4ADE80' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[740px] max-h-[85vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl">
        <div className="p-5 border-b border-white/10 flex justify-between items-start sticky top-0 bg-[#0f172a] z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-black text-white">☠️ Extinction Impact Report</h2>
            <p className="text-xs text-slate-400 mt-0.5">Removed: <span className="text-red-400 font-bold">{report.removedSpecies}</span> ({report.removedRole})</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => generatePDF(report, presetName)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all">📄 Export PDF</button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>
        <div className="p-5 grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10"><span className="text-[9px] font-bold uppercase text-slate-500">Stability</span><div className="text-2xl font-black font-mono mt-1" style={{ color: report.stabilityAfter > 0.6 ? '#4ADE80' : '#EF4444' }}>{(report.stabilityAfter * 100).toFixed(0)}%</div></div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10"><span className="text-[9px] font-bold uppercase text-slate-500">Biomass Lost</span><div className="text-2xl font-black font-mono mt-1 text-red-400">{report.biomassLoss}%</div></div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10"><span className="text-[9px] font-bold uppercase text-slate-500">Cascade Events</span><div className="text-2xl font-black font-mono mt-1 text-orange-400">{report.cascadeChain.length}</div></div>
        </div>
        <div className="px-5 pb-3"><h3 className="text-xs font-black uppercase text-slate-400 mb-2">📊 Species Impact</h3>
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-xs"><thead><tr className="border-b border-white/10 text-slate-500 uppercase text-[9px]"><th className="text-left p-2.5">Species</th><th className="text-right p-2.5">Before</th><th className="text-right p-2.5">After</th><th className="text-right p-2.5">Change</th><th className="text-center p-2.5">Status</th></tr></thead>
              <tbody>{report.impacts.map((imp, i) => (
                <tr key={i} className="border-b border-white/5"><td className="p-2.5 text-white font-bold">{imp.name}</td><td className="p-2.5 text-right text-slate-400 font-mono">{imp.before.toFixed(1)}</td><td className="p-2.5 text-right font-mono" style={{ color: sc[imp.status] }}>{imp.after.toFixed(1)}</td><td className="p-2.5 text-right font-mono font-bold" style={{ color: imp.change > 0 ? '#60A5FA' : '#EF4444' }}>{imp.change > 0 ? '+' : ''}{imp.change}%</td><td className="p-2.5 text-center"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: sc[imp.status] + '22', color: sc[imp.status] }}>{imp.status}</span></td></tr>
              ))}</tbody></table></div></div>
        {report.cascadeChain.length > 0 && <div className="px-5 pb-3"><h3 className="text-xs font-black uppercase text-slate-400 mb-2">⛓️ Cascade Chain</h3><div className="flex flex-wrap gap-1.5">{report.cascadeChain.map((ev, i) => (<div key={i} className="flex items-center gap-1.5"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${ev.type === 'trigger' ? 'border-red-500/50 text-red-400 bg-red-500/10' : ev.type === 'extinction' ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' : ev.type === 'decline' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' : 'border-blue-500/50 text-blue-400 bg-blue-500/10'}`}>{ev.event}</span>{i < report.cascadeChain.length - 1 && <span className="text-slate-600">→</span>}</div>))}</div></div>}
        <div className="px-5 pb-3"><h3 className="text-xs font-black uppercase text-slate-400 mb-2">📈 Post-Extinction Timeline</h3>
          <div className="bg-white/5 rounded-xl border border-white/10 p-3 h-44"><ResponsiveContainer width="100%" height="100%"><AreaChart data={report.timeline}><defs>{report.impacts.map((imp, i) => (<linearGradient key={i} id={`rg-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} /></linearGradient>))}</defs><CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" /><XAxis dataKey="step" stroke="#475569" fontSize={9} /><YAxis stroke="#475569" fontSize={9} /><Tooltip contentStyle={{ backgroundColor: '#0f172aEE', border: '1px solid #334155', fontSize: '11px', borderRadius: '8px' }} /><Legend iconType="circle" wrapperStyle={{ fontSize: '9px' }} />{report.impacts.map((imp, i) => (<Area key={i} type="monotone" dataKey={imp.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} fill={`url(#rg-${i})`} dot={false} />))}</AreaChart></ResponsiveContainer></div></div>
        <div className="px-5 pb-5"><h3 className="text-xs font-black uppercase text-slate-400 mb-2">🌱 Recovery Strategies</h3><div className="space-y-2">{report.strategies.map((s, i) => (
          <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-3"><div className="flex items-center gap-2 mb-1"><span className="text-lg">{s.icon}</span><span className="text-white font-bold text-sm flex-1">{s.type}</span><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' : s.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{s.priority}</span></div><p className="text-xs text-slate-400 leading-relaxed">{s.description}</p><p className="text-[10px] text-slate-600 mt-1 italic">📌 {s.example}</p></div>
        ))}</div></div>
      </div>
    </div>
  );
}

/* ── STABILITY GAUGE ── */
function StabilityGauge({ value, accent }) { const p = (value * 100).toFixed(0), c = 2 * Math.PI * 50; return (<div className="relative w-28 h-28 mx-auto"><svg className="w-full h-full -rotate-90" viewBox="0 0 112 112"><circle cx="56" cy="56" r="50" stroke="#1e293b" strokeWidth="5" fill="transparent" /><circle cx="56" cy="56" r="50" stroke={accent} strokeWidth="5" fill="transparent" strokeDasharray={c} strokeDashoffset={c * (1 - value)} strokeLinecap="round" className="transition-all duration-1000" /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-black font-mono text-white">{p}%</span><span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Resilience</span></div></div>); }

/* ══════════════════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════════════════ */
export default function App() {
  const [presetName, setPresetName] = useState("Serengeti Savanna");
  const [customLabel, setCustomLabel] = useState(null);
  const preset = PRESETS[presetName];
  const [ecosystem, setEcosystem] = useState(JSON.parse(JSON.stringify(preset)));
  const [history, setHistory] = useState([]);
  const [stability, setStability] = useState(1.0);
  const [keystone, setKeystone] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeStep, setTimeStep] = useState(0);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [impactReport, setImpactReport] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showCaseStudies, setShowCaseStudies] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showSensitivity, setShowSensitivity] = useState(false);
  const [showRiskScores, setShowRiskScores] = useState(false);
  const [showMultiCascade, setShowMultiCascade] = useState(false);
  const autoRef = useRef(null);
  const accentColor = customLabel ? '#A78BFA' : preset.accent;
  const bgImage = customLabel ? '/bg-savanna.png' : preset.bg;

  const loadPreset = (name) => {
    setPresetName(name); setCustomLabel(null);
    setEcosystem(JSON.parse(JSON.stringify(PRESETS[name])));
    setHistory([]); setTimeStep(0); setStability(1.0); setKeystone(""); setSelectedSpecies(null); setImpactReport(null); setAutoPlay(false);
  };

  const runSim = async () => {
    setLoading(true);
    try {
      const r = await fetch("/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ecosystem) });
      const d = await r.json();
      setEcosystem(d.result); setStability(d.stability); setKeystone(d.keystone);
      const entry = { t: `T${timeStep}`, ...d.result.speciesList.reduce((a, s) => ({ ...a, [s.name]: parseFloat(s.population.toFixed(1)) }), {}) };
      setHistory(prev => [...prev.slice(-39), entry]); setTimeStep(t => t + 1);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const runMulti = async (n) => { for (let i = 0; i < n; i++) await runSim(); };

  const execExtinction = async (name) => {
    setLoading(true);
    try {
      const orig = customLabel ? JSON.parse(JSON.stringify(ecosystem)) : JSON.parse(JSON.stringify(PRESETS[presetName]));
      const r = await fetch("/extinction", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ecosystem: orig, removedSpecies: name }) });
      const rep = await r.json();
      setImpactReport(rep); setEcosystem(rep.result); setStability(rep.stabilityAfter);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // Auto-play
  useEffect(() => {
    if (autoPlay) { autoRef.current = setInterval(() => { runSim(); }, 1200); }
    else { clearInterval(autoRef.current); }
    return () => clearInterval(autoRef.current);
  }, [autoPlay, ecosystem]);

  // Custom ecosystem from builder
  const applyCustomEco = (eco) => {
    setEcosystem(eco); setCustomLabel("Custom Ecosystem"); setShowBuilder(false);
    setHistory([]); setTimeStep(0); setStability(1.0); setKeystone(""); setSelectedSpecies(null); setAutoPlay(false);
  };

  // Load case study
  const loadCaseStudy = (study) => {
    setEcosystem(JSON.parse(JSON.stringify(study.ecosystem)));
    setCustomLabel(study.title);
    setHistory([]); setTimeStep(0); setStability(1.0); setKeystone(""); setSelectedSpecies(study.removedSpecies); setAutoPlay(false);
  };

  const statusColor = stability > 0.8 ? '#4ADE80' : stability > 0.4 ? '#FACC15' : '#EF4444';
  const statusText = stability > 0.8 ? 'OPTIMAL' : stability > 0.4 ? 'STRESSED' : 'CRITICAL';
  const displayName = customLabel || presetName;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ fontFamily: '"Inter","IBM Plex Sans",sans-serif' }}>
      <div className="fixed inset-0 z-0 transition-all duration-1000"><img src={bgImage} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/95" /></div>

      {/* Modals */}
      <ImpactReport report={impactReport} accent={accentColor} onClose={() => setImpactReport(null)} presetName={displayName} />
      {showBuilder && <EcosystemBuilder onApply={applyCustomEco} onClose={() => setShowBuilder(false)} accent={accentColor} />}
      {showCaseStudies && <CaseStudiesModal studies={CASE_STUDIES} onLoad={loadCaseStudy} onClose={() => setShowCaseStudies(false)} accent={accentColor} />}
      {showRecovery && <RecoveryModal ecosystem={ecosystem} accent={accentColor} onClose={() => setShowRecovery(false)} />}
      {showSensitivity && <SensitivityModal ecosystem={ecosystem} accent={accentColor} onClose={() => setShowSensitivity(false)} />}
      {showRiskScores && <RiskScoresModal ecosystem={ecosystem} accent={accentColor} onClose={() => setShowRiskScores(false)} />}
      {showMultiCascade && <MultiCascadeModal ecosystem={ecosystem} accent={accentColor} onClose={() => setShowMultiCascade(false)} />}

      {/* TOP BAR */}
      <header className="relative z-10 h-auto min-h-[3.5rem] py-2 lg:py-0 backdrop-blur-xl bg-black/40 border-b border-white/5 px-3 lg:px-5 flex flex-col lg:flex-row items-center justify-between gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: accentColor + '30' }}>🌍</div>
          <div><h1 className="text-sm font-black tracking-tight text-white uppercase">Ecosystem Dynamics Lab</h1><p className="text-[9px] text-slate-500 -mt-0.5">{displayName} — Lotka-Volterra Engine</p></div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full lg:pb-0 scrollbar-hide shrink-0">
          <button onClick={() => setShowBuilder(true)} className="px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 text-slate-300 hover:bg-white/10 transition-all">🛠️ Build</button>
          <button onClick={() => setShowCaseStudies(true)} className="px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 text-slate-300 hover:bg-white/10 transition-all">🌐 Cases</button>
          <button onClick={() => setShowRecovery(true)} className="px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 text-slate-300 hover:bg-white/10 transition-all">🔄 Recovery</button>
          <button onClick={() => setShowSensitivity(true)} className="px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 text-slate-300 hover:bg-white/10 transition-all">📊 Heatmap</button>
          <button onClick={() => setShowRiskScores(true)} className="px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 text-slate-300 hover:bg-white/10 transition-all">⚠️ Risk</button>
          <button onClick={() => setShowMultiCascade(true)} className="px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 text-slate-300 hover:bg-white/10 transition-all">🔬 Multi</button>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-xs"><span className="text-slate-400 uppercase text-[9px] font-bold">Step</span><span className="font-mono font-bold" style={{ color: accentColor }}>{timeStep}</span></div>
          <button onClick={() => setAutoPlay(!autoPlay)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${autoPlay ? 'border-red-500 text-red-400 bg-red-500/10' : 'border-white/10 text-slate-300 hover:bg-white/10'}`}>{autoPlay ? '⏸ Stop' : '⏯️ Auto'}</button>
          <button onClick={runSim} disabled={loading || autoPlay} className="px-4 py-1.5 rounded-full text-xs font-bold text-black transition-all hover:scale-105 disabled:opacity-50" style={{ background: accentColor }}>{loading ? "⏳" : "▶"} Step</button>
          <button onClick={() => runMulti(10)} disabled={loading || autoPlay} className="px-3 py-1.5 rounded-full text-xs font-bold border" style={{ borderColor: accentColor + '66', color: accentColor }}>⏩×10</button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* LEFT */}
        <aside className="w-full lg:w-72 max-h-[45vh] lg:max-h-none backdrop-blur-xl bg-black/50 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col shrink-0">
          <div className="p-3 border-b border-white/5"><h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Biome</h3><div className="space-y-1.5">{Object.keys(PRESETS).map(name => (
            <button key={name} onClick={() => loadPreset(name)} className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${presetName === name && !customLabel ? 'border-white/20 bg-white/10 text-white font-bold' : 'border-white/5 text-slate-400 hover:bg-white/5'}`}><span className="text-base">{name === "Serengeti Savanna" ? "🦁" : name === "Arctic Tundra" ? "🐺" : "🦈"}</span>{name}</button>
          ))}</div></div>
          <div className="p-3 border-b border-white/5"><h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Species</h3><p className="text-[9px] text-slate-600">Click species → Execute Extinction</p></div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">{ecosystem.speciesList.map((s, i) => (
            <div key={i} onClick={() => setSelectedSpecies(s.name)} className={`rounded-lg border p-2.5 cursor-pointer transition-all ${selectedSpecies === s.name ? 'border-red-500/50 bg-red-500/10 ring-1 ring-red-500/30' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
              <div className="flex items-center gap-2 mb-1.5"><span className="text-lg">{s.icon}</span><span className="text-white font-bold text-sm flex-1">{s.name}</span><span className="font-mono text-xs font-bold" style={{ color: COLORS[i % COLORS.length] }}>{s.population.toFixed(1)}</span></div>
              <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (s.population / 150) * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} /></div>
            </div>
          ))}</div>
          <div className="p-3 border-t border-white/5">
            <button onClick={() => selectedSpecies && execExtinction(selectedSpecies)} disabled={loading || !selectedSpecies} className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              ☠️ {selectedSpecies ? `Extinction: ${selectedSpecies}` : "Select Species"}
            </button>
          </div>
        </aside>

        {/* CENTER */}
        <section className="flex-none min-h-[60vh] lg:min-h-0 lg:flex-1 flex flex-col lg:overflow-hidden shrink-0">
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute top-3 left-3 z-10 backdrop-blur-xl bg-black/50 px-3 py-1.5 rounded-full border border-white/10"><span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">🔗 Trophic Network</span></div>
            <div className="absolute top-3 right-3 z-10 flex gap-1.5">
              <div className="backdrop-blur-xl bg-black/50 px-2.5 py-1 rounded-full border border-white/10 text-[9px] text-slate-400"><span className="font-bold text-white">{ecosystem.speciesList.length}</span> species</div>
              <div className="backdrop-blur-xl bg-black/50 px-2.5 py-1 rounded-full border border-white/10 text-[9px] text-slate-400"><span className="font-bold text-white">{ecosystem.interactions.length}</span> links</div>
              {autoPlay && <div className="backdrop-blur-xl bg-red-500/20 px-2.5 py-1 rounded-full border border-red-500/30 text-[9px] text-red-400 font-bold animate-pulse">● LIVE</div>}
            </div>
            <FoodWebCanvas ecosystem={ecosystem} accent={accentColor} selectedSpecies={selectedSpecies} onClickSpecies={setSelectedSpecies} />
          </div>
          <div className="h-52 backdrop-blur-xl bg-black/50 border-t border-white/5 p-4">
            <h3 className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">📈 Population Dynamics</h3>
            <div className="h-36 w-full">{history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><defs>{ecosystem.speciesList.map((s, i) => (<linearGradient key={i} id={`g-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} /></linearGradient>))}</defs><CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" /><XAxis dataKey="t" stroke="#475569" fontSize={9} /><YAxis stroke="#475569" fontSize={9} /><Tooltip contentStyle={{ backgroundColor: '#0f172aEE', border: '1px solid #334155', fontSize: '11px', borderRadius: '8px' }} /><Legend iconType="circle" wrapperStyle={{ fontSize: '9px' }} />{ecosystem.speciesList.map((s, i) => (<Area key={i} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} fill={`url(#g-${i})`} dot={false} />))}</AreaChart></ResponsiveContainer>
            ) : (<div className="flex items-center justify-center h-full text-slate-600 text-xs italic gap-2"><span className="text-lg">🔬</span>Run sim or enable Auto-Play</div>)}</div>
          </div>
        </section>

        {/* RIGHT */}
        <aside className="w-full lg:w-64 max-h-[45vh] lg:max-h-none backdrop-blur-xl bg-black/50 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/5"><h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Stability</h3><StabilityGauge value={stability} accent={accentColor} /></div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <div className="rounded-lg border bg-white/5 p-3" style={{ borderColor: accentColor + '33' }}><span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">🏆 Keystone</span><span className="text-white font-mono text-lg font-black">{keystone || "—"}</span></div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3"><span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">🩺 Biodiversity</span><span className="font-mono text-sm font-black" style={{ color: statusColor }}>{statusText}</span></div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3"><span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">📊 Census</span><div className="flex justify-between text-xs mt-1"><span className="text-slate-400">Alive</span><span className="text-white font-mono font-bold">{ecosystem.speciesList.filter(s => s.population > 0.1).length}/{ecosystem.speciesList.length}</span></div><div className="flex justify-between text-xs mt-1"><span className="text-slate-400">Biomass</span><span className="text-white font-mono font-bold">{ecosystem.speciesList.reduce((s, sp) => s + sp.population, 0).toFixed(0)}</span></div></div>
            <p className="text-[10px] leading-relaxed text-slate-600 italic">Click species → Execute Extinction for full impact report with PDF export.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
