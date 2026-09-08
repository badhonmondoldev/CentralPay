import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminSupabase } from '@/lib/supabase';

function toUUID(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id.toLowerCase();
  }
  const hash = crypto.createHash('md5').update(id).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function POST(request: Request) {
  try {
    const rawDeviceId = request.headers.get('X-CentralPay-Device-ID') || 'default-agent-device';
    const normalizedDeviceId = toUUID(rawDeviceId);

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { battery_level = 95, network_status = 'WiFi / Cellular', app_version = 'v1.0.0', os_version = 'Android', pending_queue_count = 0 } = body;

    const supabase = getAdminSupabase();

    // Check if device exists, if not auto-register
    const { data: existingDevice } = await supabase
      .from('devices')
      .select('*')
      .eq('id', normalizedDeviceId)
      .maybeSingle();

    if (!existingDevice) {
      await supabase.from('devices').insert({
        id: normalizedDeviceId,
        device_name: `Android Agent (${rawDeviceId.slice(0, 16)})`,
        public_key: 'auto_registered',
        status: 'ONLINE',
        last_heartbeat: new Date().toISOString(),
        battery_level,
        network_status,
        app_version,
        os_version,
        pending_queue_count,
      });
    } else {
      await supabase
        .from('devices')
        .update({
          status: 'ONLINE',
          last_heartbeat: new Date().toISOString(),
          battery_level,
          network_status,
          app_version,
          os_version,
          pending_queue_count,
          updated_at: new Date().toISOString(),
        })
        .eq('id', normalizedDeviceId);
    }

    return NextResponse.json({
      success: true,
      device_id: normalizedDeviceId,
      status: 'ONLINE',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'SYSTEM_ERROR', message: (error as Error).message }, { status: 500 });
  }
}
