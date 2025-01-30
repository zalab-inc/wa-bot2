import { Client, type Message } from "whatsapp-web.js";
import { openai } from "@ai-sdk/openai";
import {
	generateText,
	type CoreMessage,
	type CoreSystemMessage,
	type CoreUserMessage,
	type CoreAssistantMessage,
} from "ai";
import qrcode from "qrcode-terminal";
import { config } from "../config/env";
import { db } from "../config/database";
import { LocalAuth } from "whatsapp-web.js";

interface ChatData {
	phone_number: string;
	message: string;
	response: string;
	created_at: Date;
	is_sent: boolean;
	error_message?: string;
}

export class ChatBotService {
	private client: Client;
	private readonly MAX_HISTORY = 5;

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
				executablePath: process.env.CHROME_PATH,
			},
			webVersionCache: {
				type: "none",
			},
			userAgent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
		});
		this.setupEventHandlers();
	}

	private setupEventHandlers() {
		this.client.on("qr", (qr) => {
			console.log("Scan this QR code with WhatsApp:");
			qrcode.generate(qr, { small: true });
		});

		this.client.on("ready", () => {
			console.log("WhatsApp client is ready!");
		});

		this.client.on("message_create", async (message: Message) => {
			if (message.fromMe) return;
			await this.handleMessage(message);
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
			console.log(`Received message from ${message.from}: ${message.body}`);

			// Build conversation context with history
			const messages = await this.buildConversationContext(
				message.from,
				message.body,
			);

			// Generate AI response
			const { text: response } = await generateText({
				model: openai("gpt-4"),
				messages,
			});

			// Send response
			await message.reply(response);
			console.log(`Sent response to ${message.from}: ${response}`);

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
					"Sorry, there was an error processing your message. Please try again later.",
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

			console.log("Chat saved successfully:", {
				phone: chatData.phone_number,
				status: chatData.is_sent ? "sent" : "failed",
			});
		} catch (error) {
			console.error("Error saving chat to database:", error);
		}
	}

	public async initialize() {
		try {
			console.log("Initializing WhatsApp client...");
			await this.client.initialize();
		} catch (error) {
			console.error("Failed to initialize WhatsApp client:", error);
			throw error;
		}
	}

	public async destroy() {
		try {
			await this.client.destroy();
			console.log("WhatsApp client destroyed successfully");
		} catch (error) {
			console.error("Error destroying WhatsApp client:", error);
			throw error;
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
		const messages: CoreMessage[] = [
			{
				role: "system",
				content:
					"You are a helpful assistant responding via WhatsApp. Keep responses concise and friendly. You have access to chat history to maintain context.",
			} as CoreSystemMessage,
		];

		for (const chat of history) {
			messages.push(
				{ role: "user", content: chat.message } as CoreUserMessage,
				{ role: "assistant", content: chat.response } as CoreAssistantMessage,
			);
		}

		messages.push({ role: "user", content: currentMessage } as CoreUserMessage);

		return messages;
	}
}
