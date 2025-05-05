import { NextResponse } from "next/server";
import { queryDB } from "@/lib/dbUtils"; // Función para conectar a la BD
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 🔹 Obtener sucursales del usuario autenticado
export async function GET(req) {
  console.log("Tipo de queryDB:", typeof queryDB); // Debe ser "function"

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userOwnerId = searchParams.get("userOwnerId");

  if (!userOwnerId) {
    return NextResponse.json({ error: "Usuario no especificado" }, { status: 400 });
  }

  try {

    const sucursales = await queryDB("SELECT s.sucursal_id, s.user_admin_id, s.title, s.description, s.created_at, s.total_products, us.user_id, us.userName, us.email, us.phone, us.address, us.role, us.codeCollaborator, us.bought_sold FROM sucursales s, users us WHERE s.user_admin_id = ? AND us.user_id = s.user_id ORDER BY s.created_at DESC;", [userOwnerId]);

    return NextResponse.json(sucursales, { status: 200 });
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// 🔹 Crear nueva sucursal
export async function POST(req) {
  console.log("Tipo de queryDB:", typeof queryDB); // Debe ser "function"

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userOwnerId = searchParams.get("userOwnerId");
  if (!userOwnerId) {
    return NextResponse.json({ error: "Usuario Admin no especificado" }, { status: 400 });
  }

  try {
    const user_id = session.user.id;
    const { title, description } = await req.json();

    await queryDB(
      "INSERT INTO sucursales (title, description, user_id) VALUES (?, ?, ?)",
      [title, description, user_id]
    );

    return NextResponse.json({ success: true, message: "Sucursal creada correctamente" }, { status: 201 });
  } catch (error) {
    console.error("Error al crear sucursal:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/* export async function PUT(req) {
  console.log("Tipo de queryDB:", typeof queryDB); // Debe ser "function"

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { id, nombre, descripcion } = await req.json();

    await queryDB("UPDATE sucursales SET title = ?, description = ? WHERE sucursal_id = ? AND user_id = ?;",
      [nombre, descripcion, id, session.user.id]);

    return NextResponse.json({ message: "Sucursal actualizada correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar sucursal:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const { sucursal_id } = await req.json();

    await queryDB(
      "DELETE FROM sucursales WHERE sucursal_id = ? AND user_id = ?",
      [sucursal_id, userId]
    );

    return NextResponse.json({ message: "Sucursal eliminada correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar sucursal:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} */