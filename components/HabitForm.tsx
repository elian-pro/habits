
import React, { useState, useEffect } from 'react';
import { HabitCategory, Habit, ReminderConfig } from '../types';
import { Plus, X, Clock, Bell, Info, Target, Calculator, ChevronRight, CalendarDays } from 'lucide-react';

interface HabitFormProps {
  onAdd: (habit: Partial<Habit>) => void;
  onClose: () => void;
}

const HabitForm: React.FC<HabitFormProps> = ({ onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HabitCategory>(HabitCategory.PRODUCTIVITY);
  const [goalType, setGoalType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [timesPerPeriod, setTimesPerPeriod] = useState(1);
  const [reminders, setReminders] = useState<ReminderConfig[]>([{ time: '09:00', reminderMinutesBefore: 15 }]);

  // Macro Plan State
  const [isMacroPlan, setIsMacroPlan] = useState(false);
  const [macroTotal, setMacroTotal] = useState(300);
  const [macroUnit, setMacroUnit] = useState('páginas');
  const [macroSessions, setMacroSessions] = useState(100);
  const [calculatedPerInstance, setCalculatedPerInstance] = useState(0);

  useEffect(() => {
    if (isMacroPlan) {
      const perInstance = Math.ceil(macroTotal / macroSessions);
      setCalculatedPerInstance(perInstance);
    }
  }, [isMacroPlan, macroTotal, macroSessions]);

  useEffect(() => {
    const currentCount = reminders.length;
    if (timesPerPeriod > currentCount) {
      const extra = Array(timesPerPeriod - currentCount).fill(null).map((_, i) => ({
        time: `${Math.min(23, 9 + currentCount + i).toString().padStart(2, '0')}:00`,
        dayOfWeek: goalType === 'weekly' ? (currentCount + i) % 7 : undefined,
        dayOfMonth: goalType === 'monthly' ? 1 : undefined,
        specificDate: goalType === 'yearly' ? '01-01' : undefined,
        reminderMinutesBefore: 15
      }));
      setReminders([...reminders, ...extra]);
    } else if (timesPerPeriod < currentCount) {
      setReminders(reminders.slice(0, timesPerPeriod));
    }
  }, [timesPerPeriod, goalType]);

  const updateReminder = (index: number, updates: Partial<ReminderConfig>) => {
    const newReminders = [...reminders];
    newReminders[index] = { ...newReminders[index], ...updates };
    setReminders(newReminders);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd({
        name: isMacroPlan ? `${name}: ${calculatedPerInstance} ${macroUnit}` : name,
        category,
        goalType,
        timesPerPeriod,
        reminders,
        macroGoal: isMacroPlan ? {
          totalTarget: macroTotal,
          currentProgress: 0,
          unit: macroUnit,
          targetPerInstance: calculatedPerInstance
        } : undefined
      });
    }
  };

  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden my-auto border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Nuevo Hábito</h2>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">Configuración Avanzada</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Macro Plan Toggle */}
          <button 
            type="button"
            onClick={() => setIsMacroPlan(!isMacroPlan)}
            className={`w-full p-4 rounded-3xl border-2 transition-all flex items-center justify-between group ${isMacroPlan ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isMacroPlan ? 'bg-amber-500 text-white' : 'bg-white text-slate-400'}`}>
                <Calculator size={20} />
              </div>
              <div className="text-left">
                <p className={`text-xs font-black uppercase tracking-tight ${isMacroPlan ? 'text-amber-700' : 'text-slate-500'}`}>¿Es un Plan Maestro?</p>
                <p className="text-[10px] font-bold text-slate-400">Divide metas grandes en sesiones manejables</p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isMacroPlan ? 'bg-amber-500' : 'bg-slate-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isMacroPlan ? 'translate-x-4' : ''}`} />
            </div>
          </button>

          {isMacroPlan && (
            <div className="space-y-4 p-5 bg-amber-50/50 rounded-[32px] border border-amber-100 animate-in zoom-in-95 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-amber-700 uppercase ml-1">Meta Total</label>
                  <input 
                    type="number" 
                    value={macroTotal} 
                    onChange={(e) => setMacroTotal(Number(e.target.value))}
                    className="w-full bg-white p-3 rounded-2xl border border-amber-200 font-black text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-amber-700 uppercase ml-1">Unidad</label>
                  <input 
                    type="text" 
                    value={macroUnit} 
                    onChange={(e) => setMacroUnit(e.target.value)}
                    placeholder="páginas, km..."
                    className="w-full bg-white p-3 rounded-2xl border border-amber-200 font-black text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-amber-700 uppercase ml-1">Número Total de Sesiones</label>
                <input 
                  type="number" 
                  value={macroSessions} 
                  onChange={(e) => setMacroSessions(Number(e.target.value))}
                  className="w-full bg-white p-3 rounded-2xl border border-amber-200 font-black text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <p className="text-[9px] font-bold text-amber-600/70 italic mt-1 ml-1">Ejemplo: 100 sesiones para terminar el libro.</p>
              </div>
              <div className="bg-amber-100/50 p-4 rounded-2xl flex items-center justify-between border border-amber-200">
                <span className="text-xs font-bold text-amber-800 tracking-tight">Carga por sesión:</span>
                <span className="text-lg font-black text-amber-600">{calculatedPerInstance} {macroUnit}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 ml-1">¿Cómo se llama este hábito?</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isMacroPlan ? "Ej. Leer 'El Quijote'" : "Ej. Beber agua, Gimnasio..."}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-lg text-slate-900 placeholder:text-slate-400 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-800 ml-1">Categoría</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HabitCategory)}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.values(HabitCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-800 ml-1">Recurrencia</label>
                <select 
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as any)}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="daily">Diaria</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Frecuencia ({goalType === 'daily' ? 'Veces al día' : goalType === 'weekly' ? 'Veces a la semana' : 'Veces al mes'})</span>
              <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-indigo-100 shadow-sm">
                <button type="button" onClick={() => setTimesPerPeriod(Math.max(1, timesPerPeriod - 1))} className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center font-bold text-slate-700">-</button>
                <span className="w-6 text-center font-black text-indigo-600">{timesPerPeriod}</span>
                <button type="button" onClick={() => setTimesPerPeriod(Math.min(31, timesPerPeriod + 1))} className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center font-bold text-slate-700">+</button>
              </div>
            </div>
            {isMacroPlan && (
              <p className="text-[9px] font-bold text-slate-400 italic">
                A esta velocidad, completarás tus {macroSessions} sesiones en aproximadamente {Math.ceil(macroSessions / timesPerPeriod)} {goalType === 'daily' ? 'días' : goalType === 'weekly' ? 'semanas' : 'meses'}.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Clock size={16} className="text-indigo-500" /> Configuración de Avisos
            </h3>
            
            <div className="space-y-3">
              {reminders.map((rem, index) => (
                <div key={index} className="p-4 bg-white rounded-[24px] border border-slate-200 shadow-sm space-y-4 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 text-[10px] font-black">
                        {index + 1}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Horario de aviso</span>
                    </div>
                    <input 
                      type="time" 
                      value={rem.time}
                      onChange={(e) => updateReminder(index, { time: e.target.value })}
                      className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {goalType === 'weekly' && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">¿Qué día?</label>
                      <div className="flex justify-between gap-1 overflow-x-auto pb-1 no-scrollbar">
                        {dayLabels.map((label, dayIdx) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => updateReminder(index, { dayOfWeek: dayIdx })}
                            className={`flex-1 min-w-[38px] py-2 rounded-xl font-bold text-[10px] transition-all ${rem.dayOfWeek === dayIdx ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {goalType === 'monthly' && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Día del mes</label>
                      <select 
                        value={rem.dayOfMonth}
                        onChange={(e) => updateReminder(index, { dayOfMonth: Number(e.target.value) })}
                        className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>Día {d}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className={`w-full py-5 rounded-[24px] font-black text-lg transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 ${isMacroPlan ? 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600 active:scale-95' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-95'}`}
          >
            {isMacroPlan ? 'Lanzar Plan Maestro' : 'Activar Hábito'} <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default HabitForm;
