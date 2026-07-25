import { NextResponse } from 'next/server';
import sql from '../../../../../lib/db';

export async function POST(request: Request, context: any) {
  const id = Number(context.params.id);
  const body = await request.json();
  const [row] = await sql`
    INSERT INTO interactions (contact_id, date, method, contacted_by, notes)
    VALUES (${id}, ${body.date}, ${body.method}, ${body.contactedBy}, ${body.notes})
    RETURNING *
  `;
  return NextResponse.json({
    id: row.id,
    date: row.date,
    method: row.method,
    contactedBy: row.contacted_by,
    notes: row.notes,
  });
}
