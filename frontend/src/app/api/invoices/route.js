import { queryDB } from "@/lib/dbUtils";
import { NextResponse } from "next/server";

function generateCode(length = 10) {
  return Math.random().toString(36).substr(2, length).toUpperCase();
}

async function generateUniqueInvoiceCode() {
  let code,
    isUnique = false;
  while (!isUnique) {
    code = generateCode();
    const check = await queryDB(
      "SELECT user_id FROM users WHERE codeCollaborator = ?",
      [code]
    );
    isUnique = check.length === 0;
  }
  return code;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceCode = searchParams.get("invoiceCode")?.trim();

    if (!invoiceCode) {
      return NextResponse.json({ error: "Falta el código de factura" }, { status: 400 });
    }

    const result = await queryDB(
      "SELECT * FROM invoices WHERE invoiceCode = ?;",
      [invoiceCode]
    );

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    const invoice = result[0];

    const users = await queryDB(
      "SELECT user_id, userName, address, phone, role FROM users WHERE user_id = ? OR user_id = ?",
      [invoice.user_seller_id, invoice.user_buyer_id]
    );

    const seller = users.find(u => u.user_id === invoice.user_seller_id) || {};
    const buyer = users.find(u => u.user_id === invoice.user_buyer_id) || {};

    const responseData = {
      ...invoice,
      sellerName: seller.userName || null,
      sellerRole: seller.role || null,
      userClientName: buyer.userName || null,
      userClientAddress: buyer.address || null,
      userClientPhone: buyer.phone || null,
      buyerRole: buyer.role || null,
    };

    console.log("response factura por código", responseData)
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error("Error al obtener factura:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req) {

  const body = await req.json();

  const {
    invoiceCode = null,
    email,
    state,
    deliveryDate: rawDeliveryDate,
    details = null,
    collaboratorId,
  } = body;
  
  const deliveryDate = rawDeliveryDate === '' ? null : rawDeliveryDate;

  try {
    if (!email || !state || !collaboratorId) {
      console.log("Faltan datos requeridos", body);
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }
    
    const userBuyer = await queryDB(
      `SELECT user_id, userName, codeCollaborator, address, phone FROM users WHERE email = ?;`,
      [email]
    );
    if (userBuyer.length === 0) {
      return NextResponse.json(
        { error: "El usuario no existe" },
        { status: 404 }
      );
    }

    console.log("userBuyer", userBuyer[0].user_id);

    const generatedCode = await generateUniqueInvoiceCode();

    const userBuyerId = userBuyer[0].user_id;
    const userBuyerName = userBuyer[0].userName;
    const userBuyerCode = userBuyer[0].codeCollaborator;
    const userBuyerAddress = userBuyer[0].address;
    const userBuyerPhone = userBuyer[0].phone;

    const invoiceCreated = await queryDB(
      `INSERT INTO invoices (user_seller_id, user_buyer_id, state, delivery_date, details, invoiceCode) VALUES (?, ?, ?, ?, ?, ?);`,
      [collaboratorId, userBuyerId, state, deliveryDate, details, generatedCode]
    );

    if (invoiceCreated.affectedRows === 0) {
      return NextResponse.json(
        { error: "Error al crear factura" },
        { status: 500 }
      );
    }
    console.log("Factura creada", invoiceCreated);
    const invoiceId = invoiceCreated.insertId;

    const rowNewInvoice = await queryDB(
      `SELECT * FROM invoices WHERE invoice_id = ?;`,
      [invoiceId]
    );
    if (rowNewInvoice.length === 0) {
      return NextResponse.json(
        { error: "Error al obtener factura" },
        { status: 500 }
      );
    }
    const invoice = rowNewInvoice[0];
    invoice["userClientName"] = userBuyerName;
    invoice["userClientCode"] = userBuyerCode;
    invoice["userClientAddress"] = userBuyerAddress;
    invoice["userClientPhone"] = userBuyerPhone;

    return NextResponse.json(
      { message: "Factura registrada con éxito", invoice },
      { status: 201 },
    );
    
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al registrar factura" },
      { status: 500 }
    );
  }
}
