import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import sql from '../../../../lib/db';
import { ensureSchema } from '../../../../lib/ensure-schema';
import { getValidAccessToken } from '../../../../lib/gmail-sync';

function base64UrlEncode(str: string) {
return Buffer.from(str)
.toString('base64')
.replace(/\+/g, '-')
.replace(/\//g, '_')
.replace(/=+$/, '');
}

export async function GET(request: NextRequest) {
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;
const isCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`;
if (!isCron) {
return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}

await ensureSchema();

const today = new Date().toISOString().slice(0, 10);
const dueFollowUps = await sql`
SELECT f.*, c.company AS company_name
FROM follow_ups f
JOIN contacts c ON c.id = f.contact_id
WHERE f.due_date = ${today} AND f.done = false AND f.reminder_sent = false
`;

let sent = 0;
for (const f of dueFollowUps) {
if (!f.assigned_to) continue;
const [tokenRow] = await sql`SELECT * FROM staff_gmail_tokens WHERE email = ${f.assigned_to}`;
if (!tokenRow) continue;
const accessToken = await getValidAccessToken(tokenRow);
if (!accessToken) continue;

const subject = `Follow-up reminder: ${f.company_name}`;
const bodyText = `This is a reminder to follow up with ${f.company_name} today.\n\nNote: ${f.note}`;
const rawMessage = [
`To: ${f.assigned_to}`,
`Subject: ${subject}`,
'Content-Type: text/plain; charset=utf-8',
'',
bodyText,
].join('\n');

try {
const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
method: 'POST',
headers: {
Authorization: `Bearer ${accessToken}`,
'Content-Type': 'application/json',
},
body: JSON.stringify({ raw: base64UrlEncode(rawMessage) }),
});
if (res.ok) {
await sql`UPDATE follow_ups SET reminder_sent = true WHERE id = ${f.id}`;
sent++;
} else {
console.error('Failed to send follow-up reminder email', await res.text());
}
} catch (err) {
console.error('Error sending follow-up reminder email', err);
}
}

return NextResponse.json({ ok: true, sent });
}