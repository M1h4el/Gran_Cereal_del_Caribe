"use client";

import React, { useEffect, useState } from "react";
import { fetchData } from "../../utils/api";
import "@/styles/ProductsComponent.scss";
import { showSwal } from "./Swal/Swal";
import ProductsTable from "./Swal/ProductsTable";
import Swal from "sweetalert2";
import Modal from "./Modal";

function ProductsComponent({ sucursalId, totalProducts }) {
  const [stock, setStock] = useState(0);
  const [ultimoUpdate, setUltimoUpdate] = useState("Actualizado hace 1 día");
  const [codigoBuscar, setCodigoBuscar] = useState("");
  const [productoEncontrado, setProductoEncontrado] = useState(null);
  const [arrayProducts, setArrayProducts] = useState([]);
  const [handleRefresh, setHandleRefresh] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  let handleSetArray = (item) => {
    setArrayProducts(item);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  let fetchProductos = async () => {
    let data = await fetchData(`/products?sucursalId=${sucursalId}`);
    return data;
  };

  useEffect(() => {
    async function fetchResumen() {
      try {
        const productos = await fetchProductos();
        if (productos.length > 0) {
          const ultima = productos.reduce((a, b) =>
            new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
          );
          setUltimoUpdate(new Date(ultima.updatedAt).toLocaleDateString());
          setArrayProducts(productos);
        } else {
          console.log("No se encontraron productos:", productos);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
      }
    }
    fetchResumen();
  }, [sucursalId, handleRefresh]);

  console.log("111111111111:", arrayProducts);

  const handleReFetch = () => {
    setHandleRefresh((prev) => prev + 1);
  };

  async function handleBuscarProducto() {
    if (!codigoBuscar) return;
    try {
      const result = await fetchData(
        `/products/searchByCode?code=${codigoBuscar}&sucursalId=${sucursalId}`
      );
      setStock(result?.inventory);
      setProductoEncontrado(result || null);
    } catch (error) {
      console.error("Error al buscar producto:", error);
    }
  };

  const handleGestionarProductos = () => {
    setCodigoBuscar("");
    setIsModalOpen(true);
  };

  return (
      <>
        <div className="codingContainer">
          <div className="codingBox">
            <h2>Productos</h2>
            <div className="resumen-productos">
              <div>
                Total productos:{" "}
                <strong>{totalProducts ? totalProducts : 0}</strong>
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
              Inventario: <strong>{stock}</strong>
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
              <button onClick={() => handleGestionarProductos(arrayProducts)}>
                Gestionar productos
              </button>
            </div>
          </div>
        </div>
        {isModalOpen && 
        <Modal open={isModalOpen} onClose={handleCloseModal}>
          <ProductsTable
            arrayProducts={arrayProducts}
            setArrayProducts={handleSetArray}
            handleRefresh={handleReFetch}
            sucursalId={sucursalId}
          />
        </Modal>}
      </>
  );
}

export default ProductsComponent;
