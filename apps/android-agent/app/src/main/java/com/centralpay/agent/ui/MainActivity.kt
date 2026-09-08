package com.centralpay.agent.ui

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.centralpay.agent.CentralPayApplication
import com.centralpay.agent.db.SmsEventEntity
import com.centralpay.agent.db.SyncStatus
import com.centralpay.agent.security.KeystoreHelper
import com.centralpay.agent.sms.SmsSyncWorker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.security.MessageDigest

class MainActivity : ComponentActivity() {

    private val allowedSenders = listOf("bKash", "16247", "Nagad", "16167", "Rocket", "16216")
    private val client = OkHttpClient()

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        try {
            val smsGranted = permissions[Manifest.permission.RECEIVE_SMS] ?: false
            val readGranted = permissions[Manifest.permission.READ_SMS] ?: false
            if (smsGranted || readGranted) {
                scanInboxAndSync()
                sendHeartbeat()
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error in permission result: ${e.message}")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val deviceId = try {
            KeystoreHelper.getDeviceId(this)
        } catch (e: Exception) {
            "00000000-0000-0000-0000-000000000001"
        }

        setContent {
            AgentHomeScreen(
                deviceId = deviceId,
                unsyncedCount = 0,
                onSyncNow = {
                    try {
                        scanInboxAndSync()
                        sendHeartbeat()
                    } catch (e: Exception) {
                        Log.e("MainActivity", "Sync now error: ${e.message}")
                    }
                }
            )
        }

        try {
            checkPermissions()
            sendHeartbeat()
        } catch (e: Exception) {
            Log.e("MainActivity", "Startup error: ${e.message}")
        }
    }

    private fun checkPermissions() {
        val hasSmsPermission = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECEIVE_SMS
        ) == PackageManager.PERMISSION_GRANTED

        val hasReadPermission = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasSmsPermission || !hasReadPermission) {
            requestPermissionLauncher.launch(
                arrayOf(
                    Manifest.permission.RECEIVE_SMS,
                    Manifest.permission.READ_SMS
                )
            )
        } else {
            scanInboxAndSync()
        }
    }

    private fun scanInboxAndSync() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val uri = Uri.parse("content://sms/inbox")
                val cursor = contentResolver.query(
                    uri,
                    arrayOf("address", "body", "date"),
                    null,
                    null,
                    "date DESC LIMIT 50"
                )

                cursor?.use {
                    val addressIdx = it.getColumnIndex("address")
                    val bodyIdx = it.getColumnIndex("body")
                    val dateIdx = it.getColumnIndex("date")

                    val db = CentralPayApplication.instance.database

                    while (it.moveToNext()) {
                        val sender = it.getString(addressIdx) ?: continue
                        val body = it.getString(bodyIdx) ?: continue
                        val timestamp = it.getLong(dateIdx)

                        val isMfs = allowedSenders.any { allowed -> sender.contains(allowed, ignoreCase = true) }
                        if (isMfs) {
                            val fingerprint = calculateFingerprint(sender, timestamp, body)
                            val entity = SmsEventEntity(
                                sender = sender,
                                body = body,
                                receivedTimestamp = timestamp,
                                fingerprint = fingerprint,
                                syncStatus = SyncStatus.UNSYNCED
                            )
                            db?.smsEventDao()?.insert(entity)
                        }
                    }
                }

                SmsSyncWorker.enqueueSync(this@MainActivity)
            } catch (e: Exception) {
                Log.e("MainActivity", "Error scanning inbox: ${e.message}")
                SmsSyncWorker.enqueueSync(this@MainActivity)
            }
        }
    }

    private fun sendHeartbeat() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val deviceId = KeystoreHelper.getDeviceId(this@MainActivity)
                val baseUrl = "https://centralpay-xi.vercel.app"
                val payload = JSONObject().apply {
                    put("battery_level", 95)
                    put("network_status", "Active")
                    put("app_version", "v1.0.1")
                    put("os_version", "Android")
                }

                val request = Request.Builder()
                    .url("$baseUrl/api/v1/device/heartbeat")
                    .post(payload.toString().toRequestBody("application/json".toMediaType()))
                    .addHeader("X-CentralPay-Device-ID", deviceId)
                    .build()

                client.newCall(request).execute()
            } catch (e: Exception) {
                Log.e("MainActivity", "Heartbeat error: ${e.message}")
            }
        }
    }

    private fun calculateFingerprint(sender: String, timestamp: Long, body: String): String {
        val raw = "$sender|$timestamp|${body.trim().lowercase()}"
        val bytes = MessageDigest.getInstance("SHA-256").digest(raw.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
