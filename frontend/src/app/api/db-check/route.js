import mysql from 'mysql2/promise';

export async function GET() {
  // ⚠️ Seguridad: esto solo debe estar activo mientras diagnostiques
  // Después de verificar, elimina este endpoint o añade autenticación
  
  try {
    console.log('🔍 Conectando a la base de datos desde Vercel...');
    
    const connection = await mysql.createConnection({
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT || 3306,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE
    });

    const [tables] = await connection.query('SHOW TABLES');
    
    const tableNames = tables.map(table => Object.values(table)[0]);
    const tablesDetail = [];
    
    for (const name of tableNames) {
      const [count] = await connection.query(`SELECT COUNT(*) as total FROM \`${name}\``);
      tablesDetail.push({ name, rows: count[0].total });
    }
    
    await connection.end();
    
    return Response.json({
      success: true,
      database: process.env.MYSQLDATABASE,
      tables: tablesDetail,
      message: `✅ Base de datos con ${tablesDetail.length} tablas encontradas`
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({
      success: false,
      error: error.message,
      hint: "Verifica que las variables de entorno estén configuradas en Vercel"
    }, { status: 500 });
  }
}