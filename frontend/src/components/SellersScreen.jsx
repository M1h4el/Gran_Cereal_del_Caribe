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
import { BsCalendarDate } from "react-icons/bs";
import "@/styles/SellersScreen.scss";
import ProductsComponent from "./ProductsComponent";
import ToolTipLocation from "./MUI/ToolTipLocation";
import { IconContext } from "react-icons";

const SellersScreen = ({
  sucursal,
  collaborator,
  totalProducts,
  handleGetProducts,
  searchByCodeInvoice,
}) => {
  const { data: session, status } = useSession();
  const [params, setParams] = useState({});
  const [colaboradores, setColaboradores] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [locationParam, setLocationParam] = useState([]);

  console.log("params", params);

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
          `users/${session.user.id}/sucursales/${sucursal.id}/children`,
          "GET",
          null
        );

        console.log(res);

        if (res.users.length === 0)
          console.log("No se encontraron colaboradores.");
        if (res.error) console.error("Error:", res.error);

        setParams(() => {
          const vendedores = res.users.filter(
            (user) => user.role === "Vendedor"
          );

          let totals = vendedores.reduce(
            (acc, user) => {
              acc.total_profitSellers += Number(user.total_settlementUser) || 0;
              acc.total_soldByUser += Number(user.bought_sold) || 0;
              acc.settlementsPaidEstimated +=
                Number(user.total_settlementUser - user.pending_debt) || 0;
              acc.settlementsPending += Number(user.pending_debt) || 0;
              acc.settlementsPaid += Number(user.total_utilitySuc) || 0;
              acc.totalBuyedToAdmin += Number(user.payment_sucAdmin) || 0;
              return acc;
            },
            {
              total_profitSellers: 0,
              total_soldByUser: 0,
              settlementsPaid: 0,
              settlementsPending: 0,
              settlementsPaidEstimated: 0,
              totalBuyedToAdmin: 0,
            }
          );

          totals["paidToAdmin"] = res.paymentsDone.reduce(
            (acc, payment) => acc + Number(payment.amount || 0),
            0
          );

          return totals;
        });

        res.users = res.users.map((user) => {
          return {
            ...user,
            bought_sold: `$ ${Number(user?.bought_sold || 0).toLocaleString(
              "es-CO"
            )}`,
            total_settlementUser: `$ ${Number(
              user?.total_settlementUser || 0
            ).toLocaleString("es-CO")}`,
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
            address: user.address,
          };
        });

        setLocationParam(locationData);

        setColaboradores(res.users);
      } catch (error) {
        console.error("Error cargando las sucursales:", error);
      }
    }

    /* if (session?.user.role === "Sucursal") {
      fetchParamsSucursal();
    } */

    fetchCollaborators();
  }, [session]);

  function handleRowClick(row) {
    console.log("row", row);
    if (collaborator) {
      const cardObject = {
        id: row?.user_id || row?.user_seller_id,
        name: row?.userName || row?.sellerName,
        role: row?.role || row?.sellerRole,
        codeCollaborator: row?.codeCollaborator,
      };
      collaborator(cardObject, row);
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
      {
        header: "Liquidación/Comisiones ($)",
        accessorKey: "total_settlementUser",
      },
      { header: "Pendientes", accessorKey: "dayCalls" },
      { header: "Ubicación", accessorKey: "location" },
      { header: "Whatsapp", accessorKey: "phone" },
    ],
    []
  );

  const data = useMemo(
    () =>
      colaboradores.map((colab, index) => ({
        ...colab,
        index: index + 1,
        bought_sold: colab.bought_sold,
      })),
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
                <h3>Balance Total</h3>
                <h3>Saldos pendientes</h3>
                <h3>Ganancias generadas</h3>
              </div>
              <div className="valueRow">
                <div>{`$ ${Number(
                  params?.totalBuyedToAdmin - params?.paidToAdmin || 0
                ).toLocaleString("es-CO")}`}</div>
                <div>{`$ ${Number(
                  params?.settlementsPending || 0
                ).toLocaleString("es-CO")}`}</div>
                <div>{`$ ${Number(params?.settlementsPaid || 0).toLocaleString(
                  "es-CO"
                )}`}</div>
              </div>
            </div>
          </div>
          <ProductsComponent
            session={session}
            sucursal={sucursal}
            totalProducts={totalProducts}
            handleGetProducts={handleGetProducts}
            infoCollaborator={collaborator}
            searchByCodeInvoice={searchByCodeInvoice}
            params={params}
            totalDebt={Math.abs(Number(params?.debtToAdmin || 0))}
          />
        </div>
      </section>

      <section className="section2SellerScreen">
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
                  {headerGroup.headers.map((header) => {
                    // const accessorKey = header.column.columnDef.accessorKey;

                    const thStyle = {
                      cursor: "pointer",
                      position: "relative",
                      // ...(accessorKey === "location" && { width: "100px" }),
                    };
                    return (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        style={thStyle}
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
                    );
                  })}
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
                          <ToolTipLocation
                            value={value}
                            locationParamObject={locationParam[rowIndex]}
                          />
                        ) : accessorKey === "phone" ? (
                          <a href={`https://wa.me/57${value}`} target="_blank">
                            {value}
                          </a>
                        ) : accessorKey === "dayCalls" ? (
                          < div style={{ display: "flex", alignItems: "center" }}>
                            <span>{value ? value : "N/A"}</span>
                            <button
                              className="calendar-button"
                            >
                              <IconContext.Provider
                                value={{
                                  size: "25px",
                                  color: "gray"
                                }}
                              >
                                <div>
                                  <BsCalendarDate />
                                </div>
                              </IconContext.Provider>
                            </button>
                          </ div>
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
