
import React from 'react';
import { Habit, HabitCategory } from '../types';
import { CheckCircle, Circle, Trash2, Flame, Clock, Target, Star } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggle, onDelete }) => {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeekNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const isMultiFrequency = habit.timesPerPeriod > 1 && habit.goalType === 'daily';
  const isCompletedToday = isMultiFrequency 
    ? habit.completionsToday >= habit.timesPerPeriod
    : habit.completedDates.includes(today);

  // Gamification: XP logic
  const multiplier = Math.floor(habit.streak / 30) + 1;
  const xpReward = 1 * multiplier;

  const getCategoryColor = (category: HabitCategory) => {
    switch (category) {
      case HabitCategory.HEALTH: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case HabitCategory.PRODUCTIVITY: return 'bg-blue-50 text-blue-600 border-blue-100';
      case HabitCategory.MINDFULNESS: return 'bg-purple-50 text-purple-600 border-purple-100';
      case HabitCategory.LEARNING: return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getScheduleSummary = () => {
    if (!habit.reminders || habit.reminders.length === 0) return 'Sin horario';
    switch (habit.goalType) {
      case 'weekly': return Array.from(new Set(habit.reminders.map(r => dayOfWeekNames[r.dayOfWeek ?? 0]))).join(', ');
      case 'monthly': return `Día ${habit.reminders.map(r => r.dayOfMonth).join(', ')}`;
      default: return habit.timesPerPeriod > 1 ? `${habit.timesPerPeriod} veces hoy` : 'Cada día';
    }
  };

  const macroProgressPercent = habit.macroGoal 
    ? Math.min(100, Math.round((habit.macroGoal.currentProgress / habit.macroGoal.totalTarget) * 100))
    : 0;

  return (
    <div className={`group p-5 rounded-[32px] border transition-all duration-300 active:scale-[0.98] ${isCompletedToday ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-sm hover:shadow-lg'}`}>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onToggle(habit.id)}
          className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isCompletedToday ? 'text-emerald-500 bg-emerald-50' : 'text-indigo-200 bg-slate-50 group-hover:text-indigo-400'}`}
        >
          {isCompletedToday ? <CheckCircle size={32} strokeWidth={2.5} /> : <Circle size={32} strokeWidth={2.5} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getCategoryColor(habit.category)}`}>
              {habit.category}
            </span>
            <span className={`flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full border ${multiplier > 1 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
              <Star size={8} fill={multiplier > 1 ? "currentColor" : "none"} /> +{xpReward} XP
            </span>
            {habit.streak > 0 && (
              <span className="flex items-center gap-1 text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                <Flame size={9} fill="currentColor" /> {habit.streak}
              </span>
            )}
          </div>
          <h3 className={`text-base font-black truncate leading-tight ${isCompletedToday ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            {habit.name}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5 uppercase tracking-tighter">
            <Clock size={12} className="text-slate-300" /> {getScheduleSummary()}
          </p>
        </div>

        <button 
          onClick={() => onDelete(habit.id)}
          className="p-3 text-slate-200 hover:text-red-400 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {habit.macroGoal && (
        <div className="mt-4 pt-4 border-t border-slate-50">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            <div className="flex items-center gap-1.5"><Target size={12} className="text-indigo-400" /> Progreso Plan</div>
            <span className="text-indigo-600">{habit.macroGoal.currentProgress} / {habit.macroGoal.totalTarget} {habit.macroGoal.unit}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-1000"
              style={{ width: `${macroProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      {isMultiFrequency && !isCompletedToday && !habit.macroGoal && (
        <div className="mt-4 flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl">
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${(habit.completionsToday / habit.timesPerPeriod) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-black text-indigo-600">{habit.completionsToday}/{habit.timesPerPeriod}</span>
        </div>
      )}
    </div>
  );
};

export default HabitCard;
