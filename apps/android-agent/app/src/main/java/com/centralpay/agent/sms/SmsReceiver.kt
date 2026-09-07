package com.centralpay.agent.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.centralpay.agent.CentralPayApplication
import com.centralpay.agent.db.SmsEventEntity
import com.centralpay.agent.db.SyncStatus
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.security.MessageDigest

class SmsReceiver : BroadcastReceiver() {

    private val allowedSenders = listOf("bKash", "16247", "Nagad", "16167", "Rocket", "16216")

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        for (sms in messages) {
            val sender = sms.displayOriginatingAddress ?: continue
            val body = sms.displayMessageBody ?: continue
            val timestamp = sms.timestampMillis

            // Check if sender matches configured payment sources
            val isPaymentSms = allowedSenders.any { allowed ->
                sender.lowercase().contains(allowed.lowercase())
            }

            if (isPaymentSms) {
                Log.d("SmsReceiver", "Payment SMS detected from: $sender")

                val fingerprint = calculateFingerprint(sender, timestamp, body)

                val entity = SmsEventEntity(
                    sender = sender,
                    body = body,
                    receivedTimestamp = timestamp,
                    fingerprint = fingerprint,
                    syncStatus = SyncStatus.UNSYNCED
                )

                val db = CentralPayApplication.instance.database
                CoroutineScope(Dispatchers.IO).launch {
                    db?.smsEventDao()?.insert(entity)
                    // Trigger WorkManager background sync
                    SmsSyncWorker.enqueueSync(context ?: CentralPayApplication.instance)
                }
            }
        }
    }

    private fun calculateFingerprint(sender: String, timestamp: Long, body: String): String {
        val raw = "$sender|$timestamp|${body.trim().lowercase()}"
        val bytes = MessageDigest.getInstance("SHA-256").digest(raw.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
