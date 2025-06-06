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

    const data = await queryDB(
      "SELECT user_parent_id FROM relaciones WHERE user_child_id = ?",
      [userId]
    )

    if (data.length === 0) {
      return NextResponse.json({ error: 'No se encontró relación con el usuario' }, { status: 404 });
    }

    const user_parent_id = data[0].user_parent_id;

    const infoNotification = `${name};`

    await queryDB(
      "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?)",
      [user_parent_id, infoNotification, "126"]
    )

    return NextResponse.json({ message: 'Usuario actualizado' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    await queryDB('DELETE FROM users WHERE user_id = ?', [params.iduser]);

    await queryDB(
      "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?)",
      [params.iduser, null, "13"]
    );

    const data1 = await queryDB(
      "SELECT user_parent_id FROM relaciones WHERE user_child_id = ?",
      [params.iduser]
    );

    const data2 = await queryDB(
      "SELECT userName FROM users WHERE user_id = ?",
      [params.iduser]
    );

    if (data1.length === 0 || data2.length === 0) {
      return NextResponse.json({ error: 'No se encontró relación con el usuario' }, { status: 404 });
    };

    const user_parent_id = data1[0].user_parent_id;
    const userName = data2[0].userName;

    const infoNotification = `${userName};`

    await queryDB(
      "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?)",
      [user_parent_id, infoNotification, "127"]
    );

    return NextResponse.json({ message: 'Usuario eliminado' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}