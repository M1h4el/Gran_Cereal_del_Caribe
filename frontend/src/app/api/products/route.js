import { NextResponse } from "next/server";
import { queryDB } from "@/lib/dbUtils";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sucursalId = searchParams.get("sucursalId");
    const productCode = searchParams.get("productCode")?.trim(); // opcional

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Sucursal no especificada" },
        { status: 400 }
      );
    }

    let result;

    if (productCode) {
      result = await queryDB(
        "SELECT productCode, name, inventory FROM products WHERE sucursal_id = ? AND productCode = ?",
        [sucursalId, productCode]
      );
    } else {
      result = await queryDB(
        `SELECT p.* 
         FROM products p 
         JOIN sucursales s ON p.sucursal_id = s.sucursal_id 
         WHERE p.sucursal_id = ? 
         ORDER BY p.created_at DESC`,
        [sucursalId]
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sucursalId = searchParams.get("sucursalId");
    const data = await req.json();

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Sucursal no especificada" },
        { status: 400 }
      );
    }

    const {
      productCode,
      name,
      description,
      inventory,
      basePricing,
      BaseSellerPricing,
      detalSellPrice,
      MayorSellPrice,
      updated_at,
    } = data;

    console.log("data", data);

    const result = await queryDB(
      `INSERT INTO products (
        productCode,
        name,
        description,
        inventory,
        basePricing,
        BaseSellerPricing,
        detalSellPrice,
        MayorSellPrice,
        updated_at,
        sucursal_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productCode || null,
        name || null,
        description || null,
        inventory || 0,
        basePricing || null,
        BaseSellerPricing || null,
        detalSellPrice || null,
        MayorSellPrice || null,
        updated_at,
        sucursalId,
      ]
    );

    console.log("result", result);

    return NextResponse.json(
      { message: "Producto insertado correctamente", result },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al insertar producto:", error);
    return NextResponse.json(
      { error: "Error al insertar el producto" },
      { status: 500 }
    );
  }
}
