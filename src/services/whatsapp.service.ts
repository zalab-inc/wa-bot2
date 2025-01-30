import { Client, LocalAuth } from "whatsapp-web.js";
import { config } from "../config/env";
import { validatePhoneNumber, formatPhoneNumber } from "../utils/validator";

export class WhatsAppError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "WhatsAppError";
	}
}

export class WhatsAppService {
	private client: Client;
	private readyCallback?: () => Promise<void>;

	constructor() {
		this.client = new Client({
			authStrategy: new LocalAuth({
				dataPath: config.SESSION_PATH,
			}),
			puppeteer: {
				headless: config.HEADLESS,
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-dev-shm-usage",
					"--disable-accelerated-2d-canvas",
					"--disable-gpu",
				],
			},
		});

		this.setupEventHandlers();
	}

	private setupEventHandlers() {
		this.client.on("qr", (qr) => {
			console.log("QR Code received. Scan with WhatsApp:");
			// Generate QR in terminal
			require("qrcode-terminal").generate(qr, { small: true });
		});

		this.client.on("ready", async () => {
			const info = await this.client.info;
			if (info) {
				console.log(`Phone number: ${info.wid.user}`);
			}
			console.log("Client is ready to send messages!");
			if (this.readyCallback) {
				this.readyCallback().catch((error) => {
					console.error("Error in ready callback:", error);
				});
			}
		});

		this.client.on("authenticated", () => {
			console.log("Authenticated successfully!");
		});

		this.client.on("auth_failure", (msg) => {
			console.error("Authentication failed:", msg);
		});
	}

	public onReady(callback: () => Promise<void>) {
		this.readyCallback = callback;
	}

	public async initialize() {
		try {
			await this.client.initialize();
		} catch (error) {
			throw new WhatsAppError(
				`Failed to initialize WhatsApp client: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	public async sendMessage(
		phoneNumber: string,
		message: string,
		recipientId?: number,
		messageId?: number,
	): Promise<void> {
		try {
			if (!validatePhoneNumber(phoneNumber)) {
				throw new WhatsAppError("Invalid phone number format");
			}

			const formattedNumber = formatPhoneNumber(phoneNumber);
			const chatId = `${formattedNumber}@c.us`;

			// Check if number exists on WhatsApp
			const numberDetails = await this.client.getNumberId(formattedNumber);
			if (!numberDetails) {
				throw new WhatsAppError("Phone number is not registered on WhatsApp");
			}

			await this.client.sendMessage(chatId, message);
			// Log ketika pesan berhasil terkirim ke nomor tujuan
			console.log(
				`Message${messageId ? ` [ID: ${messageId}]` : ""} sent successfully to ${formattedNumber}${recipientId ? ` (ID: ${recipientId})` : ""}`,
			);
		} catch (error) {
			if (error instanceof WhatsAppError) {
				throw error;
			}
			throw new WhatsAppError(
				`Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}
