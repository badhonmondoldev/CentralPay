package com.centralpay.agent.db

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class SyncStatus {
    UNSYNCED,
    SYNCING,
    SYNCED,
    FAILED
}

@Entity(tableName = "sms_queue")
data class SmsEventEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val sender: String,
    val body: String,
    val receivedTimestamp: Long,
    val fingerprint: String,
    val syncStatus: SyncStatus = SyncStatus.UNSYNCED,
    val retryCount: Int = 0
)
