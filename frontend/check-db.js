import mysql from 'mysql2/promise';

async function checkDatabase() {
  try {
    console.log('🔍 Verificando base de datos desde Railway...');
    console.log('Host:', process.env.MYSQLHOST);
    console.log('Database:', process.env.MYSQLDATABASE);
    
    const connection = await mysql.createConnection({
      host: 'kodama.proxy.rlwy.net',
      port: 3306,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE
    });

    console.log('✅ Conexión exitosa!\n');
    
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('📭 La base de datos está vacía');
      console.log('\n❌ Esta NO es tu base de datos esperada (no tiene tablas)');
    } else {
      console.log(`📋 Encontradas ${tables.length} tabla(s):\n`);
      const tableNames = [];
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        tableNames.push(tableName);
        console.log(`📊 ${tableName}`);
        
        const [count] = await connection.query(`SELECT COUNT(*) as total FROM \`${tableName}\``);
        console.log(`   📈 ${count[0].total} registros`);
      }
      
      console.log('\n✅ Esta ES la base de datos que tienes actualmente');
      console.log('💡 Compara los nombres de tablas con lo que recuerdas de tu proyecto anterior');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase();