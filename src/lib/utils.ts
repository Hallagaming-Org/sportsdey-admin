import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
export function truncateText(text: string, length: number) {
	if (text.length > length) {
		return text.slice(0, length) + "...";
	}
	return text;
}

export function capitalizeName(name: string) {
	if (!name) return "";
	return name
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

export function formatDeviceInfo(uaOrDevice?: string | null): string {
	if (!uaOrDevice || uaOrDevice === "N/A" || uaOrDevice === "-") return "N/A";

	if (uaOrDevice.includes("Mozilla/") || uaOrDevice.includes("AppleWebKit/") || uaOrDevice.length > 30) {
		let os = "";
		let browser = "";

		if (/iPhone/i.test(uaOrDevice)) os = "iPhone";
		else if (/iPad/i.test(uaOrDevice)) os = "iPad";
		else if (/Android/i.test(uaOrDevice)) os = "Android";
		else if (/Windows/i.test(uaOrDevice)) os = "Windows PC";
		else if (/Macintosh|Mac OS/i.test(uaOrDevice)) os = "macOS";
		else if (/Linux/i.test(uaOrDevice)) os = "Linux";

		if (/Edg\//i.test(uaOrDevice)) browser = "Edge";
		else if (/OPR\/|Opera/i.test(uaOrDevice)) browser = "Opera";
		else if (/Chrome\/|CriOS/i.test(uaOrDevice)) browser = "Chrome";
		else if (/Firefox\/|FxiOS/i.test(uaOrDevice)) browser = "Firefox";
		else if (/Safari/i.test(uaOrDevice) && !/Chrome/i.test(uaOrDevice)) browser = "Safari";

		if (os && browser) return `${os} (${browser})`;
		if (os) return os;
		if (browser) return browser;

		return uaOrDevice.length > 25 ? `${uaOrDevice.slice(0, 25)}...` : uaOrDevice;
	}

	return uaOrDevice;
}

/**
 * Generates a random secure password of length between minLength and maxLength (default 8 to 12 chars),
 * containing uppercase letters, lowercase letters, numbers, and symbols.
 */
export function generateRandomPassword(minLength = 8, maxLength = 12): string {
	const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
	const lowers = "abcdefghijkmnopqrstuvwxyz";
	const numbers = "23456789";
	const symbols = "!@#$%^&*";
	const allChars = uppers + lowers + numbers + symbols;

	const range = Math.max(0, maxLength - minLength);
	const length = Math.floor(Math.random() * (range + 1)) + minLength;

	let password = [
		uppers[Math.floor(Math.random() * uppers.length)],
		lowers[Math.floor(Math.random() * lowers.length)],
		numbers[Math.floor(Math.random() * numbers.length)],
		symbols[Math.floor(Math.random() * symbols.length)],
	];

	for (let i = password.length; i < length; i++) {
		password.push(allChars[Math.floor(Math.random() * allChars.length)]);
	}

	password = password.sort(() => Math.random() - 0.5);
	return password.join("");
}