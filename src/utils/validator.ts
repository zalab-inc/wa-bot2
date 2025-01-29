export function validatePhoneNumber(number: string): boolean {
	// Remove any non-numeric characters
	const cleanNumber = number.replace(/[^\d]/g, "");

	// Basic validation for international format
	// Must start with country code and be between 10-15 digits
	const phoneRegex = /^\d{10,15}$/;
	return phoneRegex.test(cleanNumber);
}

export function formatPhoneNumber(number: string): string {
	// Remove any non-numeric characters
	const cleanNumber = number.replace(/[^\d]/g, "");

	// Ensure number has country code
	if (!cleanNumber.startsWith("62")) {
		return `62${cleanNumber.startsWith("0") ? cleanNumber.slice(1) : cleanNumber}`;
	}
	return cleanNumber;
}
