import bcrypt from "bcrypt";

const plainPassword = "9876";
const hashedPassword = "$2b$10$eirTSU0GFr8SP5bs2iJJ.OTv0XA7JJ476/JiyqX3j7jE6dwkZrKbC"; // La que tienes en BD

bcrypt.compare(plainPassword, hashedPassword)
  .then(res => console.log("¿Contraseña válida?", res))
  .catch(err => console.error("Error en la comparación:", err));