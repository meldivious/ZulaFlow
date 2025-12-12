import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { DayLog, Task } from '../types';
import { Mail, Check, Flame, Footprints, TrendingUp, Dumbbell, Trophy, Target, PieChart as PieIcon, Droplets, Sparkles, Crown, Clock, Zap, Moon, Layers } from 'lucide-react';

interface StatsProps {
  history: DayLog[];
  categories?: string[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const calculateWaterIntake = (tasks: Task[] | undefined) => {
    if (!tasks) return 0;
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

// Helper for formatting large numbers
const formatK = (num: number) => {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
};

export const Stats: React.FC<StatsProps> = ({ history, categories }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Get last 7 days
  const data = history.slice(-7);
  const totalWorkouts = history.length;
  
  // New Stats Calculations
  const totalWeeklySteps = data.reduce((acc, curr) => acc + (curr.steps || 0), 0);
  const totalWeeklyCalories = Math.round(totalWeeklySteps * 0.045);
  
  // Calculate total weekly water (sum of all days in current view)
  const totalWeeklyWater = data.reduce((acc, curr) => acc + calculateWaterIntake(curr.tasks), 0);
  
  // Best Day Calculation (Tasks)
  const bestDay = history.reduce((best, current) => {
    return (current.completedCount > (best?.completedCount || 0)) ? current : best;
  }, null as DayLog | null);

  // Daily Average Steps Calculation
  const totalStepsHistory = history.reduce((acc, curr) => acc + (curr.steps || 0), 0);
  const avgSteps = totalWorkouts > 0 ? totalStepsHistory / totalWorkouts : 0;
  const avgCalories = Math.round(avgSteps * 0.045);
  
  // Avg Water
  const totalWaterHistory = history.reduce((acc, curr) => acc + calculateWaterIntake(curr.tasks), 0);
  const avgWater = totalWorkouts > 0 ? Math.round(totalWaterHistory / totalWorkouts) : 0;

  // --- Peak Performance Logic ---
  const hourCounts = Array(24).fill(0);
  let totalTimedTasks = 0;

  history.forEach(day => {
      if (day.tasks) {
          day.tasks.filter(t => t.completed && t.completedAt).forEach(t => {
              const hour = new Date(t.completedAt!).getHours();
              hourCounts[hour]++;
              totalTimedTasks++;
          });
      }
  });

  // Find Peak Hour
  let peakHour = 0;
  let maxCount = 0;
  hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
          maxCount = count;
          peakHour = hour;
      }
  });

  // Find Quietest Hour (Active but low, or just 0 if strict)
  // We'll look for the minimum non-zero count to find "off-peak" activity, or just a generic low point.
  // Actually, finding a 0 count block is easy. Let's find the hour with min count (that isn't peak).
  let quietHour = (peakHour + 12) % 24; // Default to opposite
  let minCount = Infinity;
  // Simple heuristic: find a time with low activity that isn't sleep time (0-5) if possible?
  // Let's just take the hour with lowest count.
  hourCounts.forEach((count, hour) => {
      if (hour !== peakHour && count < minCount) {
          minCount = count;
          quietHour = hour;
      }
  });

