import { queryDB } from "@/lib/dbUtils";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// ✅ GET: Obtener todos los detalles de una factura
export async function GET(req, { params }) {
  const { invoiceId } = await params;

  try {
    if (invoiceId) {
      const details = await queryDB(
        `SELECT p.productCode, p.name, p.price, ind.idinvoice_detail, ind.quantity, ind.unitPrice, ind.total, p.created_at, p.updated_at  FROM invoice_details ind, products p WHERE ind.idinvoice = ? AND ind.productCode = p.productCode AND ind.state = 0;`,
        [invoiceId]
      );

      if (details.length === 0) {
        return NextResponse.json({error: "Detalles no encontrados"}, {status: 404})
      }

      const paid = await queryDB("SELECT idpayment, method_payment, type, amount, details, date_payment, status FROM payments WHERE invoice_id = ?;", [invoiceId]);

      console.log("allData from details API", details);

      return NextResponse.json({details, paid}, {status: 200});
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

export async function PUT(req, { params }) {
  const { invoiceId } = await params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  console.log("InvoiceId", invoiceId)

  try {
    const body = await req.json();
    const { data, invoiceCode } = body;

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    console.log("data", data)

    const newRows = [];
    const existingRows = [];

    for (const row of data) {
      const { idinvoice_detail, product, quantity, unitPrice, total } = row;

      if (!product || !quantity || !unitPrice || !total) {
        console.log("Fila incompleta, ignorada:", row);
        continue;
      }

      const productCode = product.split(" - ")[0];

      if (!idinvoice_detail || idinvoice_detail.toString().startsWith("temp-")) {
        newRows.push([invoiceId, productCode, quantity, unitPrice, total]);
      } else {
        existingRows.push({ idinvoice_detail, productCode, quantity, unitPrice, total });
      }
    }

    const updated = [];

    // INSERT individual evitando duplicados
    for (const row of newRows) {
      const [idinvoice, productCode, quantity, unitPrice, total] = row;
    
      const result = await queryDB(
        `INSERT INTO invoice_details (idinvoice, productCode, quantity, unitPrice, total)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           quantity = VALUES(quantity),
           unitPrice = VALUES(unitPrice),
           total = VALUES(total)`,
        [idinvoice, productCode, quantity, unitPrice, total]
      );
    
      updated.push({
        idinvoice_detail: result.insertId, // insertId será 0 si se hizo un UPDATE
        idproduct: productCode,
        quantity,
        unitPrice,
        total,
      });
      console.log("Response de inserción:", result);
    }

    // UPDATE múltiples usando CASE WHEN
    if (existingRows.length > 0) {
      const ids = existingRows.map((r) => r.idinvoice_detail);

      const updateQuery = `
        UPDATE invoice_details i
        SET
          productCode = CASE idinvoice_detail
            ${existingRows.map((r) => `WHEN ${r.idinvoice_detail} THEN ${JSON.stringify(r.productCode)}`).join("\n")}
          END,
          quantity = CASE idinvoice_detail
            ${existingRows.map((r) => `WHEN ${r.idinvoice_detail} THEN ${r.quantity}`).join("\n")}
          END,
          unitPrice = CASE idinvoice_detail
            ${existingRows.map((r) => `WHEN ${r.idinvoice_detail} THEN ${r.unitPrice}`).join("\n")}
          END,
          total = CASE idinvoice_detail
            ${existingRows.map((r) => `WHEN ${r.idinvoice_detail} THEN ${r.total}`).join("\n")}
          END
        WHERE idinvoice_detail IN (${ids.join(", ")}) AND i.idinvoice = ?
      `;

      const responseUpdate = await queryDB(updateQuery, [invoiceId]);
      console.log("Response de actualización:", responseUpdate);

      updated.push(...existingRows);
    }

    const init = updated.find(p => p.idinvoice_detail === 0);
    let infoNotification = `${invoiceCode};`

    if (init && init.length > 0) {
      // lógica de notificaciones si es un Update de una factura
      await queryDB(
        "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?);",
        [session.user.role === "Sucursal" && session.user.id, infoNotification, "21"]
      )
    } else {
      // lógica si es una factura nueva
      await queryDB(
        "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?);",
        [session.user.role === "Sucursal" && session.user.id, infoNotification, "20"]
      )
    }

    return NextResponse.json({ updated }, {status: 201});
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar detalles" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { invoiceId } = await params;

  try {
    const body = await req.json();
    const { data } = body;

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    console.log("Data from DELETE", data);

    if (data.length === 0) {
      return NextResponse.json({ error: "No se proporcionaron filas para eliminar" }, { status: 400 });
    }

    const validIds = data.filter((id) => !isNaN(id));
    if (validIds.length === 0) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    const placeholders = validIds.map(() => "?").join(", ");
    const query = `
      DELETE FROM invoice_details
      WHERE idinvoice_detail IN (${placeholders}) AND idinvoice = ?
    `;

    const result = await queryDB(query, [...validIds, invoiceId]);

    return NextResponse.json({
      deletedCount: result.affectedRows,
      deletedIds: validIds,
    });
  } catch (error) {
    console.error("Error en DELETE invoice_details:", error);
    return NextResponse.json({ error: "Error al eliminar detalles" }, { status: 500 });
  }
}

