import mysql from 'mysql2/promise';

let pool;

if (!global._pool) {
  global._pool = mysql.createPool(process.env.DB_URL);
}

pool = global._pool;

export { pool };