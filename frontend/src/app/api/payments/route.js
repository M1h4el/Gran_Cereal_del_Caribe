import { queryDB } from "@/lib/dbUtils";
import { NextResponse } from "next/server";

export async function GET() {}

export async function POST(request) {
  try {
    const data = await request.json();

    const { amount, details, paymentMethod, paymentType, user_id, invoice_id } =
      data;

    if ((!amount && paymentType === 'parcial') || !details || !paymentMethod || !paymentType) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos." },
        { status: 400 }
      );
    }

    if (!user_id || !invoice_id) {
      return NextResponse.json(
        { error: "Usuario o factura no especificada." },
        { status: 400 }
      );
    }

    let newAmount;

    if (paymentType === "total") {
      const rows = await queryDB(
        "SELECT amount FROM invoice_payments WHERE invoice_id = ?;",
        [invoice_id]
      );

      if (!rows.length) {
        return NextResponse.json(
          { error: "No se encontró deuda asociada" },
          { status: 404 }
        );
      }

      newAmount = Number(rows[0].amount);
    } else if (paymentType === "parcial" && !isNaN(Number(amount))) {
      newAmount = Number(amount);
    } else {
      return NextResponse.json(
        { error: "Tipo de pago o cantidad inválida." },
        { status: 400 }
      );
    }

    if (newAmount <= 0) {
      return NextResponse.json(
        { error: "La cantidad del pago debe ser mayor a 0." },
        { status: 400 }
      );
    }

    const result = await queryDB(
      "INSERT INTO payments (user_id, invoice_id, method_payment, type, amount, details) VALUES (?, ?, ?, ?, ?, ?)",
      [user_id, invoice_id, paymentMethod, paymentType, newAmount, details]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Error al Registrar Pago" },
        { status: 500 }
      );
    }

    console.log("Pago registrado", result);

    const invoiceData = queryDB(
      "SELECT invoiceCode FROM invoices WHERE invoice_id = ?;",
      [invoice_id]
    );

    const invoiceCode = invoiceData[0].invoiceCode

    if (!invoiceCode) {
      return NextResponse.json(
        {error: "No hay invoice asociado al pago"},
        {status: 404}
      )
    }

    const infoNotification = `${invoiceCode};${newAmount};`
    const infoNotifSucursal = `${paymentType};${amount};${invoiceCode}`

    await queryDB(
      "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?)",
      [user_id, infoNotification, "314"]
    )

    const row = await queryDB(
      "SELECT user_id FROM sucursales s, relaciones r WHERE s.sucursal_id = r.sucursal_id AND r.user_child_id = ?;",
      [user_id]
    )

    if (!row.length) {
      return NextResponse.json(
        { error: "No se encontró sucursal asociada al usuario." },
        { status: 404 }
      )
    }
    const sucursalId = row[0].user_id;

    await queryDB(
      "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?)",
      [sucursalId, infoNotifSucursal, "23"]
    )

    return NextResponse.json(
      { error: "Pago registrado", result },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error en el servidor", error },
      { status: 500 }
    );
  }
}
