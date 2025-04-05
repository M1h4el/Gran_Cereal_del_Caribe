"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { fetchData } from "../../utils/api";
import { useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";
import "@/styles/SellersScreen.scss";

const SellersScreen = ({ sucursalId, collaborator }) => {
  const { data: session } = useSession();
  const [colaboradores, setColaboradores] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  useEffect(() => {
    async function fetchCollaborators() {
      if (!session?.user) return;

      try {
        const res = await fetchData(
          `/users/${session.user.id}/sucursales/${sucursalId}/children`,
          "GET",
          null
        );

        if (res.length === 0) console.log("No se encontraron colaboradores.");
        if (res.error) console.error("Error:", res.error);

        setColaboradores(res);
      } catch (error) {
        console.error("Error cargando las sucursales:", error);
      }
    }

    fetchCollaborators();
  }, [session]);

  function handleRowClick(row) {
    if (collaborator) {
      const cardObject = {
        id: row?.user_id,
        name: row?.userName,
        role: row?.role,
      };
      collaborator(cardObject);
    } else {
      console.error("handleRoute no está definido");
    }
  }

  const columns = useMemo(() => [
    { header: "#", accessorKey: "index" },
    { header: "Nombre", accessorKey: "userName" },
    { header: "Tipo", accessorKey: "role" },
    { header: "Compras/Ventas ($)", accessorKey: "bought_sold" },
    { header: "Ubicación", accessorKey: "location" },
    { header: "Teléfono", accessorKey: "phone" },
  ], []);

  const data = useMemo(() =>
    colaboradores.map((colab, index) => ({ ...colab, index: index + 1 })),
    [colaboradores]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 15 },
    },
  });

  return (
    <div className="sellers-screen">
      <section className="section1">
        <div className="MenuProjectSection">
          <div className="infoContainer">
            <h2>Total</h2>
            <div className="infoBox">
              <div className="infoRow">
                <div>Compras</div>
                <div>Ventas</div>
                <div>Compras</div>
                <div>Liquidado</div>
              </div>
              <div className="valueRow">
                <div>$0</div>
                <div>$0</div>
                <div>$0</div>
                <div>$0</div>
              </div>
            </div>
          </div>
          <div className="codingContainer">
            <h2>Añadir Colaborador</h2>
            <div className="codingBox"></div>
          </div>
        </div>
      </section>

      <section className="section2">
        <div className="table-container">
          <h2>Colaboradores</h2>

          <input
            type="text"
            placeholder="Buscar..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            style={{ marginBottom: "10px", padding: "4px", width: "200px" }}
          />

          <table className="collaborators-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} onClick={header.column.getToggleSortingHandler()} style={{ cursor: "pointer", position: "relative" }}>
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
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} onClick={() => handleRowClick(row.original)}>
                  {row.getVisibleCells().map(cell => (
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
      </section>
    </div>
  );
};

export default SellersScreen;