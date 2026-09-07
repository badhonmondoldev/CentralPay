import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const rootApkPath = path.join(process.cwd(), 'public', 'centralpay-agent.apk');
    const fallbackApkPath = path.join(process.cwd(), '..', '..', 'centralpay-agent.apk');

    let targetPath = rootApkPath;
    if (!fs.existsSync(rootApkPath) && fs.existsSync(fallbackApkPath)) {
      targetPath = fallbackApkPath;
    }

    if (!fs.existsSync(targetPath)) {
      return new NextResponse('APK file not found on server', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(targetPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="centralpay-agent.apk"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new NextResponse(`Download error: ${(error as Error).message}`, { status: 500 });
  }
}
