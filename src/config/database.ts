import knex from "knex";
import dotenv from "dotenv";

dotenv.config();

// Add debug logging
console.log("Attempting database connection with:", {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	database: process.env.DB_NAME,
	client: "mysql2",
});

export const db = knex({
	client: "mysql2",
	connection: {
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		charset: "utf8mb4",
	},
	pool: {
		min: 2,
		max: 10,
	},
});

// Modified test connection function
export async function testConnection() {
	try {
		const result = await db.raw("SELECT 1 as test");
		console.log("Raw connection test result:", result);
		return true;
	} catch (error: unknown) {
		const err = error as {
			code?: string;
			errno?: number;
			sqlState?: string;
			sqlMessage?: string;
		};
		console.error("Detailed connection error:", {
			code: err.code,
			errno: err.errno,
			sqlState: err.sqlState,
			sqlMessage: err.sqlMessage,
		});
		return false;
	}
}
