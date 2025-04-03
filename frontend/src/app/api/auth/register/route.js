import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { queryDB } from "@/lib/dbUtils";

export async function POST(req) {
  try {
    const { userName, email, password } = await req.json();

    // Validar datos
    if (!userName || !email || !password) {
        return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    // Verificar si el email ya existe en la base de datos
    const existingUser = await queryDB("SELECT * FROM users WHERE email = ?", [email]);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Guardar usuario en MySQL
    const result = await queryDB(
      "INSERT INTO users (userName, email, password) VALUES (?, ?, ?)",
      [userName, email, hashedPassword]
    );

    return NextResponse.json({ message: "Usuario registrado con éxito", userId: result.insertId }, {status: 201});
  } catch (error) {

    console.error("Error en el registro:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "El correo ya está en uso" },
        { status: 400 } // 🚀 Controlando el error correctamente
      );
    }
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
