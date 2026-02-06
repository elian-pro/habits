
import React, { useState } from 'react';
import { HabitCategory, Habit } from '../types';
// Fixed error: Added 'Plus' to the lucide-react imports to resolve 'Cannot find name Plus'
import { ArrowRight, Check, Sparkles, Trophy, Zap, Target, Plus } from 'lucide-react';
import HabitForm from './HabitForm';

interface OnboardingProps {
  onComplete: (initialHabits: Habit[]) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customHabits, setCustomHabits] = useState<Habit[]>([]);

  const handleAddCustom = (habitData: Partial<Habit>) => {
    // Fixed: Added missing properties totalCompletions, maxStreak, and habitXP to satisfy Habit interface
    // Also added macroGoal to ensure planned metadata is preserved
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: habitData.name || '',
      category: habitData.category || HabitCategory.OTHER,
      goalType: habitData.goalType || 'daily',
      timesPerPeriod: habitData.timesPerPeriod || 1,
      reminders: habitData.reminders || [],
      streak: 0,
      totalCompletions: 0,
      maxStreak: 0,
      habitXP: 0,
      macroGoal: habitData.macroGoal,
      completedDates: [],
      completionsToday: 0,
      createdAt: new Date().toISOString()
    };
    setCustomHabits([...customHabits, newHabit]);
    setShowCustomForm(false);
  };

  const finish = () => {
    onComplete(customHabits);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-xl space-y-8 py-10">
        
        {step === 1 && (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-200">
              <Trophy size={40} />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Bienvenido a HabitFlow</h1>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-center">
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                Sube de nivel completando tus metas diarias. <br/>
                <strong className="text-indigo-600 text-3xl block mt-2 font-black italic">GAMIFICA TU VIDA.</strong>
              </p>
              <p className="text-sm text-slate-500 font-medium">
                Gana XP, mantén tus rachas y desbloquea multiplicadores por constancia mensual.
              </p>
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Comenzar Mi Viaje <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-3xl font-black text-slate-800">Crea tu Primer Hábito</h2>
            <p className="text-slate-500 font-medium italic">"Un viaje de mil millas comienza con un solo paso."</p>
            
            <div className="space-y-4">
              {customHabits.map((h, i) => (
                <div key={i} className="p-4 bg-white border-2 border-indigo-600 rounded-2xl flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-slate-900">{h.name}</h4>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase">{h.category}</p>
                  </div>
                  <Check className="text-indigo-600" />
                </div>
              ))}

              <button 
                onClick={() => setShowCustomForm(true)}
                className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-black hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Añadir Misión
              </button>
            </div>

            <button 
              disabled={customHabits.length === 0}
              onClick={finish}
              className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50"
            >
              Empezar Partida
            </button>
          </div>
        )}

        {showCustomForm && (
          <HabitForm onAdd={handleAddCustom} onClose={() => setShowCustomForm(false)} />
        )}
      </div>
    </div>
  );
};

export default Onboarding;
