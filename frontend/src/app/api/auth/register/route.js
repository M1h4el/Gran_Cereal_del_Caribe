import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryDB } from "@/lib/dbUtils";

// Función para generar un código único
function generateCode(length = 10) {
  return Math.random().toString(36).substr(2, length).toUpperCase();
}

// Validar campos requeridos
function validateFields(body) {
  const requiredFields = ["userName", "email", "password"];
  const missing = requiredFields.filter((field) => !body[field]);

  if (missing.length > 0) {
    return `Faltan los siguientes campos: ${missing.join(", ")}`;
  }

  return null;
}

// Crear sucursal
async function createSucursal({
  user_admin_id,
  userName,
  description,
  user_id,
}) {
  const result = await queryDB(
    "INSERT INTO sucursales (user_admin_id, title, description, user_id) VALUES (?, ?, ?, ?)",
    [user_admin_id, userName, description, user_id]
  );
  return result.insertId;
}

// Verificar unicidad de código
async function generateUniqueCollaboratorCode() {
  let code,
    isUnique = false;
  while (!isUnique) {
    code = generateCode();
    const check = await queryDB(
      "SELECT user_id FROM users WHERE codeCollaborator = ?",
      [code]
    );
    isUnique = check.length === 0;
  }
  return code;
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("data:", body);
    const {
      userName,
      email,
      password,
      role,
      codeCollaborator,
      description = null,
      user_admin_id,
    } = body;

    // Validación clara de campos
    const fieldError = validateFields(body);
    if (fieldError) {
      return NextResponse.json({ error: fieldError }, { status: 400 });
    }

    let finalRole = role || "Admin";

    // Verificar que el email no esté ya registrado
    const existingUser = await queryDB(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const generatedCode = await generateUniqueCollaboratorCode();

    const insertResult = await queryDB(
      "INSERT INTO users (userName, email, password, role, codeCollaborator) VALUES (?, ?, ?, ?, ?)",
      [userName, email, hashedPassword, finalRole, generatedCode]
    );

    const newUserId = insertResult.insertId;
    let parentUserId = null;
    let belongToSucursalId = null;
    let infoNotification;

    if (codeCollaborator) {
      const parentUser = await queryDB(
        "SELECT user_id, userName, role FROM users WHERE codeCollaborator = ?",
        [codeCollaborator]
      );

      console.log("parentUser", parentUser)

      if (parentUser.length === 0) {
        return NextResponse.json(
          { error: "El código del colaborador no es válido." },
          { status: 400 }
        );
      }

      parentUserId = parentUser[0].user_id;
      const parentRole = parentUser[0].role;
      
      if (finalRole === "Sucursal") {
        belongToSucursalId = await createSucursal({
          user_admin_id,
          userName,
          description,
          user_id: newUserId,
        });
        
        
        if (parentRole === "Admin") {
          await queryDB(
            "INSERT INTO relaciones (user_child_id, user_parent_id) VALUES (?, ?)",
            [newUserId, parentUserId]
          );
          
          infoNotification = `${parentUser[0].userName};`;

          await queryDB(
            "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?)",
            [parentUserId, infoNotification, "111"]
          )
        } else {
          return NextResponse.json(
            {
              error:
                "El código del colaborador no es válido para este tipo de usuario.",
            },
            { status: 400 }
          );
        }
      }

      if (finalRole === "Vendedor") {
        const parentRole = parentUser[0].role;
        if (parentRole !== "Sucursal" && parentRole !== "Admin") {
          return NextResponse.json(
            {
              error:
                "El código del colaborador no es válido para este tipo de usuario.",
            },
            { status: 400 }
          );
        }

        if (parentRole === "Sucursal") {
          belongToSucursalId = await queryDB(
            "SELECT sucursal_id, title FROM sucursales WHERE user_id = ?;",
            [parentUserId]
          );
          console.log("belongToSucursalId:", belongToSucursalId);

          infoNotification = `${role};${generatedCode}`

          belongToSucursalId = belongToSucursalId[0].sucursal_id;

          await queryDB(
            "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?)",
            [parentUserId, infoNotification, "19"]
          )
        }

        const dataInserted = await queryDB(
          "INSERT INTO relaciones (user_child_id, user_parent_id, sucursal_id) VALUES (?, ?, ?);",
          [newUserId, parentUserId, belongToSucursalId]
        );
        if (dataInserted.affectedRows === 0) {
          return NextResponse.json(
            { error: "Error al insertar la relación" },
            { status: 500 }
          );
        } else {
          console.log("respuesta de la inserción: en tabla relaciones:", dataInserted);
        }
      
      } else if (finalRole === "Cliente") {
        if (parentUser[0].role === "Admin") {
          return NextResponse.json(
            { error: "El código del colaborador no es válido para este tipo de usuario." },
            { status: 400 }
          );

        } else if (parentUser[0].role === "Sucursal") {
          belongToSucursalId = await queryDB(
            "SELECT sucursal_id, user_id FROM sucursales WHERE user_id = ?",
            [parentUserId]
          );
          if (belongToSucursalId.length === 0) {
            return NextResponse.json(
              { error: "Sucursal no encontrada" },
              { status: 400 }
            );
          }
          
          belongToSucursalId = belongToSucursalId[0].sucursal_id;
          infoNotification = `${role};${generatedCode}`

          await queryDB(
            "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?);",
            [parentUserId, infoNotification, "19"]
          )

        } else if (parentUser[0].role === "Vendedor") {
          const parentSucursal = await queryDB(
            "SELECT sucursal_id FROM relaciones WHERE user_child_id = ?;",
            [parentUserId]
          );

          if (parentSucursal.length === 0) {
            return NextResponse.json(
              { error: "Relación no encontrada" },
              { status: 404 }
            )
          }
          belongToSucursalId = parentSucursal[0].sucursal_id;
        }
        await queryDB(
          "INSERT INTO relaciones (user_child_id, user_parent_id, sucursal_id) VALUES (?, ?, ?)",
          [newUserId, parentUserId, belongToSucursalId]
        );

        infoNotification = `${userName};${generatedCode}`

        // revisar cuándo hay

        const data = await queryDB(
          "SELECT user_parent_id FROM relaciones WHERE user_child_id = ?;",
          [parentUserId]
        );

        if (data[0].length === 0) {
          await queryDB(
            "INSERT INTO debug_log (message) VALUES (?)",
            [`No se ha notificado a la sucursal del vendedor respecto al nuevo cliente ${generatedCode} registrado.`]
          )
        }

        const infoNotSuc = `${role};${generatedCode}`

        const idSucursalOfSeller = data[0].user_parent_id
        await queryDB(
          "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?)",
          [idSucursalOfSeller, infoNotSuc, "19"]
        )
        await queryDB(
          "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?)",
          [parentUserId, infoNotification, "213"]
        );
      }

      return NextResponse.json(
        {
          message: "Usuario registrado con éxito",
          userId: newUserId,
          codeCollaborator: generatedCode,
          details: {
            parentUser: parentUserId,
            parentUserCode: codeCollaborator || null,
            state: "pending",
            role: finalRole,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error en el registro:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "El correo ya está en uso" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}
