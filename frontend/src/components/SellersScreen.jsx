"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { fetchData } from "../../utils/api";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import "@/styles/SellersScreen.scss";
import ProductsComponent from "./ProductsComponent";
import ToolTipLocation from "./MUI/ToolTipLocation";

const SellersScreen = ({
  sucursal,
  collaborator,
  totalProducts,
  handleGetProducts,
}) => {
  const { data: session, status } = useSession();
  const [colaboradores, setColaboradores] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [locationParam, setLocationParam] = useState([]);

  console.log("location", locationParam);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      console.error("No estás autenticado.");
      return;
    }
    async function fetchCollaborators() {
      if (!session?.user || status == "unauthenticated") return;
      if (status == "loading") return;
      if (!sucursal) return;

      try {
        const res = await fetchData(
          `/users/${session.user.id}/sucursales/${sucursal.id}/children`,
          "GET",
          null
        );

        console.log(res);

        if (res.users.length === 0)
          console.log("No se encontraron colaboradores.");
        if (res.error) console.error("Error:", res.error);

        res.users = res.users.map((user) => {
          return {
            ...user,
            bought_sold: user.bought_sold || 0,
            location: "Ver más",
          };
        });

        const locationData = res.users.map((user, index) => {
          return {
            index: index,
            country: user.country,
            region: user.region,
            city: user.city,
            postalCode: user.postalcode,
            address: user.address
          }
        })

        setLocationParam(locationData)

        setColaboradores(res.users);
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

  const columns = useMemo(
    () => [
      { header: "ID", accessorKey: "codeCollaborator" },
      { header: "Nombre", accessorKey: "userName" },
      { header: "Tipo", accessorKey: "role" },
      { header: "Compras/Ventas ($)", accessorKey: "bought_sold" },
      { header: "Liquidación/Comisiones ($)", accessorKey: "amount" },
      { header: "Ubicación", accessorKey: "location" },
      { header: "Teléfono", accessorKey: "phone" },
    ],
    []
  );

  const data = useMemo(
    () => colaboradores.map((colab, index) => ({ ...colab, index: index + 1 })),
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
            <h2>Estadísticas Generales</h2>
            <hr />
            <div className="infoBox">
              <div className="infoRow">
                <h3>Pedidos por entregar</h3>
                <h3>Saldo pendiente</h3>
                <h3>Promedio de pedidos por día</h3>
                <h3>Balance Total</h3>
              </div>
              <div className="valueRow">
                <div>$0</div>
                <div>$0</div>
                <div>$0</div>
                <div>$0</div>
              </div>
            </div>
          </div>
          <ProductsComponent
            sucursal={sucursal}
            totalProducts={totalProducts}
            handleGetProducts={handleGetProducts}
          />
        </div>
      </section>

      <section className="section2">
        <div className="table-container">
          <div className="title_tools">
            <h2>Colaboradores</h2>
            <input
              type="text"
              placeholder="Buscar..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
          <hr />
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
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
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
              {table.getRowModel().rows.map((row, rowIndex) => (
                <tr key={row.id} onClick={() => handleRowClick(row.original)}>
                  {row.getVisibleCells().map((cell) => {
                    const accessorKey = cell.column.columnDef.accessorKey;
                    const value = cell.getValue();

                    return (
                      <td key={cell.id}>
                        {accessorKey === "location" ? (
                          <ToolTipLocation value={value} locationParamObject={locationParam[rowIndex]}/>
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-controls">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </button>
            <span>
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SellersScreen;
