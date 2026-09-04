import { fetchApi } from "./api";

export interface AdminActivity {
	id: string;
	adminId: string;
	adminName: string;
	adminEmail: string;
	adminRole: string;
	action: string;
	createdAt: string;
	targetUserId?: string | null;
	targetUserName?: string | null;
	targetUserEmail?: string | null;
	walletId?: string | null;
	walletType?: string | null;
	amount?: number | string | null;
	currency?: string | null;
	purpose?: string | null;
	referenceId?: string | null;
	balanceBefore?: number | string | null;
	balanceAfter?: number | string | null;
	status?: string | null;
	description?: string | null;
}

export function isWalletActivity(activity: AdminActivity): boolean {
	return Boolean(
		activity.walletId ||
		activity.walletType ||
		activity.amount !== null && activity.amount !== undefined ||
		/\b(wallet|credit|debit|deposit|withdrawal)\b/i.test(activity.action),
	);
}

export function formatActivityAmount(activity: AdminActivity): string {
	if (activity.amount === null || activity.amount === undefined || activity.amount === "") return "—";
	const amount = Number(activity.amount);
	if (!Number.isFinite(amount)) return String(activity.amount);
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: activity.currency || "NGN",
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
