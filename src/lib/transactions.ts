import { fetchApi } from "./api";

export type TransactionStatus = "Won" | "Pending" | "Failed" | "Refund";
export type TransactionType = "Deposit" | "Withdrawal" | "Payments";

export interface Transaction {
	id: string;
	dateTime: string;
	type: TransactionType;
	paymentMethod: string;
	amount: string;
	balanceAfter: string;
	status: TransactionStatus;
}

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
	amount: number;
	balance_after: number;
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

const formatAmount = (amount: number): string => {
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
			return "Deposit";
		case "withdrawal":
			return "Withdrawal";
		case "payment":
			return "Payments";
		default:
			return "Payments";
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
		search?: string;
	}): Promise<{
		success: boolean;
		data?: TransactionsResponse;
		error?: string;
	}> {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.set("page", params.page.toString());
		if (params.limit) searchParams.set("limit", params.limit.toString());
		if (params.type) searchParams.set("type", params.type);
		if (params.search) searchParams.set("search", params.search);

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
}

export const transactionService = new TransactionService();
