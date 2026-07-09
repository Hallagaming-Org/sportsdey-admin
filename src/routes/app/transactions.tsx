import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter, useRouterState, redirect } from "@tanstack/react-router";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { FaFileExport, FaFilePdf, FaFileWord } from "react-icons/fa6";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType } from "docx";
import { type Column, DataTable } from "#/components/DataTable";
import {
	TimePeriodFilter,
	type TimePeriod,
} from "#/components/TimePeriodFilter";
import { getDateRangeForPeriod } from "#/lib/time-period";
import {
	type Transaction,
	type TransactionStatus,
 	transactionService,
} from "#/lib/transactions";
import { TransactionDetailsModal } from "#/components/TransactionDetailsModal";
import { UserProfileModal } from "#/components/UserProfileModal";
import type { User } from "#/lib/users";
export const Route = createFileRoute("/app/transactions")({
	beforeLoad: ({ context }) => {
		const admin = (context as any).admin;
		if (admin && admin.role !== "super_admin" && !admin.permissions?.includes("transaction_read")) {
			throw redirect({ to: "/app", replace: true });
		}
	},
	component: WalletPage,
});

type TabKey = "all" | "deposits" | "withdrawals" | "payments";
type StatusFilter = "all" | "won" | "pending" | "failed" | "refund";

const STATUS_STYLES: Record<TransactionStatus, string> = {
	Won: "bg-[#E8F8E5] text-[#10C300]",
	Pending: "bg-[#FFF8E5] text-[#FFB000]",
	Failed: "bg-[#FEECEB] text-[#EE201C]",
	Refund: "bg-[#EFF6FF] text-[#3B82F6]",
};

const TABS: { key: TabKey; label: string }[] = [
	{ key: "all", label: "All Transactions" },
	{ key: "deposits", label: "Deposits" },
	{ key: "withdrawals", label: "Withdrawals" },
	{ key: "payments", label: "Payments" },
];

const ITEMS_PER_PAGE = 10;
const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
	{ key: "all", label: "All Statuses" },
	{ key: "won", label: "Success" },
	{ key: "pending", label: "Pending" },
	{ key: "failed", label: "Failed" },
	{ key: "refund", label: "Refund" },
];

