import { fetchApi } from "./api";

export type TransactionStatus = "Won" | "Pending" | "Failed" | "Refund";
export type TransactionType = "deposit" | "withdrawal" | "payments";

export interface Transaction {
	id: string;
	dateTime: string;
	type: TransactionType;
	paymentMethod: string;
	amount: string;
	balanceAfter: string;
	status: TransactionStatus;
}

export interface DepositSummary {
	transactionId: string;
	type: "deposit";
	status: string;
	amount: number;
	paymentMethod: string;
	referenceId: string;
	ipAddress: string;
	device: string;
	location: string;
	transactionChannel: string;
	fees?: number;
	date?: string;
	amountCredited?: number;
	provider?: string;
	cardType?: string | null;
	cardLast4?: string | null;
	description?: string;
}

export interface WithdrawalSummary {
	transactionId: string;
	type: "withdrawal";
	status: string;
	amount: number;
	paymentMethod: string;
	referenceId: string;
	ipAddress: string;
	device: string;
	location: string;
	transactionChannel: string;
	feesAmount?: number;
	requestedOn?: string;
	processedOn?: string | null;
	bankName?: string | null;
	accountNumber?: string;
	accountName?: string;
	balanceBefore?: number | null;
}

export type TransactionSummary = DepositSummary | WithdrawalSummary;

export interface TransactionsResponse {
	transactions: Transaction[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

interface ServerTransaction {
	transaction_id: string;
	date_time: {
		date: string;
		time: string;
	};
	type: "deposit" | "withdrawal" | "payment";
	payment_method: string;
	amount: number | null;
	balance_after: number | null;
	status: string;
}

interface ServerTransactionsResponse {
	transactions: ServerTransaction[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

const formatAmount = (amount: number | null | undefined): string => {
	if (amount == null) return "₦0";
	return `₦${amount.toLocaleString("en-NG")}`;
};

const mapStatusToUiStatus = (status: string): TransactionStatus => {
	switch (status.toLowerCase()) {
		case "success":
		case "completed":
			return "Won";
		case "pending":
		case "processing":
			return "Pending";
		case "failed":
			return "Failed";
		case "refund":
		case "refunded":
			return "Refund";
		default:
			return "Pending";
	}
};

const mapTypeToUiType = (
	type: "deposit" | "withdrawal" | "payment",
): TransactionType => {
	switch (type) {
		case "deposit":
			return "deposit";
		case "withdrawal":
			return "withdrawal";
		case "payment":
			return "payments";
		default:
			return "payments";
	}
};

const mapTransaction = (t: ServerTransaction): Transaction => {
	return {
		id: t.transaction_id,
		dateTime: `${t.date_time.date}\n${t.date_time.time}`,
		type: mapTypeToUiType(t.type),
		paymentMethod: t.payment_method,
		amount: formatAmount(t.amount),
		balanceAfter: formatAmount(t.balance_after),
		status: mapStatusToUiStatus(t.status),
	};
};

class TransactionService {
	async getTransactions(params: {
		page?: number;
		limit?: number;
		type?: "deposits" | "withdrawals" | "payments";
		status?: "won" | "pending" | "failed" | "refund";
		search?: string;
		fromDate?: string;
		toDate?: string;
	}): Promise<{
		success: boolean;
		data?: TransactionsResponse;
		error?: string;
	}> {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.set("page", params.page.toString());
		if (params.limit) searchParams.set("limit", params.limit.toString());
		if (params.type) searchParams.set("type", params.type);
		if (params.status) searchParams.set("status", params.status);
		if (params.search) searchParams.set("search", params.search);
		if (params.fromDate) searchParams.set("fromDate", params.fromDate);
		if (params.toDate) searchParams.set("toDate", params.toDate);

		const response = await fetchApi<ServerTransactionsResponse>(
			`/admin/wallet-transactions?${searchParams}`,
		);

		if (response.success && response.data) {
			return {
				success: true,
				data: {
					transactions: response.data.transactions.map(mapTransaction),
					pagination: response.data.pagination,
				},
			};
		}

		return {
			success: false,
			error: response.error,
		};
	}

	async getTransactionSummary(id: string): Promise<{
		success: boolean;
		data?: TransactionSummary;
		error?: string;
	}> {
		return fetchApi<TransactionSummary>(
			`/admin/wallet-transactions/${id}/summary`,
		);
	}

	async approveWithdrawal(id: string): Promise<{
		success: boolean;
		data?: { message: string; transferReference?: string };
		error?: string;
	}> {
		return fetchApi(`/admin/withdrawals/${id}/approve`, {
			method: "POST",
		});
	}

	async rejectWithdrawal(
		id: string,
		reason: string,
	): Promise<{
		success: boolean;
		data?: { message: string };
		error?: string;
	}> {
		return fetchApi(`/admin/withdrawals/${id}/reject`, {
			method: "POST",
			body: { reason },
		});
	}
}

export const transactionService = new TransactionService();
