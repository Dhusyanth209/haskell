import React from 'react';

export default function CaseStudiesModal({ studies, onLoad, onClose, accent }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-[720px] max-h-[85vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl">
                <div className="p-5 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0f172a] z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-black text-white flex items-center gap-2">🌐 Real-World Case Studies</h2>
                        <p className="text-xs text-slate-400">Learn from history — simulate real extinction events</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
                </div>

                <div className="p-5 space-y-4">
                    {studies.map(study => (
                        <div key={study.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all">
                            <div className="flex items-start gap-3">
                                <span className="text-3xl">{study.icon}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-white font-black text-sm">{study.title}</h3>
                                            <p className="text-[10px] text-slate-500">{study.location} — {study.year}</p>
                                        </div>
                                        <button onClick={() => { onLoad(study); onClose(); }}
                                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-black shrink-0"
                                            style={{ background: accent }}>
                                            🔬 Simulate
                                        </button>
                                    </div>

                                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{study.summary}</p>

                                    <div className="mt-3 bg-black/30 rounded-lg p-3 border border-white/5">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Key Finding</span>
                                        <p className="text-xs text-white mt-1">{study.keyFinding}</p>
                                    </div>

                                    <div className="mt-2 flex gap-2">
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                                            Remove: {study.removedSpecies}
                                        </span>
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                                            {study.ecosystem.speciesList.length} species
                                        </span>
                                    </div>

                                    <p className="text-[10px] text-slate-600 italic mt-2">💡 {study.lesson}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
