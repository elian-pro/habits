
export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: HabitCategory;
  goalType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  timesPerPeriod: number;
  completedDates: string[]; // Store as "YYYY-MM-DD"
  completionsToday: number;
  totalCompletions: number; // Count of completions
  habitXP: number; // Individual experience pool
  reminders: ReminderConfig[];
  createdAt: string;
  streak: number;
  maxStreak: number; // Historical record
  lastNotified?: string;
  snoozedUntil?: number;
  macroGoal?: {
    totalTarget: number;
    currentProgress: number;
    unit: string;
    targetPerInstance: number;
  };
}

export interface UserProgress {
  totalXP: number;
  level: number;
}

export interface ReminderConfig {
  time: string; // HH:mm
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  specificDate?: string; // MM-DD
  reminderMinutesBefore: number;
}

export enum HabitCategory {
  HEALTH = 'Salud',
  PRODUCTIVITY = 'Productividad',
  MINDFULNESS = 'Bienestar',
  LEARNING = 'Aprendizaje',
  OTHER = 'Otro'
}

export interface PushNotification {
  id: string;
  habitId: string;
  title: string;
  body: string;
  timestamp: number;
}
