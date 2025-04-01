import pool from '@/lib/db.js';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT NOW() AS now');
    return Response.json({ 
      message: 'Conexión exitosa', 
      serverTime: rows[0].now 
    });
  } catch (error) {
    return Response.json({ 
      error: 'Error al conectar con la base de datos', 
      details: error.message 
    }, { status: 500 });
  }
}