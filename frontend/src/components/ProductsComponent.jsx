"use client";

import React, { useEffect, useState } from "react";
import { fetchData } from "../../utils/api";
import Swal from "sweetalert2";
import "@/styles/ProductsComponent.scss";

function ProductsComponent({ sucursalId, totalProducts }) {
  const [productosBajoStock, setProductosBajoStock] = useState(0);
  const [ultimoUpdate, setUltimoUpdate] = useState("Actualizado hace 1 día");
  const [codigoBuscar, setCodigoBuscar] = useState("");
  const [productoEncontrado, setProductoEncontrado] = useState(null);

  async function fetchResumen() {
    try {
      const productos = await fetchData(`/products?sucursalId=${sucursalId}`);
      const bajos = productos.filter((p) => p.stock <= 3);
      setProductosBajoStock(bajos.length);
      if (productos.length > 0) {
        const ultima = productos.reduce((a, b) =>
          new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
        );
        setUltimoUpdate(new Date(ultima.updatedAt).toLocaleDateString());
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  }

  async function handleBuscarProducto() {
    if (!codigoBuscar) return;
    try {
      const result = await fetchData(
        `/products/searchByCode?code=${codigoBuscar}&sucursalId=${sucursalId}`
      );
      setProductoEncontrado(result || null);
    } catch (error) {
      console.error("Error al buscar producto:", error);
    }
  }

  const handleGestionarProductos = () => {
    fetchResumen();

    Swal.fire({
      title: "Gestión de Productos",
      text: "Aquí podrías abrir un formulario o panel completo",
      icon: "info",
    });
  };

  return (
    <div className="codingContainer">
      <div className="codingBox">
        <h2>Productos</h2>
        <div className="resumen-productos">
          <div>
            Total productos: <strong>{totalProducts ? totalProducts : 0}</strong>
          </div>
          
          <div>
            Última actualización: <strong>{ultimoUpdate}</strong>
          </div>
        </div>

        <div className="buscador-producto">
          <input
            type="text"
            placeholder="Buscar por código"
            value={codigoBuscar}
            onChange={(e) => setCodigoBuscar(e.target.value)}
          />
          <button onClick={handleBuscarProducto}>Buscar</button>
        </div>

        <div>
            Inventario: <strong>{productosBajoStock}</strong>
        </div>

        {productoEncontrado && (
          <table className="mini-tabla-producto">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{productoEncontrado.code}</td>
                <td>{productoEncontrado.name}</td>
                <td>{productoEncontrado.stock}</td>
              </tr>
            </tbody>
          </table>
        )}

        <div className="boton-gestionar">
          <button onClick={handleGestionarProductos}>
            Gestionar productos
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductsComponent;
