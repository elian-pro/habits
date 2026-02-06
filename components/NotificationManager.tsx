
import React, { useState, useEffect, useCallback } from 'react';
import { Habit, PushNotification } from '../types';
import { Bell, Check, Clock, X } from 'lucide-react';

interface NotificationManagerProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onSnoozeHabit: (id: string) => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ habits, onToggleHabit, onSnoozeHabit }) => {
  const [activeNotification, setActiveNotification] = useState<PushNotification | null>(null);

  const checkSchedules = useCallback(() => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    const currentDay = now.getDay();
    const currentDayOfMonth = now.getDate();
    const currentMonthDay = `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    habits.forEach(habit => {
      // Don't notify if already completed today (unless it's multi-frequency and not yet finished)
      const isCompleted = habit.goalType === 'daily' 
        ? (habit.timesPerPeriod > 1 ? habit.completionsToday >= habit.timesPerPeriod : habit.completedDates.includes(todayStr))
        : habit.completedDates.includes(todayStr);

      if (isCompleted) return;

      // Check snooze
      if (habit.snoozedUntil && Date.now() < habit.snoozedUntil) return;

      habit.reminders.forEach(reminder => {
        let shouldNotify = false;

        // Logic based on goal type
        if (habit.goalType === 'daily' && reminder.time === currentTime) shouldNotify = true;
        if (habit.goalType === 'weekly' && reminder.dayOfWeek === currentDay && reminder.time === currentTime) shouldNotify = true;
        if (habit.goalType === 'monthly' && reminder.dayOfMonth === currentDayOfMonth && reminder.time === currentTime) shouldNotify = true;
        if (habit.goalType === 'yearly' && reminder.specificDate === currentMonthDay && reminder.time === currentTime) shouldNotify = true;

        if (shouldNotify && habit.lastNotified !== `${todayStr}-${reminder.time}`) {
          // Trigger Notification
          const notification: PushNotification = {
            id: crypto.randomUUID(),
            habitId: habit.id,
            title: `¡Es hora de ${habit.name}!`,
            body: `Tienes programado esto para las ${reminder.time}.`,
            timestamp: Date.now()
          };

          setActiveNotification(notification);
          
          // Browser native notification
          if (Notification.permission === 'granted') {
            new Notification(notification.title, { body: notification.body, icon: '/favicon.ico' });
          }

          // Mark as notified so we don't spam during the same minute
          habit.lastNotified = `${todayStr}-${reminder.time}`;
        }
      });
    });
  }, [habits]);

  useEffect(() => {
    // Request notification permission on mount
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(checkSchedules, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [checkSchedules]);

  if (!activeNotification) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] animate-in slide-in-from-top-full duration-500 ease-out">
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-[24px] p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Bell size={20} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm leading-tight">{activeNotification.title}</h4>
              <p className="text-[11px] text-slate-500 font-medium">{activeNotification.body}</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveNotification(null)}
            className="p-1 text-slate-300 hover:text-slate-500"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => {
              onToggleHabit(activeNotification.habitId);
              setActiveNotification(null);
            }}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
          >
            <Check size={14} strokeWidth={3} /> Hecho
          </button>
          <button 
            onClick={() => {
              onSnoozeHabit(activeNotification.habitId);
              setActiveNotification(null);
            }}
            className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <Clock size={14} strokeWidth={3} /> Más tarde
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;
