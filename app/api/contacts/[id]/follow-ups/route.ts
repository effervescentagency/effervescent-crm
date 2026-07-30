import { NextResponse } from 'next/server';
import sql from '../../../../../lib/db';
import { ensureSchema } from '../../../../../lib/ensure-schema';
import { getValidAccessToken } from '../../../../../lib/gmail-sync';

export async function POST(request: Request, context: any) {
await ensureSchema();
const id = Number(context.params.id);
const body = await request.json();
const note = (body.note || '').trim();
const dueDate = body.dueDate;
const assignedTo = body.assignedTo;

if (!note || !dueDate) {
return NextResponse.json({ error: 'Note and due date are required.' }, { status: 400 });
}

const [contactRow] = await sql`SELECT * FROM contacts WHERE id = ${id}`;
if (!contactRow) {
return NextResponse.json({ error: 'Contact not found.' }, { status: 404 });
}

let calendarEventId: string | null = null;

if (assignedTo && assignedTo !== 'Unassigned') {
const [tokenRow] = await sql`SELECT * FROM staff_gmail_tokens WHERE email = ${assignedTo}`;
if (tokenRow) {
const accessToken = await getValidAccessToken(tokenRow);
if (accessToken) {
try {
const eventBody = {
summary: `Follow up: ${contactRow.company}`,
description: note,
start: { date: dueDate },
end: { date: dueDate },
};
const calRes = await fetch(
'https://www.googleapis.com/calendar/v3/calendars/primary/events',
{
method: 'POST',
headers: {
Authorization: `Bearer ${accessToken}`,
'Content-Type': 'application/json',
},
body: JSON.stringify(eventBody),
}
);
if (calRes.ok) {
const event = await calRes.json();
calendarEventId = event.id;
} else {
console.error('Failed to create follow-up calendar event', await calRes.text());
}
} catch (err) {
console.error('Error creating follow-up calendar event', err);
}
}
}
}

const [row] = await sql`
INSERT INTO follow_ups (contact_id, note, due_date, assigned_to, calendar_event_id)
VALUES (${id}, ${note}, ${dueDate}, ${assignedTo || null}, ${calendarEventId})
RETURNING *
`;

return NextResponse.json({
id: row.id,
note: row.note,
dueDate: row.due_date,
assignedTo: row.assigned_to,
done: row.done,
});
}