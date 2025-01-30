import { WhatsAppService, WhatsAppError } from "./services/whatsapp.service";
import {
	MessageService,
	type MessageRequest,
} from "./services/message.service";
import { recipients } from "./data/recipients";
import { messagesTemplate } from "./data/messages";
import { config } from "./config/env";

async function main() {
	const whatsapp = new WhatsAppService();
	const messageService = new MessageService(whatsapp);

	try {
		await whatsapp.initialize();

		// Menunggu client siap
		whatsapp.onReady(async () => {
			try {
				// Kirim pesan template ke semua recipients
				console.log("Mulai mengirim pesan template ke recipients...");

				// Kirim pesan satu per satu dengan ID
				let totalSent = 0;
				const failed: { phoneNumber: string; error: string }[] = [];

				for (const recipient of recipients) {
					try {
						// Pilih template pesan secara random
						const template =
							messagesTemplate[
								Math.floor(Math.random() * messagesTemplate.length)
							];

						await whatsapp.sendMessage(
							recipient.phone.toString(),
							template.message,
							recipient.id,
							template.id,
						);

						totalSent++;

						// Delay sebelum pesan berikutnya
						if (recipient !== recipients[recipients.length - 1]) {
							// Cek apakah perlu delay khusus setiap 5 pesan
							const isPerFiveMessages = totalSent > 0 && totalSent % 5 === 0;
							let delayTime;

							if (isPerFiveMessages) {
								delayTime = Math.floor(
									Math.random() *
										(config.MAX_DELAY_PER_5_MESSAGES -
											config.MIN_DELAY_PER_5_MESSAGES +
											1) +
										config.MIN_DELAY_PER_5_MESSAGES,
								);
								console.log(
									`Menunggu ${(delayTime / 1000).toFixed(3)} detik setelah mengirim 5 pesan...`,
								);
							} else {
								delayTime = Math.floor(
									Math.random() *
										(config.MAX_DELAY_PER_MESSAGE -
											config.MIN_DELAY_PER_MESSAGE +
											1) +
										config.MIN_DELAY_PER_MESSAGE,
								);
								console.log(
									`Menunggu ${(delayTime / 1000).toFixed(3)} detik sebelum mengirim pesan berikutnya...`,
								);
							}

							await new Promise((resolve) => setTimeout(resolve, delayTime));
						}
					} catch (error) {
						failed.push({
							phoneNumber: recipient.phone.toString(),
							error: error instanceof Error ? error.message : "Unknown error",
						});
					}
				}

				console.log("Hasil pengiriman:", {
					totalBerhasil: totalSent,
					totalGagal: failed.length,
					detailGagal: failed,
				});
			} catch (error) {
				if (error instanceof WhatsAppError) {
					console.error("Gagal mengirim pesan:", error.message);
				} else {
					console.error(
						"Unexpected error:",
						error instanceof Error ? error.message : "Unknown error",
					);
				}
			}
		});
	} catch (error) {
		if (error instanceof WhatsAppError) {
			console.error("WhatsApp error:", error.message);
		} else {
			console.error(
				"Unexpected error:",
				error instanceof Error ? error.message : "Unknown error",
			);
		}
		process.exit(1);
	}
}

main();
