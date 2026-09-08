import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getAdminSupabase();

    const { data: devices, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'DATABASE_ERROR', message: error.message }, { status: 500 });
    }

    // Determine online/offline based on last heartbeat within 15 minutes
    const now = Date.now();
    const formatted = (devices || []).map((d) => {
      const lastHb = d.last_heartbeat ? new Date(d.last_heartbeat).getTime() : 0;
      const isRecent = now - lastHb < 15 * 60 * 1000;
      return {
        id: d.id,
        device_name: d.device_name || 'Android CentralPay Agent',
        status: d.status === 'REVOKED' ? 'REVOKED' : isRecent ? 'ONLINE' : 'OFFLINE',
        battery_level: d.battery_level || 90,
        network_status: d.network_status || 'WiFi / Mobile Data',
        last_heartbeat: d.last_heartbeat ? new Date(d.last_heartbeat).toLocaleString() : 'Just registered',
        app_version: d.app_version || 'v1.0.0',
        pending_queue_count: d.pending_queue_count || 0,
      };
    });

    return NextResponse.json({ devices: formatted });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}
