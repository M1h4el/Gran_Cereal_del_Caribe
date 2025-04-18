import { queryDB } from '@/lib/dbUtils';

export async function GET(_, { params }) {
  try {
    const {userId} = await params
    if (!userId || isNaN(Number(userId))) {
      return new Response("Invalid or missing userId", { status: 400 });
    }
    const [users] = await queryDB('SELECT codeCollaborator, email, phone, address, role, userName FROM users WHERE user_id = ?', [userId]);
    if (users.length === 0) return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });

    return Response.json(users);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const {userId} = await params
    const { name, email, role } = await req.json();
    await queryDB('UPDATE users SET name = ?, email = ?, role = ? WHERE user_id = ?', [name, email, role, userId]);

    return Response.json({ message: 'Usuario actualizado' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    await queryDB('DELETE FROM users WHERE user_id = ?', [params.iduser]);

    return Response.json({ message: 'Usuario eliminado' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}