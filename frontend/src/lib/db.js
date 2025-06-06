import mysql from 'mysql2/promise';

let pool;

if (!global._pool) {
  global._pool = mysql.createPool({
    uri: process.env.DB_URL,
    waitForConnections: true,
    connectionLimit: 120,        // ajusta según tus necesidades
    queueLimit: 0               // 0 = sin límite de espera
  });
}

pool = global._pool;

export { pool };