const API_BASE = (() => {
	const envBase = import.meta.env.VITE_API_BASE;
	if (envBase) return envBase;

	if (typeof window !== "undefined" && window.location) {
		const hostname = window.location.hostname;
		if (hostname === "localhost" || hostname === "127.0.0.1") {
			return "http://localhost:3000";
		}
		if (hostname.includes("staging")) {
			return "https://staging-api.sportsdey.com";
		}
		return "https://api.sportsdey.com";
	}
	return "https://api.sportsdey.com";
})();

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

function getCookie(name: string): string | null {
	if (typeof document === "undefined") return null;
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
	return null;
}

async function fetchApi<T>(
	endpoint: string,
	options: FetchOptions = {}
): Promise<{
	success: boolean;
	data?: T;
	error?: string;
	statusCode?: number;
	details?: ApiErrorDetail[] | null;
}> {
	const { method = "GET", body, headers = {} } = options;

	// Update the cookie name here if it's different (e.g., 'token', 'admin_session')
	const token = getCookie("accessToken");

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

	let baseUrl = API_BASE;
	if (endpoint.startsWith("/games")) {
		if (typeof window !== "undefined" && window.location) {
			const hostname = window.location.hostname;
			if (hostname === "localhost" || hostname === "127.0.0.1") {
				baseUrl = "https://staging-api.sportsdey.com";
			}
		}
	}

	const response = await fetch(`${baseUrl}${endpoint}`, fetchOptions);

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
		return {
			success: false,
			error: result.error || `Request failed with status ${response.status}`,
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

export { fetchApi, API_BASE };
export type { HttpMethod, FetchOptions };
