package com.centralpay.agent

import android.app.Application
import android.util.Log
import com.centralpay.agent.db.AppDatabase

class CentralPayApplication : Application() {

    var database: AppDatabase? = null
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        try {
            database = AppDatabase.getDatabase(this)
        } catch (e: Exception) {
            Log.e("CentralPayApp", "Database init failed: ${e.message}")
        }
    }

    companion object {
        lateinit var instance: CentralPayApplication
            private set
    }
}
