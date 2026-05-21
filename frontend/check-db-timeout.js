import mysql from 'mysql2/promise';

// ⚠️ ACTUALIZA CON TU DIRECCIÓN DEL TCP PROXY ⚠️
const TCP_HOST = 'interchange.proxy.rlwy.net';  // ← Cambia esto
const TCP_PORT = 28435;                          // ← Cambia esto

async function checkDatabase() {
  try {
    console.log('🔍 Conectando a través del TCP Proxy...');
    console.log(`   Proxy: ${TCP_HOST}:${TCP_PORT}`);
    console.log(`   Usuario: ${process.env.MYSQLUSER}`);
    console.log(`   Base de datos: ${process.env.MYSQLDATABASE}`);
    
    const connection = await mysql.createConnection({
      host: TCP_HOST,
      port: TCP_PORT,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      connectTimeout: 30000,  // 30 segundos de timeout
      timeout: 30000
    });

    console.log('✅ Conectado exitosamente!\n');
    
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('📭 La base de datos está vacía');
    } else {
      console.log(`📋 Encontradas ${tables.length} tabla(s):\n`);
      
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        console.log(`📊 ${tableName}`);
        
        const [count] = await connection.query(`SELECT COUNT(*) as total FROM \`${tableName}\``);
        console.log(`   📈 ${count[0].total} registros`);
        console.log('');
      }
    }
    
    await connection.end();
    console.log('✨ Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ETIMEDOUT') {
      console.error('   ⏰ Timeout: El proxy tarda en responder. Verifica:');
      console.error('      1. Que el TCP Proxy esté ACTIVADO en Railway');
      console.error('      2. Que el host y puerto sean correctos');
      console.error('      3. Que no haya firewall bloqueando');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   🔌 Conexión rechazada. ¿El TCP Proxy está activo?');
    }
  }
}

checkDatabase();