'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, Battery, Wifi, ShieldCheck, Download, RefreshCw, XCircle } from 'lucide-react';

interface DeviceItem {
  id: string;
  device_name: string;
  status: 'ONLINE' | 'OFFLINE' | 'REVOKED';
  battery_level?: number;
  network_status?: string;
  last_heartbeat?: string;
  app_version?: string;
  pending_queue_count?: number;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPairModal, setShowPairModal] = useState(false);
  const appDownloadUrl = 'https://centralpay-xi.vercel.app/centralpay-agent.apk';
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(appDownloadUrl)}`;

  const loadDevices = async () => {
    try {
      const res = await fetch('/api/v1/devices');
      if (res.ok) {
        const data = await res.json();
        if (data.devices && data.devices.length > 0) {
          setDevices(data.devices);
        } else {
          setDevices([
            {
              id: 'waiting_for_first_device',
              device_name: 'No devices connected yet',
              status: 'OFFLINE',
              battery_level: 0,
              network_status: 'Waiting for APK installation',
              last_heartbeat: 'Install centralpay-agent.apk to pair',
              app_version: 'v1.0.0',
              pending_queue_count: 0,
            },
          ]);
        }
      }
    } catch {
      // Keep existing state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Android Payment Devices</h1>
          <p className="text-xs text-muted">Pair and manage Android CentralPay Agent devices to capture real payment SMS messages.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDevices}
            className="p-2 rounded-xl bg-card border border-card-border text-muted hover:text-foreground"
            title="Refresh Devices"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a
            href="/centralpay-agent.apk"
            download
            className="px-4 py-2 rounded-xl bg-card border border-card-border text-foreground font-bold text-xs hover:bg-card-border transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4 text-accent" />
            <span>Download Agent APK</span>
          </a>
          <button
            onClick={() => setShowPairModal(true)}
            className="px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs hover:bg-primary-hover transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(85,181,16,0.3)]"
          >
            <QrCode className="h-4 w-4" />
            <span>Pair Device / QR Scanner</span>
          </button>
        </div>
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
                  <h3 className="font-bold text-foreground text-sm">{dev.device_name}</h3>
                  <p className="text-xs text-muted font-mono">{dev.id}</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] border ${
                  dev.status === 'ONLINE'
                    ? 'bg-primary/20 text-primary border-primary/40'
                    : 'bg-muted/20 text-muted border-card-border'
                }`}
              >
                {dev.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-card-border text-xs">
              <div className="flex items-center gap-1.5 text-muted">
                <Battery className="h-3.5 w-3.5 text-primary" />
                <span>{dev.battery_level || 90}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <Wifi className="h-3.5 w-3.5 text-accent" />
                <span>{dev.network_status || 'Active'}</span>
              </div>
              <div className="text-right text-muted font-mono text-[10px]">{dev.app_version || 'v1.0.0'}</div>
            </div>

            <div className="pt-3 border-t border-card-border flex items-center justify-between text-xs">
              <span className="text-[10px] text-muted">Last Heartbeat: {dev.last_heartbeat || 'Active'}</span>
              {dev.status === 'ONLINE' && (
                <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                  ● Live Syncing
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Real QR Scanner & Download Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full border border-card-border space-y-5 text-center shadow-2xl">
            <div>
              <h2 className="font-bold text-base text-foreground">Pair Android CentralPay Agent</h2>
              <p className="text-xs text-muted mt-1">
                Scan this QR code with your Android phone camera to download the APK and connect automatically with this website.
              </p>
            </div>

            {/* Real QR Code Image */}
            <div className="p-4 bg-white rounded-2xl inline-block mx-auto border-4 border-primary/40 shadow-[0_0_30px_rgba(85,181,16,0.3)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrApiUrl}
                alt="CentralPay Agent QR Scanner"
                className="w-56 h-56 rounded-lg object-contain"
              />
            </div>

            <div className="space-y-2">
              <a
                href="/centralpay-agent.apk"
                download
                className="w-full py-3 rounded-xl bg-primary text-background font-extrabold text-xs hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(85,181,16,0.3)]"
              >
                <Download className="h-4 w-4" />
                <span>Direct Download APK (centralpay-agent.apk)</span>
              </a>

              <p className="text-[11px] text-muted pt-1">
                Direct URL: <span className="font-mono text-accent font-semibold">{appDownloadUrl}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-card-border text-left text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-primary font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Pairing & Sync Instructions</span>
              </div>
              <ol className="list-decimal list-inside text-[11px] text-muted space-y-1">
                <li>Scan QR above to download <strong className="text-foreground">centralpay-agent.apk</strong>.</li>
                <li>Install APK and grant <strong className="text-foreground">SMS permissions</strong>.</li>
                <li>The agent will register your device ID automatically and stream live SMS transactions.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowPairModal(false)}
              className="w-full py-2.5 rounded-xl bg-card border border-card-border text-xs text-foreground hover:bg-card-border font-semibold"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
