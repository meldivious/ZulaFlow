import React, { useState, useEffect, useRef } from 'react';
import { Task, Template, FastingSession } from '../types';
import { Plus, Trash2, CheckCircle, Circle, Timer, Play, Pause, Calendar as CalendarIcon, ChevronDown, Footprints, Save, FolderOpen, X, Clock, Flame, Droplets, CalendarClock, Edit2, Repeat, Zap, ChevronUp } from 'lucide-react';
import { formatUserName } from '../App';

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
}

const WeekCalendar = ({ viewDate, onDateSelect }: { viewDate: string, onDateSelect: (date: string) => void }) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0-6
  const todayStr = today.toISOString().split('T')[0];
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayIndex);

  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    return {
      day: days[i],
      date: d.getDate(),
      fullDate: dateStr,
      isToday: dateStr === todayStr,
      isSelected: dateStr === viewDate,
      isFuture: dateStr > todayStr
    };
  });

  return (
    <div className="flex justify-between items-center bg-white dark:bg-slate-800/50 p-4 rounded-2xl mb-6 shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
      {weekDates.map((d, i) => (
        <button 
          key={i} 
          onClick={() => !d.isFuture && onDateSelect(d.fullDate)}
          disabled={d.isFuture}
          className={`flex flex-col items-center gap-1 focus:outline-none transition-all ${d.isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
        >
          <span className={`text-[10px] font-bold ${d.isSelected ? 'text-primary dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
            {d.day}
          </span>
          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all ${
            d.isSelected 
              ? 'bg-primary text-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.4)] scale-110' 
              : d.isToday
                ? 'bg-slate-100 dark:bg-slate-700 text-primary border border-primary/30'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }`}>
            {d.date}
          </div>
        </button>
      ))}
    </div>
  );
};

const StepTracker = ({ steps, setSteps, readOnly }: { steps: number, setSteps: React.Dispatch<React.SetStateAction<number>>, readOnly: boolean }) => {
  const [isTracking, setIsTracking] = useState(false);
  const isTrackingRef = useRef(false);
  
  // Calculate calories (approx 0.045 kcal per step)
  const calories = Math.round(steps * 0.045);
  
  // Auto-start tracking on mount
  useEffect(() => {
    if (readOnly) return;
    
    // Try to auto-start. Note: On iOS 13+, this might fail without user interaction.
    const startTracking = () => {
        setIsTracking(true);
        isTrackingRef.current = true;
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          // Swallow error or handle if needed
        }
    };
    startTracking();
  }, [readOnly]);

  useEffect(() => {
    let lastStepTime = 0;
    // Increased threshold to filter out small movements more aggressively
    const threshold = 25; 

    const handleMotion = (event: DeviceMotionEvent) => {
      if (!isTrackingRef.current || readOnly) return;
      const { x, y, z } = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
      if (!x || !y || !z) return;

      const acc = Math.sqrt(x*x + y*y + z*z);
      const now = Date.now();
      
      // Increased debounce time to 500ms
      if (acc > threshold && (now - lastStepTime) > 500) {
        setSteps(prev => prev + 1);
        lastStepTime = now;
      }
    };

    if (isTracking && window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [isTracking, setSteps, readOnly]);

  const toggleTracking = () => {
    if (readOnly) return;
    
    if (!isTracking) {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              setIsTracking(true);
              isTrackingRef.current = true;
            }
          })
          .catch(console.error);
      } else {
        setIsTracking(true);
        isTrackingRef.current = true;
      }
    } else {
      setIsTracking(false);
      isTrackingRef.current = false;
    }
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
                type="number" 
                value={steps} 
                onChange={(e) => !readOnly && setSteps(parseInt(e.target.value) || 0)}
                readOnly={readOnly}
                className={`text-4xl font-black bg-transparent text-slate-900 dark:text-white w-32 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!readOnly && 'focus:border-b border-primary'}`}
             />
             
             {/* Calories Display - Moved Below */}
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
          {isTracking ? 'Stop' : 'Start'}
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
            interval = setInterval(update, 60000); // update every minute is enough for widget
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
                            className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">ml</span>
                    </div>
                    <button 
                        type="submit"
                        disabled={!addAmount}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                    >
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
  onNavigateToFasting
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState<string>('5');
  const [categoryMode, setCategoryMode] = useState<'select' | 'create'>('select');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const [exitingTaskId, setExitingTaskId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showFab, setShowFab] = useState(true); // Default to TRUE to fix "missing" button
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // Collapse State for Done
  const [isDoneExpanded, setIsDoneExpanded] = useState(false);

  // Template Modals
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  
  // Sort Categories Alphabetically
  const sortedCategories = [...categories].sort((a, b) => a.localeCompare(b));

  // Initialize selected category
  useEffect(() => {
    if (categories.length === 0) {
      setCategoryMode('create');
    }
  }, [categories]);

  // Scroll Listener for FAB
  useEffect(() => {
    const handleScroll = () => {
      // Just ensure FAB remains visible. 
      // If we wanted to hide it on scroll down, we would compare prevScrollY.
      // For now, always showing it is safer based on user feedback.
      setShowFab(true);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calculate Water Intake
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
          else if (!unit && val < 10) val *= 1000; // Assume L if small number and no unit
          return total + val;
        }
      }
      return total;
    }, 0);
  };

  const waterIntake = calculateWaterIntake();

  // Local Display Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const updateDisplay = () => {
      if (activeTaskId && timerExpiry) {
        // Running
        const left = Math.max(0, Math.ceil((timerExpiry - Date.now()) / 1000));
        setDisplayTime(left);
      } else if (activeTaskId && timerPausedRemaining) {
        // Paused
        setDisplayTime(Math.ceil(timerPausedRemaining / 1000));
      } else {
        setDisplayTime(0);
      }
    };

    updateDisplay(); // Initial update

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
      // Trigger global celebration via prop
      if (onTaskComplete) onTaskComplete();
      
      setExitingTaskId(id);
      setTimeout(() => {
        toggleTask(id);
        setExitingTaskId(null);
      }, 300); // Match CSS transition duration
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
    // Check if created within last 24 hours
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
    if (readOnly || !newTaskTitle.trim()) return;

    // Split Scheduled Date Time
    let scheduledDateStr = new Date().toISOString().split('T')[0];
    let scheduledTimeStr = undefined;

    if (scheduledDateTime) {
        const d = new Date(scheduledDateTime);
        scheduledDateStr = d.toISOString().split('T')[0];
        scheduledTimeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    incrementCreateClicks();

    let finalCategory = '';

    if (categoryMode === 'create') {
      finalCategory = customCategory.trim() || 'General';
      onAddCategory(finalCategory); // Save for future use
      setCategoryMode('select');
      setSelectedCategory(finalCategory);
    } else {
      finalCategory = selectedCategory || 'General';
    }
    
    // Add category if not in list
    if (!categories.includes(finalCategory)) {
        onAddCategory(finalCategory);
    }

    const duration = parseInt(newTaskDuration) || 5;
    const now = new Date();

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle,
      completed: false,
      category: finalCategory,
      duration: duration,
      scheduledTime: scheduledTimeStr,
      scheduledDate: scheduledDateStr,
      createdAt: now.toISOString(),
      recurring: isRecurring
    };
    
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskDuration('5');
    setScheduledDateTime('');
    setIsRecurring(false);
    setCustomCategory('');
    setSelectedCategory(''); 
    setShowTaskForm(false); // Close form after adding
  };

  const handleAddWater = (amount: number) => {
     if (readOnly) return;
     const now = new Date();
     const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
     const newTask: Task = {
         id: Math.random().toString(36).substr(2, 9),
         title: `Water ${amount}ml`,
         completed: true, // Auto-complete
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

  // --- Task Categorization Logic ---
  const activeTasksAll = tasks.filter(t => !t.completed);

  // Helper to check if a task is "Upcoming" (Future Date OR Today but later time)
  const isTaskUpcoming = (task: Task) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
      
      if (task.scheduledDate && task.scheduledDate > todayStr) return true; // Future date
      
      if (task.scheduledDate === todayStr && task.scheduledTime) {
          // If scheduled for today, check time
          return task.scheduledTime > nowTime;
      }
      
      return false; 
  };

  const upcomingTasks = activeTasksAll.filter(isTaskUpcoming);
  // Current tasks are active tasks that are NOT upcoming
  const currentTasks = activeTasksAll.filter(t => !isTaskUpcoming(t));
  
  // Sort completed tasks by completedAt timestamp descending (newest first)
  const completedTasks = tasks.filter(t => t.completed).sort((a, b) => {
      if (!a.completedAt) return 1;
      if (!b.completedAt) return -1;
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
  });

  // Render a single task item
  const renderTaskItem = (task: Task, isCompleted: boolean) => {
    const isActive = activeTaskId === task.id;
    const isRunning = isActive && timerExpiry !== null;
    const isExiting = exitingTaskId === task.id;
    const isFutureDate = task.scheduledDate && task.scheduledDate > new Date().toISOString().split('T')[0];
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
        
        <div className="flex items-center justify-between gap-4">
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

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                {isActive ? (
                  <span className={`font-mono font-bold ${isRunning ? 'text-primary animate-pulse' : 'text-yellow-500'}`}>
                    {formatTime(displayTime)}
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                     {/* Show completion time if completed, otherwise duration */}
                    {isCompleted && task.completedAt ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Finished at {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    ) : (
                        <>
                            <Timer className="w-3 h-3" />
                            <span>{task.duration} min</span>
                        </>
                    )}
                  </div>
                )}
                
                {/* Show scheduled info */}
                {!isCompleted && (task.scheduledTime || isFutureDate) && (
                   <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                     <Clock className="w-3 h-3" />
                     <span>
                        {isFutureDate && task.scheduledDate ? `${new Date(task.scheduledDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})} ` : ''}
                        {task.scheduledTime}
                     </span>
                   </div>
                )}
                
                {task.category && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 uppercase tracking-wider text-[10px] border border-slate-200 dark:border-slate-700">
                    {task.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!task.completed && !readOnly && (
              <button
                onClick={() => isUpcoming ? null : onToggleTimer(task)}
                disabled={isUpcoming}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isUpcoming
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                    : isActive 
                        ? (isRunning ? 'bg-yellow-500 text-slate-900 hover:bg-yellow-400' : 'bg-green-500 text-white hover:bg-green-400')
                        : 'bg-slate-100 dark:bg-slate-700 text-primary hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {isActive && isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
              </button>
            )}
            
            {!readOnly && (
               <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Calculate button text based on schedule
  const isFutureSchedule = scheduledDateTime && new Date(scheduledDateTime) > new Date();
  const isTimerRunning = activeTaskId && timerExpiry;
  const isTimerPaused = activeTaskId && !timerExpiry;
  const hasPending = currentTasks.length > 0;

  // Calculate local ISO string for min date (to support local time)
  const now = new Date();
  const minDateTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

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

      {/* Week Calendar */}
      <WeekCalendar viewDate={viewDate} onDateSelect={onDateSelect} />

      {/* Step Tracker (Cleaned) */}
      <StepTracker steps={steps} setSteps={setSteps} readOnly={readOnly} />

      {/* Fasting Widget (Added here) */}
      <FastingWidget activeFast={activeFast} onNavigate={onNavigateToFasting} />

      {/* Water Tracker */}
      <WaterTracker waterIntake={waterIntake} onAddWater={handleAddWater} readOnly={readOnly} />

      {/* Daily Goals Card */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-2xl border border-primary/20 mb-6 relative overflow-hidden">
        {/* Confetti Overlay */}
        {showCelebration && (
             <div className="absolute inset-0 z-10 pointer-events-none animate-in fade-in duration-500">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="20" cy="20" r="1.5" fill="#fbbf24" className="animate-[bounce_2s_infinite]" />
                  <circle cx="80" cy="30" r="1.5" fill="#ec4899" className="animate-[bounce_2.5s_infinite]" />
                  <circle cx="50" cy="70" r="1.5" fill="#3b82f6" className="animate-[bounce_3s_infinite]" />
                  <rect x="30" y="50" width="2" height="4" fill="#10b981" className="animate-[spin_4s_linear_infinite]" />
                  <rect x="70" y="60" width="3" height="3" fill="#8b5cf6" className="animate-[spin_3s_linear_infinite]" />
                  <polygon points="50,10 52,14 48,14" fill="#ef4444" className="animate-[spin_5s_linear_infinite]" />
                  <circle cx="25" cy="45" r="1" fill="#fff" className="animate-[pulse_1s_infinite]" />
                  <rect x="85" y="85" width="2" height="2" fill="#fbbf24" className="animate-[spin_2s_linear_infinite]" />
                  <circle cx="15" cy="75" r="1" fill="#f472b6" className="animate-[bounce_3s_infinite]" />
                  <rect x="10" y="10" width="2" height="2" fill="#10b981" className="animate-[spin_5s_linear_infinite]" />
                  <circle cx="90" cy="55" r="1.5" fill="#a78bfa" className="animate-[pulse_2s_infinite]" />
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

      {/* Modals */}
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
        
        {/* Empty State / All Done State */}
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-500 animate-in fade-in zoom-in-95">
            <p className="text-sm opacity-60 mb-4">Add a task below or ask the AI Mentor!</p>
            {!readOnly && (
                <button 
                    onClick={() => setShowTaskForm(true)}
                    className="bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto hover:bg-primary/20 transition-colors"
                >
                    <Plus className="w-5 h-5" /> Create Goal
                </button>
            )}
          </div>
        ) : activeTasksAll.length === 0 ? (
           <div className="text-center py-6 text-slate-500 dark:text-slate-500 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">You're a star!</h3>
            <p className="text-sm opacity-60">All tasks completed.</p>
          </div>
        ) : null}

        {/* Current Section */}
        {currentTasks.length > 0 && (
          <div className="space-y-3">
             <div className="flex justify-between items-center ml-1">
                 <h3 className="text-sm font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Current</h3>
                 {/* Start Goal / Continue Goal Button */}
                 {!isTimerRunning && hasPending && (
                    <button 
                      onClick={() => {
                        if (isTimerPaused && activeTaskId) {
                          // Resume currently paused task
                          const task = tasks.find(t => t.id === activeTaskId);
                          if (task) onToggleTimer(task);
                        } else {
                          // Start first pending task
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

        {/* Upcoming Section (New) */}
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

        {/* Done Section - Collapsible */}
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

      {/* Floating Action Button (FAB) for Creating Goal */}
      {!readOnly && !showTaskForm && showFab && (
        <div className="fixed bottom-24 right-4 flex items-center gap-3 z-40 animate-in slide-in-from-bottom-5">
            <span className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-900 dark:text-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-sm font-bold">
                Create a goal
            </span>
            <button 
                onClick={() => setShowTaskForm(true)}
                className="w-14 h-14 bg-primary text-slate-900 rounded-2xl shadow-xl flex items-center justify-center hover:bg-emerald-400 transition-transform active:scale-95"
            >
                <Plus className="w-8 h-8" />
            </button>
        </div>
      )}

      {/* Quick Add Form - Only visible when activated */}
      {!readOnly && showTaskForm && (
        <>
        {/* Overlay to close form when clicking outside - BLUR ADDED */}
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-all duration-300" onClick={() => setShowTaskForm(false)}></div>
        
        <form onSubmit={addTask} className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex flex-col gap-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl relative">
            
            {/* Close Button */}
            <button 
                type="button"
                onClick={() => setShowTaskForm(false)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-white shadow-md z-50 hover:bg-red-100 hover:text-red-500"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Row 1: Title & Timer */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What's your goal?"
                    className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-lg font-medium focus:outline-none min-w-0"
                    autoFocus
                />
                
                {/* Duration */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-900/50 rounded-lg px-2 py-2 border border-slate-200 dark:border-slate-700 shrink-0">
                    <Timer className="w-4 h-4 text-slate-400 mr-1" />
                    <input 
                      type="number" 
                      min="1" 
                      max="180"
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(e.target.value)}
                      className="w-8 bg-transparent text-center text-slate-900 dark:text-white focus:outline-none font-mono text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs text-slate-500">m</span>
                </div>
            </div>

             {/* Row 2: Categories (Full Width Horizontal Scroll) */}
            <div className="w-full overflow-x-auto no-scrollbar mask-gradient-r pb-1 -mx-1 px-1">
                <div className="flex items-center gap-2">
                     <button
                        type="button"
                        onClick={() => setCategoryMode('create')}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border border-dashed transition-all shadow-sm ${
                            categoryMode === 'create'
                             ? 'border-primary text-primary bg-primary/10'
                             : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-primary hover:border-primary/50'
                        }`}
                    >
                        + New
                    </button>
                    {sortedCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                              setSelectedCategory(prev => prev === cat ? '' : cat);
                              setCategoryMode('select');
                          }}
                          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all active:scale-95 ${
                              selectedCategory === cat
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inline Custom Category Input */}
            {categoryMode === 'create' && (
                <div className="animate-in slide-in-from-top-1">
                     <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter category name..."
                        className="w-full bg-slate-100 dark:bg-slate-900/50 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary"
                        autoFocus
                    />
                </div>
            )}

            {/* Row 3: Schedule Section - NATIVE PICKER WITH PLACEHOLDER STYLE */}
            <div className="flex flex-col gap-2 mt-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule</h3>
              <div className="flex items-center gap-2">
                  <div className="relative w-full">
                      <input 
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        min={minDateTime}
                        className={`w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none ${!scheduledDateTime ? 'text-transparent' : 'text-slate-500 dark:text-slate-300'}`}
                      />
                      {!scheduledDateTime && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                              Schedule Start (Optional)
                          </span>
                      )}
                  </div>
              </div>
            </div>

            {/* Row 4: Create Goal Button + Repeat */}
            <div className="flex gap-2">
                 {/* Repeat Toggle moved here */}
                 <button 
                   type="button"
                   onClick={() => setIsRecurring(!isRecurring)}
                   className={`px-3 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all aspect-square ${
                     isRecurring 
                     ? 'bg-blue-500 text-white border-blue-600' 
                     : 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600'
                   }`}
                 >
                   <Repeat className="w-5 h-5" />
                   <span className="text-[9px] font-bold uppercase">{isRecurring ? 'Daily' : 'Once'}</span>
                 </button>

                 <button 
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="flex-1 bg-primary text-slate-900 font-bold py-3.5 rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                >
                    <Plus className="w-5 h-5" />
                    {isFutureSchedule ? 'Schedule Goal' : 'Create Goal'}
                </button>
            </div>

          </div>
        </form>
        </>
      )}
    </div>
  );
};