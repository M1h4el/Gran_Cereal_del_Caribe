import { queryDB } from "@/lib/dbUtils";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { userId, sucursalId } = await params;

    if (!userId || !sucursalId) {
      return Response.json(
        { error: "Usuario o sucursal no especificados" },
        { status: 400 }
      );
    }

    const users = await queryDB(
      `SELECT 
        u.user_id, u.userName, u.role, u.address, u.phone, u.bought_sold
      FROM 
        users u
      JOIN 
        relaciones r ON u.user_id = r.user_child_id
      JOIN 
        users s ON r.user_parent_id = s.user_id
      WHERE 
        s.role = 'Sucursal' 
        AND r.sucursal_id = ?
        AND u.role IN ('Cliente', 'Vendedor')

      UNION

      SELECT 
        u.user_id, u.userName, u.role, u.address, u.phone, u.bought_sold
      FROM 
        users u
      JOIN 
        relaciones r1 ON u.user_id = r1.user_child_id
      JOIN 
        relaciones r2 ON r1.user_parent_id = r2.user_child_id
      JOIN 
        users s ON r2.user_parent_id = s.user_id
      WHERE 
        s.role = 'Sucursal' 
        AND r1.sucursal_id = ?
        AND u.role IN ('Cliente', 'Vendedor');
        `,
      [sucursalId, sucursalId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron colaboradores" },
        { status: 404 }
      );
    } else {
      return NextResponse.json({users, message: "Colaboradores encontrados."}, { status: 200 });
    };

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}