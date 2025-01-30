import dotenv from "dotenv";
dotenv.config();

export interface Config {
	HEADLESS: boolean;
	SESSION_PATH: string;
	MIN_DELAY_PER_MESSAGE: number;
	MAX_DELAY_PER_MESSAGE: number;
	MIN_DELAY_PER_5_MESSAGES: number;
	MAX_DELAY_PER_5_MESSAGES: number;
}

export const config: Config = {
	// WhatsApp client settings
	HEADLESS: true,
	SESSION_PATH: "./config/session",

	// Delay settings (dalam milliseconds)
	MIN_DELAY_PER_MESSAGE: 15000, // 15 detik
	MAX_DELAY_PER_MESSAGE: 30000, // 30 detik

	// Delay settings per 5 messages
	MIN_DELAY_PER_5_MESSAGES: 100000, // 100 detik
	MAX_DELAY_PER_5_MESSAGES: 150000, // 150 detik
};
