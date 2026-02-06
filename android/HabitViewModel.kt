
package com.habitflow.viewmodel

import androidx.lifecycle.ViewModel
import com.habitflow.models.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.time.LocalDate

class HabitViewModel : ViewModel() {
    private val _habits = MutableStateFlow<List<Habit>>(emptyList())
    val habits: StateFlow<List<Habit>> = _habits.asStateFlow()

    private val _progress = MutableStateFlow(UserProgress())
    val progress: StateFlow<UserProgress> = _progress.asStateFlow()

    private fun calculateRewardXP(streak: Int): Int {
        val multiplier = (streak / 30) + 1
        return 1 * multiplier
    }

    fun toggleHabit(habitId: String) {
        val today = LocalDate.now().toString()
        val currentHabits = _habits.value.toMutableList()
        val index = currentHabits.indexOfFirst { it.id == habitId }

        if (index != -1) {
            val habit = currentHabits[index]
            val wasCompleted = habit.completedDates.contains(today)
            
            var xpChange = 0
            val updatedHabit = if (wasCompleted) {
                // Desmarcar
                xpChange = -calculateRewardXP(habit.streak)
                habit.copy(
                    completedDates = habit.completedDates - today,
                    totalCompletions = (habit.totalCompletions - 1).coerceAtLeast(0),
                    streak = (habit.streak - 1).coerceAtLeast(0),
                    habitXP = (habit.habitXP + xpChange).coerceAtLeast(0)
                )
            } else {
                // Marcar
                val newStreak = habit.streak + 1
                xpChange = calculateRewardXP(newStreak)
                habit.copy(
                    completedDates = habit.completedDates + today,
                    totalCompletions = habit.totalCompletions + 1,
                    streak = newStreak,
                    maxStreak = maxOf(habit.maxStreak, newStreak),
                    habitXP = habit.habitXP + xpChange
                )
            }

            currentHabits[index] = updatedHabit
            _habits.value = currentHabits

            // Actualizar Progreso Global
            val newTotalXP = (_progress.value.totalXP + xpChange).coerceAtLeast(0)
            val newLevel = (newTotalXP / 50) + 1
            _progress.value = UserProgress(newTotalXP, newLevel)
        }
    }
}
