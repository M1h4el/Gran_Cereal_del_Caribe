import { queryDB } from '@/lib/dbUtils';
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  try {
    const {userId} = await params
    if (!userId || isNaN(Number(userId))) {
      return new NextResponse("Invalid or missing userId", { status: 400 });
    }
    const [users] = await queryDB('SELECT codeCollaborator, email, phone, address, role, userName FROM users WHERE user_id = ?', [userId]);
    if (users.length === 0) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const {userId} = await params
    const { name, email, role } = await req.json();
    const updatedData = await queryDB('UPDATE users SET name = ?, email = ?, role = ? WHERE user_id = ?', [name, email, role, userId]);

    if (updatedData.affectedRows === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    console.log("updatedData", updatedData);

    return NextResponse.json({ message: 'Usuario actualizado' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    await queryDB('DELETE FROM users WHERE user_id = ?', [params.iduser]);

    return NextResponse.json({ message: 'Usuario eliminado' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}