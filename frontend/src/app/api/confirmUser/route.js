import { NextResponse } from "next/server";
import { queryDB } from "@/lib/dbUtils";

export async function POST (req) {
    
    const userId = await req.json();
    
    if (!userId) {
        return NextResponse.json({ error: "userId es requerido" }, { status: 400 });
    }

    try {
        const result = await queryDB(
            "SELECT status FROM users WHERE user_id = ?",
            [userId]
        );
        if (!result || result.length === 0) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        console.log("Estado del usuario:", result[0].status);

        return NextResponse.json(
            { response: result[0].status },
            { status: 200 }
        );
        
    } catch (error) {
        console.error("Error al confirmar usuario:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
        
    }
}