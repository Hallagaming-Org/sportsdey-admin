const API_BASE =
	import.meta.env.VITE_API_BASE ||
	(() => {
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
		return "https://staging-api.sportsdey.com";
	})();

console.log(
	"API_BASE available:",
	!!import.meta.env.VITE_API_BASE,
	"->",
	API_BASE,
);

export interface Admin {
	id: string;
	email: string;
	name: string;
	role: "super_admin" | "admin";
	createdAt: string;
}

export interface SignInResponse {
	success: boolean;
	data?: {
		admin: Admin;
	};
	error?: string;
}

export interface AdminListResponse {
	success: boolean;
	data: Admin[];
}

class AdminAuth {
	private baseUrl: string;

	constructor(baseUrl: string = API_BASE) {
		this.baseUrl = baseUrl;
	}

	private logBase(reason: string) {
		console.debug(`[adminAuth] ${reason} baseUrl=${this.baseUrl}`);
	}

	async signIn(email: string, password: string): Promise<SignInResponse> {
		// this.logBase("signIn");
		console.log("sign in");
		try {
			const response = await fetch(`${this.baseUrl}/admin/auth/sign-in`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
				credentials: "include",
			});

			if (!response.ok) {
				console.log("response status", response.status);
				if (response.status === 503) {
					return {
						success: false,
						error: "Service unavailable. Please try again later.",
					};
				}
				if (response.status === 401) {
					return { success: false, error: "Invalid credentials" };
				}
				return {
					success: false,
					error: "An error occurred. Please try again.",
				};
			}

			const data = await response.json();
			console.log("sign in data", data);
			return data;
		} catch (err) {
			return {
				success: false,
				error: "Unable to connect. Please check your connection.",
			};
		}
	}

	async signOut(): Promise<void> {
		await fetch(`${this.baseUrl}/admin/auth/sign-out`, {
			method: "POST",
			credentials: "include",
		});
	}

	async getSession(): Promise<Admin | null> {
		console.log("getSession called, baseUrl:", this.baseUrl);
		try {
			const response = await fetch(`${this.baseUrl}/admin/me`, {
				credentials: "include",
				cache: "no-store",
			});

			console.log("getSession response status:", response.status);

			if (!response.ok) {
				if (response.status === 503) {
					return null;
				}
				if (response.status === 401) {
					return null;
				}
				return null;
			}

			const data = await response.json();
			console.log("getSession data:", data);
			if (data.success) {
				return data.data;
			}
			return null;
		} catch (err) {
			console.log("getSession error:", err);
			return null;
		}
	}

	async listAdmins(): Promise<Admin[]> {
		const response = await fetch(`${this.baseUrl}/admin/admins`, {
			credentials: "include",
		});

		const data = await response.json();
		if (data.success) {
			return data.data;
		}
		throw new Error(data.error || "Failed to fetch admins");
	}

	async createAdmin(data: {
		email: string;
		password: string;
		name: string;
		role: "super_admin" | "admin";
	}): Promise<Admin> {
		const response = await fetch(`${this.baseUrl}/admin/admins`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
			credentials: "include",
		});

		const result = await response.json();
		if (result.success) {
			return result.data;
		}
		throw new Error(result.error || "Failed to create admin");
	}

	async deleteAdmin(id: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/admin/admins/${id}`, {
			method: "DELETE",
			credentials: "include",
		});

		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || "Failed to delete admin");
		}
	}
}

export const adminAuth = new AdminAuth();
