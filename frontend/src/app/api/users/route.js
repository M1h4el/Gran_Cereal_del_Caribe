import { queryDB } from "@/lib/dbUtils";
import { NextResponse } from "next/server";

export async function GET() {
  const { searchParams } = new URL(req.url);
  const searchByCode = searchParams.get("searchByCode");

  if (!searchByCode) {
    return NextResponse.json(
      { error: "Se requiere searchByCode" },
      { status: 400 }
    );
  }

  try {
    const [users] = await queryDB("SELECT * FROM users");
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json();
    const [result] = await queryDB(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?)",
      [name, email, password, role]
    );

    return NextResponse.json({ id: result.insertId, name, email, role });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId || isNaN(Number(userId))) {
    return NextResponse.json({error: "Invalid or missing userId"}, { status: 400 });
  }
  try {
    const {phone, dob, country, region, city, postalCode, address } =
      await req.json();

    
    if (!phone || !country || !region || !city || !postalCode || !address) {
      return NextResponse.json({error: "Missing required fields"}, { status: 400 });
    }

    const formattedDob = dob ?? Date.json(dob).toISOString().slice(0, 19).replace('T', ' ') ;

    console.log("variables", {
      phone,
      formattedDob,
      country,
      region,
      city,
      postalCode,
      address,
    });

    const res = await queryDB(
      "UPDATE users SET phone = ?, dob = ?, country = ?, region = ?, city = ?, postalCode = ?, address = ?, status = 'confirmed' WHERE user_id = ?;",
      [phone, formattedDob, country, region, city, postalCode, address, userId]
    );

    console.log("res", res);

    if (res.affectedRows === 0) {
      return NextResponse.json("User not found", { status: 404 });
    }

    await queryDB(
      "INSERT INTO notifications (user_id, info, type) VALUES (?, ?, ?)",
      [userId, null, "1"]
    );

    return NextResponse.json({ message: "Usuario actualizado" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}