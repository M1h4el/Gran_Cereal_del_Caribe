"use client";

import React, { useEffect, useState } from "react";
import { fetchData } from "../../utils/api";
import "@/styles/ProductsComponent.scss";
import ProductsTable from "./Swal/ProductsTable";
import Modal from "./Modal";
import CopyCode from "../components/MUI/CopyToClipboardInput";

function formatDateToCustom(datetime) {
  const date = new Date(datetime);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Meses desde 0
  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function ProductsComponent({ sucursal, totalProducts, handleGetProducts }) {
  const [stock, setStock] = useState(0);
  const [ultimoUpdate, setUltimoUpdate] = useState("Actualizado hace 1 día");
  const [codigoBuscar, setCodigoBuscar] = useState("");
  const [productoEncontrado, setProductoEncontrado] = useState(null);
  const [arrayProducts, setArrayProducts] = useState([]);
  const [handleRefresh, setHandleRefresh] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log("producto encontrado", productoEncontrado);

  let handleSetArray = (item) => {
    setArrayProducts(item);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProductoEncontrado(null);
  };

  let fetchProductos = async () => {
    let data = await fetchData(`/products?sucursalId=${sucursal.id}`);
    return data;
  };

  useEffect(() => {
    console.log("infoSucursal", sucursal);
    async function fetchResumen() {
      try {
        const productos = await fetchProductos();
        if (productos.length > 0) {
          const ultima = productos.reduce((a, b) =>
            new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
          );
          setUltimoUpdate(new Date(ultima.updatedAt).toLocaleDateString());
          setArrayProducts(productos);
          handleGetProducts(productos);
        } else {
          console.log("No se encontraron productos:", productos);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
      }
    }
    fetchResumen();
  }, [sucursal.id, handleRefresh]);

  console.log("111111111111:", arrayProducts);

  const handleReFetch = () => {
    setHandleRefresh((prev) => prev + 1);
  };

  async function handleBuscarProducto() {
    if (!codigoBuscar) return;
    try {
      const result = await fetchData(
        `/products?productCode=${codigoBuscar}&sucursalId=${sucursal.id}`
      );
      setStock(result?.inventory);
      setProductoEncontrado(result[0] || null);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al buscar producto:", error);
    }
  }

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

          <div className="boton-gestionar">
            <button onClick={() => handleGestionarProductos(arrayProducts)}>
              Gestionar productos
            </button>
          </div>
        </div>
        <hr />
        <div className="moreOptions">
          <CopyCode valueToCopy={sucursal.codeCollaborator} />
        </div>
      </div>
      {isModalOpen && (
        <Modal open={isModalOpen} onClose={handleCloseModal}>
          {productoEncontrado ? (
            <>
              <h2 style={{padding: "20px"}}>Producto Encontrado</h2>

              <table className="mini-tabla-producto">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Stock</th>
                    <th>Precio Base</th>
                    <th>Precio (S)</th>
                    <th>Precio (V)</th>
                    <th>Precio (C)</th>
                    <th>Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{productoEncontrado.productCode}</td>
                    <td>{productoEncontrado.name}</td>
                    <td>{productoEncontrado.inventory}</td>
                    <td>{productoEncontrado.basePricing}</td>
                    <td>{productoEncontrado.baseSucursalPricing}</td>
                    <td>{productoEncontrado.BaseSellerPricing}</td>
                    <td>{productoEncontrado.price}</td>
                    <td>{formatDateToCustom(productoEncontrado.updated_at)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <ProductsTable
              arrayProducts={arrayProducts}
              setArrayProducts={handleSetArray}
              handleRefresh={handleReFetch}
              sucursalId={sucursal.id}
            />
          )}
        </Modal>
      )}
    </>
  );
}

export default ProductsComponent;
