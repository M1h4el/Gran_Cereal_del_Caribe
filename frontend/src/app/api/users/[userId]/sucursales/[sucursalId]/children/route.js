import { queryDB } from "@/lib/dbUtils";

export async function GET(req, { params }) {
  try {
    if (!params || !params.userId || !params.sucursalId) {
      return Response.json(
        { error: "Usuario o sucursal no especificados" },
        { status: 400 }
      );
    }
    const { userId, sucursalId } = params;
    if (!userId || !sucursalId) {
      return Response.json(
        { error: "Usuario o sucursalId no especificado" },
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
          WHERE 
            r.user_parent_id = ? AND r.sucursal_id = ?
      
          UNION
      
          SELECT 
            u.user_id, u.userName, u.role, u.address, u.phone, u.bought_sold
          FROM 
            users u
          JOIN 
            relaciones r1 ON u.user_id = r1.user_child_id
          JOIN 
            relaciones r2 ON r1.user_parent_id = r2.user_child_id
          WHERE 
            r2.user_parent_id = ? AND r1.sucursal_id = ?;
        `,
        [userId, sucursalId, userId, sucursalId]
      );

    return Response.json(users);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}