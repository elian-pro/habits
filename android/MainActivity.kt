
package com.habitflow

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.habitflow.models.Habit
import com.habitflow.viewmodel.HabitViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HabitFlowTheme {
                MainScreen()
            }
        }
    }
}

@Composable
fun MainScreen(viewModel: HabitViewModel = HabitViewModel()) {
    val habits by viewModel.habits.collectAsState()
    val progress by viewModel.progress.collectAsState()

    Scaffold(
        topBar = { GlobalHeader(progress) },
        bottomBar = { BottomNavigationBar() }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color(0xFFF8FAFC)),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text(
                    "Misiones de Hoy",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF0F172A)
                )
            }
            items(habits) { habit ->
                HabitItem(habit, onToggle = { viewModel.toggleHabit(habit.id) })
            }
        }
    }
}

@Composable
fun GlobalHeader(progress: com.habitflow.models.UserProgress) {
    Surface(
        shadowElevation = 4.dp,
        color = Color.White
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(Color(0xFF4F46E5), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text("LVL ${progress.level}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                    Text("XP GLOBAL", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.LightGray)
                    Text("${progress.totalXP % 50}/50", fontSize = 10.sp, color = Color(0xFF4F46E5), fontWeight = FontWeight.Bold)
                }
                LinearProgressIndicator(
                    progress = (progress.totalXP % 50) / 50f,
                    modifier = Modifier.fillMaxWidth().height(8.dp).padding(top = 4.dp),
                    color = Color(0xFF4F46E5),
                    trackColor = Color(0xFFF1F5F9)
                )
            }
        }
    }
}

@Composable
fun HabitItem(habit: Habit, onToggle: () -> Unit) {
    val isCompleted = habit.completedDates.contains(java.time.LocalDate.now().toString())
    val habitLevel = (habit.habitXP / 10) + 1
    val habitProgress = (habit.habitXP % 10) / 10f

    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = if (isCompleted) Color(0xFFF1F5F9) else Color.White),
        modifier = Modifier.fillMaxWidth(),
        onClick = onToggle
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = isCompleted, onCheckedChange = { onToggle() })
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = habit.name,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (isCompleted) Color.Gray else Color.Black,
                        textDecoration = if (isCompleted) androidx.compose.ui.text.style.TextDecoration.LineThrough else null
                    )
                    Text(habit.category.displayName, fontSize = 10.sp, color = Color.Gray)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Maestría Lvl $habitLevel", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF4F46E5))
                    Spacer(modifier = Modifier.height(4.dp))
                    LinearProgressIndicator(
                        progress = habitProgress,
                        modifier = Modifier.width(60.dp).height(4.dp),
                        color = Color(0xFF4F46E5)
                    )
                }
            }
        }
    }
}

@Composable
fun HabitFlowTheme(content: @Composable () -> Unit) {
    MaterialTheme(content = content)
}

@Composable
fun BottomNavigationBar() {
    NavigationBar(containerColor = Color.White) {
        NavigationBarItem(selected = true, onClick = {}, icon = { Text("Hoy") }, label = { Text("Hoy") })
        NavigationBarItem(selected = false, onClick = {}, icon = { Text("Data") }, label = { Text("Data") })
    }
}
