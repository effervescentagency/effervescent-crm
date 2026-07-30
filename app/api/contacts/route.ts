import { NextResponse } from 'next/server';
import sql from '../../../lib/db';
import { ensureSchema } from '../../../lib/ensure-schema';

export async function GET() {
  await ensureSchema();
  const contacts = await sql`SELECT * FROM contacts ORDER BY id`;
  const interactions = await sql`SELECT * FROM interactions ORDER BY id DESC`;
  const followUps = await sql`SELECT * FROM follow_ups WHERE done = false ORDER BY due_date ASC`;
  const result = contacts.map((c: any) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    city: c.city,
    role: c.role,
    assignedTo: c.assigned_to,
    email: c.email,
    phone: c.phone,
    status: c.status,
    lastContact: c.last_contact,
    created: c.created,
    notes: c.notes,
      shiftVenueDetails: c.shift_venue_details,
      bottlePrice: c.bottle_price,
      shotPrice: c.shot_price,
      address: c.address,
    website: c.website,
    instagram: c.instagram,
    lostReason: c.lost_reason,
    lostNotes: c.lost_notes,
    interactions: interactions
      .filter((i: any) => i.contact_id === c.id)
      .map((i: any) => ({
        id: i.id,
        date: i.date,
        method: i.method,
        contactedBy: i.contacted_by,
        notes: i.notes,
      })),
      followUps: followUps
      .filter((f: any) => f.contact_id === c.id)
      .map((f: any) => ({
      id: f.id,
      note: f.note,
      dueDate: f.due_date,
      assignedTo: f.assigned_to,
      done: f.done,
      })),
  }));
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  await ensureSchema();
  const body = await request.json();
  const [row] = await sql`
    INSERT INTO contacts (name, company, city, role, email, phone, status, last_contact, created, notes, website, instagram, assigned_to)
    VALUES (${body.name}, ${body.company}, ${body.city}, ${body.role}, ${body.email}, ${body.phone}, ${body.status}, ${body.lastContact || '-'}, ${body.created}, ${body.notes}, ${body.website}, ${body.instagram}, ${body.assignedTo})
    RETURNING *
  `;
  return NextResponse.json({
    id: row.id,
    name: row.name,
    company: row.company,
    city: row.city,
    role: row.role,
    assignedTo: row.assigned_to,
    email: row.email,
    phone: row.phone,
    status: row.status,
    lastContact: row.last_contact,
    created: row.created,
    notes: row.notes,
    shiftVenueDetails: row.shift_venue_details,
    bottlePrice: row.bottle_price,
    shotPrice: row.shot_price,
    address: row.address,
    website: row.website,
    instagram: row.instagram,
    interactions: [],
  });
}
