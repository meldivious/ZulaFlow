import React, { useState, useEffect } from 'react';
import { FastingSession, FastingPlanType, WeightEntry, NoteEntry, FastingPreset } from '../types';
import { Square, Plus, Droplets, Activity, Zap, Clock, Save, Trash2, Repeat, Calendar, Play, Scale, ScrollText, X, Lightbulb, Check } from 'lucide-react';

interface FastingProps {
  activeFast: FastingSession | null;
  setActiveFast: (session: FastingSession | null) => void;
  fastingHistory: FastingSession[];
  setFastingHistory: React.Dispatch<React.SetStateAction<FastingSession[]>>;
  fastingPresets: FastingPreset[];
  setFastingPresets: React.Dispatch<React.SetStateAction<FastingPreset[]>>;
  waterIntake: number;
  onAddWater: (amount: number) => void;
  weightHistory: WeightEntry[];
  setWeightHistory: React.Dispatch<React.SetStateAction<WeightEntry[]>>;
  notes: NoteEntry[];
  setNotes: React.Dispatch<React.SetStateAction<NoteEntry[]>>;
}

const PLANS: { type: FastingPlanType; label: string; hours: number; desc: string }[] = [
  { type: '16:8', label: '16:8', hours: 16, desc: 'LeanGains' },
  { type: '18:6', label: '18:6', hours: 18, desc: 'Advanced' },
  { type: '20:4', label: '20:4', hours: 20, desc: 'Warrior' },
  { type: 'OMAD', label: 'OMAD', hours: 23, desc: 'One Meal a Day' },
];

const FASTING_TIPS = [
    { title: "Stay Hydrated", desc: "Drink water, black coffee, or tea to stay hydrated and suppress hunger." },
    { title: "Electrolytes Matter", desc: "If you feel dizzy or weak, you might need sodium, magnesium, or potassium." },
    { title: "Keep Busy", desc: "Boredom often mimics hunger. Engage in work or hobbies to pass the time." },
    { title: "Break Gently", desc: "Start with a small meal (protein/fats) to avoid insulin spikes when ending your fast." }
];

