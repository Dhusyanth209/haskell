import React, { useState } from 'react';

export default function EcosystemBuilder({ onApply, onClose, accent }) {
    const [species, setSpecies] = useState([
        { name: "", population: 50, icon: "🐾" }
    ]);
    const [interactions, setInteractions] = useState([]);
    const [newName, setNewName] = useState("");
    const [newPop, setNewPop] = useState(50);
    const [newPred, setNewPred] = useState("");
    const [newPrey, setNewPrey] = useState("");
    const [newRate, setNewRate] = useState(0.02);

    const icons = ["🌾", "🌿", "🌳", "🪸", "🦗", "🐸", "🐍", "🦅", "🐺", "🦊", "🦌", "🐠", "🦈", "🐟", "🦎", "🐞", "🐻", "🐋", "🦦", "🐾"];

    const addSpecies = () => {
        if (!newName.trim()) return;
        setSpecies([...species.filter(s => s.name), { name: newName, population: newPop, icon: icons[species.length % icons.length] }]);
        setNewName("");
        setNewPop(50);
    };

    const removeSpecies = (name) => {
        setSpecies(species.filter(s => s.name !== name));
        setInteractions(interactions.filter(i => i.predator !== name && i.prey !== name));
    };

    const addInteraction = () => {
        if (!newPred || !newPrey || newPred === newPrey) return;
        if (interactions.some(i => i.predator === newPred && i.prey === newPrey)) return;
        setInteractions([...interactions, { predator: newPred, prey: newPrey, rate: newRate }]);
        setNewPred("");
        setNewPrey("");
    };

    const removeInteraction = (idx) => {
        setInteractions(interactions.filter((_, i) => i !== idx));
    };

    const validSpecies = species.filter(s => s.name);

    const handleApply = () => {
        if (validSpecies.length < 2) return;
        onApply({
            speciesList: validSpecies,
            interactions: interactions
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-[680px] max-h-[85vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl">
                <div className="p-5 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0f172a] z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-black text-white flex items-center gap-2">🛠️ Custom Ecosystem Builder</h2>
                        <p className="text-xs text-slate-400">Design your own food web from scratch</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
                </div>

                {/* Add Species */}
                <div className="p-5 border-b border-white/10">
                    <h3 className="text-xs font-black uppercase text-slate-400 mb-3">➕ Add Species</h3>
                    <div className="flex gap-2">
                        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Species name..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-white/30" />
                        <input type="number" value={newPop} onChange={e => setNewPop(Number(e.target.value))} className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" placeholder="Pop" />
                        <button onClick={addSpecies} className="px-4 py-2 rounded-lg text-xs font-bold text-black" style={{ background: accent }}>Add</button>
                    </div>

                    {/* Species list */}
                    <div className="mt-3 space-y-1.5">
                        {validSpecies.map((s, i) => (
                            <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                <span className="text-white text-sm font-bold flex items-center gap-2">
                                    <span>{s.icon}</span> {s.name}
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-400">Pop: <span className="text-white font-mono">{s.population}</span></span>
                                    <button onClick={() => removeSpecies(s.name)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Interactions */}
                <div className="p-5 border-b border-white/10">
                    <h3 className="text-xs font-black uppercase text-slate-400 mb-3">🔗 Add Interactions (Who eats whom)</h3>
                    <div className="flex gap-2 items-center">
                        <select value={newPred} onChange={e => setNewPred(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                            <option value="">Predator...</option>
                            {validSpecies.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                        <span className="text-slate-500 text-xs font-bold">eats</span>
                        <select value={newPrey} onChange={e => setNewPrey(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                            <option value="">Prey...</option>
                            {validSpecies.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                        <input type="number" step="0.005" value={newRate} onChange={e => setNewRate(Number(e.target.value))} className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white outline-none" />
                        <button onClick={addInteraction} className="px-4 py-2 rounded-lg text-xs font-bold text-black" style={{ background: accent }}>Link</button>
                    </div>

                    <div className="mt-3 space-y-1.5">
                        {interactions.map((inter, i) => (
                            <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                <span className="text-sm text-white">
                                    <span className="text-slate-400">{inter.prey}</span> → <span className="font-bold">{inter.predator}</span>
                                    <span className="text-xs text-slate-500 ml-2">rate: {inter.rate}</span>
                                </span>
                                <button onClick={() => removeInteraction(i)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Apply */}
                <div className="p-5 flex justify-between items-center">
                    <span className="text-xs text-slate-500">{validSpecies.length} species, {interactions.length} links</span>
                    <button onClick={handleApply} disabled={validSpecies.length < 2}
                        className="px-6 py-2.5 rounded-lg text-sm font-black text-black disabled:opacity-30 transition-all hover:scale-105"
                        style={{ background: accent }}>
                        🚀 Launch Ecosystem
                    </button>
                </div>
            </div>
        </div>
    );
}
