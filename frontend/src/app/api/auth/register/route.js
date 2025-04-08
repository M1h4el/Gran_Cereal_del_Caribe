import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { queryDB } from "@/lib/dbUtils";

// Función para generar código único para el nuevo usuario
function generateCode(length = 10) {
  return Math.random().toString(36).substr(2, length).toUpperCase();
}

export async function POST(req) {
  try {
    let body = await req.json();
    console.log("data:", body);
    const { userName, email, password, role, codeCollaborator } = body;


    if (!userName || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    let finalRole = role;

    if (!codeCollaborator) {
      finalRole = "Admin";
    }

    const existingUser = await queryDB("SELECT user_id, userName FROM users WHERE email = ?", [email]);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let generatedCode;
    let isUnique = false;

    while (!isUnique) {
      generatedCode = generateCode();
      const check = await queryDB("SELECT user_id FROM users WHERE codeCollaborator = ?", [generatedCode]);
      isUnique = check.length === 0;
    }

    const result = await queryDB(
      "INSERT INTO users (userName, email, password, role, codeCollaborator) VALUES (?, ?, ?, ?, ?)",
      [userName, email, hashedPassword, role || null, generatedCode]
    );
    
    const newUserId = result.insertId;

    if (codeCollaborator) {
      const parentUser = await queryDB(
        "SELECT user_id FROM users WHERE codeCollaborator = ?",
        [codeCollaborator]
      );

      if (parentUser.length === 0) {
        return NextResponse.json(
          { error: "El código del colaborador no es válido." },
          { status: 400 }
        );
      }

      const parentUserId = parentUser[0].user_id;

      await queryDB(
        "INSERT INTO relaciones (user_child_id, user_parent_id) VALUES (?, ?)",
        [newUserId, parentUserId]
      );

    }

    return NextResponse.json(
      {
        message: "Usuario registrado con éxito",
        userId: newUserId,
        codeCollaborator: generatedCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en el registro:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "El correo ya está en uso" }, { status: 400 });
    }

    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
