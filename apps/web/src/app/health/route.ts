import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const supabase = getAdminSupabase();
    const dbStart = Date.now();
    const { error } = await supabase.from('system_settings').select('id').limit(1).maybeSingle();
    dbLatencyMs = Date.now() - dbStart;
    if (error) {
      dbStatus = `degraded (${error.message})`;
    }
  } catch (err) {
    dbStatus = `unhealthy: ${(err as Error).message}`;
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === 'healthy';

  return NextResponse.json(
    {
      status: isHealthy ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      service: 'CentralPay MAX Core API',
      version: '1.0.0',
      checks: {
        application: 'healthy',
        database: dbStatus,
        database_latency_ms: dbLatencyMs,
        response_time_ms: responseTimeMs,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
