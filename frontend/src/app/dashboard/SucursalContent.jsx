"use client";

import React, { useState } from "react";
import SucursalCards from "../../components/SucursalCards";
import "@/styles/SucursalCards.scss";
import SellersScreen from "@/components/SellersScreen";
import InvoicesSellerScreen from "@/components/InvoicesSellerScreen";
import InvoicesCustomerScreen from "@/components/InvoicesCustomerScreen";
import InvoiceScreen from "@/components/InvoiceScreen";

function SucursalContent() {
  const [routes, setRoutes] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0)
  const [products, setProducts] = useState([])
  const [selection, setSelection] = useState({
    sucursalId: null,
    collaborator: null,
    invoices: null,
  });
  console.log("selection", selection)

  console.log("Cambiando ruta a:", routes);
  const handleRoute = (route) => {
    setRoutes((prevRoutes) => [...prevRoutes, route?.title]);

    setSelection((prev) => ({
      ...prev,
      sucursalId: route.id,
    }));
    setTotalProducts(route.total_products)
  };

  const handleGetProducts = (products) => {
    setProducts(products);
  }

  const handlecollaboratorSellected = (collaborator) => {
    if (!collaborator || !collaborator.id) {
      console.error("Error: Colaborador no válido", collaborator);
      return;
    }

    let newIndex = ""

    collaborator.role == "Vendedor" ? newIndex = "Tabla de Ventas" : collaborator.role == "Cliente" ? newIndex = "Tabla de Compras" : console.log("Rol no reconocido");

    setRoutes((prevRoutes) => [...prevRoutes, newIndex]);

    setSelection((prev) => {
      const updatedSelection = {
        ...prev,
        collaborator: collaborator,
      };

      return updatedSelection;
    });
  };

  const handleInvoiceSelected = (invoice) => {
    setRoutes((prevRoutes) => [...prevRoutes, "Detalles de Venta"]);
    setSelection((prev) => ({
      ...prev,
      invoices: invoice,
    }));
  };

  const removeRoute = (index) => {
    setRoutes((prevRoutes) => prevRoutes.slice(0, index));

    setSelection((prev) => {
      const newSelection = { ...prev };

      // Dependiendo del nivel, limpiamos valores
      if (index === 0) {
        newSelection.sucursalId = null;
        newSelection.collaborator = null;
        newSelection.invoices = null;
      } else if (index === 1) {
        newSelection.collaborator = null;
        newSelection.invoices = null;
      } else if (index === 2) {
        newSelection.invoices = null;
      }

      return newSelection;
    });
  };

  const renderComponent = () => {
    switch (routes.length) {
      case 0:
        return <SucursalCards handleRoute={handleRoute} />;
      case 1:
        return (
          <SellersScreen
            sucursalId={selection.sucursalId}
            collaborator={handlecollaboratorSellected}
            totalProducts={totalProducts}
            handleGetProducts={handleGetProducts}
          />
        );
      case 2:
        if (!selection.collaborator) console.log("Colaborador no seleccionado");
        return selection.collaborator.role === "Vendedor" ? (
          <InvoicesSellerScreen collaboratorId={selection.collaborator} invoice={handleInvoiceSelected} />
        ) : selection.collaborator.role === "Cliente" ? (
          <InvoicesCustomerScreen collaboratorId={selection.collaborator} invoice={handleInvoiceSelected} />
        ) : (
          console.log("Rol no reconocido")
        );
      case 3:
        return <InvoiceScreen data={selection.invoices} products={products} />;
      default:
        return <div>🔍 Vista profunda en {routes[routes.length - 1]}</div>;
    }
  };

  return (
    <>
      <section>
        <div className="TitleSection">
          <div className="routeIndexContainer">
            <h1 className="index" onClick={() => setRoutes([])}>
              Sucursales <hr />
            </h1>
            {routes.map((route, index) => (
              <React.Fragment key={index}>
                {" > "}
                <h2 className="index" onClick={() => removeRoute(index + 1)}>
                  {route}
                  <hr />
                </h2>
              </React.Fragment>
            ))}
          </div>
          {routes.length == 0 && <h4>Crea las sucursales de tu Empresa</h4>}
          <hr />
        </div>
      </section>
      <section>{renderComponent()}</section>
    </>
  );
}

export default SucursalContent;
