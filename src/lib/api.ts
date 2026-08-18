const viteApiBase = String(import.meta.env.VITE_API_BASE ?? "").replace(
	/\/$/,
	"",
);

let API_BASE = viteApiBase;
if (import.meta.env.DEV && import.meta.env.MODE === "staging") {
	API_BASE = "/staging-api";
} else if (!API_BASE) {
	API_BASE =
		import.meta.env.MODE === "production"
			? "https://api.sportsdey.com"
			: "https://staging-api.sportsdey.com";
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

let isRedirectingToSignIn = false;

export function clearSession(): void {
	setCookie("admin_session", "", -1);
	setCookie("admin_user_details", "", -1);
}

export function redirectToSignIn(): void {
	if (isRedirectingToSignIn) return;
	isRedirectingToSignIn = true;
	clearSession();
	if (
		typeof window !== "undefined" &&
		window.location.pathname !== "/sign-in"
	) {
		window.location.replace("/sign-in");
	} else {
		isRedirectingToSignIn = false;
	}
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
		if (response.status === 401) {
			redirectToSignIn();
		}
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
