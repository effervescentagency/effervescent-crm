import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { runGmailSync } from '../../../lib/gmail-sync';

export async function GET(request: NextRequest) {
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;
const isCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`;

if (!isCron) {
const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
if (!token) {
return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}
}

try {
const result = await runGmailSync(isCron);
return NextResponse.json({ ok: true, ...result });
} catch (err: any) {
console.error('Gmail sync failed', err);
return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
}
}