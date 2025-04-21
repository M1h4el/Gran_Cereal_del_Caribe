import { NextResponse } from "next/server";
import { queryDB } from "@/lib/dbUtils";
import generateCode from "../../../../utils/generateCode";

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
        "SELECT productCode, name, inventory FROM products WHERE sucursal_id = ? AND productCode = ? AND status = 'active'",
        [sucursalId, productCode]
      );
    } else {
      result = await queryDB(
        `SELECT p.* 
         FROM products p 
         JOIN sucursales s ON p.sucursal_id = s.sucursal_id 
         WHERE p.sucursal_id = ? AND p.status = 'active'
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

export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sucursalId = searchParams.get("sucursalId");

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Sucursal no especificada" },
        { status: 400 }
      );
    }

    const { data } = await req.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    console.log("Productos recibidos:", data);

    const insertedProducts = [];
    const updatedProducts = [];

    for (const product of data) {
      const {
        id,
        idproduct,
        name,
        description,
        inventory,
        basePricing,
        BaseSellerPricing,
        updated_at,
        price,
      } = product;

      if (!name || !price) {
        console.log("Producto incompleto, omitido:", product);
        continue;
      }

      if (id && id.toString().startsWith("temp-") && !idproduct) {
        // Lógica para nuevos productos (no existe idproduct)
        let productCode;
        let isUnique = false;

        // Generación de un productCode único
        while (!isUnique) {
          productCode = generateCode();
          const [existing] = await queryDB(
            `SELECT productCode FROM products WHERE productCode = ?`,
            [productCode]
          );
          if (!existing) isUnique = true;
        }

        // Inserción de nuevo producto
        const result = await queryDB(
          `INSERT INTO products (
            productCode,
            name,
            description,
            inventory,
            basePricing,
            BaseSellerPricing,
            updated_at,
            sucursal_id,
            price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            productCode,
            name || null,
            description || null,
            inventory || 0,
            basePricing || null,
            BaseSellerPricing || null,
            updated_at,
            sucursalId,
            price || null,
          ]
        );

        if (result.affectedRows) {
          console.log("Producto insertado:", productCode);
          insertedProducts.push({
            id: result.insertId,
            productCode,
            name,
            price,
          });
        } else {
          console.log("Error al insertar el producto:", productCode);
        }
      } else if (idproduct) {
        // Lógica para actualizar productos existentes
        const updateQuery = `
          UPDATE products
          SET
            name = ?,
            description = ?,
            inventory = ?,
            basePricing = ?,
            BaseSellerPricing = ?,
            updated_at = ?,
            price = ?
          WHERE idproduct = ? AND sucursal_id = ?`;

        const result = await queryDB(updateQuery, [
          name || null,
          description || null,
          inventory || 0,
          basePricing || null,
          BaseSellerPricing || null,
          updated_at,
          price || null,
          idproduct,
          sucursalId,
        ]);

        if (result.affectedRows) {
          console.log("Producto actualizado:", idproduct);
          updatedProducts.push({
            idproduct,
            name,
            price,
          });
        } else {
          console.log("Error al actualizar el producto:", idproduct);
        }
      }
    }

    return NextResponse.json(
      { message: "Productos procesados correctamente", insertedProducts, updatedProducts },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al procesar productos:", error);
    return NextResponse.json(
      { error: "Error al procesar los productos" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const { searchParams } = new URL(req.url);
  const sucursal_id = searchParams.get("sucursalId");

  if (!sucursal_id) {
    return NextResponse.json(
      { error: "Sucursal ID es obligatorio" },
      { status: 400 }
    );
  }

  try {
    const { data } = await req.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron filas para eliminar" },
        { status: 400 }
      );
    }

    // Validación de IDs numéricos
    const validIds = data
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id));
    if (validIds.length === 0) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Armado dinámico del query
    const placeholders = validIds.map(() => "?").join(", ");
    const query = `UPDATE products SET status = 'inactive' WHERE idproduct IN (${placeholders}) AND sucursal_id = ?`;
    
    const result = await queryDB(query, [...validIds, sucursal_id]);

    return NextResponse.json({
      deletedCount: result.affectedRows || 0,
      deletedIds: validIds,
    });
  } catch (error) {
    console.error("Error al eliminar productos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
