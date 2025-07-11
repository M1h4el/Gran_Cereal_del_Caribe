import { queryDB } from "@/lib/dbUtils";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/authOptions";

function generateCode(length = 10) {
  return Math.random().toString(36).substr(2, length).toUpperCase();
}

async function generateUniqueCollaboratorCode() {
  let code,
    isUnique = false;
  while (!isUnique) {
    code = generateCode();
    const check = await queryDB(
      "SELECT idpayment FROM payments WHERE paymentCode = ?;",
      [code]
    );
    isUnique = check.length === 0;
  }
  return code;
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "Cliente") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("searchByUser");
    const type = searchParams.get("type");

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere ID válido" },
        { status: 400 }
      );
    }

    let payments;

    if (type === "Sucursal") {
      const [userId] = await queryDB(
        "SELECT user_id from sucursales WHERE sucursal_id = ?;",
        [id]
      );

      if (!userId.user_id) {
        return NextResponse.json(
          { error: "Sucursal no encontrada" },
          { status: 404 }
        );
      }

      payments = await queryDB(
        "SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC;",
        [userId.user_id]
      );

      if (payments.length === 0) {
        return NextResponse.json(
          { payments: [] },
          { status: 404 }
        );
      }
    } else if (type === "Admin" || type === "settlementSeller") {
      payments = await queryDB(
        "SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC;",
        [id]
      );

      if (payments.length === 0) {
        return NextResponse.json(
          { payments: [] },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error en el servidor", error },
      { status: 500 }
    );
  }
}

// Necesitas ajustar la variable typePost según el contexto de la App

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ("Admin" || "Sucursal")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const {
      date,
      amount,
      details,
      paymentMethod,
      paymentType,
      user_id,
      invoice_id,
      typePost = "customerPayment",
    } = data;

    console.log("data", data);

    if (
      (!amount && paymentType === "parcial") ||
      !details ||
      !paymentMethod ||
      !paymentType
    ) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos." },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: "Usuario no especificado." },
        { status: 400 }
      );
    }

    let newAmount;

    if (typePost === "customerPayment") {
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
    } else {
      if (
        (paymentType === "total" || paymentType === "parcial") &&
        !isNaN(Number(amount))
      ) {
        newAmount = Number(amount);
      } else {
        return NextResponse.json(
          { error: "Tipo de pago o cantidad inválida." },
          { status: 400 }
        );
      }
    }

    if (newAmount <= 0) {
      return NextResponse.json(
        { error: "La cantidad del pago debe ser mayor a 0." },
        { status: 400 }
      );
    }

    const generatedCode = await generateUniqueCollaboratorCode();
    if (!generatedCode) {
      return NextResponse.json(
        { error: "Error al generar código de pago único." },
        { status: 500 }
      );
    }

    let result;

    if (
      typePost === "customerPayment" &&
      (session.user.role === "Admin" || session.user.role === "Sucursal")
    ) {
      result = await queryDB(
        "INSERT INTO payments (user_id, invoice_id, method_payment, type, amount, details, date_payment, paymentCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
        [
          user_id,
          invoice_id,
          paymentMethod,
          paymentType,
          newAmount,
          details,
          date,
          generatedCode,
        ]
      );

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: "Error al Registrar Pago" },
          { status: 500 }
        );
      }

      console.log("Pago registrado", result);

      const invoiceData = await queryDB(
        "SELECT invoiceCode FROM invoices WHERE invoice_id = ?;",
        [invoice_id]
      );

      if (!invoiceData.length) {
        return NextResponse.json(
          { error: "No hay invoice asociado al pago" },
          { status: 404 }
        );
      }

      const invoiceCode = invoiceData[0].invoiceCode;

      const infoNotification = `${invoiceCode};${newAmount};`;
      const infoNotifSucursal = `${paymentType};${amount};${invoiceCode}`;

      await queryDB(
        "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?)",
        [user_id, infoNotification, "314"]
      );

      const row = await queryDB(
        "SELECT user_id FROM sucursales s, relaciones r WHERE s.sucursal_id = r.sucursal_id AND r.user_child_id = ?;",
        [user_id]
      );

      if (!row.length) {
        return NextResponse.json(
          { error: "No se encontró sucursal asociada al usuario." },
          { status: 404 }
        );
      }

      const sucursalId = row[0].user_id;

      await queryDB(
        "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?)",
        [sucursalId, infoNotifSucursal, "23"]
      );
    } else if (
      typePost === "sucursalPayment" &&
      session.user.role === "Admin"
    ) {
      result = await queryDB(
        `INSERT INTO payments (user_id, method_payment, type, amount, details, paymentCode, date_payment)
        SELECT s.user_id, ?, ?, ?, ?, ?, ?
        FROM sucursales s
        WHERE s.sucursal_id = ?;`,
        [paymentMethod, paymentType, newAmount, details, generatedCode, date, user_id] // ← acá 'user_id' debe ser en realidad el 'sucursal_id'
      );

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: "Error al Registrar Pago" },
          { status: 500 }
        );
      }

      console.log("Pago registrado", result);
    } else if (typePost === "adminPayment" && session.user.role === "Admin") {
      result = await queryDB(
        `INSERT INTO payments (user_id, method_payment, type, amount, details, paymentCode, date_payment)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [user_id, paymentMethod, paymentType, newAmount, details, generatedCode, date]
      );
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: "Error al Registrar Pago" },
          { status: 500 }
        );
      }

      console.log("Pago registrado", result);
    } else if (
      typePost === "settlementSellerPayment" &&
      (session.user.role === "Admin" || session.user.role === "Sucursal")
    ) {
      result = await queryDB(
        `INSERT INTO payments (user_id, method_payment, type, amount, details, paymentCode, date_payment)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [user_id, paymentMethod, paymentType, newAmount, details, generatedCode, date]
      );
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: "Error al Registrar Pago" },
          { status: 500 }
        );
      }

      console.log("Pago registrado", result);
    } else {
      return NextResponse.json(
        { error: "No autorizado para este proceso." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: "Pago registrado", result },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error en el servidor", error },
      { status: 500 }
    );
  }
}
