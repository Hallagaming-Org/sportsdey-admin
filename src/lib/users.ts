import { fetchApi } from "./api";

export interface User {
	id: string;
	name: string;
	email: string;
	wallet: number;
	status: string;
	registeredDate: number;
	image?: string;
	photo?: string;
	suspended?: boolean;
}

export interface UsersResponse {
	users: User[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface UserProfile {
	id: string;
	name: string;
	email: string;
	image: string | null;
	mobileNumber: string | null;
	country: string | null;
	verificationStatus: string;
	suspended: boolean;
	createdAt: string;
	wallet: {
		balance: number;
	};
	lastTopUp: string | null;
}

export interface CreateUserData {
	name: string;
	email: string;
	country?: string;
	mobileNumber?: string;
}

export interface CreateUserResponse {
	success: boolean;
	data?: User;
	error?: string;
}

export type NewUser = CreateUserData;

class UserService {
	async listUsers(params: {
		page?: number;
		limit?: number;
		sort?: "asc" | "desc";
		tab?: "all" | "recent" | "pending";
		search?: string;
		fromDate?: string;
		toDate?: string;
	}): Promise<{ success: boolean; data?: UsersResponse; error?: string }> {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.set("page", params.page.toString());
		if (params.limit) searchParams.set("limit", params.limit.toString());
		if (params.sort) searchParams.set("sort", params.sort);
		if (params.tab && params.tab !== "all") searchParams.set("tab", params.tab);
		if (params.search) searchParams.set("search", params.search);
		if (params.fromDate) searchParams.set("fromDate", params.fromDate);
		if (params.toDate) searchParams.set("toDate", params.toDate);

		return fetchApi<UsersResponse>(`/user/all?${searchParams}`);
	}

	async createUser(data: CreateUserData): Promise<CreateUserResponse> {
		const response = await fetchApi<User>("/user", {
			method: "POST",
			body: data,
		});

		if (response.success) {
			return {
				success: true,
				data: response.data,
			};
		}

		return {
			success: false,
			error: response.error,
		};
	}

	async toggleUserSuspend(userId: string): Promise<{ success: boolean; error?: string }> {
		const response = await fetchApi<{ status: string }>(`/user/${userId}/suspended`, {
			method: "PATCH",
		});
		return {
			success: response.success,
			error: response.error,
		};
	}

	async getUserProfile(userId: string): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
		return fetchApi<UserProfile>(`/user/${userId}/profile`);
	}
}

export const userService = new UserService();
