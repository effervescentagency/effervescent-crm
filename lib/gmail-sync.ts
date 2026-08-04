import sql from './db';
import { ensureSchema } from './ensure-schema';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const SYNC_MIN_INTERVAL_MS = 60 * 1000; // 1 minute (was 3 minutes) - allows more frequent opportunistic syncs

async function refreshAccessToken(refreshToken: string) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });
    if (!res.ok) {
        throw new Error('Failed to refresh Gmail token: ' + (await res.text()));
    }
    return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function getValidAccessToken(row: any): Promise<string | null> {
    const now = Math.floor(Date.now() / 1000);
    if (row.access_token && row.expiry_date && Number(row.expiry_date) - 60 > now) {
        return row.access_token;
    }
    if (!row.refresh_token) return null;
    try {
        const refreshed = await refreshAccessToken(row.refresh_token);
        const expiry = now + (refreshed.expires_in || 3600);
        await sql`UPDATE staff_gmail_tokens SET access_token = ${refreshed.access_token}, expiry_date = ${expiry}, updated_at = now() WHERE email = ${row.email}`;
        return refreshed.access_token;
    } catch (err) {
        console.error('Gmail token refresh failed for', row.email, err);
        return null;
    }
}

function extractEmails(headerValue: string): string[] {
    const matches = headerValue.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    return matches ? matches.map((e) => e.toLowerCase()) : [];
}

export async function runGmailSync(force = false) {
    await ensureSchema();

    const stateRows = await sql`SELECT value FROM sync_state WHERE key = 'gmail_last_sync'`;
    const lastSync = stateRows[0]?.value ? Number(stateRows[0].value) : 0;
    const now = Date.now();
    if (!force && now - lastSync < SYNC_MIN_INTERVAL_MS) {
        return { skipped: true, matched: 0 };
    }
    await sql`
INSERT INTO sync_state (key, value) VALUES ('gmail_last_sync', ${String(now)})
ON CONFLICT (key) DO UPDATE SET value = ${String(now)}
`;

    const staff = await sql`SELECT * FROM staff_gmail_tokens`;
    const contacts = await sql`SELECT id, email FROM contacts WHERE email IS NOT NULL AND email <> ''`;
    const contactByEmail = new Map<string, number>();
    for (const c of contacts) {
        if (c.email) contactByEmail.set(String(c.email).toLowerCase(), c.id);
    }

    let matched = 0;

    for (const person of staff) {
        const accessToken = await getValidAccessToken(person);
        if (!accessToken) continue;

        let messageIds: string[] = [];
        try {
            const listRes = await fetch(
                'https://gmail.googleapis.com/gmail/v1/users/me/messages?' +
                new URLSearchParams({ labelIds: 'SENT', maxResults: '25' }),
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!listRes.ok) {
                console.error('Gmail list failed for', person.email, await listRes.text());
                continue;
            }
            const listData = await listRes.json();
            messageIds = (listData.messages || []).map((m: any) => m.id);
        } catch (err) {
            console.error('Gmail list error for', person.email, err);
            continue;
        }

        for (const id of messageIds) {
            const already = await sql`SELECT 1 FROM processed_gmail_messages WHERE message_id = ${id}`;
            if (already.length > 0) continue;

            try {
                const msgRes = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=To&metadataHeaders=Subject`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (!msgRes.ok) continue;
                const msgData = await msgRes.json();
                const headers: any[] = msgData.payload?.headers || [];
                const toHeader = headers.find((h) => h.name === 'To')?.value || '';
                const subjectHeader = headers.find((h) => h.name === 'Subject')?.value || '(no subject)';
                const toEmails = extractEmails(toHeader);

                let matchedContactId: number | null = null;
                for (const e of toEmails) {
                    if (contactByEmail.has(e)) {
                        matchedContactId = contactByEmail.get(e)!;
                        break;
                    }
                }

                if (matchedContactId) {
                    const dateStr = msgData.internalDate
                        ? new Date(Number(msgData.internalDate)).toISOString().slice(0, 10)
                        : new Date().toISOString().slice(0, 10);
                    await sql`
INSERT INTO interactions (contact_id, date, method, contacted_by, notes)
VALUES (${matchedContactId}, ${dateStr}, 'Email', ${person.email}, ${'Auto-detected: ' + subjectHeader})
`;
                    matched++;
                }

                await sql`
INSERT INTO processed_gmail_messages (message_id, contact_id)
VALUES (${id}, ${matchedContactId})
ON CONFLICT (message_id) DO NOTHING
`;
            } catch (err) {
                console.error('Error processing Gmail message', id, err);
            }
        }

        // --- Inbound (received) emails ---
        let inboxMessageIds: string[] = [];
        try {
            const inboxListRes = await fetch(
                'https://gmail.googleapis.com/gmail/v1/users/me/messages?' +
                new URLSearchParams({ labelIds: 'INBOX', maxResults: '25' }),
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!inboxListRes.ok) {
                console.error('Gmail inbox list failed for', person.email, await inboxListRes.text());
            } else {
                const inboxListData = await inboxListRes.json();
                inboxMessageIds = (inboxListData.messages || []).map((m: any) => m.id);
            }
        } catch (err) {
            console.error('Gmail inbox list error for', person.email, err);
        }

        for (const id of inboxMessageIds) {
            const already = await sql`SELECT 1 FROM processed_gmail_messages WHERE message_id = ${id}`;
            if (already.length > 0) continue;

            try {
                const msgRes = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (!msgRes.ok) continue;
                const msgData = await msgRes.json();
                const headers: any[] = msgData.payload?.headers || [];
                const fromHeader = headers.find((h) => h.name === 'From')?.value || '';
                const subjectHeader = headers.find((h) => h.name === 'Subject')?.value || '(no subject)';
                const fromEmails = extractEmails(fromHeader);

                let matchedContactId: number | null = null;
                for (const e of fromEmails) {
                    if (contactByEmail.has(e)) {
                        matchedContactId = contactByEmail.get(e)!;
                        break;
                    }
                }

                if (matchedContactId) {
                    const dateStr = msgData.internalDate
                        ? new Date(Number(msgData.internalDate)).toISOString().slice(0, 10)
                        : new Date().toISOString().slice(0, 10);
                    await sql`
                                                                                                                                                                                                                                                                                                                                                                                                                                              INSERT INTO interactions (contact_id, date, method, contacted_by, notes)
                                                                                                                                                                                                                                                                                                                                                                                                                                                            VALUES (${matchedContactId}, ${dateStr}, 'Email (Received)', ${person.email}, ${'Auto-detected: ' + subjectHeader})
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `;
                    matched++;
                }

                await sql`
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    INSERT INTO processed_gmail_messages (message_id, contact_id)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                VALUES (${id}, ${matchedContactId})
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ON CONFLICT (message_id) DO NOTHING
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `;
            } catch (err) {
                console.error('Error processing Gmail inbox message', id, err);
            }
        }
    }

    return { skipped: false, matched };
}