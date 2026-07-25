import { NextResponse } from 'next/server';
import sql from '../../../lib/db';
import seedData from '../../../lib/seed-data.json';

export async function POST() {
  await sql`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      city TEXT,
      role TEXT,
      email TEXT,
      phone TEXT,
      status TEXT NOT NULL,
      last_contact TEXT,
      created TEXT,
      notes TEXT
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS interactions (
      id SERIAL PRIMARY KEY,
      contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
      date TEXT,
      method TEXT,
      contacted_by TEXT,
      notes TEXT
    )
  `;

  const existing = await sql`SELECT COUNT(*)::int AS count FROM contacts`;
  const count = existing[0].count;

  if (count === 0) {
    for (const c of seedData as any[]) {
      const [row] = await sql`
        INSERT INTO contacts (name, company, city, role, email, phone, status, last_contact, created, notes)
        VALUES (${c.name}, ${c.company}, ${c.city}, ${c.role}, ${c.email}, ${c.phone}, ${c.status}, ${c.lastContact}, ${c.created}, ${c.notes})
        RETURNING id
      `;
      if (c.interactions && c.interactions.length) {
        for (const it of c.interactions) {
          await sql`
            INSERT INTO interactions (contact_id, date, method, contacted_by, notes)
            VALUES (${row.id}, ${it.date}, ${it.method}, ${it.contactedBy}, ${it.notes})
          `;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, seeded: count === 0 });
}
