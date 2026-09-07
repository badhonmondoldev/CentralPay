'use client';

import React, { useState } from 'react';
import { Smartphone, QrCode, Battery, Wifi, ShieldAlert, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface DeviceItem {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'REVOKED';
  battery: number;
  network: string;
  lastHeartbeat: string;
  appVersion: string;
  pendingQueue: number;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceItem[]>([
    {
      id: 'dev_pixel7_01',
      name: 'Android Agent Primary (Pixel 7)',
      status: 'ONLINE',
      battery: 92,
      network: 'WiFi (5G)',
      lastHeartbeat: '30 seconds ago',
      appVersion: 'v1.0.4',
      pendingQueue: 0,
    },
  ]);

  const [showPairModal, setShowPairModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Android Payment Devices</h1>
          <p className="text-xs text-muted">Manage paired Android CentralPay Agent devices and check real-time telemetry.</p>
        </div>
        <button
          onClick={() => setShowPairModal(true)}
          className="px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs hover:bg-primary-hover transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(85,181,16,0.3)]"
        >
          <QrCode className="h-4 w-4" />
          <span>Pair New Android Device</span>
        </button>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((dev) => (
          <div key={dev.id} className="glass-card p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-bold">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{dev.name}</h3>
                  <p className="text-xs text-muted font-mono">{dev.id}</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 font-semibold text-[10px]">
                {dev.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-card-border text-xs">
              <div className="flex items-center gap-1.5 text-muted">
                <Battery className="h-3.5 w-3.5 text-primary" />
                <span>{dev.battery}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <Wifi className="h-3.5 w-3.5 text-accent" />
                <span>{dev.network}</span>
              </div>
              <div className="text-right text-muted font-mono text-[10px]">{dev.appVersion}</div>
            </div>

            <div className="pt-3 border-t border-card-border flex items-center justify-between text-xs">
              <span className="text-[10px] text-muted">Heartbeat: {dev.lastHeartbeat}</span>
              <button className="text-red-400 font-semibold hover:underline flex items-center gap-1 text-[11px]">
                <XCircle className="h-3.5 w-3.5" />
                <span>Revoke Device</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* QR Pairing Modal (Requirement 20) */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full border border-card-border space-y-4 text-center shadow-2xl">
            <h2 className="font-bold text-base text-foreground">Pair Android CentralPay Agent</h2>
            <p className="text-xs text-muted">Scan this pairing QR code inside the CentralPay Agent Android application.</p>

            <div className="p-4 bg-white rounded-xl inline-block mx-auto border-4 border-primary/40 shadow-[0_0_25px_rgba(85,181,16,0.3)]">
              {/* Simulated QR Code Canvas */}
              <div className="w-48 h-48 bg-gray-900 flex flex-col items-center justify-center text-white p-2 rounded text-center space-y-2">
                <QrCode className="h-16 w-16 text-primary" />
                <span className="text-[10px] font-mono text-gray-400">PAIRING-KEY-CP-9921</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-card-border text-left text-xs space-y-1">
              <span className="text-foreground font-semibold">Security Requirement:</span>
              <p className="text-[11px] text-muted">
                This QR contains a single-use pairing token. The device will exchange Ed25519 public keys upon scanning.
              </p>
            </div>

            <button onClick={() => setShowPairModal(false)} className="w-full py-2.5 rounded-xl bg-card border border-card-border text-xs text-foreground hover:bg-card-border">
              Close Scanner Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
