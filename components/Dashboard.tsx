import React, { useState, useEffect, useRef } from 'react';
import { Task, Template, FastingSession, FastingPreset, FastingPlanType } from '../types';
import { Plus, Trash2, CheckCircle, Circle, Timer, Play, Pause, Calendar as CalendarIcon, ChevronDown, Footprints, Save, FolderOpen, X, Clock, Flame, Droplets, CalendarClock, Edit2, Repeat, Zap, ChevronUp, Dumbbell, CheckSquare, ArrowLeft, MoreHorizontal, ArrowRight } from 'lucide-react';
import { formatUserName, getTodayDate } from '../App';

interface DashboardProps {
  userName?: string;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  categories: string[];
  onAddCategory: (category: string) => void;
  templates: Template[];
  onSaveTemplate: (name: string) => void;
  steps: number;
  setSteps: React.Dispatch<React.SetStateAction<number>>;
  activeTaskId: string | null;
  timerExpiry: number | null;
  timerPausedRemaining: number | null;
  onToggleTimer: (task: Task) => void;
  viewDate: string;
  onDateSelect: (date: string) => void;
  readOnly: boolean;
  showCelebration: boolean;
  onTaskComplete?: () => void;
  incrementCreateClicks: () => void;
  activeFast: FastingSession | null;
  onNavigateToFasting: () => void;
  fastingPresets: FastingPreset[];
  onStartFast: (plan: FastingPlanType, hours: number, name?: string) => void;
}

const WeekCalendar = ({ viewDate, onDateSelect }: { viewDate: string, onDateSelect: (date: string) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [days, setDays] = useState<any[]>([]);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const todayStr = getTodayDate();

    const monthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i, 12, 0, 0);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        monthDays.push({
            day: dayNames[d.getDay()],
            date: i,
            fullDate: dateStr,
            isToday: dateStr === todayStr,
            isSelected: dateStr === viewDate,
            isFuture: dateStr > todayStr
        });
    }
    setDays(monthDays);
  }, [viewDate]);

  useEffect(() => {
      if (scrollRef.current) {
          const selectedEl = scrollRef.current.querySelector('.is-selected');
          if (selectedEl) {
              selectedEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          } else {
              const todayEl = scrollRef.current.querySelector('.is-today');
              if (todayEl) {
                  todayEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
              }
          }
      }
  }, [days]);

  return (
    <div className="w-full relative">
        <div 
            ref={scrollRef}
            className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 px-1 snap-x"
        >
        {days.map((d) => (
            <button 
            key={d.fullDate} 
            onClick={() => !d.isFuture && onDateSelect(d.fullDate)}
            disabled={d.isFuture}
            className={`
                flex-shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-lg transition-all duration-200 snap-center
                ${d.isSelected 
                    ? 'bg-primary text-slate-900 shadow-md shadow-primary/20 scale-100 is-selected font-bold' 
                    : d.isToday
                        ? 'bg-slate-200 dark:bg-slate-700/50 text-slate-900 dark:text-white is-today border-2 border-primary/20'
                        : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
                ${d.isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
            `}
            >
            <span className={`text-[9px] uppercase leading-none mb-1 font-bold ${d.isSelected ? 'text-slate-900/60' : ''}`}>{d.day}</span>
            <span className="text-xl leading-none font-bold">{d.date}</span>
            </button>
        ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-[#0f172a] to-transparent pointer-events-none"></div>
    </div>
  );
};

const StepTracker = ({ steps, setSteps, readOnly }: { steps: number, setSteps: React.Dispatch<React.SetStateAction<number>>, readOnly: boolean }) => {
  const [isTracking, setIsTracking] = useState(false);
  const isTrackingRef = useRef(false);
  const calories = Math.round(steps * 0.045);
  
  // Auto-start tracking if not readOnly
  useEffect(() => {
    if (readOnly) return;
    setIsTracking(true);
    isTrackingRef.current = true;
  }, [readOnly]);

  useEffect(() => {
    let lastStepTime = 0;
    // Standard sensitivity threshold ~11m/s^2 (Gravity is 9.8)
    const threshold = 11; 
    
    const handleMotion = (event: DeviceMotionEvent) => {
      if (!isTrackingRef.current || readOnly) return;
      
      // accelerationIncludingGravity is the most widely supported
      const { x, y, z } = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
      if (!x && !y && !z) return;
      
      const acc = Math.sqrt(x*x + y*y + z*z);
      const now = Date.now();
      
      if (acc > threshold && (now - lastStepTime) > 500) {
        setSteps(prev => prev + 1);
        lastStepTime = now;
      }
    };
    
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => {
      if (window.DeviceMotionEvent) window.removeEventListener('devicemotion', handleMotion);
    };
  }, [setSteps, readOnly]);

  const toggleTracking = () => {
    if (readOnly) return;
    setIsTracking(prev => {
        isTrackingRef.current = !prev;
        return !prev;
    });
  };

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 mb-6 flex items-center justify-between shadow-sm dark:shadow-lg">
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-2xl ${isTracking ? 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 animate-pulse' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-400'}`}>
          <Footprints className="w-8 h-8" />
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Steps</p>
          <div className="flex flex-col">
             <input 
                type="text" 
                value={steps} 
                readOnly={true}
                className="text-4xl font-black bg-transparent text-slate-900 dark:text-white w-32 focus:outline-none cursor-default select-none"
             />
             <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400 mt-1">
                <Flame className="w-4 h-4 fill-current" />
                <span className="text-xl font-bold">{calories}</span>
                <span className="text-xs font-medium text-slate-400 uppercase">kcal</span>
             </div>
          </div>
        </div>
      </div>
      {!readOnly && (
        <button 
          onClick={toggleTracking}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            isTracking 
            ? 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20' 
            : 'bg-primary/10 text-primary border border-primary/20'
          }`}
        >
          {isTracking ? 'Pause' : 'Resume'}
        </button>
      )}
    </div>
  );
};

