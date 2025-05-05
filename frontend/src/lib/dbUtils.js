import { pool } from "./db";

export const queryDB = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);

    const [[status]] = await pool.query(
      'SHOW STATUS WHERE `variable_name` = "Threads_connected"'
    );
    console.log("Conexiones activas:", status);

    return results;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}
