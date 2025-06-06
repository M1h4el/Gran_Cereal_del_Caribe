import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/authOptions";
import { NextResponse } from "next/server";
import { queryDB } from "@/lib/dbUtils";
import { pool } from "@/lib/db";

function generateCode(length = 10) {
  return Math.random().toString(36).substr(2, length).toUpperCase();
}

async function generateUniqueInvoiceCode() {
  let code,
    isUnique = false;
  while (!isUnique) {
    code = generateCode();
    const check = await queryDB(
      "SELECT idsupply_invoice FROM supplyinvoices WHERE invoiceCode = ?",
      [code]
    );
    isUnique = check.length === 0;
  }
  return code;
}

export async function GET(req) {}

export async function POST(req) {
  let connection;
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (session.user.role === "admin") {
      return NextResponse.json(
        { error: "Acción no permitida para administradores" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { supply, totalSold, totalDebt, totalUtility } = body;

    if (!Array.isArray(supply)) {
      return NextResponse.json(
        { error: "Supply debe ser un array" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const generatedCode = await generateUniqueInvoiceCode();
      const [invoiceResult] = await connection.execute(
        "INSERT INTO supplyinvoices (user_id, invoiceCode, total_net, settlement, admin_debt) VALUES (?, ?, ?, ?, ?)",
        [session.user.id, generatedCode, totalSold, totalUtility, totalDebt]
      );

      // 2. Preparar inserción masiva de detalles
      const detailValues = supply.map((product) => {
        if (!product.name.includes(" - ")) {
          throw new Error(`Formato de nombre inválido: ${product.name}`);
        }

        const [productCode] = product.name.split(" - ");
        const price = Number(product.price);
        if (isNaN(price)) throw new Error(`Precio inválido: ${product.price}`);

        return [
          invoiceResult.insertId,
          productCode,
          product.quantity,
          price,
          price * product.quantity,
        ];
      });

      // 3. Construir y ejecutar consulta masiva
      if (detailValues.length > 0) {
        const placeholders = detailValues
          .map(() => "(?, ?, ?, ?, ?)")
          .join(", ");
        const query = `
          INSERT INTO supplyinvoices_details 
          (idsupply_invoice, productCode, quantity, unit_price, total) 
          VALUES ${placeholders}
        `;
        await connection.execute(query, detailValues.flat());
      }

      const infoNotification = `${generatedCode};`;

      await queryDB(
        "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?);",
        [session.user.id, infoNotification, "14"]
      );

      const idParentList = await queryDB(
        "SELECT user_admin_id FROM sucursales WHERE user_child_id = ?;",
        [session.user.id]
      );

      const userParentId = idParentList[0].user_admin_id;

      const infoNotificationParent = `${session.user.userName};`;

      await queryDB(
        "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?);",
        [userParentId, infoNotificationParent, "113"]
      );

      await connection.commit();

      return NextResponse.json(
        {
          success: true,
          invoiceId: invoiceResult.insertId,
          invoiceCode: generatedCode,
        },
        { status: 200 }
      );
    } catch (error) {
      await connection.rollback();
      console.error("Error en transacción:", error);
      return NextResponse.json(
        {
          error: "Error al procesar la orden",
          details:
            process.env.NODE_ENV === "development" ? error.message : null,
        },
        { status: 500 }
      );
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("Error general:", error);
    return NextResponse.json(
      {
        error: "Error en el servidor",
        details: process.env.NODE_ENV === "development" ? error.message : null,
      },
      { status: 500 }
    );
  }
}
