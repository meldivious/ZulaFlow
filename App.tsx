import React, { useState, useEffect, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { AIMentor } from './components/AICoach';
import { Stats } from './components/Stats';
import { Shop } from './components/Shop';
import { Fasting } from './components/Fasting';
import { Tab, Task, AppState, DayLog, Template, CartItem, FastingSession, WeightEntry, NoteEntry, FastingPreset, FastingPlanType } from './types';
import { LayoutDashboard, Sparkles, BarChart3, Menu, ArrowRight, UserCircle, LogOut, Download, Upload, Sun, Moon, Clock, ShoppingBag, X, Zap, Smartphone, HardDrive, RefreshCw, Share } from 'lucide-react';

const STORAGE_KEY = 'fitflow_data';

// --- SOUND SYSTEM ---
let audioContext: AudioContext | null = null;

const initAudio = () => {
    if (!audioContext) {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtor) {
            audioContext = new AudioCtor();
        }
    }
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(e => console.log("Audio resume failed", e));
    }
};

const PLAY_SUCCESS_SOUND = () => {
    if (!audioContext) initAudio();
    if (!audioContext) return;
    try {
        const ctx = audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        const now = ctx.currentTime;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now); 
        oscillator.frequency.linearRampToValueAtTime(659.25, now + 0.1); 
        oscillator.frequency.linearRampToValueAtTime(783.99, now + 0.2); 
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
    } catch (e) {
        console.error("Sound error", e);
    }
};

// HELPER: Get Local ISO Date (YYYY-MM-DD)
// This fixes the bug where evening users see tomorrow's date
export const getTodayDate = () => {
  const d = new Date();
  // Adjust for timezone offset to get local YYYY-MM-DD
  const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
  return localIso.split('T')[0];
};

const TASKS_POOL = [
  { title: 'Morning Stretch', category: 'Fitness', duration: 10 },
  { title: 'Drink Water (500ml)', category: 'Health', duration: 0 },
  { title: '30 min Jog', category: 'Fitness', duration: 30 },
  { title: 'Push-ups 3x15', category: 'Fitness', duration: 15 },
  { title: 'Read 10 pages', category: 'Daily Task', duration: 20 },
  { title: 'Meditation', category: 'Daily Task', duration: 10 },
  { title: 'Protein Shake', category: 'Health', duration: 5 },
  { title: 'Squats 3x20', category: 'Fitness', duration: 10 },
  { title: 'Plank 2 min', category: 'Fitness', duration: 2 },
  { title: 'Walk the dog', category: 'Fitness', duration: 20 },
  { title: 'Jump Rope 5 min', category: 'Fitness', duration: 5 },
  { title: 'Yoga Flow', category: 'Fitness', duration: 15 },
  { title: 'No Sugar', category: 'Fasting', duration: 0 },
  { title: 'Sleep 8 Hours', category: 'Health', duration: 0 },
  { title: 'Cold Shower', category: 'Health', duration: 5 },
  { title: 'Journaling', category: 'Daily Task', duration: 10 },
  { title: 'Lunges 3x12', category: 'Fitness', duration: 8 },
  { title: 'Cycling 10km', category: 'Fitness', duration: 40 },
  { title: 'Vitamins', category: 'Health', duration: 0 },
  { title: 'Foam Rolling', category: 'Fitness', duration: 15 }
];

const DEFAULT_CATEGORIES = [
  'Fitness',
  'Fasting',
  'Daily Task',
  'Health', 
  'Work',
  'Errands'
];

