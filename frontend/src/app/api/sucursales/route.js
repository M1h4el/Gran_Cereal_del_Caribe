import { NextResponse } from "next/server";
import { queryDB } from "@/lib/dbUtils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/authOptions"

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userOwnerId = searchParams.get("userOwnerId");
  const searchByCode = searchParams.get("searchByCode");

  // Validación de parámetros
  if (!userOwnerId && !searchByCode) {
    return NextResponse.json(
      { error: "Se requiere userOwnerId o searchByCode" },
      { status: 400 }
    );
  }

  try {
    let query;
    let params = [];
    let errorMessage = "";

    if (userOwnerId) {
      // Consulta por userOwnerId (administrador)
      query = `
        SELECT 
          s.sucursal_id, s.user_admin_id, s.title, s.description, 
          s.created_at, s.total_products, us.user_id, us.userName, 
          us.email, us.phone, us.address, us.role, us.codeCollaborator, 
          us.bought_sold 
        FROM 
          sucursales s, users us 
        WHERE 
          s.user_admin_id = ? AND us.user_id = s.user_id 
        ORDER BY 
          s.created_at DESC
      `;
      params = [userOwnerId];
      errorMessage = "No se encontraron sucursales para este administrador";
    } else if (searchByCode) {
      // Consulta por código de colaborador/sucursal
      query = `
        SELECT 
          s.sucursal_id, s.user_admin_id, s.title, s.description, 
          s.created_at, s.total_products, us.user_id, us.userName, 
          us.email, us.phone, us.address, us.role, us.codeCollaborator, 
          us.bought_sold 
        FROM 
          sucursales s
        JOIN 
          users us ON us.user_id = s.user_id
        WHERE 
          us.codeCollaborator = ?
        ORDER BY 
          s.created_at DESC
      `;
      params = [searchByCode];
      errorMessage = "No se encontraron sucursales con este código";
    }

    const results = await queryDB(query, params);

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      );
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// 🔹 Crear nueva sucursal
export async function POST(req) {

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

export async function PUT(req) {

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
}