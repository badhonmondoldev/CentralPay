package com.centralpay.agent.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update

@Dao
interface SmsEventDao {

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(event: SmsEventEntity): Long

    @Query("SELECT * FROM sms_queue WHERE syncStatus = 'UNSYNCED' ORDER BY receivedTimestamp ASC")
    suspend fun getUnsyncedEvents(): List<SmsEventEntity>

    @Update
    suspend fun update(event: SmsEventEntity)

    @Query("UPDATE sms_queue SET syncStatus = 'SYNCED' WHERE id = :id")
    suspend fun markSynced(id: Long)

    @Query("SELECT COUNT(*) FROM sms_queue WHERE syncStatus = 'UNSYNCED'")
    suspend fun getUnsyncedCount(): Int
}
