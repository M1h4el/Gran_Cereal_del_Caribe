import { NextResponse } from "next/server";
import { queryDB } from "@/lib/dbUtils";

// 🔹 Obtener productos de una sucursal (por sucursalId)
export async function GET(req) {
  
  try {
    const { searchParams } = new URL(req.url);
    const sucursalId = searchParams.get("sucursalId");
    const productCode = searchParams.get("productCode"); // opcional

    if (!sucursalId) {
      return NextResponse.json({ error: "Sucursal no especificada" }, { status: 400 });
    }

    let result;

    if (productCode) {
      result = await queryDB(
        "SELECT productCode, name, inventory FROM products WHERE sucursal_id = ? AND productCode = ?",
        [sucursalId, productCode]
      );
    } else {
      result = await queryDB(
        "SELECT * FROM products WHERE sucursal_id = ? ORDER BY created_at DESC",
        [sucursalId]
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}