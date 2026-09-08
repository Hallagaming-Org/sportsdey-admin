import { fetchApi } from "./api";

export interface AdminActivity {
	id: string;
	userId: string;
	fullName: string;
	emailAddress: string;
	role: string;
	username: string | null;
	avatar: string | null;
	status: "online" | "offline";
	action: string;
	createdAt: string;
	targetUser: {
		id: string;
		name: string | null;
		email: string | null;
		username: string | null;
	} | null;
	details: {
		transactionType?: "credit" | "debit";
		amount?: number;
		currency?: string;
		reason?: string;
		transactionId?: string;
		balanceAfter?: number;
	} | null;
}

export interface AdminActivityDetail extends AdminActivity {
	module?: string | null;
	sessionId?: string | null;
	ipAddress?: string | null;
	device?: string | null;
	browser?: string | null;
	location?: string | null;
	timeZone?: string | null;
	screenResolution?: string | null;
	reference?: string | null;
	description?: string | null;
	executionStatus?: "completed" | string | null;
}

export function isWalletActivity(activity: AdminActivity): boolean {
	return Boolean(activity.details?.transactionType);
}

export function formatActivityAmount(activity: AdminActivity): string {
	const amount = activity.details?.amount;
	if (amount === null || amount === undefined) return "—";
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: activity.details?.currency || "NGN",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
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

export async function getAdminActivityDetail(activityId: string): Promise<{
	success: boolean;
	data?: AdminActivityDetail;
	error?: string;
}> {
	const response = await fetchApi<{ activity: AdminActivityDetail }>(
		`/admin/activity/${encodeURIComponent(activityId)}`,
	);
	return response.success
		? { success: true, data: response.data?.activity }
		: { success: false, error: response.error };
}
