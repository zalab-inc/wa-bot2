import knex from "knex";
import dotenv from "dotenv";

dotenv.config();

export const db = knex({
	client: "mysql2",
	connection: {
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
	},
});

// Simple connection test function
export async function testConnection() {
	try {
		await db.raw("SELECT 1");
		console.log("Database connection successful!");
		return true;
	} catch (error) {
		console.error("Database connection failed:", error);
		return false;
	}
}

// In src/config/database.ts
console.log("Database connection config:", {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	database: process.env.DB_NAME,
});

// Test the connection explicitly
testConnection()
	.then((success) => console.log("Connection test result:", success))
	.catch((error) => console.error("Connection test error:", error));
