import { type WhatsAppService, WhatsAppError } from "./whatsapp.service";
import { config } from "../config/env";

export interface MessageRequest {
	phoneNumber: string;
	message: string;
}

export interface BulkMessageRequest {
	messages: MessageRequest[];
}

export interface MessageTemplate {
	id: number;
	message: string;
}

export class MessageService {
	constructor(private whatsappService: WhatsAppService) {}

	private getRandomDelay(isPerFiveMessages = false): number {
		if (isPerFiveMessages) {
			return Math.floor(
				Math.random() *
					(config.MAX_DELAY_PER_5_MESSAGES -
						config.MIN_DELAY_PER_5_MESSAGES +
						1) +
					config.MIN_DELAY_PER_5_MESSAGES,
			);
		}
		return Math.floor(
			Math.random() *
				(config.MAX_DELAY_PER_MESSAGE - config.MIN_DELAY_PER_MESSAGE + 1) +
				config.MIN_DELAY_PER_MESSAGE,
		);
	}

	private async delay(messageCount: number) {
		const isPerFiveMessages = messageCount > 0 && messageCount % 5 === 0;
		const delayTime = this.getRandomDelay(isPerFiveMessages);

		if (isPerFiveMessages) {
			console.log(
				`Menunggu ${delayTime / 1000} detik setelah mengirim 5 pesan...`,
			);
		} else {
			console.log(
				`Menunggu ${delayTime / 1000} detik sebelum mengirim pesan berikutnya...`,
			);
		}

		await new Promise((resolve) => setTimeout(resolve, delayTime));
	}

	async sendSingleMessage(request: MessageRequest): Promise<void> {
		try {
			await this.whatsappService.sendMessage(
				request.phoneNumber,
				request.message,
			);
		} catch (error) {
			if (error instanceof WhatsAppError) {
				throw error;
			}
			throw new WhatsAppError(
				`Message service error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async sendBulkMessages(request: BulkMessageRequest): Promise<{
		success: MessageRequest[];
		failed: { request: MessageRequest; error: string }[];
	}> {
		const results = {
			success: [] as MessageRequest[],
			failed: [] as { request: MessageRequest; error: string }[],
		};

		for (let i = 0; i < request.messages.length; i++) {
			const messageRequest = request.messages[i];
			try {
				await this.sendSingleMessage(messageRequest);
				results.success.push(messageRequest);
				await this.delay(results.success.length); // Pass message count for delay calculation
			} catch (error) {
				results.failed.push({
					request: messageRequest,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		return results;
	}

	async sendMessageWithRetry(
		request: MessageRequest,
		maxRetries = 3,
		delayMs?: number,
	): Promise<void> {
		let lastError: Error | undefined;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				await this.sendSingleMessage(request);
				return; // Success, exit the function
			} catch (error) {
				lastError = error instanceof Error ? error : new Error("Unknown error");
				console.log(`Attempt ${attempt} failed: ${lastError.message}`);

				if (attempt < maxRetries) {
					await new Promise((resolve) =>
						setTimeout(resolve, delayMs || this.getRandomDelay()),
					);
				}
			}
		}

		throw new WhatsAppError(
			`Failed to send message after ${maxRetries} attempts. Last error: ${lastError?.message}`,
		);
	}

	async sendTemplateToRecipients(
		recipients: string[],
		templates: MessageTemplate[],
		options = { randomTemplate: true },
	): Promise<{
		totalSent: number;
		failed: { phoneNumber: string; error: string }[];
	}> {
		const results = {
			totalSent: 0,
			failed: [] as { phoneNumber: string; error: string }[],
		};

		for (const phoneNumber of recipients) {
			try {
				// Pilih template pesan
				const template = options.randomTemplate
					? templates[Math.floor(Math.random() * templates.length)]
					: templates[results.totalSent % templates.length];

				await this.sendSingleMessage({
					phoneNumber,
					message: template.message,
				});

				results.totalSent++;
				await this.delay(results.totalSent); // Pass message count for delay calculation
			} catch (error) {
				results.failed.push({
					phoneNumber,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		return results;
	}
}