const FastingWidget = ({ activeFast, onNavigate }: { activeFast: FastingSession | null, onNavigate: () => void }) => {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        let interval: any;
        if (activeFast) {
            const update = () => {
                const now = Date.now();
                const start = new Date(activeFast.startTime).getTime();
                setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
            };
            update();
            interval = setInterval(update, 60000);
        }
        return () => clearInterval(interval);
    }, [activeFast]);
    const hours = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    return (
        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/30 dark:to-slate-900 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 mb-6 flex items-center justify-between shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={onNavigate}>
            <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl ${activeFast ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-400'}`}>
                    <Zap className="w-8 h-8 fill-current" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Fasting</p>
                    {activeFast ? (
                        <div className="flex flex-col">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{hours}h {mins}m</span>
                            <span className="text-xs text-indigo-500 font-bold">{activeFast.plan} Plan</span>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                           <span className="text-xl font-bold text-slate-900 dark:text-white">Start Fast</span>
                           <span className="text-xs text-slate-400">Ready to begin?</span>
                        </div>
                    )}
                </div>
            </div>
            {activeFast && (
                 <div className="h-10 w-10 relative">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                         <path className="text-indigo-100 dark:text-indigo-900" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                         <path className="text-indigo-500" strokeDasharray={`${Math.min(100, (elapsed / (activeFast.targetDuration * 3600)) * 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                      </svg>
                 </div>
            )}
             {!activeFast && (
                <div className="bg-indigo-500 text-white p-2 rounded-lg">
                    <Play className="w-4 h-4" />
                </div>
             )}
        </div>
    );
};

const WaterTracker = ({ waterIntake, onAddWater, readOnly }: { waterIntake: number, onAddWater: (amount: number) => void, readOnly: boolean }) => {
    const [addAmount, setAddAmount] = useState<string>('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(addAmount);
        if (amount && amount > 0) {
            onAddWater(amount);
            setAddAmount('');
        }
    };
    return (
        <div className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl border border-blue-100 dark:border-slate-700 mb-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-400">
                    <Droplets className="w-8 h-8 fill-current" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Water</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{waterIntake}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">ml</span>
                    </div>
                </div>
            </div>
            {!readOnly && (
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <div className="relative">
                        <input 
                            type="number" 
                            value={addAmount}
                            onChange={(e) => setAddAmount(e.target.value)}
                            placeholder="250"
                            className="w-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-2 pr-6 text-sm focus:outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">ml</span>
                    </div>
                    <button type="submit" disabled={!addAmount} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50">
                        <Plus className="w-5 h-5" />
                    </button>
                </form>
            )}
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  userName,
  tasks, 
  setTasks, 
  categories,
  onAddCategory,
  templates,
  onSaveTemplate,
  steps,
  setSteps,
  activeTaskId, 
  timerExpiry, 
  timerPausedRemaining,
  onToggleTimer,
  viewDate,
  onDateSelect,
  readOnly,
  showCelebration,
  onTaskComplete,
  incrementCreateClicks,
  activeFast,
  onNavigateToFasting,
  fastingPresets,
  onStartFast
}) => {
  // SEPARATE STATES FOR GOAL TYPES
  const [fitnessTitle, setFitnessTitle] = useState('');
  const [fitnessDuration, setFitnessDuration] = useState<string>('30');
  const [fitnessTime, setFitnessTime] = useState('');
  
  const [todoTitle, setTodoTitle] = useState('');
  const [todoDuration, setTodoDuration] = useState<string>('15');
  const [todoTime, setTodoTime] = useState('');
  
  const [categoryMode, setCategoryMode] = useState<'select' | 'create'>('select');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  
  const [recurrence, setRecurrence] = useState<'none'|'daily'|'weekly'|'monthly'>('none');
  const [displayTime, setDisplayTime] = useState(0);
  const [exitingTaskId, setExitingTaskId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  // Creation Wizard States
  const [creationStep, setCreationStep] = useState<'type' | 'details' | 'fasting-setup'>('type');
  const [creationType, setCreationType] = useState<'todo' | 'fitness' | 'fasting'>('todo');
  const [selectedFastingPlan, setSelectedFastingPlan] = useState<{plan: FastingPlanType, hours: number} | null>(null);
  const [fastingName, setFastingName] = useState('');
  
  const [showFab, setShowFab] = useState(false); 
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const [isDoneExpanded, setIsDoneExpanded] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  
  const sortedCategories = [...categories].sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (categories.length === 0) setCategoryMode('create');
  }, [categories]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) setShowFab(true);
      else setShowFab(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const calculateWaterIntake = () => {
    return tasks.reduce((total, task) => {
      if (!task.completed) return total;
      const text = task.title.toLowerCase();
      if (text.includes('water') || text.includes('drink')) {
        const match = text.match(/(\d+(?:\.\d+)?)\s*(ml|l)?/);
        if (match) {
          let val = parseFloat(match[1]);
          const unit = match[2];
          if (unit === 'l') val *= 1000;
          else if (!unit && val < 10) val *= 1000;
          return total + val;
        }
      }
      return total;
    }, 0);
  };

  const waterIntake = calculateWaterIntake();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const updateDisplay = () => {
      if (activeTaskId && timerExpiry) {
        const left = Math.max(0, Math.ceil((timerExpiry - Date.now()) / 1000));
        setDisplayTime(left);
      } else if (activeTaskId && timerPausedRemaining) {
        setDisplayTime(Math.ceil(timerPausedRemaining / 1000));
      } else {
        setDisplayTime(0);
      }
    };
    updateDisplay();
    if (activeTaskId && timerExpiry) {
      interval = setInterval(updateDisplay, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTaskId, timerExpiry, timerPausedRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleWithAnimation = (id: string, currentlyCompleted: boolean) => {
    if (readOnly) return;
    if (!currentlyCompleted) {
      if (onTaskComplete) onTaskComplete();
      setExitingTaskId(id);
      setTimeout(() => {
        toggleTask(id);
        setExitingTaskId(null);
      }, 300);
    } else {
      toggleTask(id);
    }
  };

  const toggleTask = (id: string) => {
    if (readOnly) return;
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
          const newState = !t.completed;
          return { 
              ...t, 
              completed: newState,
              completedAt: newState ? new Date().toISOString() : undefined
          };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    if (readOnly) return;
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleStartEdit = (task: Task) => {
    const now = new Date();
    const created = new Date(task.createdAt);
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      setEditingTaskId(task.id);
      setEditTitle(task.title);
    } else {
      alert("Tasks can only be renamed within 24 hours of creation.");
    }
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, title: editTitle } : t));
    }
    setEditingTaskId(null);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    let title, durationStr, timeStr;
    if (creationType === 'fitness') {
        title = fitnessTitle;
        durationStr = fitnessDuration;
        timeStr = fitnessTime;
    } else {
        title = todoTitle;
        durationStr = todoDuration;
        timeStr = todoTime;
    }

    if (!title.trim()) return;

    // Use local date helper
    let scheduledDateStr = getTodayDate();
    let scheduledTimeStr = undefined;

    if (timeStr) {
        const d = new Date(timeStr);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        scheduledDateStr = `${yyyy}-${mm}-${dd}`;
        scheduledTimeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    incrementCreateClicks();

    let finalCategory = '';
    if (creationType === 'fitness' && !selectedCategory) {
        finalCategory = 'Fitness';
    } else if (categoryMode === 'create') {
      finalCategory = customCategory.trim() || 'General';
      onAddCategory(finalCategory); 
      setCategoryMode('select');
      setSelectedCategory(finalCategory);
    } else {
      finalCategory = selectedCategory || 'General';
    }
    
    if (!categories.includes(finalCategory)) {
        onAddCategory(finalCategory);
    }

    const duration = parseInt(durationStr) || 5;
    const now = new Date();

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: title,
      completed: false,
      category: finalCategory,
      duration: duration,
      scheduledTime: scheduledTimeStr,
      scheduledDate: scheduledDateStr,
      createdAt: now.toISOString(),
      recurring: recurrence !== 'none'
    };
    
    setTasks(prev => [...prev, newTask]);
    
    // Reset based on type
    if (creationType === 'fitness') {
        setFitnessTitle('');
        setFitnessDuration('30');
        setFitnessTime('');
    } else {
        setTodoTitle('');
        setTodoDuration('15');
        setTodoTime('');
    }
    setRecurrence('none');
    setCustomCategory('');
    setSelectedCategory(''); 
    setShowTaskForm(false);
    // Reset wizard
    setCreationStep('type');
    setCreationType('todo');
  };

  const handleAddWater = (amount: number) => {
     if (readOnly) return;
     const now = new Date();
     const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
     const newTask: Task = {
         id: Math.random().toString(36).substr(2, 9),
         title: `Water ${amount}ml`,
         completed: true, 
         category: 'Health',
         duration: 0,
         scheduledTime: timeStr,
         completedAt: now.toISOString(),
         scheduledDate: now.toISOString().split('T')[0],
         createdAt: now.toISOString()
     };
     setTasks(prev => [...prev, newTask]);
  };

  const handleLoadTemplate = (t: Template) => {
    const now = new Date().toISOString();
    const newTasks = t.tasks.map(task => ({
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
      createdAt: now
    }));
    setTasks(prev => [...prev, ...newTasks]);
    setShowTemplates(false);
  };

  const saveCurrentAsTemplate = () => {
    if (!templateName.trim()) return;
    onSaveTemplate(templateName);
    setTemplateName('');
    setShowSaveTemplate(false);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const activeTasksAll = tasks.filter(t => !t.completed);
  const isTaskUpcoming = (task: Task) => {
      const todayStr = getTodayDate();
      const nowTime = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
      
      if (task.scheduledDate && task.scheduledDate > todayStr) return true; 
      if (task.scheduledDate === todayStr && task.scheduledTime) {
          return task.scheduledTime > nowTime;
      }
      return false; 
  };

  const upcomingTasks = activeTasksAll.filter(isTaskUpcoming);
  const currentTasks = activeTasksAll.filter(t => !isTaskUpcoming(t));
  const completedTasks = tasks.filter(t => t.completed).sort((a, b) => {
      if (!a.completedAt) return 1;
      if (!b.completedAt) return -1;
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
  });

  const renderTaskItem = (task: Task, isCompleted: boolean) => {
    const isActive = activeTaskId === task.id;
    const isRunning = isActive && timerExpiry !== null;
    const isExiting = exitingTaskId === task.id;
    // Check if task is from a past date
    const todayStr = getTodayDate();
    const isPastTask = task.scheduledDate && task.scheduledDate < todayStr;
    const isFutureDate = task.scheduledDate && task.scheduledDate > todayStr;
    const isEditing = editingTaskId === task.id;
    const isUpcoming = isTaskUpcoming(task);
    
    let progressWidth = 0;
    if (isActive) {
        const totalDurationSecs = (task.duration || 10) * 60;
        const timeLeftSecs = displayTime;
        progressWidth = (timeLeftSecs / totalDurationSecs) * 100;
    }

    return (
      <div 
        key={task.id} 
        className={`flex flex-col p-4 rounded-xl transition-all duration-300 border relative overflow-hidden transform ${
          isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        } ${
          isCompleted 
            ? 'bg-slate-100 dark:bg-slate-800/50 border-transparent opacity-60 animate-in slide-in-from-left duration-300' 
            : isActive 
              ? 'bg-white dark:bg-slate-800 border-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
              : 'bg-white dark:bg-card border-slate-200 dark:border-slate-700 hover:border-primary/50'
        }`}
      >
        {isActive && (
          <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-1000 linear" style={{ width: `${progressWidth}%` }}></div>
        )}
        
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button 
              onClick={() => handleToggleWithAnimation(task.id, task.completed)}
              disabled={readOnly || isEditing}
              className={`text-slate-400 dark:text-slate-400 transition-colors focus:outline-none shrink-0 ${!readOnly && 'hover:text-primary'}`}
            >
              {task.completed ? (
                <CheckCircle className="w-6 h-6 text-primary" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSaveEdit(task.id); }}
                  className="flex items-center gap-2"
                >
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                    autoFocus
                    onBlur={() => handleSaveEdit(task.id)}
                  />
                </form>
              ) : (
                <div className="flex items-start gap-2">
                    <span className={`block font-medium break-words whitespace-normal leading-tight ${task.completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                    {task.title}
                    </span>
                    {task.recurring && (
                        <Repeat className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                    )}
                </div>
              )}

              {/* Compact Metadata Row (Time, Duration, Category) */}
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                
                {/* Time */}
                {!isCompleted && (task.scheduledTime || isFutureDate) && (
                   <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                     <Clock className="w-3 h-3" />
                     <span>
                        {isFutureDate && task.scheduledDate ? `${new Date(task.scheduledDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})} ` : ''}
                        {task.scheduledTime}
                     </span>
                   </div>
                )}

                {/* Duration */}
                {isActive ? (
                  <div className={`flex items-center gap-1 font-mono font-bold ${isRunning ? 'text-primary animate-pulse' : 'text-yellow-500'}`}>
                     <Timer className="w-3 h-3" />
                     {formatTime(displayTime)}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {isCompleted && task.completedAt ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    ) : (
                        <>
                            <Timer className="w-3 h-3" />
                            <span>{task.duration} min</span>
                        </>
                    )}
                  </div>
                )}

                {/* Category */}
                {task.category && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50 uppercase tracking-wider text-[9px] font-bold border border-slate-200 dark:border-slate-700">
                    {task.category}
                  </span>
                )}

                 {/* Past task indicator */}
                {!isCompleted && isPastTask && (
                     <span className="text-red-400 font-bold uppercase tracking-wider text-[9px]">Overdue</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!task.completed && !readOnly && !isPastTask && (
              <button
                onClick={() => isUpcoming ? null : onToggleTimer(task)}
                disabled={isUpcoming}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isUpcoming
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                    : isActive 
                        ? (isRunning ? 'bg-yellow-500 text-slate-900 hover:bg-yellow-400' : 'bg-green-500 text-white hover:bg-green-400')
                        : 'bg-slate-100 dark:bg-slate-700 text-primary hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {isActive && isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
              </button>
            )}
            
            {!readOnly && (
               <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const isTimerRunning = activeTaskId && timerExpiry;
  const isTimerPaused = activeTaskId && !timerExpiry;
  const hasPending = currentTasks.length > 0;
  const now = new Date();
  const minDateTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

  // Helper variables for current form
  const currentTitle = creationType === 'fitness' ? fitnessTitle : todoTitle;
  const currentDuration = creationType === 'fitness' ? fitnessDuration : todoDuration;
  const currentTime = creationType === 'fitness' ? fitnessTime : todoTime;
  
  const isFutureTime = currentTime && new Date(currentTime) > new Date();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-32">
      {/* Greeting */}
      {userName && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            Hi <span className="text-primary capitalize">{formatUserName(userName)}</span>,
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Let's set some goals today.</p>
        </div>
      )}
      
      {/* Rest of Dashboard Render */}
      <WeekCalendar viewDate={viewDate} onDateSelect={onDateSelect} />
      <StepTracker steps={steps} setSteps={setSteps} readOnly={readOnly} />
      <FastingWidget activeFast={activeFast} onNavigate={onNavigateToFasting} />
      <WaterTracker waterIntake={waterIntake} onAddWater={handleAddWater} readOnly={readOnly} />

      {/* Daily Goals Card */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-2xl border border-primary/20 mb-6 relative overflow-hidden">
        {/* ... Confetti Logic ... */}
        {showCelebration && (
             <div className="absolute inset-0 z-10 pointer-events-none animate-in fade-in duration-500">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="20" cy="20" r="2" fill="#fbbf24" className="animate-bounce" />
                  <circle cx="80" cy="30" r="2" fill="#ec4899" className="animate-bounce" />
                </svg>
             </div>
        )}
        
        <div className="relative z-20">
          <div className="flex justify-between items-end mb-3">
            <div>
              <div className="flex items-center gap-3">
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white">Daily Goals</h2>
                 <div className="flex gap-1">
                    <button onClick={() => setShowSaveTemplate(true)} className="p-1.5 bg-white/50 dark:bg-black/20 rounded-lg text-slate-700 dark:text-white hover:bg-white hover:text-primary transition-colors" title="Save Routine"><Save className="w-4 h-4" /></button>
                    <button onClick={() => setShowTemplates(true)} className="p-1.5 bg-white/50 dark:bg-black/20 rounded-lg text-slate-700 dark:text-white hover:bg-white hover:text-primary transition-colors" title="Load Routine"><FolderOpen className="w-4 h-4" /></button>
                 </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{tasks.length === 0 ? 'Start by adding a task below!' : 'Keep pushing forward!'}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-primary">{completedCount}</span>
              <span className="text-slate-500 dark:text-slate-500 text-sm font-medium">/{tasks.length}</span>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-primary to-emerald-400 h-full transition-all duration-1000 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ... Rest of existing dashboard ... */}
      {showSaveTemplate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 shadow-2xl">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Save Routine</h3>
             <input 
              autoFocus
              type="text" 
              placeholder="Routine Name (e.g. Leg Day)"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white mb-4 focus:border-primary outline-none"
             />
             <div className="flex gap-2">
               <button onClick={() => setShowSaveTemplate(false)} className="flex-1 p-2 text-slate-500 dark:text-slate-400">Cancel</button>
               <button onClick={saveCurrentAsTemplate} className="flex-1 bg-primary text-slate-900 font-bold rounded-lg p-2">Save</button>
             </div>
           </div>
        </div>
      )}

      {showTemplates && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 max-h-[80vh] overflow-y-auto animate-in zoom-in-95 shadow-2xl">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Load Routine</h3>
               <button onClick={() => setShowTemplates(false)}><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             
             {templates.length === 0 ? (
               <p className="text-slate-500 text-center py-4">No saved templates yet.</p>
             ) : (
               <div className="space-y-2">
                 {templates.map(t => (
                   <button 
                    key={t.id}
                    onClick={() => handleLoadTemplate(t)}
                    className="w-full text-left p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-primary transition-all group"
                   >
                     <div className="flex justify-between items-center">
                       <p className="text-slate-900 dark:text-white font-medium group-hover:text-primary">{t.name}</p>
                       <p className="text-[10px] text-slate-500">
                         {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
                       </p>
                     </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400">{t.tasks.length} tasks</p>
                   </button>
                 ))}
               </div>
             )}
           </div>
        </div>
      )}

      {/* Main Task List Area */}
      <div className="space-y-6">
        {tasks.length === 0 && (
          <div className="text-center py-6 text-slate-500 dark:text-slate-500 animate-in fade-in zoom-in-95">
            <p className="text-sm opacity-60 mb-4">Add a task below or ask the AI Mentor!</p>
            {!readOnly && (
                <button 
                    onClick={() => { setShowTaskForm(true); setCreationStep('type'); }}
                    className="bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto hover:bg-primary/20 transition-colors"
                >
                    <Plus className="w-5 h-5" /> Create Goal
                </button>
            )}
          </div>
        )}

        {/* Current Section */}
        {currentTasks.length > 0 && (
          <div className="space-y-3">
             <div className="flex justify-between items-center ml-1">
                 <h3 className="text-sm font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Current</h3>
                 {!isTimerRunning && hasPending && (
                    <button 
                      onClick={() => {
                        if (isTimerPaused && activeTaskId) {
                          const task = tasks.find(t => t.id === activeTaskId);
                          if (task) onToggleTimer(task);
                        } else {
                          onToggleTimer(currentTasks[0]);
                        }
                      }}
                      className="text-xs font-bold text-primary flex items-center gap-1 hover:text-emerald-400 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" /> {isTimerPaused ? 'Continue Goal' : 'Start Goal'}
                    </button>
                 )}
             </div>
             {currentTasks.map(task => renderTaskItem(task, false))}
          </div>
        )}

        {/* Upcoming Section */}
        {upcomingTasks.length > 0 && (
          <div className="space-y-3 pt-2">
             <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                <CalendarClock className="w-3 h-3" /> Upcoming
             </h3>
             <div className="opacity-80">
                {upcomingTasks.map(task => renderTaskItem(task, false))}
             </div>
          </div>
        )}

        {/* Done Section */}
        {completedTasks.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
             <button 
                onClick={() => setIsDoneExpanded(!isDoneExpanded)}
                className="w-full flex justify-between items-center text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1 hover:text-slate-600 dark:hover:text-slate-300"
             >
                 <span>Done ({completedTasks.length})</span>
                 {isDoneExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
             </button>
             
             {isDoneExpanded && (
                 <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                    {completedTasks.map(task => renderTaskItem(task, true))}
                 </div>
             )}
          </div>
        )}
      </div>

      {/* FAB */}
      {!readOnly && !showTaskForm && showFab && (
        <div className="fixed bottom-24 right-4 flex items-center gap-3 z-40 animate-in slide-in-from-bottom-5">
            <span className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-900 dark:text-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-sm font-bold">
                Create a goal
            </span>
            <button 
                onClick={() => { setShowTaskForm(true); setCreationStep('type'); }}
                className="w-14 h-14 bg-primary text-slate-900 rounded-2xl shadow-xl flex items-center justify-center hover:bg-emerald-400 transition-transform active:scale-95"
            >
                <Plus className="w-8 h-8" />
            </button>
        </div>
      )}

      {/* CREATE GOAL WIZARD */}
      {!readOnly && showTaskForm && (
        <>
         <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-all duration-300" onClick={() => setShowTaskForm(false)}></div>
         <div className="fixed bottom-0 left-0 right-0 z-[101] animate-in slide-in-from-bottom-10 fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-700 shadow-2xl p-6 max-w-md mx-auto max-h-[80vh] overflow-y-auto pb-safe">
             <button onClick={() => setShowTaskForm(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-6 h-6" /></button>
             
              {/* STEP 1 */}
                {creationStep === 'type' && (
                    <div className="space-y-4 mb-8">
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-6">What type of goal?</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => { setCreationType('fasting'); setCreationStep('details'); }} className="bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 p-4 rounded-2xl flex items-center gap-4 text-left group">
                                <div className="bg-indigo-100 dark:bg-indigo-800 p-3 rounded-xl text-indigo-600 dark:text-indigo-300"><Zap className="w-6 h-6" /></div>
                                <div><h4 className="font-bold text-slate-900 dark:text-white">Fasting</h4><p className="text-xs text-slate-500">Start or schedule a fast</p></div>
                            </button>
                            <button onClick={() => { setCreationType('todo'); setCreationStep('details'); }} className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 p-4 rounded-2xl flex items-center gap-4 text-left group">
                                <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-xl text-blue-600 dark:text-blue-300"><CheckSquare className="w-6 h-6" /></div>
                                <div><h4 className="font-bold text-slate-900 dark:text-white">To-Do Task</h4><p className="text-xs text-slate-500">Daily chores, reading, work</p></div>
                            </button>
                            <button onClick={() => { setCreationType('fitness'); setCreationStep('details'); }} className="bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 p-4 rounded-2xl flex items-center gap-4 text-left group">
                                <div className="bg-emerald-100 dark:bg-emerald-800 p-3 rounded-xl text-emerald-600 dark:text-emerald-300"><Dumbbell className="w-6 h-6" /></div>
                                <div><h4 className="font-bold text-slate-900 dark:text-white">Fitness Goal</h4><p className="text-xs text-slate-500">Workouts, running, yoga</p></div>
                            </button>
                        </div>
                    </div>
                )}
                {/* Steps 2 & 3 - Preserved Logic */}
                {creationStep === 'details' && creationType === 'fasting' && (
                    <div className="space-y-4 mb-8">
                         <div className="flex items-center gap-2 mb-2"><button onClick={() => setCreationStep('type')}><ArrowLeft className="w-5 h-5" /></button><h3 className="font-bold text-lg">Choose Fasting Plan</h3></div>
                         <div className="space-y-2">
                            <button onClick={() => { setSelectedFastingPlan({plan: 'Custom', hours: 16}); setCreationStep('fasting-setup'); }} className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold flex justify-center items-center gap-2"><Plus className="w-5 h-5" /> Custom Fast</button>
                            {['16:8', '18:6', '20:4', 'OMAD'].map((plan: any) => (
                                <button key={plan} onClick={() => { const h = plan === 'OMAD' ? 23 : parseInt(plan.split(':')[0]); setSelectedFastingPlan({plan, hours: h}); setCreationStep('fasting-setup'); }} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between font-bold"><span>{plan}</span><span className="text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded">{plan === 'OMAD' ? '23h' : plan.split(':')[0]+'h'}</span></button>
                            ))}
                         </div>
                    </div>
                )}
                {creationStep === 'fasting-setup' && selectedFastingPlan && (
                    <div className="space-y-6 mb-8">
                         <div className="flex items-center gap-2 mb-2"><button onClick={() => setCreationStep('details')}><ArrowLeft className="w-5 h-5" /></button><h3 className="font-bold text-lg">Setup Fast</h3></div>
                         <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl">
                             <div className="flex justify-between mb-2"><div><p className="text-xs text-indigo-500 font-bold uppercase">Plan</p><p className="text-2xl font-black">{selectedFastingPlan.plan}</p></div><div className="text-right"><p className="text-xs text-indigo-500 font-bold uppercase">Duration</p><p className="text-2xl font-black">{selectedFastingPlan.hours}h</p></div></div>
                             {selectedFastingPlan.plan === 'Custom' && <input type="range" min="1" max="72" value={selectedFastingPlan.hours} onChange={(e) => setSelectedFastingPlan({...selectedFastingPlan, hours: parseInt(e.target.value)})} className="w-full accent-indigo-500 h-2 bg-slate-200 rounded-lg appearance-none" />}
                         </div>
                         <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Name</label><input type="text" value={fastingName} onChange={(e) => setFastingName(e.target.value)} placeholder="e.g. My Fast" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" /></div>
                         <button onClick={() => { onStartFast(selectedFastingPlan.plan, selectedFastingPlan.hours, fastingName); setShowTaskForm(false); setCreationStep('type'); setFastingName(''); onNavigateToFasting(); }} className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl flex justify-center items-center gap-2"><Zap className="w-5 h-5" /> Start Fast Now</button>
                    </div>
                )}
                {creationStep === 'details' && (creationType === 'todo' || creationType === 'fitness') && (
                    <form onSubmit={addTask} className="flex flex-col gap-4 mb-8">
                        <div className="flex items-center gap-2 mb-1"><button type="button" onClick={() => setCreationStep('type')}><ArrowLeft className="w-5 h-5" /></button><h3 className="font-bold text-lg capitalize">{creationType === 'todo' ? 'New Task' : 'New Goal'}</h3></div>
                        {creationType === 'fitness' && (
                             <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                <button type="button" onClick={() => { const c = prompt("New Workout:"); if(c) { onAddCategory(c); setSelectedCategory(c); setFitnessTitle(c); } }} className="px-3 py-1.5 rounded-full text-xs font-bold border border-dashed text-slate-400 whitespace-nowrap">+ New</button>
                                {['Running', 'Gym', 'Yoga', 'Walk', 'HIIT'].map(a => (<button type="button" key={a} onClick={() => setFitnessTitle(a)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${currentTitle === a ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{a}</button>))}
                             </div>
                        )}
                        <input type="text" value={currentTitle} onChange={(e) => creationType === 'fitness' ? setFitnessTitle(e.target.value) : setTodoTitle(e.target.value)} placeholder="Title..." className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 font-medium focus:outline-none" autoFocus />
                        <div className="flex gap-4">
                            <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Duration (min)</label><input type="number" value={currentDuration} onChange={(e) => creationType === 'fitness' ? setFitnessDuration(e.target.value) : setTodoDuration(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 font-bold" /></div>
                            <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Start Time</label><input type="datetime-local" value={currentTime} onChange={(e) => creationType === 'fitness' ? setFitnessTime(e.target.value) : setTodoTime(e.target.value)} min={minDateTime} className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-2 py-3 text-xs font-bold" /></div>
                        </div>
                        {creationType === 'todo' && (
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category</label>
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    <button type="button" onClick={() => { const c = prompt("New Category:"); if(c) { onAddCategory(c); setSelectedCategory(c); } }} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed text-slate-400">+ New</button>
                                    {sortedCategories.map(cat => (<button key={cat} type="button" onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${selectedCategory === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>{cat}</button>))}
                                </div>
                            </div>
                        )}
                        <button type="submit" disabled={!currentTitle.trim()} className="bg-primary text-slate-900 font-bold py-4 rounded-xl mt-2 flex justify-center items-center gap-2"><Plus className="w-5 h-5" /> {isFutureTime ? 'Schedule' : 'Start Now'}</button>
                    </form>
                )}
           </div>
         </div>
        </>
      )}
    </div>
  );
};
