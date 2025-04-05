import { queryDB } from "@/lib/dbUtils";

export async function GET(req, { params }) {
  try {
    if (!params || !params.collaboratorId) {
      return Response.json(
        { error: "Usuario o sucursal no especificados" },
        { status: 400 }
      );
    }
    const { collaboratorId } = params;
    if (!collaboratorId) {
      return Response.json(
        { error: "Usuario no especificado" },
        { status: 400 }
      );
    }
    const users = await queryDB(
        `SELECT * FROM invoices i WHERE user_seller_id = ?;;
        `,
        [collaboratorId]
      );

    return Response.json(users);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}