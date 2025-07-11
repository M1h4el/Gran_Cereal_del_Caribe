import { queryDB } from "@/lib/dbUtils";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/authOptions";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const searchById = searchParams.get("searchById");
  const screen = searchParams.get("screen") || "sucursales";

  if (!searchById)
    return NextResponse.json(
      { error: "Se requiere searchById" },
      { status: 400 }
    );

  try {
    // Pantalla de Sucursales
    if (
      (session.user.role === "Admin" || session.user.role === "Sucursal") &&
      screen === "sucursales"
    ) {
      const [params] = await queryDB(
        "SELECT SUM(si.settlement) AS total_profit, SUM(si.admin_debt) AS total_admin_factory_debt, SUM(si.total_net) AS total_sucursal_admin_debt FROM supplyinvoices si WHERE si.user_id = ?;",
        [searchById]
      );

      if (!params) {
        return NextResponse.json(
          { error: "No se encontraron datos" },
          { status: 404 }
        );
      }

      const total_sucursal_admin_debt = Number(
        params.total_sucursal_admin_debt || 0
      );
      const total_admin_profit = Number(params.total_profit || 0);
      const total_admin_factory_debt = Number(
        params.total_admin_factory_debt || 0
      );

      return NextResponse.json(
        {
          params: {
            total_sucursal_admin_debt,
            total_admin_profit,
            total_admin_factory_debt,
          },
        },
        { status: 200 }
      );
    }

    // Pantalla sellerInvoicesScreen
    if (session.user.role !== "Cliente" && screen === "sellerInvoiceScreen") {
      const [stats] = await queryDB(
        `
        SELECT 
          SUM(CASE WHEN i.sold_out = 'confirmed' THEN i.total_net ELSE 0 END) AS confirmed_total_sales,
          SUM(CASE WHEN i.sold_out = 'confirmed' THEN (p.price - p.BaseSellerPricing) * d.quantity ELSE 0 END) AS confirmed_total_utility,
          SUM(CASE WHEN i.sold_out = 'pending' THEN i.total_net ELSE 0 END) AS pending_total_sales,
          SUM(CASE WHEN i.sold_out = 'pending' THEN (p.price - p.BaseSellerPricing) * d.quantity ELSE 0 END) AS pending_total_utility
        FROM invoices i
        JOIN invoice_details d ON i.invoice_id = d.idinvoice
        JOIN products p ON d.productCode = p.productCode
        WHERE i.user_seller_id = ?;
        `,
        [searchById]
      );

      if (!stats) {
        return NextResponse.json(
          { error: "No se encontraron estadísticas" },
          { status: 404 }
        );
      }

      const [settlements] = await queryDB(
        "SELECT IFNULL(SUM(amount), 0) AS total_settlementsPaid FROM payments WHERE user_id = ?;",
        [searchById]
      )

      if (!settlements) {
        return NextResponse.json(
          { total_settlementsPaid: [] },
          { status: 404 }
        )
      }

      const result = {
        confirmed: {
          total_settlementsPaid: Number(settlements.total_settlementsPaid || 0),
          total_sales: Number(stats.confirmed_total_sales || 0),
          total_utility: Number(stats.confirmed_total_utility || 0),
        },
        pending: {
          total_sales: Number(stats.pending_total_sales || 0),
          total_utility: Number(stats.pending_total_utility || 0),
        },
      };

      console.log("Estadísticas finales", result);

      return NextResponse.json(
        { stats: result, message: "Estadísticas del vendedor obtenidas" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "No autorizado o pantalla no válida" },
      { status: 403 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