function WalletPage() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<TabKey>("all");
	const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
	const [showTypeMenu, setShowTypeMenu] = useState(false);
	const [showStatusMenu, setShowStatusMenu] = useState(false);
	const [showExportMenu, setShowExportMenu] = useState(false);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [selectedTimePeriod, setSelectedTimePeriod] =
		useState<TimePeriod>("All");
	const [customRange, setCustomRange] = useState<{ start: string; end: string } | undefined>(undefined);

	const typeParam = activeTab === "all" ? undefined : activeTab;
	const statusParam = selectedStatus === "all" ? undefined : selectedStatus;

	const { fromDate, toDate } = useMemo(
		() => getDateRangeForPeriod(selectedTimePeriod, customRange),
		[selectedTimePeriod, customRange],
	);

	const {
		data: response,
		isLoading,
		error,
	} = useQuery({
		queryKey: [
			"transactions",
			page,
			typeParam,
			statusParam,
			search,
			fromDate,
			toDate,
		],
		queryFn: async () => {
			console.log("fromDate", fromDate);
			const result = await transactionService.getTransactions({
				page,
				limit: ITEMS_PER_PAGE,
				type: typeParam,
				status: statusParam,
				search: search || undefined,
				fromDate,
				toDate,
			});
			if (!result.success) {
				throw new Error(result.error || "Failed to fetch transactions");
			}
			return result.data;
		},
	});

	const transactions: Transaction[] = response?.transactions ?? [];
	const totalItems = response?.pagination.total ?? 0;
	const totalPages = response?.pagination.totalPages ?? 0;

	const columns: Column<Transaction>[] = [
		{
			header: "Transactions ID",
			accessor: "id",
			cellClassName: "font-mono text-gray-700",
		},
		{
			header: "Date & Time",
			accessor: (t) => (
				<span className="whitespace-pre-line text-gray-500 text-xs leading-relaxed">
					{t.dateTime}
				</span>
			),
		},
		{
			header: "Type",
			accessor: (t) => (
				<span className="font-medium text-gray-800">{t.type}</span>
			),
		},
		{
			header: "Payment Method",
			accessor: "paymentMethod",
			cellClassName: "text-gray-500",
		},
		{
			header: "Amount",
			accessor: "amount",
			cellClassName: "font-medium text-gray-900",
		},
		{
			header: "Balance After",
			accessor: "balanceAfter",
			cellClassName: "font-medium text-gray-900",
		},
		{
			header: "Status",
			accessor: (t) => (
				<span
					className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[t.status]}`}
				>
					{t.status}
				</span>
			),
		},
	];

	const { location } = useRouterState();
	const initialViewTxn = (location.state as unknown as Record<string, unknown>)?.viewTransaction as string | undefined;

	const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(initialViewTxn ?? null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(!!initialViewTxn);
	const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);

	return (
		<div className="flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden px-6">
			<div className="flex-1 min-h-0 flex flex-col gap-4">
				<div className="relative z-30 flex-none flex items-center justify-between overflow-visible">
					<div>
						<h3 className="font-bold text-xl text-[#03002B]">Transactions</h3>
						<p className="text-sm text-[#001A26]">Manage all betting history</p>
					</div>
					<div className="relative z-40 flex items-center gap-2">
						<div className="relative">
							<button
								type="button"
								onClick={() => {
									setShowTypeMenu((prev) => !prev);
									setShowStatusMenu(false);
								}}
								className="inline-flex items-center h-11 gap-1.5 rounded-full border border-[#053209] bg-[#F4F8F3] px-3 py-1.5 text-sm font-medium text-[#053209] hover:bg-gray-50 cursor-pointer"
							>
								T-type <ChevronDown className="h-3.5 w-3.5 text-[#364052]" />
							</button>
							{showTypeMenu && (
								<div className="absolute right-0 z-[70] mt-2 min-w-[180px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
									{TABS.map((tab) => (
										<button
											key={tab.key}
											type="button"
											onClick={() => {
												setActiveTab(tab.key);
												setPage(1);
												setShowTypeMenu(false);
											}}
											className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
												activeTab === tab.key
													? "bg-[#F4F8F3] text-[#053209]"
													: "text-gray-700 hover:bg-gray-50"
											}`}
										>
											{tab.label}
										</button>
									))}
								</div>
							)}
						</div>
						<div className="relative">
							<button
								type="button"
								onClick={() => {
									setShowStatusMenu((prev) => !prev);
									setShowTypeMenu(false);
								}}
								className="inline-flex items-center h-11 gap-1.5 rounded-full border border-[#053209] bg-[#F4F8F3] px-3 py-1.5 text-sm font-medium text-[#053209] hover:bg-gray-50 cursor-pointer"
							>
								Status <ChevronDown className="h-3.5 w-3.5 text-[#364052]" />
							</button>
							{showStatusMenu && (
								<div className="absolute right-0 z-[70] mt-2 min-w-[180px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
									{STATUS_OPTIONS.map((status) => (
										<button
											key={status.key}
											type="button"
											onClick={() => {
												setSelectedStatus(status.key);
												setPage(1);
												setShowStatusMenu(false);
											}}
											className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
												selectedStatus === status.key
													? "bg-[#F4F8F3] text-[#053209]"
													: "text-gray-700 hover:bg-gray-50"
											}`}
										>
											{status.label}
										</button>
									))}
								</div>
							)}
						</div>
						<div className="relative">
							<button 
								onClick={() => setShowExportMenu(!showExportMenu)}
								className="inline-flex items-center h-11 gap-1.5 rounded-full bg-[#1BAA04] px-3 py-1.5 text-sm font-medium text-white cursor-pointer hover:bg-[#158903] transition-colors"
							>
								Export File as
								<FaFileExport className="h-3.5 w-3.5 text-white" />
							</button>
							{showExportMenu && (
								<div className="absolute right-0 z-[70] mt-2 w-40 rounded-xl border border-gray-200 bg-white p-1 shadow-lg overflow-hidden">
									<button
										onClick={() => {
											setShowExportMenu(false);
											if (transactions.length === 0) return;
											
											const doc = new jsPDF("landscape");
											doc.text("Transactions", 14, 15);
											autoTable(doc, {
												head: [["ID", "Date & Time", "Type", "Payment Method", "Amount", "Balance After", "Status"]],
												body: transactions.map(t => [
													t.id,
													t.dateTime.replace(/\n/g, ' '),
													t.type,
													t.paymentMethod || "N/A",
													t.amount?.replace(/₦/g, 'NGN '),
													t.balanceAfter?.replace(/₦/g, 'NGN ') || "N/A",
													t.status
												]),
												startY: 20,
											});
											doc.save(`transactions_export_${new Date().toISOString().split('T')[0]}.pdf`);
										}}
										className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
									>
										<FaFilePdf className="text-red-500 w-4 h-4" />
										PDF
									</button>
									<button
										onClick={() => {
											setShowExportMenu(false);
											if (transactions.length === 0) return;
											
											const docx = new Document({
												sections: [
													{
														properties: {},
														children: [
															new Paragraph({
																children: [
																	new TextRun({
																		text: "Transactions",
																		bold: true,
																		size: 32,
																	}),
																],
																spacing: { after: 400 },
															}),
															new Table({
																width: { size: 100, type: WidthType.PERCENTAGE },
																rows: [
																	new TableRow({
																		children: ["ID", "Date & Time", "Type", "Payment Method", "Amount", "Balance After", "Status"].map(
																			header => new TableCell({
																				children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
																				shading: { fill: "f3f4f6" },
																				margins: { top: 100, bottom: 100, left: 100, right: 100 }
																			})
																		),
																	}),
																	...transactions.map(t => new TableRow({
																		children: [
																			t.id,
																			t.dateTime.replace(/\n/g, ' '),
																			t.type,
																			t.paymentMethod || "N/A",
																			t.amount?.replace(/₦/g, 'NGN '),
																			t.balanceAfter?.replace(/₦/g, 'NGN ') || "N/A",
																			t.status
																		].map(cell => new TableCell({
																			children: [new Paragraph(String(cell))],
																			margins: { top: 100, bottom: 100, left: 100, right: 100 }
																		})),
																	}))
																],
															}),
														],
													},
												],
											});

											Packer.toBlob(docx).then((blob) => {
												const link = document.createElement("a");
												const url = URL.createObjectURL(blob);
												link.setAttribute("href", url);
												link.setAttribute("download", `transactions_export_${new Date().toISOString().split('T')[0]}.docx`);
												link.style.visibility = 'hidden';
												document.body.appendChild(link);
												link.click();
												document.body.removeChild(link);
											});
										}}
										className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
									>
										<FaFileWord className="text-blue-600 w-4 h-4" />
										DOCX
									</button>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Tabs + Search */}
				<div className="flex-none flex items-center justify-between gap-4">
					<div className="flex gap-6 border-b border-[#B0B0B0]">
						{TABS.map((tab) => (
							<button
								key={tab.key}
								type="button"
								onClick={() => {
									setActiveTab(tab.key);
									setPage(1);
								}}
								className={`pb-3 font-medium text-sm transition-colors cursor-pointer ${
									activeTab === tab.key
										? "border-b-2 border-[#1BAA04] text-[#1BAA04]"
										: "text-[#B0B0B0] hover:text-[#1BAA04]"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>
					<div className="flex items-center gap-2">
						<div className="relative">
							<input
								type="text"
								placeholder="Search"
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setPage(1);
								}}
								className="w-[352px] rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-9 text-sm focus:border-[#1BAA04] focus:outline-none focus:ring-1 focus:ring-[#1BAA04]"
							/>
							<Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
						</div>
							<TimePeriodFilter
								onFilterChange={(period, range) => {
									setSelectedTimePeriod(period);
									setCustomRange(range);
									setPage(1);
								}}
								buttonClassName="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
							/>
					</div>
				</div>

				{/* Reusable DataTable */}
				<div className="flex-1 min-h-0">
					<DataTable
						data={transactions}
						columns={columns}
						maxHeight="100%"
						isLoading={isLoading}
						onActionClick={(t) => console.log("Action for transaction", t.id)}
						actionMenuItems={[
							{
								label: "View transaction info",
								onClick: (t: Transaction) => {
									setSelectedTransactionId(t.id);
									setIsDetailsOpen(true);
								},
							},
						]}
						emptyMessage={error ? error.message : "No transactions found"}
						pagination={{
							currentPage: page,
							totalPages,
							onPageChange: setPage,
							totalItems,
							itemsPerPage: ITEMS_PER_PAGE,
						}}
					/>

					{selectedTransactionId && (
						<TransactionDetailsModal
							transactionId={selectedTransactionId}
							open={isDetailsOpen}
							onClose={() => setIsDetailsOpen(false)}
							onActionSuccess={() => {
								queryClient.invalidateQueries({ queryKey: ["transactions"] });
								router.invalidate();
							}}
							onViewProfile={(user) => setSelectedProfileUser(user)}
						/>
					)}

					{selectedProfileUser && (
						<UserProfileModal
							user={selectedProfileUser}
							onClose={() => setSelectedProfileUser(null)}
							onSendNotice={() => setSelectedProfileUser(null)}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
