import { queryDB } from '@/lib/dbUtils';

export async function GET(_, { params }) {
  try {
    const {idUser} = await params
    const [users] = await queryDB('SELECT * FROM users WHERE id = ?', [idUser]);
    if (users.length === 0) return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });

    return Response.json(users[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const {idUser} = await params
    const { name, email, role } = await req.json();
    await queryDB('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [name, email, role, idUser]);

    return Response.json({ message: 'Usuario actualizado' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    await queryDB('DELETE FROM users WHERE id = ?', [params.iduser]);

    return Response.json({ message: 'Usuario eliminado' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}