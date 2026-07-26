import { NextResponse } from 'next/server';
import sql from '../../../../lib/db';
import { ensureSchema } from '../../../../lib/ensure-schema';

const fieldMap: Record<string, string> = {
  name: 'name',
  company: 'company',
  city: 'city',
  role: 'role',
  email: 'email',
  phone: 'phone',
  status: 'status',
  lastContact: 'last_contact',
  created: 'created',
  notes: 'notes',
  shiftVenueDetails: 'shift_venue_details',
  bottlePrice: 'bottle_price',
  shotPrice: 'shot_price',
  address: 'address',
  website: 'website',
  instagram: 'instagram',
  lostReason: 'lost_reason',
  lostNotes: 'lost_notes',
};

export async function PATCH(request: Request, context: any) {
  await ensureSchema();
  const id = Number(context.params.id);
  const body = await request.json();
  const mapped: Record<string, any> = {};
  for (const key of Object.keys(body)) {
    const col = fieldMap[key];
    if (col) mapped[col] = body[key];
  }
  if (Object.keys(mapped).length === 0) {
    return NextResponse.json({ ok: true });
  }
  const [row] = await sql`UPDATE contacts SET ${sql(mapped)} WHERE id = ${id} RETURNING *`;
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
    shiftVenueDetails: row.shift_venue_details,
    bottlePrice: row.bottle_price,
    shotPrice: row.shot_price,
    address: row.address,
    website: row.website,
    instagram: row.instagram,
    lostReason: row.lost_reason,
    lostNotes: row.lost_notes,
  });
}

export async function DELETE(request: Request, context: any) {
  await ensureSchema();
  const id = Number(context.params.id);
  await sql`DELETE FROM contacts WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
