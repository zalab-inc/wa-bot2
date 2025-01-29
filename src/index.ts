import { WhatsAppService, WhatsAppError } from "./services/whatsapp.service";
import {
	MessageService,
	type MessageRequest,
} from "./services/message.service";
import { recipients } from "./data/recipients";

// Import dan export template messages
const messagesTemplate = [
	{
		id: 1,
		message: "Halo, apa kabar hari ini? Semoga sehat selalu ya!",
	},
	{
		id: 2,
		message: "Hai! Bagaimana kabarmu hari ini?",
	},
	{
		id: 3,
		message: "Semoga harimu menyenangkan! Beritahu saya jika butuh bantuan.",
	},
	{
		id: 4,
		message: "Selamat siang! Sekedar menyapa.",
	},
	{
		id: 5,
		message: "Hai! Bagaimana minggu ini berjalan?",
	},
];

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
				const results = await messageService.sendTemplateToRecipients(
					recipients,
					messagesTemplate,
					{ randomTemplate: true },
				);

				console.log("Hasil pengiriman:", {
					totalBerhasil: results.totalSent,
					totalGagal: results.failed.length,
					detailGagal: results.failed,
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
