package com.centralpay.agent.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val BackgroundColor = Color(0xFF07090D)
val CardColor = Color(0xFF10141B)
val PrimaryColor = Color(0xFF55B510)
val AccentColor = Color(0xFF00D9FF)
val TextColor = Color(0xFFFFFFFF)
val MutedColor = Color(0xFF8B93A1)

@Composable
fun AgentHomeScreen(
    deviceId: String,
    unsyncedCount: Int,
    onSyncNow: () -> Unit
) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            background = BackgroundColor,
            surface = CardColor,
            primary = PrimaryColor,
            secondary = AccentColor
        )
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = BackgroundColor
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "CENTRALPAY AGENT",
                            color = TextColor,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            color = PrimaryColor,
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = "ACTIVE",
                                color = BackgroundColor,
                                fontWeight = FontWeight.Black,
                                fontSize = 10.sp,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                // Device Identity Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardColor),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(text = "Paired Device Identity", color = MutedColor, fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = deviceId,
                            color = AccentColor,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }

                // Sync Queue Status Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardColor),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(text = "Pending Offline Queue", color = MutedColor, fontSize = 12.sp)
                                Text(
                                    text = "$unsyncedCount Events",
                                    color = if (unsyncedCount > 0) AccentColor else PrimaryColor,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 20.sp
                                )
                            }
                            Button(
                                onClick = onSyncNow,
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryColor)
                            ) {
                                Text("Sync Now", color = BackgroundColor, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                Text(
                    text = "SMS Listener Activity",
                    color = TextColor,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )

                // SMS Queue Activity Log List
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = CardColor),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(text = "bKash (16247)", color = PrimaryColor, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    Text(text = "LISTENING", color = PrimaryColor, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Ready to capture payment confirmation SMS messages.",
                                    color = TextColor,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