const generateDemoData = (): AppState => {
  const dateStr = getTodayDate();
  const now = new Date().toISOString();
  
  const history: DayLog[] = Array.from({ length: 90 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (90 - i));
    const dStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const steps = Math.floor(Math.random() * 10000) + 8000; 
    
    const numTasks = Math.floor(Math.random() * 5) + 4; 
    const dailyTasks: Task[] = [];
    const shuffled = [...TASKS_POOL].sort(() => 0.5 - Math.random());
    
    for(let j=0; j<numTasks; j++) {
      const completionDate = new Date(d);
      const hour = 17 + Math.floor(Math.random() * 5); 
      const minute = Math.floor(Math.random() * 60);
      completionDate.setHours(hour, minute);

      dailyTasks.push({
        id: `hist-${i}-${j}`,
        title: shuffled[j].title,
        completed: Math.random() > 0.1, 
        category: shuffled[j].category,
        duration: shuffled[j].duration,
        completedAt: completionDate.toISOString(),
        createdAt: d.toISOString()
      });
    }

    const completedCount = dailyTasks.filter(t => t.completed).length;

    return {
      date: dStr,
      completedCount: completedCount,
      totalCount: numTasks,
      steps: steps,
      tasks: dailyTasks
    };
  });

  const todayTasks: Task[] = [];
  const todayShuffled = [...TASKS_POOL].sort(() => 0.5 - Math.random());
  
  for(let i=0; i<4; i++) {
     const tTime = new Date();
     tTime.setMinutes(tTime.getMinutes() - (i * 45)); 
     todayTasks.push({
        id: `today-done-${i}`,
        title: todayShuffled[i].title,
        completed: true,
        category: todayShuffled[i].category,
        duration: todayShuffled[i].duration,
        completedAt: tTime.toISOString(),
        createdAt: now
     });
  }

  for(let i=4; i<7; i++) {
     todayTasks.push({
        id: `today-todo-${i}`,
        title: todayShuffled[i].title,
        completed: false,
        category: todayShuffled[i].category,
        duration: todayShuffled[i].duration,
        createdAt: now
     });
  }

  return {
    tasks: todayTasks,
    history,
    lastLogin: dateStr,
    categories: DEFAULT_CATEGORIES,
    templates: [
      {
        id: 't1',
        name: 'Morning Routine',
        tasks: [
            { id: 't1-1', title: 'Drink Water', completed: false, category: 'Health', duration: 1, createdAt: now },
            { id: 't1-2', title: 'Sun Salutations', completed: false, category: 'Fitness', duration: 10, createdAt: now }
        ],
        createdAt: new Date().toISOString()
      },
    ],
    steps: 12543, 
    userName: '',
    theme: 'dark',
    createClicks: 0,
    cart: [],
    fastingHistory: [],
    activeFast: null,
    fastingPresets: [],
    weightHistory: [],
    notes: [],
    isPro: true, 
    hasStoragePermission: false
  };
};

