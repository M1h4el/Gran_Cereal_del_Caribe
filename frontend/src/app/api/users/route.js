import { queryDB } from "@/lib/dbUtils";

export async function GET() {
  try {
    const [users] = await queryDB("SELECT * FROM users");
    return Response.json(users);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json();
    const [result] = await queryDB(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?)",
      [name, email, password, role]
    );

    return Response.json({ id: result.insertId, name, email, role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId || isNaN(Number(userId))) {
    return new Response("Invalid or missing userId", { status: 400 });
  }
  try {
    const {phone, dob, country, region, city, postalCode, address } =
      await req.json();

    
    if (!phone || !country || !region || !city || !postalCode || !address) {
      return new Response("Missing required fields", { status: 400 });
    }

    const formattedDob = dob ?? new Date(dob).toISOString().slice(0, 19).replace('T', ' ') ;

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
      return new Response("User not found", { status: 404 });
    }

    return Response.json({ message: "Usuario actualizado" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
