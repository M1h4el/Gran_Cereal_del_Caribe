import React, { useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import {
  TextField,
  Button,
  Paper,
  Stack,
  Box,
  LinearProgress,
} from "@mui/material";

import "@/styles/ProductsTable.scss";
import { fetchData } from "../../../utils/api";

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

function ProductsTable({
  arrayProducts,
  handleRefresh,
  sucursalId,
  setArrayProducts,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [isEditing, setIsEditing] = useState(false); // Nuevo estado para manejar la edición
  const [originalRows, setOriginalRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]); // Para seleccionar filas
  const [newProduct, setNewProduct] = useState({
    productCode: "",
    name: "",
    description: "",
    inventory: "",
    basePricing: "",
    BaseSellerPricing: "",
    price: "",
    updated_at: "----------------------------------",
  });

  console.log("arrayProducts", arrayProducts);
  console.log("originalRows", originalRows);
  console.log("selectedRows", selectedRows);
  console.log("isEditing", isEditing);
  console.log("newProduct", newProduct);

  const validateRows = (rows) => {
    return rows.every((row) =>
      row.productCode &&
      row.name &&
      row.description &&
      row.inventory !== "" &&
      row.basePricing !== "" &&
      row.BaseSellerPricing !== "" &&
      row.price !== ""
    );
  };

  const getModifiedRows = () => {
    return arrayProducts.filter((row) => {
      const original = originalRows.find(
        (orig) => String(orig.id) === String(row.id)
      );
  
      // Si no existe en originalRows, es nuevo
      if (!original) return true;
  
      // Verificar si algún campo cambió
      for (let key in row) {
        const currentValue = row[key];
        const originalValue = original[key];
  
        const isObject =
          currentValue !== null &&
          typeof currentValue === "object" &&
          originalValue !== null &&
          typeof originalValue === "object";
  
        if (isObject) {
          if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
            return true;
          }
        } else {
          if (currentValue !== originalValue) {
            return true;
          }
        }
      }
  
      return false;
    });
  };  

  const handleRowChange = (rowIndex, field, value) => {
    setArrayProducts((prevRows) => {
      const updatedRows = [...prevRows];
      const updatedRow = { ...updatedRows[rowIndex] };

      updatedRow[field] = value;

      updatedRows[rowIndex] = updatedRow;

      return updatedRows;
    });
  };

  const handleEdit = () => {
    if (!isEditing) {
      setOriginalRows(JSON.parse(JSON.stringify(arrayProducts))); // Guardamos una copia profunda
      setIsEditing(true);
      setSelectedRows([]); // Limpiamos selección
    } else {
      setArrayProducts(originalRows); // Restauramos si se cancela edición
      setIsEditing(false);
      setSelectedRows([]);
    }
  };

  const handleSave = async () => {
    const isValid = validateRows(arrayProducts);
  
    if (!isValid) {
      alert("Por favor, completa todos los campos obligatorios antes de guardar.");
      return;
    }
      const modifiedRows = getModifiedRows();
      const now = formatToMySQLTimestamp(new Date());
  
      const rowsToSend = modifiedRows.map((row) => ({
        ...row,
        updated_at: now,
      }));
  
      const res = await fetchData(`products?sucursalId=${sucursalId}`, "PUT", {
        data: rowsToSend,
      });
  
      if (res.error) {
        console.error("Error al guardar productos:", res.error);
        return;
      }
  
      handleRefresh(); // Asume que esto recarga desde el servidor
      setIsEditing(false);
      setSelectedRows([]);
      setOriginalRows([]); // Actualizará con los nuevos datos desde handleRefresh
  };
  

  const handleDelete = async () => {
    const tempRows = selectedRows.filter((row) => row.id?.startsWith("temp-"));
    const realRows = selectedRows.filter((row) => !row.id?.startsWith("temp-"));
  
    // Eliminamos todas visualmente
    const newRows = tableRows.filter(
      (row) => !selectedRows.some((sel) => sel.id === row.id)
    );
  
    setTableRows(newRows);
    setSelectedRows([]);
  
    // Solo eliminamos en backend las que son reales
    const idsToDelete = realRows.map((row) => row.id);
  
    if (idsToDelete.length > 0) {
      try {
        const res = await fetchData(
          `products?sucursalId=${sucursalId}`,
          "DELETE",
          {
            data: idsToDelete,
          }
        );
  
        if (res.error) {
          console.error("Error al eliminar en el backend:", res.error);
        } else {
          const updatedOriginalRows = originalRows.filter(
            (row) => !idsToDelete.includes(row.id)
          );
  
          setOriginalRows(updatedOriginalRows);
          console.log("Filas eliminadas en el backend:", idsToDelete);
        }
      } catch (error) {
        console.error("Error al eliminar productos:", error.message);
      }
    }
  };  
  

  const handleAdd = () => {
    setArrayProducts((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`, // ID temporal para distinguir las nuevas
        productCode: "",
        name: "",
        description: "",
        inventory: "",
        basePricing: "",
        BaseSellerPricing: "",
        price: "",
        updated_at: "----------------------------------",
      },
    ]);

    setNewProduct({
      productCode: "",
      name: "",
      description: "",
      inventory: "",
      basePricing: "",
      BaseSellerPricing: "",
      price: "",
      updated_at: "----------------------------------",
    });
  };

  const columns = useMemo(
    () => [
      { name: "Código", field: "productCode", editable: false },
      { name: "Nombre", field: "name", editable: true },
      { name: "Descripción", field: "description", editable: true },
      {
        name: "Inventario",
        field: "inventory",
        editable: true,
        type: "number",
      },
      {
        name: "Precio Base",
        field: "basePricing",
        editable: true,
        format: formatCurrency,
        type: "number",
      },
      {
        name: "Precio Base Vendedor",
        field: "BaseSellerPricing",
        editable: true,
        format: formatCurrency,
        type: "number",
      },
      {
        name: "Valor",
        field: "price",
        editable: true,
        format: formatCurrency,
        type: "number",
      },
      {
        name: "Última Actualización",
        field: "updated_at",
        editable: false,
        format: (value) => new Date(value).toLocaleDateString("es-ES"),
      },
    ],
    []
  );

  const customColumns = useMemo(() => {
    return columns.map((col) => ({
      name: col.name,
      selector: (row) => row[col.field],
      sortable: true,
      grow: col.flex || 1,
      right: col.right,
      width: col.width || "auto",
      grow: col.grow || 1,
      cell: (row, rowIndex) =>
        col.editable && isEditing ? (
          <TextField
            type={col.type === "number" ? "number" : "text"}
            value={row[col.field]}
            onChange={(e) =>
              handleRowChange(rowIndex, col.field, e.target.value)
            }
            variant="outlined"
            size="small"
            sx={{ input: { padding: "4px", width: "100%" } }}
          />
        ) : col.format ? (
          col.format(row[col.field])
        ) : typeof row[col.field] === "object" && row[col.field] !== null ? (
          row[col.field].label ||
          row[col.field].name ||
          JSON.stringify(row[col.field])
        ) : (
          row[col.field]
        ),
    }));
  }, [columns, isEditing]);

  // Función para guardar los cambios después de editar
  const handleSaveChanges = () => {
    setIsEditing(false);
    // Lógica para guardar cambios en el backend si es necesario
    // ...
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

      <Paper>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            width: "1600px",
            height: "auto",
            marginBottom: 2,
            justifyContent: "space-between",
          }}
        >
          <Button
            variant="contained"
            color={isEditing ? "error" : "primary"}
            onClick={handleEdit}
          >
            {isEditing ? "Cancelar" : "Editar"}
          </Button>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant="contained"
              color="success"
              onClick={handleSave}
              disabled={!isEditing}
            >
              Guardar cambios
            </Button>
            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={!isEditing}
            >
              Agregar
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              disabled={!isEditing || selectedRows.length === 0}
            >
              Eliminar Seleccionados
            </Button>
          </div>
        </Stack>
        <DataTable
          columns={customColumns}
          data={arrayProducts}
          selectableRows={isEditing}
          onSelectedRowsChange={({ selectedRows }) =>
            setSelectedRows(selectedRows.map((row) => row.index))
          }
          pagination
          highlightOnHover
          dense
          fixedHeader
          fixedHeaderScrollHeight="400px"
          customStyles={{
            rows: {
              style: {
                minHeight: "10px", // override the row height
              },
            },
            headCells: {
              style: {
                minHeight: "50px", // override the row height for head cells
                fontSize: "1rem",
                fontWeight: "bold",
                color: "#333",
                backgroundColor: "#f5f5f5",
                borderBottom: "1px solid #ddd",
                borderTop: "1px solid #ddd",
                borderLeft: "1px solid #ddd",
                borderRight: "1px solid #ddd",
                width: "auto",
                "&:first-child": {
                  borderLeft: "none",
                },
                "&:last-child": {
                  borderRight: "none",
                },
                "&:hover": {
                  backgroundColor: "#e0e0e0",
                },
                "&:active": {
                  backgroundColor: "#ccc",
                },
                "&:focus": {
                  backgroundColor: "#ccc",
                },
                "&:focus-within": {
                  backgroundColor: "#ccc",
                },
                "&:focus-visible": {
                  backgroundColor: "#ccc",
                },
                paddingLeft: "8px", // override the cell padding for head cells
                paddingRight: "8px",
              },
            },
            cells: {
              style: {
                paddingLeft: "8px", // override the cell padding for data cells
                paddingRight: "8px",
                minHeight: "50px", // override the cell padding for data cells
              },
            },
          }}
          noDataComponent={
            <div
              style={{
                height: "400px",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: "30px",
              }}
            >
              <h2 style={{ textAlign: "center", color: "GrayText" }}>
                Registra y administra tus productos aquí.
              </h2>
              <Button
                variant="contained"
                style={{ width: "150px", height: "50px", fontSize: "18px" }}
                onClick={() => {
                  handleAdd();
                  setIsEditing(true);
                }}
              >
                Agregar
              </Button>
            </div>
          }
        />
      </Paper>
    </div>
  );
}

export default ProductsTable;
