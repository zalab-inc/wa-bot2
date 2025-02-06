import { Client, LocalAuth, type Message } from "whatsapp-web.js";
import { openai } from "@ai-sdk/openai";
import {
	generateText,
	type CoreMessage,
	type CoreSystemMessage,
	type CoreUserMessage,
	type CoreAssistantMessage,
} from "ai";
import { db } from "./config/database";
import { systemPrompt } from "./config/prompt";

interface ChatData {
	phone_number: string;
	message: string;
	response: string;
	created_at: Date;
	is_sent: boolean;
	error_message?: string;
}

class WhatsAppService {
	private client: Client;
	private readyCallback?: () => Promise<void>;
	private readonly MAX_HISTORY = 5;

	constructor() {
		this.client = new Client({
			authStrategy: new LocalAuth(),
			puppeteer: {
				headless: true,
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

		// AI Message Handler
		this.client.on("message", async (message: Message) => {
			if (message.fromMe) return;

			const isCalled =
				message.body.toLowerCase().includes("aik") ||
				message.body.toLowerCase().includes("kelasinovatif") ||
				message.body.toLowerCase().includes("wulang");

			// Get the actual sender ID from group message
			const senderId = message.author || message.from;

			// Extract phone number from sender ID
			const phoneNumber = senderId.split("@")[0].split("-")[0];

			const allowedNumbers = [
				"6281235581851",
				"6285712208535",
				"6282323363406",
			];

			const isCalledFrom = allowedNumbers.includes(phoneNumber);

			if (isCalled && isCalledFrom) {
				console.log("Processing message from:", phoneNumber);
				await this.handleMessage(message);
			} else {
				console.log(
					"Message not processed. Called:",
					isCalled,
					"From allowed number:",
					isCalledFrom,
				);
				console.log("Phone number extracted:", phoneNumber);
			}
		});
	}

	private async handleMessage(message: Message) {
		const chatData: Partial<ChatData> = {
			phone_number: message.from,
			message: message.body,
			created_at: new Date(),
			is_sent: false,
		};

		try {
			// console.log(`Received message from ${message.from}: ${message.body}`);
			console.log(`Received message from ${message.from}`);

			// Build conversation context with history
			const messages = await this.buildConversationContext(
				message.from,
				message.body,
			);

			// Generate AI response
			const { text: response } = await generateText({
				model: openai("gpt-4o-mini"),
				messages,
			});

			// Send response
			await message.reply(response);
			// console.log(`Sent response to ${message.from}: ${response}`);

			// Update chat data
			chatData.response = response;
			chatData.is_sent = true;

			// Save to database
			await this.saveChat(chatData as ChatData);
		} catch (error) {
			console.error("Error handling message:", error);
			chatData.error_message =
				error instanceof Error ? error.message : "Unknown error";
			chatData.is_sent = false;

			if (chatData.message) {
				await this.saveChat(chatData as ChatData);
			}

			try {
				await message.reply(
					"Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi nanti.",
				);
			} catch (replyError) {
				console.error("Error sending error message:", replyError);
			}
		}
	}

	private async saveChat(chatData: ChatData) {
		try {
			if (!chatData.phone_number || !chatData.message) {
				throw new Error("Missing required chat data");
			}

			await db("chats").insert({
				phone_number: chatData.phone_number,
				message: chatData.message,
				response: chatData.response || null,
				created_at: chatData.created_at,
				is_sent: chatData.is_sent,
				error_message: chatData.error_message,
			});

			// console.log("Chat saved successfully:", {
			// 	phone: chatData.phone_number,
			// 	status: chatData.is_sent ? "sent" : "failed",
			// });
		} catch (error) {
			console.error("Error saving chat to database:", error);
		}
	}

	private async getChatHistory(phoneNumber: string): Promise<ChatData[]> {
		try {
			const history = await db("chats")
				.where({
					phone_number: phoneNumber,
					is_sent: true,
				})
				.orderBy("created_at", "desc")
				.limit(this.MAX_HISTORY)
				.select();

			return history.reverse();
		} catch (error) {
			console.error("Error fetching chat history:", error);
			return [];
		}
	}

	private async buildConversationContext(
		phoneNumber: string,
		currentMessage: string,
	): Promise<CoreMessage[]> {
		const history = await this.getChatHistory(phoneNumber);
		const messages: CoreMessage[] = [];

		// Add system message with proper typing
		const systemMessage: CoreSystemMessage = {
			role: "system",
			content: systemPrompt,
		};
		messages.push(systemMessage);

		for (const chat of history) {
			const userMessage: CoreUserMessage = {
				role: "user",
				content: chat.message,
			};
			const assistantMessage: CoreAssistantMessage = {
				role: "assistant",
				content: chat.response,
			};
			messages.push(userMessage, assistantMessage);
		}

		const finalUserMessage: CoreUserMessage = {
			role: "user",
			content: currentMessage,
		};
		messages.push(finalUserMessage);

		return messages;
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

whatsappService.onReady(async () => {
	console.log("WhatsApp service is ready to use!");
});

process.on("SIGINT", async () => {
	console.log("Shutting down...");
	process.exit(0);
});

async function startWhatsAppService() {
	try {
		await whatsappService.initialize();
	} catch (error) {
		console.error("Failed to initialize WhatsApp service:", error);
		process.exit(1);
	}
}

startWhatsAppService();
