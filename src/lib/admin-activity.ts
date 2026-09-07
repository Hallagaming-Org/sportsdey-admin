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
