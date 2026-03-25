import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#4ADE80', '#60A5FA', '#F97316', '#FACC15', '#EC4899', '#A78BFA', '#2DD4BF'];

/* ══════════════════════════════════════
   1. RECOVERY MODE MODAL
   ══════════════════════════════════════ */
export function RecoveryModal({ ecosystem, accent, onClose }) {
    const [selectedSpecies, setSelectedSpecies] = useState(null);
    const [reintroducePop, setReintroducePop] = useState(5);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const runRecovery = async () => {
        if (!selectedSpecies) return;
        setLoading(true);
        try {
            const r = await fetch("http://localhost:3000/recovery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ecosystem, removedSpecies: selectedSpecies, reintroducePop }) });
            setReport(await r.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-[720px] max-h-[85vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl">
                <div className="p-5 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0f172a] z-10 rounded-t-2xl">
                    <div><h2 className="text-lg font-black text-white">🔄 Ecosystem Recovery Mode</h2><p className="text-xs text-slate-400">Remove a species → reintroduce it → watch the ecosystem heal</p></div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
                </div>

                <div className="p-5 flex gap-3 items-end border-b border-white/10">
                    <div className="flex-1">
                        <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1">Species to Remove & Reintroduce</label>
                        <select value={selectedSpecies || ""} onChange={e => setSelectedSpecies(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                            <option value="">Select species...</option>
                            {ecosystem.speciesList.map(s => <option key={s.name} value={s.name}>{s.icon} {s.name}</option>)}
                        </select>
                    </div>
                    <div className="w-32">
                        <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1">Reintro. Pop</label>
                        <input type="number" value={reintroducePop} onChange={e => setReintroducePop(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                    </div>
                    <button onClick={runRecovery} disabled={!selectedSpecies || loading} className="px-5 py-2 rounded-lg text-xs font-bold text-black disabled:opacity-30" style={{ background: accent }}>
                        {loading ? "⏳" : "🔄"} Simulate
                    </button>
                </div>

                {report && (
                    <div className="p-5">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10"><span className="text-[9px] font-bold uppercase text-slate-500">Final Stability</span><div className="text-2xl font-black font-mono mt-1" style={{ color: report.finalStability > 0.6 ? '#4ADE80' : '#EF4444' }}>{(report.finalStability * 100).toFixed(0)}%</div></div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10"><span className="text-[9px] font-bold uppercase text-slate-500">Reintro. at Step</span><div className="text-2xl font-black font-mono mt-1" style={{ color: accent }}>{report.reintroduceStep}</div></div>
                        </div>

                        <h3 className="text-xs font-black uppercase text-slate-400 mb-2">📈 Degradation → Recovery Timeline</h3>
                        <div className="bg-white/5 rounded-xl border border-white/10 p-3 h-52 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={report.timeline}>
                                    <defs>{ecosystem.speciesList.map((s, i) => (<linearGradient key={i} id={`rc-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} /></linearGradient>))}</defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                    <XAxis dataKey="step" stroke="#475569" fontSize={9} />
                                    <YAxis stroke="#475569" fontSize={9} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172aEE', border: '1px solid #334155', fontSize: '11px', borderRadius: '8px' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
                                    {ecosystem.speciesList.map((s, i) => (<Area key={i} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} fill={`url(#rc-${i})`} dot={false} />))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-3">
                            <div className="flex items-center gap-2 mb-1"><span className="text-base">🌱</span><span className="text-emerald-400 font-bold text-xs">Reintroduction at Step 20</span></div>
                            <p className="text-[10px] text-slate-400">The dashed vertical line marks when {report.removedSpecies} was reintroduced with a population of {reintroducePop}.</p>
                        </div>

                        <h3 className="text-xs font-black uppercase text-slate-400 mb-2">Recovery Scores</h3>
                        <div className="space-y-1.5">
                            {report.recoveryScores.map((s, i) => (
                                <div key={i} className="bg-white/5 rounded-lg border border-white/10 p-2.5 flex items-center justify-between">
                                    <span className="text-white font-bold text-sm">{s.name}</span>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-slate-400">Orig: {s.original.toFixed(1)}</span>
                                        <span className="text-slate-400">Now: {s.recovered}</span>
                                        <span className="font-mono font-bold" style={{ color: s.recoveryPct > 80 ? '#4ADE80' : s.recoveryPct > 40 ? '#FACC15' : '#EF4444' }}>{s.recoveryPct.toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════
   2. SENSITIVITY HEATMAP MODAL
   ══════════════════════════════════════ */
export function SensitivityModal({ ecosystem, accent, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://localhost:3000/sensitivity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ecosystem }) })
            .then(r => r.json()).then(d => { setData(d); setLoading(false); });
    }, []);

    const getColor = (val) => {
        if (val === -100) return '#1e293b'; // self
        if (val > 50) return '#3B82F6';
        if (val > 20) return '#60A5FA88';
        if (val > 0) return '#60A5FA44';
        if (val > -20) return '#FACC1544';
        if (val > -50) return '#F9731688';
        return '#EF444488';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-[680px] max-h-[85vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl">
                <div className="p-5 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0f172a] z-10 rounded-t-2xl">
                    <div><h2 className="text-lg font-black text-white">📊 Sensitivity Heatmap</h2><p className="text-xs text-slate-400">How each species removal affects every other species</p></div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
                </div>
                <div className="p-5">
                    {loading ? <div className="text-center text-slate-500 py-10">⏳ Computing sensitivity matrix...</div> : data && (
                        <>
                            <div className="text-[9px] text-slate-500 mb-3 flex items-center gap-3">
                                <span className="text-slate-400">Row = species removed</span>
                                <span className="text-slate-400">Column = impact on that species</span>
                                <span className="inline-block w-3 h-3 rounded" style={{ background: '#60A5FA88' }} /> Surge
                                <span className="inline-block w-3 h-3 rounded" style={{ background: '#EF444488' }} /> Decline
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-2 text-left text-slate-500 text-[9px] uppercase">Remove ↓ / Effect →</th>
                                            {data.species.map(name => <th key={name} className="p-2 text-center text-white text-[9px] font-bold">{name}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.matrix.map((row, i) => (
                                            <tr key={i}>
                                                <td className="p-2 text-white font-bold text-[10px] border-r border-white/10">{row.removed}</td>
                                                {data.species.map(col => (
                                                    <td key={col} className="p-1.5 text-center" style={{ backgroundColor: getColor(row[col]) }}>
                                                        <span className="font-mono text-[10px] font-bold" style={{ color: row[col] === -100 ? '#475569' : row[col] > 0 ? '#93C5FD' : '#FCA5A5' }}>
                                                            {row[col] === -100 ? '—' : `${row[col] > 0 ? '+' : ''}${row[col]}%`}
                                                        </span>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[10px] text-slate-600 mt-3 italic">Each cell shows the % population change of the column species when the row species is removed.</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════
   3. EXTINCTION RISK SCORES MODAL
   ══════════════════════════════════════ */
export function RiskScoresModal({ ecosystem, accent, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://localhost:3000/risk-scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ecosystem }) })
            .then(r => r.json()).then(d => { setData(d); setLoading(false); });
    }, []);

    const riskColor = { CRITICAL: '#EF4444', VULNERABLE: '#FACC15', STABLE: '#4ADE80' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-[680px] max-h-[85vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl">
                <div className="p-5 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0f172a] z-10 rounded-t-2xl">
                    <div><h2 className="text-lg font-black text-white">⚠️ Extinction Risk Assessment</h2><p className="text-xs text-slate-400">Vulnerability of each species based on dependencies and population</p></div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
                </div>
                <div className="p-5">
                    {loading ? <div className="text-center text-slate-500 py-10">⏳ Calculating risk scores...</div> : data && (
                        <div className="space-y-3">
                            {data.scores.map((sp, i) => (
                                <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">{sp.icon || '🐾'}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-black text-sm">{sp.name}</span>
                                                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: riskColor[sp.riskLevel] + '22', color: riskColor[sp.riskLevel] }}>{sp.riskLevel}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-500">{sp.role} — Trophic Level {sp.trophicLevel}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black font-mono" style={{ color: riskColor[sp.riskLevel] }}>{sp.riskScore}</div>
                                            <span className="text-[8px] text-slate-500 uppercase">Risk</span>
                                        </div>
                                    </div>
                                    {/* Risk bar */}
                                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mb-2">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${sp.riskScore}%`, backgroundColor: riskColor[sp.riskLevel] }} />
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-[9px]">
                                        <div className="bg-black/30 rounded p-1.5"><span className="text-slate-500 block">Pop</span><span className="text-white font-mono">{sp.population.toFixed(1)}</span></div>
                                        <div className="bg-black/30 rounded p-1.5"><span className="text-slate-500 block">Food Sources</span><span className="text-white font-mono">{sp.foodSources}</span></div>
                                        <div className="bg-black/30 rounded p-1.5"><span className="text-slate-500 block">Dependents</span><span className="text-white font-mono">{sp.dependents}</span></div>
                                        <div className="bg-black/30 rounded p-1.5"><span className="text-slate-500 block">Ecosystem Impact</span><span className="font-mono" style={{ color: sp.impactScore > 50 ? '#EF4444' : '#4ADE80' }}>{sp.impactScore}%</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════
   4. MULTI-CASCADE MODAL
   ══════════════════════════════════════ */
export function MultiCascadeModal({ ecosystem, accent, onClose }) {
    const [selected, setSelected] = useState([]);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const toggle = (name) => {
        setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : prev.length < 3 ? [...prev, name] : prev);
    };

    const runAnalysis = async () => {
        if (selected.length < 2) return;
        setLoading(true);
        try {
            const r = await fetch("http://localhost:3000/multi-extinction", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ecosystem, removedSpecies: selected }) });
            setReport(await r.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const sc = { EXTINCT: '#EF4444', CRITICAL: '#F97316', DECLINING: '#FACC15', SURGING: '#60A5FA', STABLE: '#4ADE80' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-[740px] max-h-[85vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl">
                <div className="p-5 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0f172a] z-10 rounded-t-2xl">
                    <div><h2 className="text-lg font-black text-white">🔬 Multi-Species Cascade</h2><p className="text-xs text-slate-400">Remove 2-3 species and analyze compound effects</p></div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
                </div>

                <div className="p-5 border-b border-white/10">
                    <p className="text-[9px] text-slate-500 mb-2 uppercase font-bold">Select 2-3 species to remove (in order)</p>
                    <div className="flex flex-wrap gap-2">
                        {ecosystem.speciesList.map((s, i) => (
                            <button key={i} onClick={() => toggle(s.name)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${selected.includes(s.name) ? 'border-red-500/50 bg-red-500/15 text-red-400 font-bold' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
                                <span>{s.icon}</span> {s.name}
                                {selected.includes(s.name) && <span className="bg-red-500/30 text-red-400 text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-mono">{selected.indexOf(s.name) + 1}</span>}
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Order: {selected.length > 0 ? selected.join(" → ") : "none selected"}</span>
                        <button onClick={runAnalysis} disabled={selected.length < 2 || loading} className="px-5 py-2 rounded-lg text-xs font-bold text-black disabled:opacity-30" style={{ background: accent }}>
                            {loading ? "⏳" : "🔬"} Analyze Compound Cascade
                        </button>
                    </div>
                </div>

                {report && (
                    <div className="p-5">
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10"><span className="text-[9px] font-bold uppercase text-slate-500">Final Stability</span><div className="text-2xl font-black font-mono mt-1" style={{ color: report.finalStability > 0.4 ? '#4ADE80' : '#EF4444' }}>{(report.finalStability * 100).toFixed(0)}%</div></div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10"><span className="text-[9px] font-bold uppercase text-slate-500">Biomass Lost</span><div className="text-2xl font-black font-mono mt-1 text-red-400">{report.totalBiomassLoss}%</div></div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10"><span className="text-[9px] font-bold uppercase text-slate-500">Surviving</span><div className="text-2xl font-black font-mono mt-1 text-orange-400">{report.surviving}/{report.totalSpecies}</div></div>
                        </div>

                        {/* Phase-by-phase results */}
                        {report.phaseResults.map((phase, pi) => (
                            <div key={pi} className="mb-4">
                                <h3 className="text-xs font-black uppercase text-slate-400 mb-2 flex items-center gap-2">
                                    <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-[9px]">Phase {phase.phase}</span>
                                    Remove: <span className="text-white">{phase.removed}</span> ({phase.role}) — Stability: <span style={{ color: phase.stability > 0.6 ? '#4ADE80' : '#EF4444' }}>{(phase.stability * 100).toFixed(0)}%</span>
                                </h3>
                                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                    <table className="w-full text-xs"><thead><tr className="border-b border-white/10 text-slate-500 text-[9px] uppercase"><th className="text-left p-2">Species</th><th className="text-right p-2">Before</th><th className="text-right p-2">After</th><th className="text-right p-2">Change</th><th className="text-center p-2">Status</th></tr></thead>
                                        <tbody>{phase.impacts.map((imp, j) => (
                                            <tr key={j} className="border-b border-white/5"><td className="p-2 text-white font-bold">{imp.name}</td><td className="p-2 text-right text-slate-400 font-mono">{imp.before.toFixed(1)}</td><td className="p-2 text-right font-mono" style={{ color: sc[imp.status] }}>{imp.after.toFixed(1)}</td><td className="p-2 text-right font-mono font-bold" style={{ color: imp.change > 0 ? '#60A5FA' : '#EF4444' }}>{imp.change > 0 ? '+' : ''}{imp.change}%</td><td className="p-2 text-center"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: sc[imp.status] + '22', color: sc[imp.status] }}>{imp.status}</span></td></tr>
                                        ))}</tbody></table>
                                </div>
                            </div>
                        ))}

                        <h3 className="text-xs font-black uppercase text-slate-400 mb-2">📈 Multi-Phase Timeline</h3>
                        <div className="bg-white/5 rounded-xl border border-white/10 p-3 h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={report.timeline}>
                                    <defs>{ecosystem.speciesList.map((s, i) => (<linearGradient key={i} id={`mc-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} /></linearGradient>))}</defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                    <XAxis dataKey="step" stroke="#475569" fontSize={9} />
                                    <YAxis stroke="#475569" fontSize={9} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172aEE', border: '1px solid #334155', fontSize: '11px', borderRadius: '8px' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
                                    {ecosystem.speciesList.map((s, i) => (<Area key={i} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} fill={`url(#mc-${i})`} dot={false} />))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
