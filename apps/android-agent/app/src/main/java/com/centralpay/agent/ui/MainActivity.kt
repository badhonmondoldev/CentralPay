package com.centralpay.agent.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.centralpay.agent.security.KeystoreHelper
import com.centralpay.agent.sms.SmsSyncWorker

class MainActivity : ComponentActivity() {

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        try {
            val smsGranted = permissions[Manifest.permission.RECEIVE_SMS] ?: false
            if (smsGranted) {
                SmsSyncWorker.enqueueSync(this)
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
            "dev_agent_fallback"
        }

        setContent {
            AgentHomeScreen(
                deviceId = deviceId,
                unsyncedCount = 0,
                onSyncNow = {
                    try {
                        SmsSyncWorker.enqueueSync(this)
                    } catch (e: Exception) {
                        Log.e("MainActivity", "Sync now error: ${e.message}")
                    }
                }
            )
        }

        try {
            checkPermissions()
        } catch (e: Exception) {
            Log.e("MainActivity", "Check permissions error: ${e.message}")
        }
    }

    private fun checkPermissions() {
        val hasSmsPermission = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECEIVE_SMS
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasSmsPermission) {
            requestPermissionLauncher.launch(
                arrayOf(
                    Manifest.permission.RECEIVE_SMS,
                    Manifest.permission.READ_SMS
                )
            )
        }
    }
}
