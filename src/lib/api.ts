const API_BASE = (import.meta as any)?.env?.VITE_API_BASE as string;

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

	const fetchOptions: RequestInit = {
		method,
		headers: {
			"Content-Type": "application/json",
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
