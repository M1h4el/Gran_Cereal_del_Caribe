import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { pool } from "@/lib/db"; // Asegúrate de que tu conexión está en /lib/db.js

export async function POST(req) {
  try {
    const { userName, email, password } = await req.json();

    // Validar datos
    if (!userName || !email || !password) {
        return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    // Verificar si el email ya existe en la base de datos
    const existingUser = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Guardar usuario en MySQL
    const [result] = await pool.query(
      "INSERT INTO users (userName, email, password) VALUES (?, ?, ?)",
      [userName, email, hashedPassword]
    );

    return NextResponse.json({ message: "Usuario registrado con éxito", userId: result.insertId }, {status: 201});
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
