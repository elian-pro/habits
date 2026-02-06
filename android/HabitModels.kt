
package com.habitflow.models

import java.util.*

enum class HabitCategory(val displayName: String) {
    HEALTH("Salud"),
    PRODUCTIVITY("Productividad"),
    MINDFULNESS("Bienestar"),
    LEARNING("Aprendizaje"),
    OTHER("Otro")
}

data class Habit(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val category: HabitCategory,
    val goalType: String = "daily",
    val timesPerPeriod: Int = 1,
    val completedDates: Set<String> = emptySet(),
    val completionsToday: Int = 0,
    val totalCompletions: Int = 0,
    val habitXP: Int = 0,
    val streak: Int = 0,
    val maxStreak: Int = 0,
    val createdAt: Long = System.currentTimeMillis()
)

data class UserProgress(
    val totalXP: Int = 0,
    val level: Int = 1
)