export const formatUserName = (name: string): string => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 3) {
    return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}. ${parts[2]}`;
  }
  if (parts.length > 3) {
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }
  return name; 
};

const calculateWaterIntake = (tasks: Task[]) => {
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<DayLog[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [steps, setSteps] = useState<number>(0);
  const [userName, setUserName] = useState<string>('');
  const [theme, setTheme] = useState<'light'|'dark'>('dark');
  const [createClicks, setCreateClicks] = useState<number>(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [fastingHistory, setFastingHistory] = useState<FastingSession[]>([]);
  const [activeFast, setActiveFast] = useState<FastingSession | null>(null);
  const [fastingPresets, setFastingPresets] = useState<FastingPreset[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  
  const [hasStoragePermission, setHasStoragePermission] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const [fileHandle, setFileHandle] = useState<any>(null);
  
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
  const [viewDate, setViewDate] = useState<string>(getTodayDate());
  const [initialized, setInitialized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [inputName, setInputName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timerExpiry, setTimerExpiry] = useState<number | null>(null);
  const [timerPausedRemaining, setTimerPausedRemaining] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Request Notification Permission on Mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
        // Wait a bit before asking to not be annoying
        setTimeout(() => {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    try {
                        new Notification("Welcome to ZulaFlow", {
                            body: "Get ready to crush your goals today! tap to start.",
                            icon: "/icon.png"
                        });
                    } catch (e) {
                        console.log("Notification failed", e);
                    }
                }
            });
        }, 5000);
    }
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
        initAudio();
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        setDeferredPrompt(null);
        setIsMenuOpen(false);
      });
    } else if (isIOS) {
        setShowIOSInstall(true);
        setIsMenuOpen(false);
    } else {
        alert("App is installed or installation not supported via button. Check browser menu.");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
       const now = getTodayDate();
       if (now !== currentDate) {
           setCurrentDate(now);
           if (viewDate === currentDate) {
               setViewDate(now);
           }
       }
    }, 60000); 
    return () => clearInterval(interval);
  }, [currentDate, viewDate]);

  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0f172a');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
    }
  }, [theme]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const today = getTodayDate();
    let dataToLoad: AppState | null = null;

    if (saved) {
      try {
        const parsed: AppState = JSON.parse(saved);
        if ((!parsed.tasks || parsed.tasks.length === 0) && (!parsed.history || parsed.history.length === 0)) {
          dataToLoad = generateDemoData();
          dataToLoad.userName = parsed.userName || ''; 
        } else {
          dataToLoad = parsed;
        }
      } catch (e) {
        dataToLoad = generateDemoData();
      }
    } else {
      dataToLoad = generateDemoData();
    }

    if (dataToLoad) {
      // Check date rollover
      if (dataToLoad.lastLogin !== today) {
        if (dataToLoad.tasks.length > 0) {
          const yesterdayLog: DayLog = {
            date: dataToLoad.lastLogin,
            completedCount: dataToLoad.tasks.filter(t => t.completed).length,
            totalCount: dataToLoad.tasks.length,
            steps: dataToLoad.steps || 0,
            tasks: dataToLoad.tasks 
          };
          setHistory(prev => [...(dataToLoad?.history || []), yesterdayLog]);
        } else {
          setHistory(dataToLoad.history || []);
        }
        // Rollover incomplete tasks
        const uncompleted = (dataToLoad.tasks || []).filter(t => !t.completed);
        setTasks(uncompleted);
        setSteps(0); 
      } else {
        setTasks(dataToLoad.tasks || []);
        setHistory(dataToLoad.history || []);
        setSteps(dataToLoad.steps || 0);
      }
      setCategories(dataToLoad.categories && dataToLoad.categories.length > 0 ? dataToLoad.categories : DEFAULT_CATEGORIES);
      setTemplates(dataToLoad.templates || []);
      setTheme(dataToLoad.theme || 'dark');
      setCreateClicks(dataToLoad.createClicks || 0);
      setCart(dataToLoad.cart || []);
      
      setFastingHistory(dataToLoad.fastingHistory || []);
      setActiveFast(dataToLoad.activeFast || null);
      setFastingPresets(dataToLoad.fastingPresets || []);
      setWeightHistory(dataToLoad.weightHistory || []);
      setNotes(dataToLoad.notes || []);

      setHasStoragePermission(dataToLoad.hasStoragePermission || false);

      if (dataToLoad.userName) {
        setUserName(dataToLoad.userName);
      } else {
        setShowOnboarding(true);
      }
    }
    
    setInitialized(true);
  }, []);

  // Save to LocalStorage & Auto-Save to File
  useEffect(() => {
    if (!initialized) return;

    const state: AppState = {
      tasks,
      history,
      categories,
      templates,
      steps,
      userName,
      theme,
      lastLogin: getTodayDate(),
      createClicks,
      cart,
      fastingHistory,
      activeFast,
      fastingPresets,
      weightHistory,
      notes,
      isPro: true,
      hasStoragePermission
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    if (fileHandle) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(state, null, 2));
                await writable.close();
            } catch (err) {
                console.error("Auto-save failed", err);
                setFileHandle(null);
                setHasStoragePermission(false);
            }
        }, 1000); 
    }

  }, [tasks, history, categories, templates, steps, userName, theme, createClicks, cart, fastingHistory, activeFast, fastingPresets, weightHistory, notes, initialized, hasStoragePermission, fileHandle]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeTaskId && timerExpiry) {
      interval = setInterval(() => {
        if (Date.now() >= timerExpiry) {
           handleTaskComplete(activeTaskId);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTaskId, timerExpiry]);

  useEffect(() => {
    if (showCelebration) {
      PLAY_SUCCESS_SOUND(); // Play sound
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  const handleTaskComplete = (taskId: string) => {
    const currentTasksList = tasksRef.current;
    const taskIndex = currentTasksList.findIndex(t => t.id === taskId);
    const todayStr = getTodayDate();
    
    const nextTask = currentTasksList.find((t, i) => 
        i > taskIndex && 
        !t.completed && 
        (!t.scheduledDate || t.scheduledDate <= todayStr)
    );

    setTasks(prev => prev.map(t => 
        t.id === taskId 
        ? { ...t, completed: true, completedAt: new Date().toISOString() } 
        : t
    ));

    if (nextTask) {
        setActiveTaskId(nextTask.id);
        const durationMs = (nextTask.duration || 5) * 60 * 1000;
        setTimerExpiry(Date.now() + durationMs);
        setTimerPausedRemaining(null);
    } else {
        setActiveTaskId(null);
        setTimerExpiry(null);
        setTimerPausedRemaining(null);
        setShowCelebration(true);
    }
  };

  const handleManualTaskComplete = () => {
    setShowCelebration(true);
  };

  const handleToggleTimer = (task: Task) => {
    initAudio();
    if (activeTaskId === task.id) {
       if (timerExpiry) {
         const remaining = timerExpiry - Date.now();
         setTimerPausedRemaining(remaining);
         setTimerExpiry(null);
       } else {
         const durationMs = timerPausedRemaining || (task.duration || 5) * 60 * 1000;
         setTimerExpiry(Date.now() + durationMs);
         setTimerPausedRemaining(null);
       }
    } else {
      setActiveTaskId(task.id);
      const durationMs = (task.duration || 5) * 60 * 1000;
      setTimerExpiry(Date.now() + durationMs);
      setTimerPausedRemaining(null);
    }
  };

  const handleAddTasks = (newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks]);
    setActiveTab('dashboard');
    setViewDate(getTodayDate()); 
  };
  
  const handleAddWater = (amount: number) => {
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
        scheduledDate: getTodayDate(),
        createdAt: now.toISOString()
    };
    setTasks(prev => [...prev, newTask]);
    setShowCelebration(true); 
  };

  const handleStartFast = (plan: FastingPlanType, hours: number, name?: string) => {
    const startTime = new Date().toISOString();
    const newFast: FastingSession = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        startTime: startTime,
        targetDuration: hours,
        plan
    };
    setActiveFast(newFast);
    setShowCelebration(true);
  };

  const handleAddCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories(prev => [...prev, category]);
    }
  };

  const handleSaveTemplate = (name: string) => {
    const newTemplate: Template = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      tasks: tasks.map(t => ({...t, id: Math.random().toString(36).substr(2, 9), completed: false})), 
      createdAt: new Date().toISOString()
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      setUserName(inputName.trim());
      setShowOnboarding(false);
      setIsMenuOpen(false);
      initAudio();
    }
  };

  const handleEditName = () => {
    setInputName(userName);
    setShowOnboarding(true);
    setIsMenuOpen(false);
  };

  // ... (Sync, Export, Import functions remain similar) ...
  const handleSyncFile = async () => {
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: 'fitflow_data.json',
                types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
            });
            const writable = await handle.createWritable();
            const state: AppState = { tasks, history, categories, templates, steps, userName, theme, lastLogin: getTodayDate(), createClicks, cart, fastingHistory, activeFast, fastingPresets, weightHistory, notes, isPro: true, hasStoragePermission: true };
            await writable.write(JSON.stringify(state, null, 2));
            await writable.close();
            setFileHandle(handle);
            setHasStoragePermission(true);
            alert("Sync Enabled!");
            setIsMenuOpen(false);
        } catch (err) { console.error(err); }
    } else {
        const state: AppState = { tasks, history, categories, templates, steps, userName, theme, lastLogin: getTodayDate(), createClicks, cart, fastingHistory, activeFast, fastingPresets, weightHistory, notes, isPro: true, hasStoragePermission: true };
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitflow_data.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsMenuOpen(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (importedData) {
          setTasks(importedData.tasks || []);
          setHistory(importedData.history || []);
          setCategories(importedData.categories || DEFAULT_CATEGORIES);
          setTemplates(importedData.templates || []);
          setSteps(importedData.steps || 0);
          setUserName(importedData.userName || '');
          setTheme(importedData.theme || 'dark');
          setCreateClicks(importedData.createClicks || 0);
          setCart(importedData.cart || []);
          setFastingHistory(importedData.fastingHistory || []);
          setActiveFast(importedData.activeFast || null);
          setFastingPresets(importedData.fastingPresets || []);
          setWeightHistory(importedData.weightHistory || []);
          setNotes(importedData.notes || []);
          setHasStoragePermission(importedData.hasStoragePermission || false);
          alert('Data imported successfully!');
        }
      } catch (err) { alert('Failed to import data.'); }
    };
    reader.readAsText(file);
    setIsMenuOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getDateLabel = (dateStr: string) => {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    // Use proper date parsing for local time string YYYY-MM-DD
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    
    const diffTime = today.getTime() - target.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const todayLog: DayLog = {
    date: currentDate,
    completedCount: tasks.filter(t => t.completed).length,
    totalCount: tasks.length,
    steps: steps,
    tasks: tasks
  };
  
  const fullStats = [...history, todayLog];
  const isToday = viewDate === currentDate;
  const historicalLog = !isToday ? history.find(h => h.date === viewDate) : null;
  const displayedTasks = isToday ? tasks : (historicalLog?.tasks || []);
  const displayedSteps = isToday ? steps : (historicalLog?.steps || 0);

  const todayStr = currentDate;
  const activeTodayTasks = tasks.filter(t => !t.completed && (!t.scheduledDate || t.scheduledDate <= todayStr));
  const futureTasks = tasks.filter(t => !t.completed && t.scheduledDate && t.scheduledDate > todayStr);
  const hasActiveToday = activeTodayTasks.length > 0;
  
  const waterIntake = calculateWaterIntake(tasks);

  let TaskBadge = null;
  if (hasActiveToday) {
      TaskBadge = <div className="absolute top-2 right-1/4 translate-x-1/2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] border border-white dark:border-slate-900 z-10"></div>;
  } else if (futureTasks.length > 0) {
      TaskBadge = (
        <div className="absolute -top-1 right-1/4 translate-x-1/2 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm border border-slate-200 dark:border-slate-700 z-10">
            <Clock className="w-3 h-3 text-yellow-500" />
        </div>
      );
  }

  if (!initialized) return null;

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans flex items-center justify-center p-6 overflow-hidden">
        <div className="max-w-md w-full animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-emerald-300 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-8 mx-auto">
            <span className="font-bold text-slate-900 text-3xl">Z</span>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">Welcome to ZulaFlow</h1>
          <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Your offline-first daily fitness companion.</p>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">What should we call you?</label>
              <input 
                type="text" 
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:outline-none transition-colors text-lg"
                autoFocus
                required
              />
            </div>
            <button 
              type="submit"
              disabled={!inputName.trim()}
              className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans selection:bg-primary selection:text-slate-900 overflow-x-hidden transition-colors duration-300">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md z-50 border-b border-slate-200 dark:border-slate-800 pt-safe transition-all duration-300">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary to-emerald-300 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-slate-900">Z</span>
            </div>
            {activeTab !== 'dashboard' && (
              <span className="font-bold text-xl text-slate-900 dark:text-white">ZulaFlow</span>
            )}
          </div>
          {activeTab === 'dashboard' && (
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">{getDateLabel(viewDate)}</span>
                {!isToday && (
                  <span className="text-[10px] text-slate-500">{viewDate.split('-').slice(1).join('/')}</span>
                )}
            </div>
          )}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div id="main-scroll" className="w-full max-w-md mx-auto pt-20 pb-28 px-4 min-h-screen">
            {activeTab === 'dashboard' && (
            <Dashboard 
                userName={userName}
                tasks={displayedTasks} 
                setTasks={isToday ? setTasks : () => {}} 
                categories={categories}
                onAddCategory={handleAddCategory}
                templates={templates}
                onSaveTemplate={handleSaveTemplate}
                steps={displayedSteps}
                setSteps={isToday ? setSteps : () => {}} 
                activeTaskId={activeTaskId}
                timerExpiry={timerExpiry}
                timerPausedRemaining={timerPausedRemaining}
                onToggleTimer={handleToggleTimer}
                viewDate={viewDate}
                onDateSelect={setViewDate}
                readOnly={!isToday}
                showCelebration={showCelebration}
                onTaskComplete={handleManualTaskComplete}
                incrementCreateClicks={() => setCreateClicks(prev => prev + 1)}
                activeFast={activeFast}
                onNavigateToFasting={() => setActiveTab('fasting')}
                fastingPresets={fastingPresets}
                onStartFast={handleStartFast}
            />
            )}
            {activeTab === 'mentor' && <AIMentor onAddTasks={handleAddTasks} />}
            {activeTab === 'fasting' && (
                <Fasting
                activeFast={activeFast}
                setActiveFast={setActiveFast}
                fastingHistory={fastingHistory}
                setFastingHistory={setFastingHistory}
                fastingPresets={fastingPresets}
                setFastingPresets={setFastingPresets}
                waterIntake={waterIntake}
                onAddWater={handleAddWater}
                weightHistory={weightHistory}
                setWeightHistory={setWeightHistory}
                notes={notes}
                setNotes={setNotes}
                />
            )}
            {activeTab === 'shop' && <Shop cart={cart} setCart={setCart} />}
            {activeTab === 'stats' && <Stats history={fullStats} categories={categories} />}
      </div>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe z-40">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 w-full h-full justify-center ${activeTab === 'dashboard' ? 'text-primary' : 'text-slate-500'}`}>
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-medium uppercase">Tasks</span>
            {TaskBadge}
        </button>
        <button onClick={() => setActiveTab('mentor')} className={`flex flex-col items-center gap-1 w-full h-full justify-center ${activeTab === 'mentor' ? 'text-primary' : 'text-slate-500'}`}>
            <Sparkles className="w-6 h-6" />
            <span className="text-[10px] font-medium uppercase">AI Mentor</span>
        </button>
        <button onClick={() => setActiveTab('fasting')} className={`flex flex-col items-center gap-1 w-full h-full justify-center relative ${activeTab === 'fasting' ? 'text-primary' : 'text-slate-500'}`}>
            <Zap className="w-6 h-6" />
            <span className="text-[10px] font-medium uppercase">Fasting</span>
            {activeFast && <div className="absolute top-2 right-1/4 translate-x-1/2 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse border border-white dark:border-slate-900 z-10"></div>}
        </button>
        <button onClick={() => setActiveTab('shop')} className={`flex flex-col items-center gap-1 w-full h-full justify-center ${activeTab === 'shop' ? 'text-primary' : 'text-slate-500'}`}>
            <ShoppingBag className="w-6 h-6" />
            <span className="text-[10px] font-medium uppercase">Shop</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 w-full h-full justify-center ${activeTab === 'stats' ? 'text-primary' : 'text-slate-500'}`}>
            <BarChart3 className="w-6 h-6" />
            <span className="text-[10px] font-medium uppercase">Stats</span>
        </button>
        </div>
      </nav>

      {/* Menu & Install Logic remains similar, trimmed for brevity but functional logic is above */}
      <div className={`fixed inset-y-0 right-0 w-64 bg-white dark:bg-slate-800 shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
             <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center pt-safe">
                 <h2 className="font-bold text-slate-900 dark:text-white">Menu</h2>
                 <button onClick={() => setIsMenuOpen(false)}><X className="w-6 h-6 text-slate-500" /></button>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
                <p className="text-xs text-slate-500">Signed in as</p>
                <p className="font-bold text-lg capitalize">{formatUserName(userName)}</p>
             </div>
             <div className="flex-1 overflow-y-auto py-2">
                {((deferredPrompt || isIOS) && !isStandalone) && (
                    <button onClick={handleInstallClick} className="w-full text-left px-6 py-4 text-sm text-white bg-primary hover:bg-emerald-400 mx-4 rounded-xl flex items-center gap-3 mb-4 font-bold max-w-[calc(100%-2rem)]">
                      <Smartphone className="w-5 h-5" /> Install App
                    </button>
                )}
                <button onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setIsMenuOpen(false); }} className="w-full text-left px-6 py-4 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-3">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button onClick={handleEditName} className="w-full text-left px-6 py-4 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-3">
                    <UserCircle className="w-5 h-5" /> Edit Profile
                </button>
                <button onClick={handleSyncFile} className="w-full text-left px-6 py-4 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-3">
                    {fileHandle ? <><RefreshCw className="w-5 h-5 text-primary" /> Auto-Sync On</> : <><HardDrive className="w-5 h-5" /> Enable Sync / Export</>}
                </button>
                <button onClick={handleImportClick} className="w-full text-left px-6 py-4 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-3">
                    <Upload className="w-5 h-5" /> Import Data
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="application/json" onChange={handleFileChange} />
             </div>
             <div className="p-4 border-t border-slate-200 dark:border-slate-700 pb-safe">
                  <button onClick={() => { setIsMenuOpen(false); setShowOnboarding(true); setUserName(''); setInputName(''); }} className="w-full text-left px-4 py-3 text-sm text-red-500 font-bold flex items-center gap-3">
                    <LogOut className="w-5 h-5" /> Log Out
                  </button>
             </div>
          </div>
      </div>
      {isMenuOpen && <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />}
      
      {showIOSInstall && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 relative animate-in slide-in-from-bottom-10">
                  <button onClick={() => setShowIOSInstall(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-6 h-6" /></button>
                  <div className="text-center">
                      <Share className="w-8 h-8 text-primary mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Install on iOS</h3>
                      <p className="text-slate-500 text-sm mb-4">Tap Share, then 'Add to Home Screen'.</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;