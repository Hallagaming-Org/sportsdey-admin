import { fetchApi } from "./api";

export interface OverviewStats {
	totalUsers: number;
	activePlayers: number;
	pendingPayouts: number;
	totalIncome: number;
}

export interface DayActivity {
	date: string;
	revenue: number;
	bets: number;
	users: number;
}

export interface ActivityResponse {
	days: DayActivity[];
}

export interface TopBet {
	id: string;
	playerName: string;
	betType: string;
	amount: number;
}

export interface TopBetsResponse {
	bets: TopBet[];
}

function toDateInput(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function periodToDateRange(
	period: string,
	customRange?: { start: string; end: string },
): { fromDate?: string; toDate?: string } {
	if (period === "All") return {};
	if (period === "Custom" && customRange?.start && customRange?.end) {
		return { fromDate: customRange.start, toDate: customRange.end };
	}

	const now = new Date();
	let fromDate: Date;

	switch (period) {
		case "Today":
			fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			return { fromDate: toDateInput(fromDate), toDate: toDateInput(now) };
		case "Yesterday": {
			const y = new Date(now);
			y.setDate(y.getDate() - 1);
			fromDate = new Date(y.getFullYear(), y.getMonth(), y.getDate());
			const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59);
			return { fromDate: toDateInput(fromDate), toDate: toDateInput(end) };
		}
		case "3 days ago":
			fromDate = new Date(now);
			fromDate.setDate(fromDate.getDate() - 3);
			fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
			return { fromDate: toDateInput(fromDate), toDate: toDateInput(now) };
		case "A week ago":
			fromDate = new Date(now);
			fromDate.setDate(fromDate.getDate() - 7);
			fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
			return { fromDate: toDateInput(fromDate), toDate: toDateInput(now) };
		case "A month ago":
			fromDate = new Date(now);
			fromDate.setMonth(fromDate.getMonth() - 1);
			fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
			return { fromDate: toDateInput(fromDate), toDate: toDateInput(now) };
		default:
			return {};
	}
}

class OverviewService {
	async getStats(params?: {
		fromDate?: string;
		toDate?: string;
	}): Promise<{
		success: boolean;
		data?: OverviewStats;
		error?: string;
	}> {
		const searchParams = new URLSearchParams();
		if (params?.fromDate) searchParams.set("fromDate", params.fromDate);
		if (params?.toDate) searchParams.set("toDate", params.toDate);
		const qs = searchParams.toString();
		return fetchApi<OverviewStats>(
			`/admin/overview/stats${qs ? `?${qs}` : ""}`,
		);
	}

	async getActivity(params?: {
		fromDate?: string;
		toDate?: string;
	}): Promise<{
		success: boolean;
		data?: ActivityResponse;
		error?: string;
	}> {
		const searchParams = new URLSearchParams();
		if (params?.fromDate) searchParams.set("fromDate", params.fromDate);
		if (params?.toDate) searchParams.set("toDate", params.toDate);
		const qs = searchParams.toString();
		return fetchApi<ActivityResponse>(
			`/admin/overview/activity${qs ? `?${qs}` : ""}`,
		);
	}

	async getTopBets(): Promise<{
		success: boolean;
		data?: TopBetsResponse;
		error?: string;
	}> {
		return fetchApi<TopBetsResponse>("/admin/overview/top-bets");
	}
}

export const overviewService = new OverviewService();
