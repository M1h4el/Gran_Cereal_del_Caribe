import { queryDB } from "@/lib/dbUtils";
import { NextResponse } from "next/server";

// ✅ GET: Obtener todos los detalles de una factura
export async function GET(req, { params }) {
  const { invoiceId } = await params;

  try {
    if (invoiceId) {
      const details = await queryDB(
        `SELECT p.productCode, p.name, p.price, ind.idinvoice_detail, ind.idproduct, ind.quantity, ind.unitPrice, ind.subTotal, p.created_at, p.updated_at  FROM invoice_details ind, products p WHERE ind.idinvoice = 2 AND ind.idproduct = p.idproduct;`,
        [invoiceId]
      );
      return NextResponse.json(details);
    } else {
      return NextResponse.json(
        { error: "Invoice Id no especificado" },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener detalles" },
      { status: 500 }
    );
  }
}

// ✅ POST: Crear un nuevo detalle
export async function POST(request, { params }) {
  const { invoiceId } = params;
  const body = await request.json();
  const { idproduct, quantity, productType, unitPrice, subTotal } = body;

  try {
    const result = await queryDB(
      `INSERT INTO invoice_details (idinvoice, idproduct, quantity, productType, unitPrice, subTotal, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [invoiceId, idproduct, quantity, productType, unitPrice, subTotal]
    );

    return NextResponse.json(
      { message: "Detalle creado", id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear detalle" },
      { status: 500 }
    );
  }
}

// ✅ PUT: Actualizar un detalle existente
export async function PUT(request, { params }) {
  const { invoiceId } = params;
  const body = await request.json();
  const { id, idproduct, quantity, productType, unitPrice, subTotal } = body;

  try {
    await queryDB(
      `UPDATE invoice_details
       SET idinvoice = ?, idproduct = ?, quantity = ?, productType = ?, unitPrice = ?, subTotal = ?, updated_at = NOW()
       WHERE id = ?`,
      [invoiceId, idproduct, quantity, productType, unitPrice, subTotal, id]
    );

    return NextResponse.json({ message: "Detalle actualizado" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar detalle" },
      { status: 500 }
    );
  }
}

// ✅ DELETE: Eliminar un detalle
export async function DELETE(request, { params }) {
  const { id } = await request.json();

  try {
    await queryDB(`DELETE FROM invoice_details WHERE id = ?`, [id]);
    return NextResponse.json({ message: "Detalle eliminado correctamente." });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar detalle" },
      { status: 500 }
    );
  }
}
