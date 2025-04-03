'use client';

import React, { useState, useEffect } from "react";
import "@/styles/SucursalContent.scss";
import { fetchData } from "../../../utils/api";
import ProjectCard from "@/components/ProjectCard";
import { useSession } from "next-auth/react";

function SucursalContent({ handleCard }) {
  
  const [cardData, setCardData] = useState([]);
  const { data: session, status } = useSession();

  useEffect(() => {
    async function fetchSucursales() {
      if (!session?.user) return;

      try {
        const res = await fetchData(`/sucursales?userId=${session.user.id}`, "GET", null);

        if (Array.isArray(res)) {
          setCardData(res);
        } else {
          console.error("Respuesta inesperada:", res);
        }

      } catch (error) {
        console.error("Error cargando las sucursales:", error);
      }
    }

    fetchSucursales();
  }, [session]);

  const handleCreateSucursal = async () => {
    try {
      const nuevaSucursal = {
        title: "Nueva Sucursal",
        description: "Sucursal creada automáticamente",
      };

      const res = await fetchData(`/sucursales?userId=${session.user.id}`, "POST", nuevaSucursal);
      if (res && res.message) {
        setCardData([...cardData, nuevaSucursal]);
      }
    } catch (error) {
      console.error("Error creando sucursal:", error);
    }
  };

  const rotatedData = cardData.length > 1 ? [...cardData.slice(1), cardData[0]] : cardData;

  function handleCardClick(card) {
    console.log(card, "clicked");
    handleCard(card);
  }
  return (
    <>
      <section>
        <div className="TitleSection">
          <h1>Sucursales</h1>
          <h4>Crea las sucursales de tu Empresa</h4>
          <hr />
        </div>
      </section>
      <section>
        <div className="MenuProjectSection">
          {/* <TbNewSection /> */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              padding: "16px",
            }}
          >
            {/* Primera tarjeta con formato especial */}
            <div
              style={{
                flex: "1 1 calc(33.33% - 16px)",
                maxWidth: "calc(33.33% - 16px)",
                minWidth: "250px",
                boxSizing: "border-box",
              }}
              onClick={() => handleCreateSucursal()}
            >
              <ProjectCard
                title="Nueva Surcursal"
                description="Crear una nueva sucursal"
                /* image={staticFirstCard.image}*/
                alt="nueva Sucursal" 
                isFeatured
              />
            </div>

            {/* Renderizar el resto de las tarjetas */}
            {rotatedData.map((card, index) => (
              <div
                key={index}
                style={{
                  flex: "1 1 calc(33.33% - 16px)",
                  maxWidth: "calc(33.33% - 16px)",
                  minWidth: "250px",
                  boxSizing: "border-box",
                }}
                onClick={() => handleCardClick(card)}
              >
                <ProjectCard
                  title={card.title}
                  description={card.description}
                  /* image={card.image}
                  alt={card.alt} */
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default SucursalContent;
