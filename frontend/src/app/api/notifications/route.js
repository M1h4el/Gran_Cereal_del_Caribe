import { NextResponse } from "next/server";
import { queryDB } from "@/lib/dbUtils";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id es requerido" }, { status: 400 });
  }

  try {
    const notifications = await queryDB(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
