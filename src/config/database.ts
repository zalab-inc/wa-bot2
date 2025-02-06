import knex from "knex";
import dotenv from "dotenv";

dotenv.config();

// Add debug logging
console.log("Database connection attempt with:", {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	database: process.env.DB_NAME,
	hasPassword: !!process.env.DB_PASSWORD,
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
	debug: false, // Enable debug logging
});
