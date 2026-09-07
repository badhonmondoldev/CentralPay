package com.centralpay.agent.security

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import java.util.UUID

object KeystoreHelper {

    private const val PREFS_NAME = "centralpay_agent_secure_prefs"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_DEVICE_SECRET = "device_secret"

    fun getDeviceId(context: Context): String {
        return try {
            val prefs = getPrefs(context)
            var id = prefs.getString(KEY_DEVICE_ID, null)
            if (id == null) {
                id = "dev_agent_${UUID.randomUUID().toString().replace("-", "").substring(0, 12)}"
                prefs.edit().putString(KEY_DEVICE_ID, id).apply()
            }
            id
        } catch (e: Exception) {
            Log.e("KeystoreHelper", "Error getting device ID: ${e.message}")
            "dev_agent_fallback_99"
        }
    }

    fun getDeviceSecret(context: Context): String {
        return try {
            val prefs = getPrefs(context)
            var secret = prefs.getString(KEY_DEVICE_SECRET, null)
            if (secret == null) {
                secret = UUID.randomUUID().toString() + UUID.randomUUID().toString()
                prefs.edit().putString(KEY_DEVICE_SECRET, secret).apply()
            }
            secret
        } catch (e: Exception) {
            Log.e("KeystoreHelper", "Error getting device secret: ${e.message}")
            "fallback_secret_key_12345"
        }
    }

    fun signPayload(payload: String, secret: String, timestamp: Long, nonce: String): String {
        return try {
            val dataToSign = "$timestamp.$nonce.$payload"
            val mac = Mac.getInstance("HmacSHA256")
            val secretKey = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "HmacSHA256")
            mac.init(secretKey)
            val hash = mac.doFinal(dataToSign.toByteArray(Charsets.UTF_8))
            hash.joinToString("") { "%02x".format(it) }
        } catch (e: Exception) {
            "fallback_signature"
        }
    }

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
}
