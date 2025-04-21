"use client";

import React, { useState } from "react";
import { fetchData } from "../../../utils/api";
import Swal from 'sweetalert2';

export default function CreateSucursal({sucursal, userId, reloadTrigger}) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    console.log("Datos del formulario:", formData);

    try {
      const newSucursal = {
        title: formData.nombre,
        description: formData.descripcion,
      };

      const res = await fetchData(`/sucursales?userOwnerId=${userId}`, "POST", newSucursal);
      if (res && res.message) {
        sucursal(newSucursal);
        reloadTrigger();
      }
      Swal.close();

    } catch (error) {
      console.error("Error creando sucursal:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Crea una sucursal</h2>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="nombre">Nombre:</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: "0.5rem" }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="descripcion">Descripción:</label>
        <input
          type="text"
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          style={{ width: "100%", padding: "0.5rem", resize: "vertical" }}
        />
      </div>

      <button type="submit" style={{ padding: "0.5rem 1rem" }}>
        Enviar
      </button>
    </form>
  );
}
