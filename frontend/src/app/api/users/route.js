import pool from '@/lib/db';

export async function GET() {
  try {
    const [users] = await pool.query('SELECT * FROM users');
    return Response.json(users);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json();
    const [result] = await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?)', [name, email, password, role]);

    return Response.json({ id: result.insertId, name, email, role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}