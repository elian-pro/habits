
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Habit, HabitCategory, UserProgress } from './types';
import HabitCard from './components/HabitCard';
import HabitForm from './components/HabitForm';
import NotificationManager from './components/NotificationManager';
import Onboarding from './components/Onboarding';
import { Plus, BarChart3, LayoutDashboard, Calendar, Trophy, Star, Flame, Target, CheckCircle2, Circle, Award, Zap, TrendingUp, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('habitflow_habits');
    return saved ? JSON.parse(saved) : [];
  });

  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('habitflow_progress');
    return saved ? JSON.parse(saved) : { totalXP: 0, level: 1 };
  });
  
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(() => {
    return localStorage.getItem('habitflow_onboarding_done') === 'true';
  });

  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'stats'>('today');
  const [selectedAgendaDate, setSelectedAgendaDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const agendaScrollRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    localStorage.setItem('habitflow_habits', JSON.stringify(habits));
    localStorage.setItem('habitflow_progress', JSON.stringify(progress));
  }, [habits, progress]);

  useEffect(() => {
    const lastReset = localStorage.getItem('habitflow_last_reset');
    if (lastReset !== today) {
      setHabits(prev => prev.map(h => ({ ...h, completionsToday: 0 })));
      localStorage.setItem('habitflow_last_reset', today);
    }
  }, [today]);

  const calculateRewardXP = (streak: number) => {
    const multiplier = Math.floor(streak / 30) + 1;
    return 1 * multiplier;
  };

  const isHabitScheduledForDate = (habit: Habit, dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    if (habit.goalType === 'daily') return true;
    if (habit.goalType === 'weekly') return habit.reminders.some(r => r.dayOfWeek === dayOfWeek);
    if (habit.goalType === 'monthly') return habit.reminders.some(r => r.dayOfMonth === dayOfMonth);
    return false;
  };

  const toggleHabit = (id: string, dateOverride?: string) => {
    const targetDate = dateOverride || today;
    const isTodayAction = targetDate === today;
    
    const hIdx = habits.findIndex(h => h.id === id);
    if (hIdx === -1) return;

    const habit = habits[hIdx];
    const wasCompleted = habit.completedDates.includes(targetDate);
    const isMulti = habit.timesPerPeriod > 1 && habit.goalType === 'daily' && isTodayAction;
    
    let xpChange = 0;

    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        let newCompletionsToday = h.completionsToday;
        let newTotalCompletions = h.totalCompletions || 0;
        let newDates = [...h.completedDates];
        let newStreak = h.streak;
        let newMaxStreak = h.maxStreak || 0;
        let newHabitXP = h.habitXP || 0;
        let newMacro = h.macroGoal?.currentProgress || 0;

        if (isMulti) {
          if (newCompletionsToday >= h.timesPerPeriod) {
            // DESMARCAR (Ya estaba completado)
            newCompletionsToday = 0;
            newTotalCompletions = Math.max(0, newTotalCompletions - 1);
            newDates = newDates.filter(d => d !== targetDate);
            xpChange = -calculateRewardXP(newStreak);
            newStreak = Math.max(0, newStreak - 1);
            newHabitXP = Math.max(0, newHabitXP + xpChange);
            if (h.macroGoal) newMacro -= h.macroGoal.targetPerInstance;
          } else {
            newCompletionsToday += 1;
            if (newCompletionsToday === h.timesPerPeriod) {
              // MARCAR COMPLETADO
              newTotalCompletions += 1;
              newDates.push(targetDate);
              newStreak += 1;
              newMaxStreak = Math.max(newMaxStreak, newStreak);
              xpChange = calculateRewardXP(newStreak);
              newHabitXP += xpChange;
              if (h.macroGoal) newMacro += h.macroGoal.targetPerInstance;
            }
          }
        } else {
          if (wasCompleted) {
            // DESMARCAR
            newTotalCompletions = Math.max(0, newTotalCompletions - 1);
            newDates = newDates.filter(d => d !== targetDate);
            xpChange = -calculateRewardXP(newStreak);
            newStreak = Math.max(0, newStreak - 1);
            newHabitXP = Math.max(0, newHabitXP + xpChange);
            if (h.macroGoal) newMacro -= h.macroGoal.targetPerInstance;
          } else {
            // MARCAR
            newTotalCompletions += 1;
            newDates.push(targetDate);
            newStreak += 1;
            newMaxStreak = Math.max(newMaxStreak, newStreak);
            xpChange = calculateRewardXP(newStreak);
            newHabitXP += xpChange;
            if (h.macroGoal) newMacro += h.macroGoal.targetPerInstance;
          }
        }

        return { 
          ...h, 
          completionsToday: isTodayAction ? newCompletionsToday : h.completionsToday,
          totalCompletions: newTotalCompletions,
          habitXP: newHabitXP,
          completedDates: newDates,
          streak: newStreak,
          maxStreak: newMaxStreak,
          macroGoal: h.macroGoal ? { ...h.macroGoal, currentProgress: newMacro } : undefined
        };
      }
      return h;
    }));

    if (xpChange !== 0) {
      setProgress(prev => {
        const newXP = Math.max(0, prev.totalXP + xpChange);
        const newLevel = Math.floor(newXP / 50) + 1;
        if (newLevel > prev.level && xpChange > 0) setJustLeveledUp(true);
        return { totalXP: newXP, level: newLevel };
      });
      if (xpChange > 0) setTimeout(() => setJustLeveledUp(false), 2000);
    }
  };

  const habitsForToday = useMemo(() => {
    return habits
      .filter(h => isHabitScheduledForDate(h, today))
      .sort((a, b) => {
        const aDone = a.completedDates.includes(today);
        const bDone = b.completedDates.includes(today);
        return aDone === bDone ? 0 : aDone ? 1 : -1;
      });
  }, [habits, today]);

  const habitsForSelectedDate = useMemo(() => {
    return habits
      .filter(h => isHabitScheduledForDate(h, selectedAgendaDate))
      .sort((a, b) => {
        const aDone = a.completedDates.includes(selectedAgendaDate);
        const bDone = b.completedDates.includes(selectedAgendaDate);
        return aDone === bDone ? 0 : aDone ? 1 : -1;
      });
  }, [habits, selectedAgendaDate]);

  const agendaDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const getHabitLevel = (xp: number) => Math.floor((xp || 0) / 10) + 1;
  const getHabitLevelProgress = (xp: number) => ((xp || 0) % 10) * 10;

  return (
    <div className="min-h-screen pb-32 bg-slate-50 text-slate-900 overflow-x-hidden">
      <NotificationManager habits={habits} onToggleHabit={(id) => toggleHabit(id)} onSnoozeHabit={() => {}} />

      {/* GAMIFIED HEADER - GLOBAL XP */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-5">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`relative transition-transform duration-500 ${justLeveledUp ? 'scale-125' : ''}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ring-4 ring-indigo-50 transition-colors ${justLeveledUp ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                {justLeveledUp ? <Star size={24} fill="currentColor" /> : <Trophy size={22} />}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white">
                LVL {progress.level}
              </div>
            </div>
            <div className="flex-1 min-w-[120px]">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global XP</span>
                <span className="text-[10px] font-black text-indigo-600">{progress.totalXP % 50} / 50</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ease-out ${justLeveledUp ? 'bg-amber-400' : 'bg-indigo-500'}`}
                  style={{ width: `${(progress.totalXP % 50) / 50 * 100}%` }}
                />
              </div>
            </div>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 hover:bg-indigo-700">
            <Plus size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-6 space-y-8">
        
        {/* TODAY VIEW */}
        {activeTab === 'today' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Misiones de Hoy</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <div className="bg-indigo-50 px-3 py-1 rounded-full text-[10px] font-black text-indigo-600 uppercase">
                {habitsForToday.filter(h => h.completedDates.includes(today)).length}/{habitsForToday.length}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {habitsForToday.length === 0 ? (
                <div className="py-20 text-center space-y-4 opacity-50">
                  <Calendar size={48} className="mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">Sin misiones para hoy.</p>
                </div>
              ) : (
                habitsForToday.map(habit => (
                  <HabitCard 
                    key={habit.id} 
                    habit={habit} 
                    onToggle={() => toggleHabit(habit.id)} 
                    onDelete={(id) => setHabits(prev => prev.filter(h => h.id !== id))} 
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* AGENDA VIEW */}
        {activeTab === 'calendar' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agenda Táctica</h2>
            <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
                {agendaDates.map((dateStr) => {
                  const isSelected = selectedAgendaDate === dateStr;
                  const isDateToday = dateStr === today;
                  const d = new Date(dateStr + 'T12:00:00');
                  return (
                    <button key={dateStr} onClick={() => setSelectedAgendaDate(dateStr)} className={`flex-shrink-0 w-14 py-4 rounded-2xl border transition-all flex flex-col items-center gap-1.5 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-110' : isDateToday ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                      <span className="text-[8px] font-black uppercase tracking-tighter">{d.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                      <span className="text-base font-black">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              {habitsForSelectedDate.length > 0 ? (
                habitsForSelectedDate.map(h => {
                  const isDone = h.completedDates.includes(selectedAgendaDate);
                  return (
                    <div key={h.id} className={`p-4 rounded-[24px] border transition-all ${isDone ? 'bg-emerald-50 border-emerald-100 opacity-70' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleHabit(h.id, selectedAgendaDate)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDone ? 'bg-white text-emerald-500 shadow-sm' : 'bg-slate-50 text-slate-300 hover:text-indigo-600'}`}>
                          {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-black truncate ${isDone ? 'text-emerald-700 line-through' : 'text-slate-900'}`}>{h.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{h.category}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-10 text-slate-300 text-xs font-bold uppercase tracking-widest">Día libre de misiones</p>
              )}
            </div>
          </div>
        )}

        {/* DATA / STATS VIEW */}
        {activeTab === 'stats' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Data Center</h2>
            
            {/* Global Stats Dashboard */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-2">
                  <Award size={20} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Misiones Activas</p>
                <p className="text-3xl font-black text-slate-900">{habits.length}</p>
              </div>
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-2">
                  <Flame size={20} fill="currentColor" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Racha de Poder</p>
                <p className="text-3xl font-black text-slate-900">{Math.max(0, ...habits.map(h => h.streak))}d</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" /> Consistencia Global
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                 <div className="text-center p-3 bg-slate-50 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Checks Totales</p>
                    <p className="text-lg font-black text-slate-900">{habits.reduce((acc, h) => acc + (h.totalCompletions || 0), 0)}</p>
                 </div>
                 <div className="text-center p-3 bg-slate-50 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Récord Hist.</p>
                    <p className="text-lg font-black text-slate-900">{Math.max(0, ...habits.map(h => h.maxStreak || 0))}d</p>
                 </div>
                 <div className="text-center p-3 bg-slate-50 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase">LVL Global</p>
                    <p className="text-lg font-black text-indigo-600">{progress.level}</p>
                 </div>
              </div>
            </div>

            {/* Individual Habit Mastery List */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" /> Maestría de Habilidades
              </h3>
              <div className="space-y-4">
                {habits.map(h => {
                  const hLevel = getHabitLevel(h.habitXP || 0);
                  const hProgress = getHabitLevelProgress(h.habitXP || 0);
                  return (
                    <div key={h.id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4 hover:border-indigo-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black shadow-sm ${hLevel >= 10 ? 'bg-amber-500 text-white' : 'bg-slate-50 text-indigo-600 border border-indigo-50'}`}>
                            <span className="text-[8px] uppercase leading-none mb-0.5 opacity-60">Lvl</span>
                            <span className="text-xl leading-none">{hLevel}</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-900 truncate">{h.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-orange-100">
                                <Flame size={8} fill="currentColor" /> {h.streak}d
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                Récord: {h.maxStreak || 0}d
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[11px] font-black text-indigo-600">{h.habitXP || 0} XP</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Maestría</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                          <span>Nivel {hLevel}</span>
                          <span>{hProgress}%</span>
                          <span>Nivel {hLevel + 1}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 transition-all duration-700 ease-out" style={{ width: `${hProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-6 left-6 right-6 bg-white/95 backdrop-blur-xl border border-slate-200 px-6 py-3 flex justify-around items-center z-50 rounded-[32px] shadow-2xl">
        <button onClick={() => setActiveTab('today')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'today' ? 'text-indigo-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
          <LayoutDashboard size={24} strokeWidth={activeTab === 'today' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Hoy</span>
        </button>
        <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'calendar' ? 'text-indigo-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
          <Calendar size={24} strokeWidth={activeTab === 'calendar' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Agenda</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? 'text-indigo-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
          <BarChart3 size={24} strokeWidth={activeTab === 'stats' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Data</span>
        </button>
      </nav>

      {/* MODALS */}
      {isFormOpen && <HabitForm onAdd={(h) => {
        const newHabit: Habit = {
          id: crypto.randomUUID(),
          name: h.name || '',
          category: h.category || HabitCategory.OTHER,
          goalType: h.goalType || 'daily',
          timesPerPeriod: h.timesPerPeriod || 1,
          reminders: h.reminders || [],
          streak: 0,
          maxStreak: 0,
          totalCompletions: 0,
          habitXP: 0,
          macroGoal: h.macroGoal,
          completedDates: [],
          completionsToday: 0,
          createdAt: new Date().toISOString()
        };
        setHabits(prev => [...prev, newHabit]);
        setIsFormOpen(false);
      }} onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};

export default App;
