import { fetchApi } from "./api";

export interface AdminActivity {
	id: string;
	adminId: string;
	adminName: string;
	adminEmail: string;
	adminRole: string;
	action: string;
	createdAt: string;
}

export interface AdminActivityResponse {
	activities: AdminActivity[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export async function getAdminActivity(params: {
	page: number;
	limit: number;
}): Promise<{
	success: boolean;
	data?: AdminActivityResponse;
	error?: string;
}> {
	const searchParams = new URLSearchParams({
		page: String(params.page),
		limit: String(params.limit),
	});
	return fetchApi<AdminActivityResponse>(`/admin/activity?${searchParams}`);
}