export const Fasting: React.FC<FastingProps> = ({
  activeFast,
  setActiveFast,
  fastingHistory,
  setFastingHistory,
  fastingPresets,
  setFastingPresets,
  waterIntake,
  onAddWater,
  weightHistory,
  setWeightHistory,
  notes,
  setNotes
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState<'stats' | 'health' | 'note'>('stats');
  
  // Custom Fast State
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customHours, setCustomHours] = useState(16);
  const [scheduleTime, setScheduleTime] = useState(''); // ISO string or empty for now
  
  // Electrolyte State
  const [showElectrolyteForm, setShowElectrolyteForm] = useState(false);
  const [sodium, setSodium] = useState(0);
  const [potassium, setPotassium] = useState(0);
  const [magnesium, setMagnesium] = useState(0);

  // Input states
  const [weightInput, setWeightInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  // Timer Tick
  useEffect(() => {
    let interval: any;
    const update = () => {
      if (activeFast) {
        const now = Date.now();
        const startTime = activeFast.scheduledStartTime 
            ? new Date(activeFast.scheduledStartTime).getTime() 
            : new Date(activeFast.startTime).getTime();
        
        // If scheduled in future
        if (activeFast.scheduledStartTime && startTime > now) {
            setElapsed(-(startTime - now) / 1000); // Negative elapsed means waiting
        } else {
            setElapsed(Math.floor((now - startTime) / 1000));
        }
      } else {
        setElapsed(0);
      }
    };

    if (activeFast) {
      update();
      interval = setInterval(update, 1000);
    }
    return () => clearInterval(interval);
  }, [activeFast]);

  // Actions
  const startFast = (plan: FastingPlanType, hours: number, name?: string, scheduledStart?: string) => {
    const startTime = scheduledStart || new Date().toISOString();
    
    const newFast: FastingSession = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      startTime: startTime,
      targetDuration: hours,
      plan,
      scheduledStartTime: scheduledStart
    };
    setActiveFast(newFast);
    setShowCustom(false);
    setCustomName('');
    setScheduleTime('');
  };

  const endFast = () => {
    if (!activeFast) return;
    const completedFast: FastingSession = {
      ...activeFast,
      endTime: new Date().toISOString()
    };
    setFastingHistory(prev => [completedFast, ...prev]);
    setActiveFast(null);
  };

  const savePreset = () => {
      if (!customName) {
          alert("Please name your preset");
          return;
      }
      const newPreset: FastingPreset = {
          id: Math.random().toString(36).substr(2, 9),
          name: customName,
          duration: customHours
      };
      setFastingPresets(prev => [...prev, newPreset]);
      alert("Preset Saved!");
  };

  const deletePreset = (id: string) => {
      setFastingPresets(prev => prev.filter(p => p.id !== id));
  };

  // Helpers
  const formatTime = (sec: number) => {
    const absSec = Math.abs(sec);
    const h = Math.floor(absSec / 3600);
    const m = Math.floor((absSec % 3600) / 60);
    const s = Math.floor(absSec % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDurationDetailed = (ms: number) => {
      const seconds = Math.floor((ms / 1000) % 60);
      const minutes = Math.floor((ms / (1000 * 60)) % 60);
      const hours = Math.floor(ms / (1000 * 60 * 60));
      
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m ${seconds}s`;
  };

  const getLongestFast = () => {
      if (fastingHistory.length === 0) return '--';
      const maxMs = Math.max(...fastingHistory.map(f => {
        if (!f.endTime) return 0;
        return new Date(f.endTime).getTime() - new Date(f.startTime).getTime();
      }));
      if (maxMs === 0) return '--';
      return formatDurationDetailed(maxMs);
  };

  const getProgress = () => {
    if (!activeFast || elapsed < 0) return 0;
    const targetSec = activeFast.targetDuration * 3600;
    return Math.min(100, (elapsed / targetSec) * 100);
  };

  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightInput) return;
    const entry: WeightEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      value: parseFloat(weightInput)
    };
    setWeightHistory(prev => [entry, ...prev]);
    setWeightInput('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput) return;
    const entry: NoteEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      content: noteInput,
      type: 'journal'
    };
    setNotes(prev => [entry, ...prev]);
    setNoteInput('');
  };

  const saveElectrolytes = (e: React.FormEvent) => {
      e.preventDefault();
      // Filter out 0 entries to keep it clean
      const parts = [];
      if (sodium > 0) parts.push(`Sodium: ${sodium}g`);
      if (potassium > 0) parts.push(`Potassium: ${potassium}g`);
      if (magnesium > 0) parts.push(`Magnesium: ${magnesium}g`);

      if (parts.length === 0) {
          setShowElectrolyteForm(false);
          return;
      }

      const content = `Electrolytes: ${parts.join(', ')}`;
      const entry: NoteEntry = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          content: content,
          type: 'electrolytes'
      };
      setNotes(prev => [entry, ...prev]);
      setShowElectrolyteForm(false);
      
      // Reset
      setSodium(0);
      setPotassium(0);
      setMagnesium(0);
  };

  const currentWeight = weightHistory.length > 0 ? weightHistory[0].value : '--';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-24 relative">
      
      {/* Timer / Control Section */}
      <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-xl relative overflow-hidden text-center border border-slate-200 dark:border-slate-700">
        {!activeFast ? (
          <div className="space-y-6">
             {!showCustom ? (
                 <>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Start Fasting</h2>
                    
                    {/* Presets Grid */}
                    {fastingPresets.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {fastingPresets.map(preset => (
                                <button 
                                    key={preset.id}
                                    onClick={() => startFast('Custom', preset.duration, preset.name)}
                                    className="flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-3 min-w-[100px] relative group"
                                >
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                                        className="absolute top-1 right-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                    <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300 truncate">{preset.name}</div>
                                    <div className="text-xs text-slate-500">{preset.duration}h</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Standard Plans */}
                    <div className="grid grid-cols-2 gap-3">
                    {PLANS.map(p => (
                        <button
                        key={p.type}
                        onClick={() => startFast(p.type, p.hours)}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary transition-all group"
                        >
                        <div className="text-xl font-black text-primary mb-1">{p.label}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">{p.desc}</div>
                        </button>
                    ))}
                    </div>
                    
                    <button onClick={() => setShowCustom(true)} className="w-full py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-primary hover:border-primary transition-colors text-sm font-bold flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Create Custom Fast
                    </button>
                 </>
             ) : (
                 <div className="animate-in slide-in-from-right">
                     <div className="flex items-center justify-between mb-4">
                         <h3 className="font-bold text-lg">Custom Fast</h3>
                         <button onClick={() => setShowCustom(false)} className="text-xs text-slate-500 underline">Cancel</button>
                     </div>
                     
                     <div className="space-y-4 text-left">
                         <div>
                             <label className="text-xs font-bold uppercase text-slate-500">Name (Optional)</label>
                             <input 
                                type="text" 
                                value={customName} 
                                onChange={e => setCustomName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm border border-slate-200 dark:border-slate-700 focus:border-primary outline-none"
                                placeholder="e.g. Monk Fast"
                             />
                         </div>

                         <div>
                             <div className="flex justify-between mb-2">
                                <label className="text-xs font-bold uppercase text-slate-500">Duration</label>
                                <span className="font-bold text-primary">{customHours} Hours</span>
                             </div>
                             <input 
                                type="range" min="1" max="168"
                                value={customHours}
                                onChange={e => setCustomHours(parseInt(e.target.value))}
                                className="w-full accent-primary h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                             />
                         </div>

                         <div>
                             <label className="text-xs font-bold uppercase text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Schedule Start (Optional)</label>
                             <input 
                                type="datetime-local"
                                value={scheduleTime}
                                onChange={e => setScheduleTime(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm border border-slate-200 dark:border-slate-700 text-slate-500"
                             />
                         </div>

                         <div className="flex gap-2 pt-2">
                             <button 
                                onClick={savePreset}
                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary"
                                title="Save as Preset"
                             >
                                 <Save className="w-5 h-5" />
                             </button>
                             <button 
                                onClick={() => startFast('Custom', customHours, customName, scheduleTime || undefined)} 
                                className="flex-1 bg-primary text-slate-900 font-bold py-3 rounded-xl"
                             >
                                 {scheduleTime ? 'Schedule Fast' : 'Start Fast'}
                             </button>
                         </div>
                     </div>
                 </div>
             )}
          </div>
        ) : (
          <div className="relative z-10 py-4">
             {/* Progress Visual */}
             <div className="w-64 h-64 mx-auto relative flex items-center justify-center mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-slate-700" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke={elapsed < 0 ? "#fbbf24" : "#10b981"} strokeWidth="8" 
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * getProgress() / 100)}
                    className="transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                       {activeFast.name || activeFast.plan}
                   </span>
                   <span className={`text-4xl font-black tabular-nums tracking-tight ${elapsed < 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                     {formatTime(elapsed)}
                   </span>
                   <span className="text-xs text-slate-500 mt-2 font-medium">
                     {elapsed < 0 ? 'Starts in...' : `Target: ${activeFast.targetDuration}h`}
                   </span>
                </div>
             </div>

             {elapsed >= 0 ? (
                 <button 
                onClick={endFast}
                className="bg-red-500/10 text-red-500 border border-red-500/20 px-8 py-3 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 mx-auto"
                >
                <Square className="w-4 h-4 fill-current" /> End Fast
                </button>
             ) : (
                <button 
                onClick={() => setActiveFast(null)}
                className="text-slate-400 hover:text-red-500 text-sm font-bold"
                >
                Cancel Schedule
                </button>
             )}
             
          </div>
        )}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4">
           {[
               { id: 'stats', label: 'Stats' },
               { id: 'health', label: 'Health' },
               { id: 'note', label: 'Note' }
           ].map((tab) => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
             >
               {tab.label}
             </button>
           ))}
        </div>

        {/* STATS TAB */}
        {activeTab === 'stats' && (
           <div className="space-y-4 animate-in slide-in-from-right-2">
              <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-card p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 font-bold uppercase">Total Fasts</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{fastingHistory.length}</p>
                  </div>
                  <div className="bg-white dark:bg-card p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 font-bold uppercase">Longest</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                          {getLongestFast()}
                      </p>
                  </div>
              </div>

              <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                 <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/20">
                     <h3 className="font-bold text-sm">History</h3>
                 </div>
                 <div className="max-h-60 overflow-y-auto">
                     {fastingHistory.length === 0 ? (
                         <p className="text-center text-slate-400 text-xs py-6">No completed fasts yet.</p>
                     ) : (
                         fastingHistory.map((fast, i) => {
                             const duration = fast.endTime 
                                ? ((new Date(fast.endTime).getTime() - new Date(fast.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1) 
                                : 0;
                             
                             return (
                                <div key={i} className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div>
                                        <p className="font-bold text-sm text-slate-900 dark:text-white">{fast.name || fast.plan}</p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(fast.startTime).toLocaleDateString()} • {duration} hours
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => startFast(fast.plan, fast.targetDuration, fast.name)}
                                        className="text-primary hover:bg-primary/10 p-2 rounded-lg"
                                        title="Repeat Fast"
                                    >
                                        <Repeat className="w-4 h-4" />
                                    </button>
                                </div>
                             );
                         })
                     )}
                 </div>
              </div>
           </div>
        )}

        {/* HEALTH TAB */}
        {activeTab === 'health' && (
           <div className="space-y-4 animate-in slide-in-from-right-2">
              {/* Weight Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-blue-100 text-xs font-bold uppercase">Current Weight</p>
                      <p className="text-3xl font-black">{currentWeight} <span className="text-sm font-normal opacity-70">kg</span></p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Scale className="w-6 h-6 text-white" />
                    </div>
                 </div>
                 
                 <form onSubmit={handleAddWeight} className="flex gap-2">
                    <input 
                      type="number" step="0.1" 
                      value={weightInput}
                      onChange={e => setWeightInput(e.target.value)}
                      placeholder="Log weight..."
                      className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:outline-none focus:bg-white/30"
                    />
                    <button type="submit" className="bg-white text-blue-600 px-4 rounded-lg font-bold hover:bg-blue-50"><Plus className="w-5 h-5" /></button>
                 </form>
              </div>

              {/* Water Card */}
              <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl p-6 border border-cyan-100 dark:border-cyan-800/30 flex items-center justify-between">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                       <Droplets className="w-5 h-5 text-cyan-500" />
                       <h3 className="font-bold text-slate-900 dark:text-white">Water Intake</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{waterIntake}<span className="text-sm text-slate-400 font-medium ml-1">ml</span></p>
                 </div>
                 <div className="flex flex-col gap-2">
                    <button onClick={() => onAddWater(250)} className="bg-white dark:bg-card shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-600 border border-cyan-200 dark:border-cyan-800">+ 250ml</button>
                    <button onClick={() => onAddWater(500)} className="bg-white dark:bg-card shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-600 border border-cyan-200 dark:border-cyan-800">+ 500ml</button>
                 </div>
              </div>

              {/* Quick Logs Area */}
              <div>
                  <button 
                    onClick={() => setShowElectrolyteForm(true)}
                    className="w-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 p-4 rounded-2xl flex items-center justify-between hover:scale-[1.02] transition-transform"
                  >
                      <div className="flex items-center gap-3">
                          <div className="bg-yellow-100 dark:bg-yellow-500/20 p-2 rounded-xl text-yellow-600 dark:text-yellow-400">
                              <Zap className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                              <span className="block text-sm font-bold text-slate-900 dark:text-white">Log Electrolytes</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Track Sodium, Potassium, Magnesium</span>
                          </div>
                      </div>
                      <Plus className="w-5 h-5 text-yellow-500" />
                  </button>
              </div>

              {/* Fasting Tips */}
              <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Fasting Tips</h3>
                  </div>
                  <div className="p-4 space-y-4">
                      {FASTING_TIPS.map((tip, idx) => (
                          <div key={idx} className="flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-xs font-bold text-slate-500">
                                  {idx + 1}
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{tip.title}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tip.desc}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
           </div>
        )}

        {/* NOTE TAB */}
        {activeTab === 'note' && (
           <div className="space-y-4 animate-in slide-in-from-right-2">
              <form onSubmit={handleAddNote} className="bg-white dark:bg-card p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><ScrollText className="w-4 h-4" /> Journal</h3>
                  <textarea 
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="How are you feeling today?"
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                    rows={4}
                  />
                  <button type="submit" disabled={!noteInput} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 rounded-lg font-bold text-xs uppercase tracking-wider disabled:opacity-50">Save Note</button>
              </form>

              <div className="space-y-3">
                 {notes.filter(n => n.type === 'journal' || n.type === 'electrolytes' || n.type === 'blood').map(note => (
                   <div key={note.id} className="bg-white dark:bg-card p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          note.type === 'electrolytes' ? 'bg-yellow-100 text-yellow-600' : 
                          note.type === 'blood' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                          {note.type === 'electrolytes' ? <Zap className="w-4 h-4" /> : 
                           note.type === 'blood' ? <Activity className="w-4 h-4" /> : <ScrollText className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">{new Date(note.date).toLocaleString()}</p>
                        <p className="text-sm text-slate-900 dark:text-white">{note.content}</p>
                      </div>
                   </div>
                 ))}
                 {notes.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No notes yet.</p>}
              </div>
           </div>
        )}
      </div>

      {/* Electrolyte Form Modal */}
      {showElectrolyteForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 animate-in slide-in-from-bottom-10 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                          <Zap className="w-5 h-5 text-yellow-500" /> Electrolytes
                      </h3>
                      <button onClick={() => setShowElectrolyteForm(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <form onSubmit={saveElectrolytes} className="space-y-4">
                      {/* Sodium */}
                      <div>
                          <div className="flex justify-between mb-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Sodium</label>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{sodium.toFixed(2)}g</span>
                          </div>
                          <input 
                            type="range" min="0" max="3" step="0.01"
                            value={sodium}
                            onChange={(e) => setSodium(parseFloat(e.target.value))}
                            className="w-full accent-yellow-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                          />
                      </div>

                      {/* Potassium */}
                      <div>
                          <div className="flex justify-between mb-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Potassium</label>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{potassium.toFixed(2)}g</span>
                          </div>
                          <input 
                            type="range" min="0" max="3" step="0.01"
                            value={potassium}
                            onChange={(e) => setPotassium(parseFloat(e.target.value))}
                            className="w-full accent-yellow-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                          />
                      </div>

                      {/* Magnesium */}
                      <div>
                          <div className="flex justify-between mb-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Magnesium</label>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{magnesium.toFixed(2)}g</span>
                          </div>
                          <input 
                            type="range" min="0" max="3" step="0.01"
                            value={magnesium}
                            onChange={(e) => setMagnesium(parseFloat(e.target.value))}
                            className="w-full accent-yellow-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                          />
                      </div>

                      <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold mt-4">
                          Save Log
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};