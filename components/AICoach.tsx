import React, { useState } from 'react';
import { generateWorkoutPlan } from '../services/geminiService';
import { Task } from '../types';
import { Sparkles, Loader2, PlusCircle, AlertCircle, Zap } from 'lucide-react';

interface AIMentorProps {
  onAddTasks: (tasks: Task[]) => void;
}

const PRESETS = [
  { 
    id: 'reset', 
    title: 'Daily 7-Min Reset', 
    duration: '7 min',
    prompt: 'Create a 7-minute full-body reset workout containing jumping jacks, squats, lunges, and plank. Industry standard structure.' 
  },
  { 
    id: 'core', 
    title: 'Core & Abs Blast', 
    duration: '10 min',
    prompt: 'Create a 10-minute intense core workout featuring crunches, leg raises, russian twists, and mountain climbers.' 
  },
  { 
    id: 'fullbody', 
    title: 'Full Body HIIT', 
    duration: '20 min',
    prompt: 'Create a 20-minute Full Body HIIT workout. Include warm-up, high intensity intervals (burpees, pushups, high knees), and cool down.' 
  },
  { 
    id: 'yoga', 
    title: 'Morning Yoga Flow', 
    duration: '15 min',
    prompt: 'Create a 15-minute morning yoga flow for flexibility and mindfulness. Include sun salutations, warrior poses, and child\'s pose.' 
  }
];

export const AIMentor: React.FC<AIMentorProps> = ({ onAddTasks }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (customPrompt?: string) => {
    const promptToUse = customPrompt || prompt;
    if (!promptToUse.trim()) return;
    
    setLoading(true);
    setError(null);
    setGeneratedTasks(null);

    try {
      const tasks = await generateWorkoutPlan(promptToUse);
      if (customPrompt) {
        // If it was a preset, add immediately
        onAddTasks(tasks);
      } else {
        // If custom, show preview
        setGeneratedTasks(tasks);
      }
    } catch (err) {
      setError("Failed to generate plan. Please check your connection or API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (generatedTasks) {
      onAddTasks(generatedTasks);
      setGeneratedTasks(null);
      setPrompt('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20">
      
      {/* Quick Start Presets */}
      <div>
        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 ml-1">Quick Start</h3>
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleGenerate(preset.prompt)}
              disabled={loading}
              className="bg-white dark:bg-card border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800 p-4 rounded-xl text-left transition-all group relative overflow-hidden shadow-sm dark:shadow-none"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{preset.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{preset.duration}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 dark:bg-[#0f172a] px-2 text-slate-500">Or Custom Goals</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-900 dark:to-purple-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <Sparkles className="absolute top-4 right-4 w-24 h-24 text-white opacity-5 -rotate-12" />
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-300" />
          AI Mentor
        </h2>
        <p className="text-indigo-100 dark:text-indigo-200 mb-6">
          Tell me your Daily Goals or Fitness goals for today.
        </p>
        
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., I want to run 5k today and do some core work."
          className="w-full bg-white/20 border border-white/30 rounded-xl p-4 text-white placeholder-indigo-100 focus:outline-none focus:bg-white/30 transition-all resize-none h-24"
        />

        <button
          onClick={() => handleGenerate()}
          disabled={loading || !prompt.trim()}
          className="mt-4 w-full bg-white text-indigo-900 font-bold py-3 px-6 rounded-xl hover:bg-indigo-50 disabled:opacity-50 flex justify-center items-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Designing Plan...
            </>
          ) : (
            'Generate Plan'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-200 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {generatedTasks && generatedTasks.length > 0 && (
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-2xl p-6 animate-in slide-in-from-bottom-2 shadow-lg">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Suggested Routine</h3>
          <div className="space-y-3 mb-6">
            {generatedTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="w-1.5 h-10 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-slate-900 dark:text-white font-medium">{task.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{task.category} • {task.duration} min</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setGeneratedTasks(null)}
              className="flex-1 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
            >
              Discard
            </button>
            <button 
              onClick={handleAccept}
              className="flex-1 bg-primary text-slate-900 font-bold py-3 rounded-xl hover:bg-emerald-400 transition-colors flex justify-center items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Start Workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};