import { NextResponse } from 'next/server';
import sql from '../../../../../../lib/db';
import { ensureSchema } from '../../../../../../lib/ensure-schema';

export async function PATCH(request: Request, context: any) {
await ensureSchema();
const followUpId = Number(context.params.followUpId);
const contactId = Number(context.params.id);
const body = await request.json();

const [followUp] = await sql`SELECT * FROM follow_ups WHERE id = ${followUpId} AND contact_id = ${contactId}`;
if (!followUp) {
return NextResponse.json({ error: 'Follow-up not found.' }, { status: 404 });
}

if (body.done) {
await sql`UPDATE follow_ups SET done = true WHERE id = ${followUpId}`;
const today = new Date().toISOString().slice(0, 10);
const [interaction] = await sql`
INSERT INTO interactions (contact_id, date, method, contacted_by, notes)
VALUES (${contactId}, ${today}, 'Follow-Up', ${followUp.assigned_to || ''}, ${followUp.note})
RETURNING *
`;
return NextResponse.json({
ok: true,
interaction: {
id: interaction.id,
date: interaction.date,
method: interaction.method,
contactedBy: interaction.contacted_by,
notes: interaction.notes,
},
});
}

return NextResponse.json({ ok: true });
}