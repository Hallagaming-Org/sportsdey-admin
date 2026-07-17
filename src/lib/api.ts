let API_BASE = (import.meta.env.VITE_API_BASE as string) || "https://api.sportsdey.com";
if (API_BASE === "/api") {
	API_BASE = "https://api.sportsdey.com";
}
if (import.meta.env.DEV && import.meta.env.MODE === "staging") {
	API_BASE = "/staging-api";
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface FetchOptions {
	method?: HttpMethod;
	body?: unknown;
	headers?: Record<string, string>;
}

export interface ApiErrorDetail {
	field: string;
	message: string;
	code: string;
}

export function getCookie(name: string): string | null {
	if (typeof document === "undefined") return null;
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) {
		const cookies = parts.pop()?.split(";").shift();
		return cookies || null;
	}
	return null;
}

export function setCookie(name: string, value: string, days: number = 7): void {
	if (typeof document === "undefined") return;
	let expires = "";
	if (days) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

async function fetchApi<T>(
	endpoint: string,
	options: FetchOptions = {},
): Promise<{
	success: boolean;
	data?: T;
	error?: string;
	statusCode?: number;
	details?: ApiErrorDetail[] | null;
}> {
	const { method = "GET", body, headers = {} } = options;

	const token = getCookie("admin_session");

	const fetchOptions: RequestInit = {
		method,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...headers,
		},
		credentials: "include",
	};

	if (body && method !== "GET") {
		fetchOptions.body = JSON.stringify(body);
	}

	const response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

	let result;
	try {
		result = await response.json();
	} catch {
		if (response.status === 404) {
			return {
				success: false,
				error: "Not found",
				statusCode: 404,
			};
		}
		return {
			success: false,
			error: `Request failed with status ${response.status}`,
			statusCode: response.status,
		};
	}

	if (response.status === 404) {
		return {
			success: false,
			error: "Not found",
			statusCode: 404,
		};
	}

	if (!response.ok || result.success === false) {
		const errorMessage =
			response.status === 400
				? result.error || "Invalid request."
				: "An error occurred. Try again later.";
		return {
			success: false,
			error: errorMessage,
			statusCode: response.status,
			details: result.details ?? null,
		};
	}

	return {
		success: true,
		data: result.data,
		statusCode: response.status,
	};
}

export type { FetchOptions, HttpMethod };
export { API_BASE, fetchApi };
