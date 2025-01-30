import { Client, LocalAuth } from "whatsapp-web.js";
import { config } from "./config/env";

class WhatsAppService {
	private client: Client;
	private readyCallback?: () => Promise<void>;

	constructor() {
		this.client = new Client({
			authStrategy: new LocalAuth(),
			puppeteer: {
				headless: false,
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-dev-shm-usage",
				],
			},
		});

		this.setupEventHandlers();
	}

	private setupEventHandlers() {
		this.client.on("loading_screen", (percent, message) => {
			console.log("LOADING SCREEN", percent, message);
		});

		this.client.on("qr", (qr) => {
			console.log("QR Code received. Scan with WhatsApp:");
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

		this.client.on("disconnected", (reason) => {
			console.log("Client was disconnected", reason);
		});

		// Menambahkan handler untuk pesan masuk
		this.client.on("message", async (message) => {
			console.log("Message received:", message.body);
			// Balas setiap pesan dengan "Pong"
			await message.reply("Pong");
		});
	}

	public onReady(callback: () => Promise<void>) {
		this.readyCallback = callback;
	}

	public async initialize() {
		try {
			await this.client.initialize();
		} catch (error) {
			console.error("Failed to initialize WhatsApp client:", error);
			process.exit(1);
		}
	}
}

const whatsappService = new WhatsAppService();

// Contoh penggunaan callback onReady
whatsappService.onReady(async () => {
	console.log("WhatsApp service is ready to use!");
});

// Handle process termination
process.on("SIGINT", async () => {
	console.log("Shutting down...");
	process.exit(0);
});

// Inisialisasi WhatsApp service
async function startWhatsAppService() {
	try {
		await whatsappService.initialize();
	} catch (error) {
		console.error("Failed to initialize WhatsApp service:", error);
		process.exit(1);
	}
}

startWhatsAppService();
