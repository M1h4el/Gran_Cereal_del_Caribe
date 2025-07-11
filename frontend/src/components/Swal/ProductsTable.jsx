import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { TextField, Button, Paper, Stack } from "@mui/material";

import "@/styles/ProductsTable.scss";
import { fetchData } from "../../../utils/api";
import Modal from "../Modal";
import { useSession } from "next-auth/react";
import SupplyInventory from "../Modal/SupplyInventory";

const formatCurrency = (value) => {
  if (!value && value !== 0) return "";
  return `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
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
  const { data: session, status } = useSession();
  const [globalFilter, setGlobalFilter] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [originalRows, setOriginalRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
  const text = globalFilter.toLowerCase();
  return arrayProducts.filter((item) =>
    Object.values(item).some(
      (value) =>
        typeof value === "string" && value.toLowerCase().includes(text)
    )
  );
}, [arrayProducts, globalFilter]);

  if (!session?.user || status == "unauthenticated") return;

  const validateRows = (rows) => {
    return rows.every(
      (row) =>
        row.name &&
        row.description &&
        row.inventory !== "" &&
        row.basePricing !== "" &&
        row.baseSucursalPricing !== "" &&
        row.BaseSellerPricing !== "" &&
        row.price !== ""
    );
  };

  useEffect(() => {
    setArrayProducts((prev) =>
      prev.map((row) => {
        const modifiedRow = {
          ...row,
          id: row.idproduct,
        };
        return modifiedRow;
      })
    );
  }, []);

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

  const handleRowChange = (rowId, field, value) => {
    setArrayProducts((prev) =>
      prev.map((row) =>
        row.id === rowId || row.idproduct === rowId
          ? { ...row, [field]: value }
          : row
      )
    );

    // Si es un producto nuevo, también actualizar en newProducts
    if (String(rowId).startsWith("temp-")) {
      setNewProducts((prev) =>
        prev.map((prod) =>
          prod.id === rowId ? { ...prod, [field]: value } : prod
        )
      );
    }
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
      alert(
        "Por favor, completa todos los campos obligatorios antes de guardar."
      );
      return;
    }
    const modifiedRows = getModifiedRows();
    const now = formatToMySQLTimestamp(new Date());

    const rowsToSend = modifiedRows.map((row) => ({
      ...row,
      updated_at: now,
    }));

    console.log("777777777777", rowsToSend);

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
    if (selectedRows.length === 0) return;

    // ✅ Temporales: tienen `id` (string tipo temp-) y `idproduct` vacío
    const tempRows = selectedRows.filter(
      (row) =>
        typeof row.id === "string" &&
        row.id.startsWith("temp-") &&
        row.idproduct === ""
    );

    // ✅ Reales: no tienen `id`, pero sí `idproduct` numérico
    const realRows = selectedRows.filter(
      (row) => typeof row.idproduct === "number" && !row.id
    );

    // ✅ Eliminar visualmente todas (temp + reales)
    const newRows = arrayProducts.filter((row) => {
      // Si es temporal, comparamos por `id`
      if (typeof row.id === "string") {
        return !selectedRows.some((sel) => sel.id === row.id);
      }

      // Si es real, comparamos por `idproduct`
      if (typeof row.idproduct === "number") {
        return !selectedRows.some((sel) => sel.idproduct === row.idproduct);
      }

      return true; // en caso de que no cumpla ninguna condición
    });
    setNewProducts((prev) =>
      prev.filter((prod) => !tempRows.some((temp) => temp.id === prod.id))
    );
    setArrayProducts(newRows);
    setSelectedRows([]);

    // ✅ Enviar al backend solo los reales
    const idsToDelete = realRows.map((row) => row.idproduct);

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
            (row) => !idsToDelete.includes(row.idproduct)
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
    const tempId = `temp-${Date.now()}`;
    const newProducts = {
      id: tempId,
      idproduct: "",
      name: "",
      description: "",
      inventory: 0,
      basePricing: null,
      baseSucursalPricing: null,
      BaseSellerPricing: null,
      updated_at: new Date().toISOString(),
      price: null,
    };
    setArrayProducts((prev) => [...prev, newProducts]);
    setNewProducts((prev) => [...prev, newProducts]);
  };

  const supplyInventory = () => {
    setIsModalOpen(true);
  };

  const columns = useMemo(
    () => [
      { name: "Código", field: "productCode", editable: false, minWidth: "150px" },
      { name: "Nombre", field: "name", editable: true, minWidth: "280px" },
      { name: "Descripción", field: "description", editable: true },
      {
        name: "Inventario",
        field: "inventory",
        editable: true,
        type: "number",
        minWidth: "150px",
        right: true
      },
      {
        name: "Precio Base",
        field: "basePricing",
        editable: true,
        format: formatCurrency,
        type: "number",
        right: true
      },
      {
        name: "Precio Base Sucursal",
        field: "baseSucursalPricing",
        editable: true,
        format: formatCurrency,
        type: "number",
        minWidth: "220px",
        right: true
      },
      {
        name: "Precio Base Vendedor",
        field: "BaseSellerPricing",
        editable: true,
        format: formatCurrency,
        type: "number",
        minWidth: "220px",
        right: true
      },
      {
        name: "Valor",
        field: "price",
        editable: true,
        format: formatCurrency,
        type: "number",
        minWidth: "150px",
        right: true
      },
      {
        name: "Última Actualización",
        field: "updated_at",
        editable: false,
        format: (value) => new Date(value).toLocaleDateString("es-ES"),
        minWidth: "200px"
      },
    ],
    []
  );

  const customColumns = useMemo(() => {
    const filteredColumns =
      session?.user?.role !== "Admin"
        ? columns.filter((col) => col.field !== "basePricing")
        : columns;

    return filteredColumns.map((col) => ({
      name: col.name,
      selector: (row) => row[col.field],
      sortable: true,
      ...(col.minWidth ? { minWidth: col.minWidth } : { grow: col.grow || 1 }),
      right: col.right || false,
      grow: col.grow || 1,
      cell: (row, rowIndex) =>
        col.editable && isEditing ? (
          <TextField
            type={col.type === "number" ? "number" : "text"}
            value={row[col.field] ?? (col.type === "number" ? 0 : "")}
            onChange={(e) => {
              console.log("Antes:", row[col.field], "Nuevo:", e.target.value);
              handleRowChange(
                row.id || row.idproduct,
                col.field,
                e.target.value
              );
            }}
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
  }, [columns, isEditing, session]);

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
          value={globalFilter.trim() ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="inputSearch"
        />
      </div>

      <Paper>
        {session.user.role === "Admin" && (
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
        )}
        <DataTable
          columns={customColumns}
          data={filteredData}
          selectableRows={isEditing}
          onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
          pagination
          highlightOnHover
          dense
          fixedHeader
          fixedHeaderScrollHeight="400px"
          customStyles={{
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
                minHeight: "50px", // override the cell padding for data cells
                textAlign: "left"
              }
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
                No se encontraron productos.
              </h2>
              {!filteredData && <Button
                variant="contained"
                style={{ width: "150px", height: "50px", fontSize: "18px" }}
                onClick={() => {
                  handleAdd();
                  setIsEditing(true);
                }}
              >
                Agregar
              </Button>}
            </div>
          }
        />
        {session.user.role === "Admin" && (
          <Stack>
            <Button
              variant="outlined"
              onClick={supplyInventory}
              disabled={isEditing}
            >
              Abastecer
            </Button>
          </Stack>
        )}
      </Paper>
      {isModalOpen && (
        <Modal open={isModalOpen} onClose={handleCloseModal}>
          <SupplyInventory arrayProducts={arrayProducts} />
        </Modal>
      )}
    </div>
  );
}

export default ProductsTable;
