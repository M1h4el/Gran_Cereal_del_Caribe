"use client";

import React, { useState } from "react";
import SucursalCards from "../../components/SucursalCards";
import "@/styles/SucursalCards.scss";
import SellersScreen from "@/components/SellersScreen";
import InvoicesSellerScreen from "@/components/InvoicesSellerScreen";
import InvoicesCustomerScreen from "@/components/InvoicesCustomerScreen";

function SucursalContent() {
  const [routes, setRoutes] = useState([]);
  const [idSucursalSelected, setIdSucursalSelected] = useState(null);
  const [collaboratorSellected, setCollaboratorSellected] = useState(null);
  const [invoicesSellected, setInvoicesSellected] = useState(null);

  const handlecollaboratorSellected = (collaborator) => {
    setCollaboratorSellected(collaborator);
  };

  const handleRoute = (route) => {
    console.log("Cambiando ruta a:", route.title);
    setRoutes((prevRoutes) => [...prevRoutes, route?.title]);
    setIdSucursalSelected(route.id);
  };

  const removeRoute = (index) => {
    setRoutes(routes.slice(0, index));
  };

  const renderComponent = () => {
    switch (routes.length) {
      case 0:
        return (
          <SucursalCards handleRoute={handleRoute} />
        );
      case 1:
        return (
          <SellersScreen
            sucursalId={idSucursalSelected}
            collaborator={handlecollaboratorSellected}
          />
        );
      case 2:
        if (!collaboratorSellected) console.log("Colaborador no seleccionado");
        return collaboratorSellected.role === "Vendedor" ? (
          <InvoicesSellerScreen data={collaboratorSellected} />
        ) : collaboratorSellected.role === "Cliente" ? (
          <InvoicesCustomerScreen data={collaboratorSellected} />
        ) : (
          console.log("Rol no reconocido")
        );
      case 3:
        return <div>📄 Archivo en {routes[2]}</div>;
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
          <h4>Crea las sucursales de tu Empresa</h4>
          <hr />
        </div>
      </section>
      <section>{renderComponent()}</section>
    </>
  );
}

export default SucursalContent;
