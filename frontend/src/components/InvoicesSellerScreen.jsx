"use client";

import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useSession } from "next-auth/react";
import { fetchData } from "../../utils/api";
import "@/styles/InvoicesSellerScreen.scss";

const InvoicesSellerScreen = ({ collaboratorId, invoice }) => {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    async function fetchInvoices() {
      if (!session?.user || !collaboratorId?.id) return;

      try {
        const res = await fetchData(
          `/users/${session.user.id}/collaborators/${collaboratorId.id}/invoices`,
          "GET",
          null
        );

        if (res.length === 0) console.log("No se encontraron facturas.");
        if (res.error) console.error("Error:", res.error);

        const formatted = res.map((el) => ({
          ...el,
          created_at: new Date(el.created_at).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "America/Bogota",
          }),
        }));

        setInvoices(formatted);
      } catch (error) {
        console.error("Error cargando las facturas:", error);
      }
    }

    fetchInvoices();
  }, [session, collaboratorId]);

  const columns = [
    {
      header: "#",
      cell: (info) => info.row.index + 1,
    },
    {
      accessorKey: "created_at",
      header: "Fecha",
    },
    {
      accessorKey: "user_buyer_id",
      header: "Código de Cliente",
    },
    {
      accessorKey: "total_net",
      header: "Valor Neto",
      cell: (info) => `$${info.getValue()}`,
    },
    {
      accessorKey: "state",
      header: "Pago",
      cell: (info) => (info.getValue() === "pending" ? "N" : "S"),
    },
    {
      accessorKey: "deliveryDate",
      header: "Fecha de Entrega",
      cell: (info) => info.getValue() ?? "--",
    },
    {
      accessorKey: "sold_out",
      header: "Liquidado",
      cell: (info) => (info.getValue() === "pending" ? "N" : "S"),
    },
  ];

  const table = useReactTable({
    data: invoices,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleRowClick = (row) => {
    if (invoice) {
      invoice(row.original);
    } else {
      console.error("handleRoute no está definido");
    }
  };

  return (
    <div className="table-container">
      <h2>Facturas del vendedor: {collaboratorId?.name}</h2>

      <input
        type="text"
        placeholder="Buscar..."
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="search-input"
      />

      <table className="collaborators-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: "pointer", position: "relative" }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() && (
                    <span
                      className={`sort-arrow ${header.column.getIsSorted()}`}
                    />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} onClick={() => handleRowClick(row)}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination-controls">
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Anterior
        </button>
        <span>
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default InvoicesSellerScreen;
