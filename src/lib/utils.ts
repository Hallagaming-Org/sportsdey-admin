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