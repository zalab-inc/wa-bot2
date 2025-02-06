import knex from "knex";
import { config } from "./env";

// Initialize database connection
// export const db = knex({
// 	client: "mysql2",
// 	connection: {
// 		host: "localhost",
// 		user: "root",
// 		password: "root",
// 		database: "wa_bot",
// 	},
// });

export const db = knex({
	client: "mysql2",
	connection: {
		host: "localhost",
		user: "wabot",
		password: "root",
		database: "X2k9#mP$vL5nQ@3j",
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
