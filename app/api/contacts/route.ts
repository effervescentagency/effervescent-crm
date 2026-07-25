import { NextResponse } from 'next/server';
import sql from '../../../lib/db';
import { ensureSchema } from '../../../lib/ensure-schema';

export async function GET() {
  await ensureSchema();
  const contacts = await sql`SELECT * FROM contacts ORDER BY id`;
  const interactions = await sql`SELECT * FROM interactions ORDER BY id DESC`;
  const result = contacts.map((c: any) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    city: c.city,
    role: c.role,
    email: c.email,
    phone: c.phone,
    status: c.status,
    lastContact: c.last_contact,
    created: c.created,
    notes: c.notes,
    interactions: interactions
      .filter((i: any) => i.contact_id === c.id)
      .map((i: any) => ({
        id: i.id,
        date: i.date,
        method: i.method,
        contactedBy: i.contacted_by,
        notes: i.notes,
      })),
  }));
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  await ensureSchema();
  const body = await request.json();
  const [row] = await sql`
    INSERT INTO contacts (name, company, city, role, email, phone, status, last_contact, created, notes)
    VALUES (${body.name}, ${body.company}, ${body.city}, ${body.role}, ${body.email}, ${body.phone}, ${body.status}, ${body.lastContact || '-'}, ${body.created}, ${body.notes})
    RETURNING *
  `;
  return NextResponse.json({
    id: row.id,
    name: row.name,
    company: row.company,
    city: row.city,
    role: row.role,
    email: row.email,
    phone: row.phone,
    status: row.status,
    lastContact: row.last_contact,
    created: row.created,
    notes: row.notes,
    interactions: [],
  });
}
