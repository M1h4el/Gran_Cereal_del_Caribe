import { queryDB } from "@/lib/dbUtils";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { userId, sucursalId } = await params;

    if (!userId || !sucursalId) {
      return Response.json(
        { error: "Usuario o sucursal inválidos" },
        { status: 400 }
      );
    }

    const users = await queryDB(
      `SELECT 
        u.user_id,
        u.codeCollaborator,
        u.userName,
        u.role,
        u.address,
        u.country,
        u.region,
        u.city,
        u.postalcode,
        u.phone,
        u.bought_sold,
        IFNULL(d.total_amount, 0) AS total_settlementUser,
        IFNULL(d.pending_amount, 0) AS pending_debt,
        IFNULL(inv.confirmed_sold_total, 0) AS total_paidUser
      FROM 
        users u
      JOIN 
        relaciones r ON u.user_id = r.user_child_id
      JOIN 
        users s ON r.user_parent_id = s.user_id
      LEFT JOIN (
        SELECT 
          from_user,
          SUM(amount) AS total_amount,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_amount
        FROM debts
        GROUP BY from_user
      ) d ON d.from_user = u.user_id
      LEFT JOIN (
        SELECT user_seller_id, SUM(total_net) AS confirmed_sold_total
        FROM invoices
        WHERE sold_out = 'confirmed'
        GROUP BY user_seller_id
      ) inv ON inv.user_seller_id = u.user_id
      WHERE 
        s.role = 'Sucursal'
        AND r.sucursal_id = ?
        AND u.role IN ('Cliente', 'Vendedor')

      UNION

      SELECT 
        u.user_id,
        u.codeCollaborator,
        u.userName, 
        u.role, 
        u.address,
        u.country,
        u.region,
        u.city,
        u.postalcode,
        u.phone, 
        u.bought_sold,
        IFNULL(d.total_amount, 0) AS total_settlementUser,
        IFNULL(d.pending_amount, 0) AS pending_debt,
        IFNULL(inv.confirmed_sold_total, 0) AS confirmed_sold_total
      FROM 
        users u
      JOIN 
        relaciones r1 ON u.user_id = r1.user_child_id
      JOIN 
        relaciones r2 ON r1.user_parent_id = r2.user_child_id
      JOIN 
        users s ON r2.user_parent_id = s.user_id
      LEFT JOIN (
        SELECT 
          from_user,
          SUM(amount) AS total_amount,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_amount
        FROM debts
        GROUP BY from_user
      ) d ON d.from_user = u.user_id
      LEFT JOIN (
        SELECT user_seller_id, SUM(total_net) AS confirmed_sold_total
        FROM invoices
        WHERE sold_out = 'confirmed'
        GROUP BY user_seller_id
      ) inv ON inv.user_seller_id = u.user_id
      WHERE 
        s.role = 'Sucursal' 
        AND r1.sucursal_id = ?
        AND u.role IN ('Cliente', 'Vendedor');
  `,
      [sucursalId, sucursalId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron colaboradores" },
        { status: 404 }
      );
    }

    const utilities = await queryDB(
      `
        SELECT 
          i.user_seller_id,
          COUNT(DISTINCT i.invoice_id) AS invoice_count,
          SUM(i.total_net) AS total_sales,
          SUM((p.price - p.BaseSellerPricing) * d.quantity) AS total_utility,
          SUM(p.baseSucursalPricing * d.quantity) AS payment_sucAdmin
        FROM 
          invoices i
        JOIN 
          invoice_details d ON i.invoice_id = d.idinvoice
        JOIN 
          products p ON d.productCode = p.productCode
        WHERE 
          i.sold_out = 'confirmed'
          AND i.user_seller_id IN (
            SELECT u.user_id
            FROM users u
            JOIN relaciones r ON u.user_id = r.user_child_id
            WHERE r.sucursal_id = ?
            AND u.role = 'Vendedor'
            UNION
            SELECT u.user_id
            FROM users u
            JOIN relaciones r1 ON u.user_id = r1.user_child_id
            JOIN relaciones r2 ON r1.user_parent_id = r2.user_child_id
            WHERE r2.sucursal_id = ?
            AND u.role = 'Vendedor'
          )
        GROUP BY i.user_seller_id
      `,
      [sucursalId, sucursalId]
    );

    // Mapear utilidades por user_id
    const utilityMap = {};
    utilities.forEach((u) => {
      utilityMap[u.user_seller_id] = {
        total_utility: Number(u.total_utility || 0),
        payment_sucAdmin: Number(u.payment_sucAdmin || 0),
        total_sales: Number(u.total_sales || 0),
        invoice_count: Number(u.invoice_count || 0),
      };
    });

    const confirmedResult = users.map((user) => {
      const utility = utilityMap[user.user_id] || {
        total_utility: 0,
        payment_sucAdmin: 0,
        total_sales: 0,
        invoice_count: 0,
      };

      return {
        ...user,
        total_paidUser: user.total_paidUser || 0,
        total_settlementUser: user.total_settlementUser || 0,
        bought_sold: user.bought_sold || 0,
        total_utilitySuc: utility.total_utility,
        payment_sucAdmin: utility.payment_sucAdmin,
        total_sales: utility.total_sales,
        invoice_count: utility.invoice_count,
      };
    });

    const paymentsDone = await queryDB(
      "SELECT * FROM payments p JOIN sucursales s ON s.user_id = p.user_id WHERE s.sucursal_id = ?;",
      [sucursalId]
    )

    console.log("confirmedResult", confirmedResult, paymentsDone);

    return NextResponse.json(
      { users: confirmedResult, paymentsDone, message: "Colaboradores encontrados." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}