package com.centralpay.agent.sms

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.centralpay.agent.CentralPayApplication
import com.centralpay.agent.security.KeystoreHelper
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.UUID

class SmsSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    private val client = OkHttpClient()

    override suspend fun doWork(): Result {
        val db = CentralPayApplication.instance.database
        val unsyncedEvents = db?.smsEventDao()?.getUnsyncedEvents() ?: emptyList()

        if (unsyncedEvents.isEmpty()) {
            return Result.success()
        }

        // Live Vercel Production Server URL
        val baseUrl = "https://centralpay-xi.vercel.app"
        val deviceId = KeystoreHelper.getDeviceId(applicationContext)
        val deviceSecret = KeystoreHelper.getDeviceSecret(applicationContext)

        for (event in unsyncedEvents) {
            val payloadObj = JSONObject().apply {
                put("sender", event.sender)
                put("message_body", event.body)
                put("received_at", java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).format(java.util.Date(event.receivedTimestamp)))
            }

            val payloadStr = payloadObj.toString()
            val timestamp = System.currentTimeMillis()
            val nonce = UUID.randomUUID().toString()

            val signature = KeystoreHelper.signPayload(payloadStr, deviceSecret, timestamp, nonce)

            val request = Request.Builder()
                .url("$baseUrl/api/v1/device/events")
                .post(payloadStr.toRequestBody("application/json".toMediaType()))
                .addHeader("X-CentralPay-Device-ID", deviceId)
                .addHeader("X-CentralPay-Signature", signature)
                .addHeader("X-CentralPay-Timestamp", timestamp.toString())
                .addHeader("X-CentralPay-Nonce", nonce)
                .build()

            try {
                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    db?.smsEventDao()?.markSynced(event.id)
                    Log.d("SmsSyncWorker", "Successfully synced event ID: ${event.id}")
                } else {
                    Log.e("SmsSyncWorker", "Server rejected sync: ${response.code}")
                    return Result.retry()
                }
            } catch (e: Exception) {
                Log.e("SmsSyncWorker", "Network error syncing event: ${e.message}")
                return Result.retry()
            }
        }

        return Result.success()
    }

    companion object {
        fun enqueueSync(context: Context) {
            val workRequest = OneTimeWorkRequestBuilder<SmsSyncWorker>().build()
            WorkManager.getInstance(context).enqueue(workRequest)
        }
    }
}
