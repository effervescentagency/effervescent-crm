import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import sql from '@/lib/db';
import { ensureSchema } from '@/lib/ensure-schema';
import { authOptions } from '@/lib/auth';
import { getValidAccessToken } from '@/lib/gmail-sync';

function pad(n: number) {
    return String(n).padStart(2, '0');
}

function formatNaive(d: Date) {
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;
}

export async function POST(request: Request, context: any) {
    await ensureSchema();

    const session = await getServerSession(authOptions);
    const staffEmail = session?.user?.email;
    if (!staffEmail) {
        return NextResponse.json({ error: 'You must be signed in to schedule a meeting.' }, { status: 401 });
    }

    const [tokenRow] = await sql`SELECT * FROM staff_gmail_tokens WHERE email = ${staffEmail}`;
    if (!tokenRow) {
        return NextResponse.json({ error: 'No connected Google account found. Please sign out and sign in again.' }, { status: 400 });
    }

    const accessToken = await getValidAccessToken(tokenRow);
    if (!accessToken) {
        return NextResponse.json({ error: 'Could not access Google Calendar. Please sign out and sign in again to grant calendar access.' }, { status: 400 });
    }

    const body = await request.json();
    const title = (body.title || '').trim();
    const date = body.date;
    const time = body.time;
    const durationMinutes = Number(body.duration) || 30;
    const description = body.description || '';
    const inviteClient = !!body.inviteClient;
    const clientEmail = body.clientEmail;
    const guests: string[] = Array.isArray(body.guests) ? body.guests : [];
    const addMeet = body.addMeet !== false;

    if (!title || !date || !time) {
        return NextResponse.json({ error: 'Title, date and time are required.' }, { status: 400 });
    }

    const startDateTime = `${date}T${time}:00`;
    const startNaive = new Date(`${startDateTime}Z`);
    if (isNaN(startNaive.getTime())) {
        return NextResponse.json({ error: 'Invalid date or time.' }, { status: 400 });
    }
    const endNaive = new Date(startNaive.getTime() + durationMinutes * 60000);
    const endDateTime = formatNaive(endNaive);
    const timeZone = 'Europe/London';

    const seen = new Set<string>();
    const attendees: { email: string }[] = [];
    function addAttendee(email?: string) {
        if (!email) return;
        const trimmed = String(email).trim().toLowerCase();
        if (!trimmed || seen.has(trimmed)) return;
        seen.add(trimmed);
        attendees.push({ email: trimmed });
    }
    if (inviteClient) addAttendee(clientEmail);
    guests.forEach((g) => addAttendee(g));

    const eventBody: any = {
        summary: title,
        description,
        start: { dateTime: startDateTime, timeZone },
        end: { dateTime: endDateTime, timeZone },
        attendees,
    };

    if (addMeet) {
        eventBody.conferenceData = {
            createRequest: {
                requestId: `meet-${context.params.id}-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
        };
    }

    const calRes = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventBody),
        }
    );

    if (!calRes.ok) {
        const errText = await calRes.text();
        console.error('Google Calendar create event failed', errText);
        if (calRes.status === 403) {
            return NextResponse.json({ error: 'Calendar access was not granted. Please sign out and sign in again, and accept the calendar permission.' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to create the calendar event. Please try again.' }, { status: 502 });
    }

    const event = await calRes.json();

    return NextResponse.json({
        htmlLink: event.htmlLink,
        meetLink: event.hangoutLink || null,
    });
}
