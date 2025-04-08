import React, { useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import "@/styles/ProductsTable.scss";
import { fetchData } from "../../../utils/api";

function generateCode(length = 10) {
  return Math.random().toString(36).substr(2, length).toUpperCase();
}

const formatCurrency = (value) => {
  if (!value && value !== 0) return "";
  return `$ ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

function formatToMySQLTimestamp(date) {
  const pad = (n) => (n < 10 ? "0" + n : n);
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

function ProductsTable({ arrayProducts, handleRefresh, sucursalId, setArrayProducts,  }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({
    productCode: "",
    name: "",
    description: "",
    inventory: "",
    basePricing: "",
    BaseSellerPricing: "",
    detalSellPrice: "",
    MayorSellPrice: "",
    updated_at: "----------------------------------"
  });

  const columns = useMemo(
    () => [
      { accessorKey: "productCode", header: "Código" },
      { accessorKey: "name", header: "Nombre" },
      { accessorKey: "description", header: "Descripción" },
      { accessorKey: "inventory", header: "Inventario" },
      {
        accessorKey: "basePricing",
        header: "Precio Base",
        cell: ({ getValue }) => formatCurrency(getValue()),
      },
      {
        accessorKey: "BaseSellerPricing",
        header: "Precio Base Vendedor",
        cell: ({ getValue }) => formatCurrency(getValue()),
      },
      {
        accessorKey: "detalSellPrice",
        header: "Precio (U)",
        cell: ({ getValue }) => formatCurrency(getValue()),
      },
      {
        accessorKey: "MayorSellPrice",
        header: "Precio (U/P)",
        cell: ({ getValue }) => formatCurrency(getValue()),
      },
      {
        accessorKey: "updated_at",
        header: "Última Actualización",
        cell: ({ getValue }) => {
          const date = getValue();
          return date ? new Date(date).toLocaleDateString("es-ES") : "";
        },
      },
    ],
    []
  );

  const data = useMemo(() => {
    return adding ? [...arrayProducts, newProduct] : arrayProducts;
  }, [arrayProducts, adding, newProduct]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleInputChange = (key, value) => {
    setNewProduct((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddOrSave = async () => {
    if (adding) {
      const now = formatToMySQLTimestamp(new Date());
      const codeGenerated = generateCode();
      const productToSave = {
        ...newProduct,
        updated_at: now,
        productCode: codeGenerated,
      };

      try {
        const res = await fetchData(`products?sucursalId=${sucursalId}`, "POST", productToSave);
        console.log(res);

        setArrayProducts(prev => [...prev, productToSave]);

        setNewProduct({
          productCode: "",
          name: "",
          description: "",
          inventory: "",
          basePricing: "",
          BaseSellerPricing: "",
          detalSellPrice: "",
          MayorSellPrice: "",
          updated_at: "----------------------------------"
        });

        setAdding(false);
        handleRefresh();
        
      } catch (error) {
        console.error("Error al guardar el producto:", error.message);
        alert("Hubo un error al guardar el producto. Intenta nuevamente.");
      }
    } else {
      setAdding(true);
    }
  };

  return (
    <div className="containerSwal">
      <div className="topContainer">
        <h2>Tabla de Productos</h2>
        <input
          placeholder="Buscar producto..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="inputSearch"
        />
      </div>

      <table>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header, index) => (
                <th
                  key={header.id}
                  style={
                    index === 0
                      ? { width: "100px" }
                      : index === 1
                      ? { width: "420px" }
                      : undefined
                  }
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, rowIndex) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell, cellIndex) => {
                const key = cell.column.id;
                const isNewRow = adding && rowIndex === data.length - 1;

                return (
                  <td key={cell.id} style={cell.id.includes("name") ? { textAlign: "left" } : null}>
                    {isNewRow && key !== "productCode" ? (
                      <input
                        type="text"
                        value={newProduct[key]}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        disabled={key === "updated_at"}
                      />
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="paginacion">
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {"Anterior"}
        </button>
        <span>
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {"Siguiente"}
        </button>
      </div>

      <button className="addButton" onClick={handleAddOrSave}>
        {adding ? "Guardar producto" : "Agregar producto"}
      </button>
    </div>
  );
}

export default ProductsTable;