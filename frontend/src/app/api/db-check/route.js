import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    
    const connection = await mysql.createConnection({
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT || 3306,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE
    });

    const [tables] = await connection.query('SHOW TABLES');
    const tablesList = tables.map(table => Object.values(table)[0]);
    
    await connection.end();
    
    return NextResponse.json({
      success: true,
      database: process.env.MYSQLDATABASE,
      tables: tablesList,
      totalTables: tablesList.length
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}