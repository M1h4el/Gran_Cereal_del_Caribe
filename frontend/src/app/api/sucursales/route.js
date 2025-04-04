import { NextResponse } from "next/server";
import { queryDB } from "@/lib/dbUtils"; // Función para conectar a la BD
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 🔹 Obtener sucursales del usuario autenticado
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Usuario no especificado" }, { status: 400 });
  }

  try {

    const user_id = session.user.id;
    const sucursales = await queryDB("SELECT * FROM sucursales s WHERE user_id = ? ORDER BY s.sucursal_id DESC", [user_id]);

    return NextResponse.json(sucursales, { status: 200 });
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// 🔹 Crear nueva sucursal
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Usuario no especificado" }, { status: 400 });
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

// 🔹 Actualizar sucursal
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { id, nombre, descripcion, imagen } = await req.json();

    await queryDB("UPDATE sucursales SET nombre = ?, descripcion = ?, imagen = ? WHERE id = ? AND email = ?", [nombre, descripcion, imagen, id, userEmail]);

    return NextResponse.json({ message: "Sucursal actualizada correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar sucursal:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// 🔹 Eliminar sucursal
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { id } = await req.json();

    await queryDB("DELETE FROM sucursales WHERE id = ? AND email = ?", [id, userEmail]);

    return NextResponse.json({ message: "Sucursal eliminada correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar sucursal:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}