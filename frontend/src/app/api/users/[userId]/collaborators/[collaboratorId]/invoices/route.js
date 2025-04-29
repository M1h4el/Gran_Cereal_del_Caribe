import { queryDB } from "@/lib/dbUtils";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {

    const {collaboratorId} = await params

    if (!params || !collaboratorId) {
      return NextResponse.json(
        { error: "Usuario o sucursal no especificados" },
        { status: 400 }
      );
    }

    const invoices = await queryDB(
      `SELECT * FROM invoices i WHERE i.user_seller_id = ?;`,
      [collaboratorId]
      );
    if (invoices.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron facturas" },
        { status: 404 }
      );
    }
    console.log("Invoices", invoices);

    const userClients = await Promise.all(
      invoices.map(async (invoice) => {
      const userClient = await queryDB(
        `SELECT userName FROM users u WHERE u.user_id = ?;`,
        [invoice.user_buyer_id]
      );
      return {
        invoice,
        userClientName: userClient[0]?.userName || null
      };
      })
    );

    console.log("User Clients with Invoices", userClients);

    return NextResponse.json(userClients, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}