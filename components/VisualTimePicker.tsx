import React, { useState, useEffect, useRef } from 'react';

interface VisualTimePickerProps {
  initialTime?: string;
  onTimeSelect: (time: string) => void;
  onClose: () => void;
}

export const VisualTimePicker: React.FC<VisualTimePickerProps> = ({ initialTime, onTimeSelect, onClose }) => {
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);
  const [isPm, setIsPm] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (initialTime) {
      const [h, m] = initialTime.split(':').map(Number);
      setHours(h % 12 || 12);
      setMinutes(m);
      setIsPm(h >= 12);
    }
  }, [initialTime]);

  const handlePointer = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, isEnd = false) => {
    if (!clockRef.current) return;
    
    const rect = clockRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === 'hours') {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      setHours(h);
      if (isEnd) setMode('minutes');
    } else {
      let m = Math.round(angle / 6);
      if (m === 60) m = 0;
      setMinutes(m);
    }
  };

  const handleDone = () => {
    let finalHour = hours;
    if (isPm && hours !== 12) finalHour += 12;
    if (!isPm && hours === 12) finalHour = 0;
    
    const timeStr = `${finalHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onTimeSelect(timeStr);
  };

  const calculateHandAngle = () => {
    if (mode === 'hours') {
      return (hours % 12) * 30;
    } else {
      return minutes * 6;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
        {/* Header Display */}
        <div className="bg-slate-100 dark:bg-slate-900 p-6 flex justify-between items-center">
           <div className="flex items-baseline gap-1 text-5xl font-bold text-slate-800 dark:text-white">
             <button 
               onClick={() => setMode('hours')}
               className={`${mode === 'hours' ? 'text-primary' : 'opacity-50'}`}
             >
               {hours.toString().padStart(2, '0')}
             </button>
             <span className="opacity-50">:</span>
             <button 
               onClick={() => setMode('minutes')}
               className={`${mode === 'minutes' ? 'text-primary' : 'opacity-50'}`}
             >
               {minutes.toString().padStart(2, '0')}
             </button>
           </div>
           <div className="flex flex-col gap-2">
             <button 
               onClick={() => setIsPm(false)}
               className={`px-3 py-1 rounded font-bold text-xs ${!isPm ? 'bg-primary text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
             >
               AM
             </button>
             <button 
               onClick={() => setIsPm(true)}
               className={`px-3 py-1 rounded font-bold text-xs ${isPm ? 'bg-primary text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
             >
               PM
             </button>
           </div>
        </div>

        {/* Clock Face */}
        <div className="p-8 flex justify-center">
           <div 
             ref={clockRef}
             className="w-64 h-64 rounded-full bg-slate-100 dark:bg-slate-700 relative touch-none select-none cursor-pointer"
             onMouseDown={(e) => { setIsDragging(true); handlePointer(e); }}
             onMouseMove={(e) => { if (isDragging) handlePointer(e); }}
             onMouseUp={(e) => { setIsDragging(false); handlePointer(e, true); }}
             onTouchStart={(e) => { setIsDragging(true); handlePointer(e); }}
             onTouchMove={(e) => { if (isDragging) handlePointer(e); }}
             onTouchEnd={(e) => { setIsDragging(false); handlePointer(e, true); }}
           >
             {/* Center Dot */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full z-20"></div>
             
             {/* Hand */}
             <div 
               className="absolute top-1/2 left-1/2 h-1/2 w-[2px] bg-primary origin-bottom z-10 pointer-events-none transition-transform duration-75 ease-out"
               style={{ 
                 transform: `translate(-50%, -100%) rotate(${calculateHandAngle()}deg)`,
                 height: '40%' 
                }}
             >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary/30 rounded-full -mt-4 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
             </div>

             {/* Numbers */}
             {mode === 'hours' && [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h, i) => {
               const angle = (i * 30 - 90) * (Math.PI / 180);
               const r = 40; // percentage
               const x = 50 + r * Math.cos(angle);
               const y = 50 + r * Math.sin(angle);
               return (
                 <div 
                   key={h}
                   className={`absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${hours === h ? 'bg-primary text-slate-900' : 'text-slate-500 dark:text-slate-300'}`}
                   style={{ left: `${x}%`, top: `${y}%` }}
                 >
                   {h}
                 </div>
               );
             })}

             {mode === 'minutes' && [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m, i) => {
               const angle = (i * 30 - 90) * (Math.PI / 180);
               const r = 40; // percentage
               const x = 50 + r * Math.cos(angle);
               const y = 50 + r * Math.sin(angle);
               return (
                 <div 
                   key={m}
                   className={`absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${minutes === m ? 'bg-primary text-slate-900' : 'text-slate-500 dark:text-slate-300'}`}
                   style={{ left: `${x}%`, top: `${y}%` }}
                 >
                   {m}
                 </div>
               );
             })}
           </div>
        </div>

        {/* Actions */}
        <div className="p-4 flex justify-end gap-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-white px-4 py-2 text-sm font-bold">Cancel</button>
          <button onClick={handleDone} className="bg-primary text-slate-900 px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-400">OK</button>
        </div>
      </div>
    </div>
  );
};
