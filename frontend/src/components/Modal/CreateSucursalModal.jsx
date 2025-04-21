import React, { useState } from "react";
import { fetchData } from "../../../utils/api";
import { useSession } from "next-auth/react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

export default function CreateSucursal({
  sucursal,
  userId,
  reloadTrigger,
  onClose,
}) {
  const { data: session } = useSession();

  const codeCollaborator = session?.user?.codeCollaborator || null;

  console.log("codeCollaborator", codeCollaborator);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    userName: "",
    description: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Sucursal",
    codeCollaborator: codeCollaborator
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.userName.trim()) {
      setError("El nombre de la sucursal es obligatorio.");
      return;
    }

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Email y contraseña son obligatorios.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const newSucursal = {
        userName: formData.userName.trim(),
        description: formData.description.trim() || null,
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: formData.role.trim() || "Sucursal",
        codeCollaborator: codeCollaborator,
        user_admin_id: userId,
      };

      const res = await fetchData("auth/register", "POST", newSucursal);

      if (res?.message) {
        setSuccessMessage("Sucursal creada correctamente.");
        sucursal(newSucursal);
        
        reloadTrigger();
        setFormData({
            userName: "",
            description: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: "Sucursal",
            codeCollaborator: codeCollaborator
        });

        onClose(); // Cierra el modal después de crear la sucursal
      } else {
        setError("No se pudo crear la sucursal.");
      }
    } catch (error) {
      console.error("Error creando sucursal:", error);
      setError("Hubo un problema al crear la sucursal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "400px", margin: "auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
        Crea una sucursal
      </h2>

      {error && (
        <div
          style={{ color: "red", marginBottom: "1rem", textAlign: "center" }}
        >
          {error}
        </div>
      )}
      {successMessage && (
        <div
          style={{ color: "green", marginBottom: "1rem", textAlign: "center" }}
        >
          {successMessage}
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <TextField
          label="Nombre"
          id="userName"
          name="userName"
          value={formData.userName}
          onChange={handleChange}
          required
          fullWidth
          variant="outlined"
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <TextField
          label="Descripción"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          fullWidth
          variant="outlined"
          multiline
          rows={2}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <TextField
          label="Email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          fullWidth
          variant="outlined"
          type="email"
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <TextField
          label="Contraseña"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          fullWidth
          variant="outlined"
          type="password"
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <TextField
          label="Confirmar contraseña"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          fullWidth
          variant="outlined"
          type="password"
        />
      </div>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        style={{ padding: "0.5rem 1rem" }}
      >
        {loading ? "Guardando..." : "Crear Sucursal"}
      </Button>
    </form>
  );
}
