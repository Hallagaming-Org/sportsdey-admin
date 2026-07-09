// const API_BASE =
// 	import.meta.env.VITE_API_BASE ||"http://localhost:3000"

import { API_BASE, getCookie } from "./api";


export interface Admin {
	id: string;
	email: string;
	name: string;
	mobileNumber: string | null;
	image: string | null;
	role: "super_admin" | "admin" | "csr-admin";
	permissions?: string[];
	createdAt: string;
}

export interface Device {
	id: string;
	deviceName: string;
	ipAddress: string | null;
	browser: string;
	lastActiveAt: string;
	createdAt: string;
	isCurrentDevice: boolean;
}

export interface SignInResponse {
	success: boolean;
	data?: {
		admin: Admin;
		token?: string;
	};
	error?: string;
}

export interface AdminListResponse {
	success: boolean;
	data: Admin[];
}

export interface DevicesResponse {
	success: boolean;
	data: {
		devices: Device[];
	};
}

class AdminAuth {
	private baseUrl: string;

	constructor(baseUrl: string = API_BASE) {
		this.baseUrl = baseUrl;
	}

	async signIn(email: string, password: string): Promise<SignInResponse> {
		try {
		//   console.log("API_URL",this.baseUrl)
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
		const token = getCookie("admin_session");
		try {
			await fetch(`${this.baseUrl}/admin/auth/sign-out`, {
				method: "POST",
				headers: {
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				credentials: "include",
			});
		} catch (e) {
			// Ignore errors if backend is unreachable
		}
	}

	async getSession(): Promise<Admin | null> {
		try {
			const token = getCookie("admin_session");
			const response = await fetch(`${this.baseUrl}/admin/me`, {
				headers: {
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				credentials: "include",
				cache: "no-store",
			});

			if (!response.ok) {
				return null;
			}

			const data = await response.json();
			if (data.success && data.data) {
				return data.data.admin || data.data;
			}
			return null;
		} catch {
			return null;
		}
	}

	async listAdmins(): Promise<Admin[]> {
		const token = getCookie("admin_session");
		const response = await fetch(`${this.baseUrl}/admin/admins`, {
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
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
		role: "super_admin" | "admin" | "csr-admin";
	}): Promise<Admin> {
		const token = getCookie("admin_session");
		const response = await fetch(`${this.baseUrl}/admin/admins`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
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

	async getAdmin(id: string): Promise<Admin> {
		const token = getCookie("admin_session");
		const response = await fetch(`${this.baseUrl}/admin/admins/${id}`, {
			method: "GET",
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			credentials: "include",
		});

		const result = await response.json();
		if (result.success) {
			return result.data;
		}
		throw new Error(result.error || "Failed to fetch admin details");
	}

	async deleteAdmin(id: string): Promise<void> {
		const token = getCookie("admin_session");
		const response = await fetch(`${this.baseUrl}/admin/admins/${id}`, {
			method: "DELETE",
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			credentials: "include",
		});

		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || "Failed to delete admin");
		}
	}

	async updateAdminPermissions(id: string, permissions: string[]): Promise<void> {
		const token = getCookie("admin_session");
		const response = await fetch(`${this.baseUrl}/admin/admins/${id}/permissions`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ permissions }),
			credentials: "include",
		});

		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || "Failed to update admin permissions");
		}
	}

	async forceLogoutAdmin(adminId: string): Promise<void> {
		const token = getCookie("admin_session");
		const response = await fetch(`${this.baseUrl}/admin/admins/${adminId}/sessions`, {
			method: "DELETE",
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			credentials: "include",
		});

		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || "Failed to force logout admin");
		}
	}

	async changePassword(newPassword: string, confirmPassword: string): Promise<{ success: boolean; error?: string }> {
		try {
			const token = getCookie("admin_session");
			const response = await fetch(`${this.baseUrl}/admin/auth/change-password`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({ newPassword, confirmPassword }),
				credentials: "include",
			});

			const data = await response.json();
			return data;
		} catch {
			return {
				success: false,
				error: "Unable to connect. Please check your connection.",
			};
		}
	}

	async listDevices(): Promise<Device[]> {
		const token = getCookie("admin_session");
		const response = await fetch(`${this.baseUrl}/admin/auth/devices`, {
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			credentials: "include",
		});

		const data = await response.json();
		if (data.success && data.data) {
			return data.data.devices;
		}
		throw new Error(data.error || "Failed to fetch devices");
	}

	async logoutDevice(sessionId: string): Promise<void> {
		const token = getCookie("admin_session");
		const response = await fetch(
			`${this.baseUrl}/admin/auth/devices/${sessionId}`,
			{
				method: "DELETE",
				headers: {
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				credentials: "include",
			},
		);

		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || "Failed to log out device");
		}
	}
}

export const adminAuth = new AdminAuth();
