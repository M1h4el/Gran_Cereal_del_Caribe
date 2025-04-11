"use client";

import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

/* const localeText = {
  // General
  noRowsLabel: "Sin filas",
  noResultsOverlayLabel: "Sin resultados",
  errorOverlayDefaultLabel: "Ha ocurrido un error.",

  // Density selector toolbar button text
  toolbarDensity: "Densidad",
  toolbarDensityLabel: "Densidad",
  toolbarDensityCompact: "Compacta",
  toolbarDensityStandard: "Estándar",
  toolbarDensityComfortable: "Cómoda",

  // Columns selector toolbar button text
  toolbarColumns: "Columnas",
  toolbarColumnsLabel: "Seleccionar columnas",

  // Filters toolbar button text
  toolbarFilters: "Filtros",
  toolbarFiltersLabel: "Mostrar filtros",
  toolbarFiltersTooltipHide: "Ocultar filtros",
  toolbarFiltersTooltipShow: "Mostrar filtros",
  toolbarFiltersTooltipActive: (count) =>
    count !== 1 ? `${count} filtros activos` : `${count} filtro activo`,

  // Export selector toolbar button text
  toolbarExport: "Exportar",
  toolbarExportLabel: "Exportar",
  toolbarExportCSV: "Descargar como CSV",
  toolbarExportPrint: "Imprimir",
  toolbarExportExcel: "Descargar como Excel",

  // Columns panel text
  columnsPanelTextFieldLabel: "Buscar columna",
  columnsPanelTextFieldPlaceholder: "Título de la columna",
  columnsPanelDragIconLabel: "Reordenar columna",
  columnsPanelShowAllButton: "Mostrar todas",
  columnsPanelHideAllButton: "Ocultar todas",

  // Filter panel text
  filterPanelAddFilter: "Agregar filtro",
  filterPanelDeleteIconLabel: "Eliminar",
  filterPanelOperators: "Operadores",
  filterPanelOperatorAnd: "Y",
  filterPanelOperatorOr: "O",
  filterPanelColumns: "Columnas",
  filterPanelInputLabel: "Valor",
  filterPanelInputPlaceholder: "Valor del filtro",

  // Filter operators text
  filterOperatorContains: "contiene",
  filterOperatorEquals: "igual a",
  filterOperatorStartsWith: "comienza con",
  filterOperatorEndsWith: "termina con",
  filterOperatorIs: "es",
  filterOperatorNot: "no es",
  filterOperatorAfter: "es posterior a",
  filterOperatorOnOrAfter: "es en o después de",
  filterOperatorBefore: "es anterior a",
  filterOperatorOnOrBefore: "es en o antes de",
  filterOperatorIsEmpty: "está vacío",
  filterOperatorIsNotEmpty: "no está vacío",
  filterOperatorIsAnyOf: "es cualquiera de",

  // Pagination text
  footerRowSelected: (count) =>
    count !== 1
      ? `${count.toLocaleString()} filas seleccionadas`
      : `${count.toLocaleString()} fila seleccionada`,
  footerTotalRows: "Total de filas:",
  footerPaginationRowsPerPage: "Filas por página:",

  // Column menu text
  columnMenuLabel: "Menú",
  columnMenuShowColumns: "Mostrar columnas",
  columnMenuFilter: "Filtrar",
  columnMenuHideColumn: "Ocultar",
  columnMenuUnsort: "Quitar orden",
  columnMenuSortAsc: "Orden ascendente",
  columnMenuSortDesc: "Orden descendente",
}; */

export default function DataTable({ rows, columns }) {
  const [tableRows, setTableRows] = useState(rows);
  const [selectionModel, setSelectionModel] = useState([]);

  console.log("rows", tableRows);


  const handleAdd = () => {
    const newRow = {
      id: Date.now(),
      product: "",
      quantity: "",
      subTotal: "",
    };
    setTableRows((prev) => [...prev, newRow]);
  };

  const handleDelete = () => {
    const filteredRows = tableRows.filter(
      (row) => !selectionModel.includes(row.id)
    );
    setTableRows(filteredRows);
    setSelectionModel([]);
  };

  return (
    <Paper sx={{ height: "auto", width: "100%", padding: 2 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained" color="primary" onClick={handleAdd}>
          Agregar
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDelete}
          disabled={selectionModel.length === 0}
        >
          Eliminar seleccionados
        </Button>
      </Stack>
      <DataGrid
        rows={tableRows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(newSelection) =>
          setSelectionModel(newSelection)
        }
        rowSelectionModel={selectionModel}
        /* localeText={localeText} */
        pageSizeOptions={[10, 20]}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
      />
    </Paper>
  );
}
