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

	async signIn(email: string, password: string): Promise<SignInResponse> {
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
			if (data.success && data.data?.admin) {
				localStorage.setItem("admin_session", JSON.stringify(data.data.admin));
			}
			return data;
		} catch {
			return {
				success: false,
				error: "Unable to connect. Please check your connection.",
			};
		}
	}

	async signOut(): Promise<void> {
		localStorage.removeItem("admin_session");
		try {
			await fetch(`${this.baseUrl}/admin/auth/sign-out`, {
				method: "POST",
				credentials: "include",
			});
		} catch (e) {
			// Ignore errors if backend is unreachable
		}
	}

	async getSession(): Promise<Admin | null> {
		try {
			// First check local storage for instant loads and to prevent dev refresh issues
			if (typeof window !== "undefined") {
				const cached = localStorage.getItem("admin_session");
				if (cached) {
					try {
						return JSON.parse(cached);
					} catch (e) {}
				}
			}

			const response = await fetch(`${this.baseUrl}/admin/me`, {
				credentials: "include",
				cache: "no-store",
			});

			if (!response.ok) {
				localStorage.removeItem("admin_session");
				return null;
			}

			const data = await response.json();
			if (data.success && data.data) {
				localStorage.setItem("admin_session", JSON.stringify(data.data));
				return data.data;
			}
			localStorage.removeItem("admin_session");
			return null;
		} catch {
			// On network error, if we had a cache we would have returned it. 
			// If we reach here, there was no cache and the network failed.
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
