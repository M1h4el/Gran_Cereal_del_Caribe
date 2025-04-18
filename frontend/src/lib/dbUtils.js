import { pool } from "./db";

export async function queryDB(query, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(query, params);
    const [rows] = await connection.query(
      'SHOW STATUS WHERE `variable_name` = "Threads_connected"'
    );
    console.log("Conexiones activas:", rows[0]);
    return results;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}