  const formatHour = (h: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12} ${ampm}`;
  };

  const getPersona = (h: number) => {
      if (h >= 5 && h < 10) return "Early Bird";
      if (h >= 10 && h < 14) return "Lunch Crusher";
      if (h >= 14 && h < 18) return "Afternoon Ace";
      if (h >= 18 && h < 22) return "Night Owl";
      return "Midnight Mover";
  };
  // -----------------------------

  // Category Breakdown Logic
  const categoryStats: Record<string, number> = {};
  let totalTasksForCats = 0;
  history.forEach(day => {
    if (day.tasks) {
        day.tasks.filter(t => t.completed).forEach(t => {
            const cat = t.category || 'Other';
            categoryStats[cat] = (categoryStats[cat] || 0) + 1;
            totalTasksForCats++;
        });
    }
  });

  const categoryChartData = Object.entries(categoryStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5

  // Prepare chart data with normalized values
  const chartData = data.map(day => {
    const steps = day.steps || 0;
    const calories = Math.round(steps * 0.045);
    const water = calculateWaterIntake(day.tasks); // ml

    return {
        date: day.date,
        fullDate: new Date(day.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}),
        tasks: day.completedCount,
        stepsRaw: steps,
        stepsK: Number((steps / 1000).toFixed(1)), // Normalized 4372 -> 4.4
        caloriesRaw: calories,
        caloriesK: Number((calories / 1000).toFixed(2)), // Normalized 300 -> 0.3
        waterRaw: water,
        waterL: Number((water / 1000).toFixed(1)), // Normalized 2000 -> 2.0
    };
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
          setSubscribed(false);
          setEmail('');
      }, 3000);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl min-w-[140px]">
          <p className="text-slate-500 dark:text-slate-300 text-sm mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">{d.fullDate}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-4">
               <span className="text-emerald-500 font-bold text-xs">Tasks</span>
               <span className="text-slate-900 dark:text-white font-bold text-xs">{d.tasks}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
               <span className="text-blue-500 font-bold text-xs">Steps</span>
               <span className="text-slate-900 dark:text-white font-bold text-xs">{formatK(d.stepsRaw)}</span>
            </div>
             <div className="flex justify-between items-center gap-4">
               <span className="text-orange-500 font-bold text-xs">Kcal</span>
               <span className="text-slate-900 dark:text-white font-bold text-xs">{formatK(d.caloriesRaw)}</span>
            </div>
             <div className="flex justify-between items-center gap-4">
               <span className="text-cyan-500 font-bold text-xs">Water</span>
               <span className="text-slate-900 dark:text-white font-bold text-xs">{d.waterRaw} ml</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      
      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Weekly Steps, Calories, Water */}
        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group shadow-sm dark:shadow-none">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Footprints className="w-10 h-10 text-slate-900 dark:text-white" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">Weekly Activity</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatK(totalWeeklySteps)}</p>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400">
                <Flame className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold">{formatK(totalWeeklyCalories)} kcal</span>
            </div>
            <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                <Droplets className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold">{(totalWeeklyWater / 1000).toFixed(1)} L</span>
            </div>
          </div>
        </div>

        {/* Best Day (Tasks) */}
        <div className="bg-gradient-to-br from-yellow-100 to-white dark:from-yellow-900/40 dark:to-slate-800 p-5 rounded-2xl border border-yellow-500/20 relative overflow-hidden shadow-sm dark:shadow-none group">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          <p className="text-yellow-600 dark:text-yellow-300 text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
            Best Day <Trophy className="w-3 h-3 text-yellow-500" />
          </p>
          {bestDay ? (
            <div>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{bestDay.completedCount}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">tasks on {new Date(bestDay.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</p>
            </div>
          ) : (
            <p className="text-xl font-bold text-slate-500 mt-2">-</p>
          )}
        </div>
        
        {/* Daily Average (Steps, Calories, Water) */}
        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden col-span-2 shadow-sm dark:shadow-none group">
           <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Footprints className="w-10 h-10 text-blue-500 dark:text-blue-400" />
           </div>
           <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">Daily Average</p>
           <div className="flex flex-wrap items-end gap-4 mt-2">
             <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{formatK(Math.round(avgSteps))}</span>
                <span className="text-sm text-slate-500">steps</span>
             </div>
             
             <div className="flex gap-2">
                <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                    <Flame className="w-3 h-3 fill-current" />
                    <span className="text-xs font-bold">{formatK(avgCalories)} kcal</span>
                </div>
                <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                    <Droplets className="w-3 h-3 fill-current" />
                    <span className="text-xs font-bold">{avgWater} ml</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Peak Performance Section (New) */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-900/80 dark:to-indigo-900/80 p-6 rounded-2xl shadow-lg relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-24 h-24" />
          </div>
          
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-4">
                 <Clock className="w-5 h-5 text-violet-200" />
                 <h3 className="text-sm font-bold uppercase tracking-wider text-violet-100">Peak Performance</h3>
             </div>

             <div className="flex items-end justify-between">
                 <div>
                     <p className="text-4xl font-black mb-1">
                         {totalTimedTasks > 0 ? `${formatHour(peakHour)}` : '--'}
                     </p>
                     <p className="text-sm text-violet-200 font-medium">
                         {totalTimedTasks > 0 ? `Most Active: ${getPersona(peakHour)}` : 'Not enough data'}
                     </p>
                 </div>
                 
                 {totalTimedTasks > 0 && (
                     <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                         <div className="flex items-center gap-2 mb-1">
                             <Moon className="w-3 h-3 text-violet-300" />
                             <span className="text-[10px] text-violet-200 uppercase tracking-wide">Quiet Time</span>
                         </div>
                         <p className="font-bold text-lg">{formatHour(quietHour)}</p>
                     </div>
                 )}
             </div>
             
             {totalTimedTasks > 0 && (
                 <div className="mt-4 pt-4 border-t border-white/10 flex gap-4 text-xs text-violet-200">
                    <p>Based on {totalTimedTasks} completed tasks</p>
                 </div>
             )}
          </div>
      </div>

      {/* Weekly Stats - Unified Chart */}
      <div className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
             <Check className="w-4 h-4 text-primary" /> Weekly Stats
           </h3>
        </div>
        
        <div className="h-64 w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#334155', opacity: 0.1}} />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} 
                  iconType="circle"
                />
                <Bar dataKey="tasks" name="Tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stepsK" name="Steps (k)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="caloriesK" name="Kcal (k)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="waterL" name="Water (L)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-500 text-xs">No data available</div>
          )}
        </div>
      </div>

      {/* Top Categories Chart - Redesigned as List */}
      <div className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
             <Layers className="w-4 h-4 text-blue-500" /> Top Categories
           </h3>
        </div>
        
        <div className="space-y-4">
            {categoryChartData.length > 0 ? (
                categoryChartData.map((item, index) => (
                  <div key={item.name} className="group">
                    <div className="flex justify-between mb-1.5 items-end">
                      <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-800" style={{ backgroundColor: COLORS[index % COLORS.length], '--tw-ring-color': COLORS[index % COLORS.length] } as any} />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500 font-medium">
                         {Math.round(item.value / totalTasksForCats * 100)}% ({item.value})
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110 relative"
                        style={{ width: `${(item.value / totalTasksForCats) * 100}%`, backgroundColor: COLORS[index % COLORS.length] }} 
                      >
                         <div className="absolute inset-0 bg-white/20" />
                      </div>
                    </div>
                  </div>
                ))
            ) : (
                <div className="py-10 text-center text-slate-500 text-xs">No category data yet</div>
            )}
        </div>
      </div>

      {/* Email Report Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/50 dark:to-slate-800 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg">
            <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold">Weekly Report</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Get your 7-day summary via email</p>
          </div>
        </div>
        
        <form onSubmit={handleSubscribe} className="flex gap-2">
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={subscribed}
            className="flex-1 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
            required
          />
          <button 
            type="submit"
            disabled={subscribed}
            className={`px-4 rounded-lg font-bold transition-all ${
              subscribed 
                ? 'bg-green-500 text-white' 
                : 'bg-indigo-500 hover:bg-indigo-400 text-white'
            }`}
          >
            {subscribed ? <Check className="w-5 h-5" /> : 'Send'}
          </button>
        </form>
        {subscribed && (
          <p className="text-green-600 dark:text-green-400 text-xs mt-2 animate-in fade-in">Report scheduled! check your inbox soon.</p>
        )}
      </div>

      {/* Upgrade to Pro Banner - New Addition */}
      <div className="mt-6 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 rounded-2xl p-6 text-white dark:text-slate-900 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 p-4 opacity-10">
             <Crown className="w-24 h-24 rotate-12" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-400 dark:text-yellow-600" fill="currentColor" />
                <span className="text-xs font-bold uppercase tracking-widest text-yellow-400 dark:text-yellow-600">Pro Feature</span>
            </div>
            <h3 className="text-xl font-bold mb-1">Unlock Advanced Analytics</h3>
            <p className="text-sm opacity-80 mb-4 max-w-[80%]">Get detailed insights, unlimited AI coaching, and cloud backup.</p>
            <button className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform">
                Upgrade Now
            </button>
        </div>
      </div>

    </div>
  );
};