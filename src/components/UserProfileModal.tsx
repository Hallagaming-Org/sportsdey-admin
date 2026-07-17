import { X, AlertTriangle, MessageCircle, Wallet, ChevronDown, MinusCircle, PlusCircle, MoreHorizontal, Copy } from "lucide-react";
import { CgProfile } from "react-icons/cg";
import { PauseCircle } from "lucide-react";
import { userService, type User, type UserProfile, type UserTransaction } from "../lib/users";
import { LuMessageSquareDot } from "react-icons/lu";
import { useState, useMemo } from "react";
import { UserProfileWalletInfo } from "./UserProfileWalletInfo";
import { UserProfileLogNotes } from "./UserProfileLogNotes";
import { TimePeriodDropdown, type TimePeriodOption } from "./TimePeriodDropdown";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getDateRangeForPeriod } from "#/lib/time-period";
import { toast } from "sonner";
import { capitalizeName, formatDeviceInfo } from "#/lib/utils";

interface UserProfileModalProps {
	user: User;
	profile?: UserProfile;
	isLoading?: boolean;
	onClose: () => void;
	onSendNotice: (user: User) => void;
	onSuspend?: (user: User) => void;
}

function Skeleton({ className }: { className?: string }) {
	return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

function formatCurrency(amount: number | undefined | null) {
	if (amount == null) return "₦0.00";
	return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: string }) {
	const s = status?.toLowerCase();
	const isSuccess = s === "success" || s === "completed" || s === "won";
	const isPending = s === "pending" || s === "processing";
	const isFailed = s === "failed";

	const cls = isSuccess
		? "bg-[#E8F8E5] text-[#10C300] border border-[#10C300]/20"
		: isPending
			? "bg-[#FFF8E5] text-[#FFB000] border border-[#FFB000]/20"
			: isFailed
				? "bg-[#FEECEB] text-[#EE201C] border border-[#EE201C]/20"
				: "bg-gray-100 text-gray-600 border border-gray-200";

	const label = isSuccess ? "Success" : isPending ? "Pending" : isFailed ? "Failed" : status;

	return (
		<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
			{label}
		</span>
	);
}


function WalletTab({ userId }: { userId: string }) {
	const [timePeriod, setTimePeriod] = useState<TimePeriodOption>("All");
	const [customRange, setCustomRange] = useState<{ start: string; end: string } | undefined>(undefined);
	const [txType, setTxType] = useState<"credit" | "debit">("credit");
	const [amount, setAmount] = useState("");
	const [reason, setReason] = useState("");

	const { fromDate, toDate } = getDateRangeForPeriod(timePeriod, customRange, { output: "iso" });

	const {
		data: overview,
		isLoading: overviewLoading,
	} = useQuery({
		queryKey: ["user-wallet-overview", userId, fromDate, toDate],
		queryFn: async () => {
			const result = await userService.getUserWalletOverview(userId, { fromDate, toDate });
			if (!result.success) throw new Error(result.error || "Failed to fetch wallet overview");
			return result.data;
		},
		enabled: !!userId,
	});

	const {
		data: txData,
		isLoading: txLoading,
	} = useQuery({
		queryKey: ["user-wallet-transactions", userId, fromDate, toDate],
		queryFn: async () => {
			const result = await userService.getUserWalletTransactions(userId, { fromDate, toDate, limit: 10 });
			if (!result.success) throw new Error(result.error || "Failed to fetch transactions");
			return result.data;
		},
		enabled: !!userId,
	});

	const manualMutation = useMutation({
		mutationFn: async () => {
			if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
				throw new Error("Please enter a valid amount");
			}
			if (!reason) throw new Error("Please select a reason");
			const result = await userService.processManualTransaction(userId, {
				type: txType,
				amount: Number(amount),
				reason,
			});
			if (!result.success) throw new Error(result.error || "Transaction failed");
			return result;
		},
		onSuccess: () => {
			toast.success(`Manual ${txType} of ₦${Number(amount).toLocaleString()} processed successfully`);
			setAmount("");
			setReason("");
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const reasons = [
		"Bonus credit",
		"Compensation",
		"Error correction",
		"Promotional credit",
		"Fraud reversal",
		"Other",
	];

	const statCards = [
		{ label: "Current Balance", value: overview?.currentBalance },
		{ label: "Total Deposits", value: overview?.totalDeposits },
		{ label: "Total Withdrawals", value: overview?.totalWithdrawals },
		{ label: "Net Position (GGR)", value: overview?.netPosition },
	];

	return (
		<div className="space-y-5">
			{/* Wallet Overview */}
			<div className="bg-white rounded-2xl p-5 shadow-sm">
				<div className="flex items-center justify-between mb-4">
					<h4 className="font-bold text-gray-900 text-base">Wallet Overview</h4>
					<TimePeriodDropdown
						value={timePeriod}
						onChange={(p, r) => {
							setTimePeriod(p);
							setCustomRange(r);
						}}
					/>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{statCards.map((card) => (
						<div key={card.label}>
							<p className="text-xs text-gray-500 mb-1">{card.label}</p>
							{overviewLoading ? (
								<Skeleton className="h-7 w-28" />
							) : (
								<p className="text-xl font-bold text-gray-900">{formatCurrency(card.value)}</p>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Transaction Summary */}
			<div className="bg-white rounded-2xl p-5 shadow-sm">
				<div className="flex items-center justify-between mb-4">
					<h4 className="font-bold text-gray-900 text-base">Transaction Summary</h4>
				</div>
			<div className="overflow-x-auto custom-scrollbar">
				<table className="min-w-full text-sm whitespace-nowrap">
					<thead>
						<tr className="border-b border-gray-100">
							<th className="text-left text-gray-500 font-medium pb-3 pr-4 text-xs">Type</th>
							<th className="text-left text-gray-500 font-medium pb-3 pr-4 text-xs">Amount</th>
							<th className="text-left text-gray-500 font-medium pb-3 pr-4 text-xs">Reference ID</th>
							<th className="text-left text-gray-500 font-medium pb-3 pr-4 text-xs">Date &amp; Time</th>
							<th className="text-left text-gray-500 font-medium pb-3 pr-4 text-xs">Status</th>
							<th className="pb-3" />
						</tr>
					</thead>
						<tbody>
							{txLoading ? (
								Array.from({ length: 3 }).map((_, i) => (
									<tr key={i} className="border-b border-gray-50">
										<td className="py-3 pr-4"><Skeleton className="h-4 w-20" /></td>
										<td className="py-3 pr-4"><Skeleton className="h-4 w-24" /></td>
										<td className="py-3 pr-4"><Skeleton className="h-4 w-32" /></td>
										<td className="py-3 pr-4"><Skeleton className="h-4 w-28" /></td>
										<td className="py-3 pr-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
										<td className="py-3" />
									</tr>
								))
							) : !txData?.transactions?.length ? (
								<tr>
									<td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
										No transactions found
									</td>
								</tr>
							) : (
								txData.transactions.map((tx: UserTransaction) => {
									const [datePart, timePart] = tx.dateTime?.includes("T")
										? [
											new Date(tx.dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
											new Date(tx.dateTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase(),
										]
										: (tx.dateTime || "").split(" ");

									const typeLabel =
										tx.type === "deposit" ? "Deposit" :
										tx.type === "withdrawal" ? "Withdrawal" :
										tx.type === "manual_credit" ? "Manual Credit" :
										tx.type === "manual_debit" ? "Manual Debit" :
										tx.type;

									return (
										<tr key={tx.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
											<td className="py-3 pr-4 text-gray-900 text-xs font-medium">{typeLabel}</td>
											<td className="py-3 pr-4 text-gray-900 text-xs font-semibold">{formatCurrency(tx.amount)}</td>
											<td className="py-3 pr-4 text-gray-600 text-xs font-mono">{tx.referenceId || "-"}</td>
											<td className="py-3 pr-4 text-xs">
												<span className="font-medium text-gray-900 block">{datePart}</span>
												<span className="text-gray-500">{timePart}</span>
											</td>
											<td className="py-3 pr-4">
												<StatusBadge status={tx.status} />
											</td>
											<td className="py-3">
												<button type="button" className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1 rounded">
													<MoreHorizontal className="w-4 h-4" />
												</button>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Manual Credit/Debits */}
			<div className="bg-white rounded-2xl p-5 shadow-sm">
				<div className="flex items-start justify-between mb-1">
					<div>
						<h4 className="font-bold text-gray-900 text-base">Manual Credit/Debits</h4>
						<p className="text-xs text-gray-500 mt-0.5">Manually adjust user wallet balance</p>
					</div>
					<button type="button" className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded transition-colors">
						<MoreHorizontal className="w-4 h-4" />
					</button>
				</div>

				<div className="mt-4 flex flex-col gap-4">
					{/* Transaction Type + Amount + Reason */}
					<div className="flex flex-wrap items-end gap-4">
						{/* Type selector */}
						<div className="flex-shrink-0">
							<p className="text-xs text-gray-500 mb-2">Transaction Type</p>
							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={() => setTxType("credit")}
									className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium border transition-all cursor-pointer ${
										txType === "credit"
											? "bg-[#10C300] text-white border-[#10C300]"
											: "bg-white text-gray-700 border-gray-200"
									}`}
								>
									<PlusCircle className={`w-4 h-4 ${txType === "credit" ? "text-white" : "text-[#10C300]"}`} />
									Credit
								</button>
								<button
									type="button"
									onClick={() => setTxType("debit")}
									className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium border transition-all cursor-pointer ${
										txType === "debit"
											? "bg-[#EE201C] text-white border-[#EE201C]"
											: "bg-white text-gray-700 border-gray-200"
									}`}
								>
									<MinusCircle className={`w-4 h-4 ${txType === "debit" ? "text-white" : "text-[#EE201C]"}`} />
									Debit
								</button>
							</div>
						</div>

						{/* Amount */}
						<div className="flex-1 min-w-[140px]">
							<label className="text-xs text-gray-500 mb-2 block">Amount (₦)</label>
							<div className="relative">
								<input
									type="number"
									min="0"
									placeholder="Enter amount"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#10C300] focus:border-[#10C300] transition-colors"
								/>
							</div>
						</div>

						{/* Reason */}
						<div className="flex-1 min-w-[160px]">
							<label className="text-xs text-gray-500 mb-2 block">Reasons</label>
							<div className="relative">
								<select
									value={reason}
									onChange={(e) => setReason(e.target.value)}
									className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#10C300] focus:border-[#10C300] transition-colors appearance-none bg-white pr-8 cursor-pointer"
								>
									<option value="">Select a reason</option>
									{reasons.map((r) => (
										<option key={r} value={r}>{r}</option>
									))}
								</select>
								<ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
							</div>
						</div>
					</div>

					{/* Submit */}
					<div className="flex justify-center">
						<button
							type="button"
							onClick={() => manualMutation.mutate()}
							disabled={manualMutation.isPending}
							className="w-full max-w-xs bg-[#10C300] hover:bg-[#0ea800] disabled:opacity-60 text-white font-semibold rounded-full px-6 py-2.5 text-sm transition-colors cursor-pointer shadow-[0_4px_14px_0_rgba(16,195,0,0.3)]"
						>
							{manualMutation.isPending ? "Processing..." : "Process Transaction"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Contact Tab (existing profile layout) ─────────────────────────────────────

// function ContactTab({
// 	displayData,
// 	loading,
// 	status,
// 	registeredDate,
// 	walletBalance,
// 	lastTopUp,
// 	country,
// 	mobileNumber,
// }: {
// 	displayData: User | UserProfile;
// 	loading: boolean;
// 	status: string;
// 	registeredDate: number | string | null;
// 	walletBalance: number;
// 	lastTopUp: Date | null;
// 	country: string;
// 	mobileNumber: string;
// }) {
// 	return (
// 		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// 			<div className="bg-white h-[280px] rounded-2xl p-5 shadow-sm">
// 				<h4 className="font-bold text-gray-900 mb-4">Personal Details</h4>
// 				<div className="space-y-4 text-sm">
// 					<div className="flex justify-between items-start">
// 						<span className="text-gray-500 text-xs">Full Name:</span>
// 						{loading ? <Skeleton className="h-3 w-24" /> : <span className="font-normal text-gray-900 text-xs text-left">{displayData.name}</span>}
// 					</div>
// 					<div className="flex justify-between items-start">
// 						<span className="text-gray-500 text-xs">Email Address:</span>
// 						{loading ? <Skeleton className="h-3 w-32" /> : <span className="font-normal text-gray-900 text-xs text-left underline underline-offset-2">{displayData.email}</span>}
// 					</div>
// 					<div className="flex justify-between items-start">
// 						<span className="text-gray-500 text-xs">Mobile number:</span>
// 						{loading ? <Skeleton className="h-3 w-20" /> : <span className="font-normal text-gray-900 text-xs text-left">{mobileNumber}</span>}
// 					</div>
// 					<div className="flex justify-between items-center">
// 						<span className="text-gray-500 text-xs">Status:</span>
// 						{loading ? (
// 							<Skeleton className="h-6 w-16 rounded-full" />
// 						) : (
// 							<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
// 								status === "verified" ? "bg-[#E8F8E5] text-[#10C300]" :
// 								status === "pending_verification" ? "bg-[#FFF8E5] text-[#FFB000]" :
// 								"bg-[#FEECEB] text-[#EE201C]"
// 							}`}>
// 								{status === "verified" ? "Verified" : status === "pending_verification" ? "Pending" : "Not Verified"}
// 							</span>
// 						)}
// 					</div>
// 					<div className="flex justify-between items-start">
// 						<span className="text-gray-500 text-xs">Country:</span>
// 						{loading ? <Skeleton className="h-3 w-16" /> : <span className="font-normal text-gray-900 text-xs text-left">{country}</span>}
// 					</div>
// 					<div className="flex justify-between items-start">
// 						<span className="text-gray-500 text-xs">Registration date:</span>
// 						{loading ? (
// 							<Skeleton className="h-3 w-24" />
// 						) : (
// 							<span className="font-normal text-gray-900 text-xs text-left">
// 								{registeredDate ? new Date(registeredDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
// 							</span>
// 						)}
// 					</div>
// 				</div>
// 			</div>

// 			<div className="h-[280px] bg-white rounded-2xl p-5 shadow-sm">
// 				<h4 className="font-bold text-gray-900 mb-4">User's Wallet</h4>
// 				<div className="space-y-4 text-sm">
// 					<div>
// 						<span className="block text-gray-500 mb-1">Current Balance</span>
// 						{loading ? (
// 							<Skeleton className="h-8 w-28" />
// 						) : (
// 							<div className="inline-flex items-center gap-1 text-gray-900">
// 								<span className="text-xs font-medium">₦</span>
// 								<span className="text-2xl font-bold">{walletBalance.toLocaleString()}</span>
// 							</div>
// 						)}
// 					</div>
// 					<div className="flex justify-between items-start pt-2">
// 						<span className="text-gray-500">Last Top-up:</span>
// 						{loading ? (
// 							<Skeleton className="h-3 w-24" />
// 						) : (
// 							<span className="font-normal text-gray-900 text-left">
// 								{lastTopUp ? lastTopUp.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
// 							</span>
// 						)}
// 					</div>
// 				</div>
// 			</div>
// 		</div>
// 	);
// }

// ─── Main Modal ────────────────────────────────────────────────────────────────

export function UserProfileModal({ user, profile, isLoading, onClose, onSendNotice, onSuspend }: UserProfileModalProps) {
	const [activeView, setActiveView] = useState<"personal" | "wallet">("personal");
	const [showDevices, setShowDevices] = useState(false);
	const [showLoginIps, setShowLoginIps] = useState(false);
	const displayData = profile || user;
	const status = profile?.verificationStatus || user.status;
	const registeredDate = profile?.createdAt ? new Date(profile.createdAt).getTime() : user.registeredDate;
	const walletBalance = profile?.wallet?.balance ?? user.wallet;
	// const lastTopUp = profile?.lastTopUp ? new Date(profile.lastTopUp) : null;
	const country = profile?.country || "Nigeria";
	const mobileNumber = profile?.mobileNumber || "1234567890";
	const isUserSuspended = user?.suspended

	const deviceHistory = useMemo(() => {
		const list: Array<{ name: string; browser: string; current: boolean }> = [];
		const sessionDevices = profile?.recentSessions?.devices || [];
		if (sessionDevices.length > 0) {
			sessionDevices.forEach((d: any, index: number) => {
				let name = "";
				let browser = "";
				let current = false;
				if (typeof d === "string") {
					name = formatDeviceInfo(d);
					current = index === 0;
				} else if (d && typeof d === "object") {
					name = formatDeviceInfo(d.name || d.deviceName || "Unknown Device");
					browser = d.browser || "";
					current = d.current || d.isCurrent || index === 0;
				}
				if (name && name !== "N/A" && !list.some(item => item.name === name)) {
					list.push({ name, browser, current });
				}
			});
		} else if (profile?.deviceType && profile.deviceType !== "N/A") {
			list.push({
				name: formatDeviceInfo(profile.deviceType),
				browser: profile.browser || "",
				current: true
			});
		}
		return list;
	}, [profile]);

	const ipHistory = useMemo(() => {
		const list: Array<{ ip: string; timestamp: string; current: boolean }> = [];
		const sessionIps = profile?.recentSessions?.ipAddresses || [];
		if (sessionIps.length > 0) {
			sessionIps.forEach((ipObj: any, index: number) => {
				let ip = "";
				let timestamp = "";
				let current = false;
				if (typeof ipObj === "string") {
					ip = ipObj;
					current = index === 0;
				} else if (ipObj && typeof ipObj === "object") {
					ip = ipObj.ip || ipObj.ipAddress || "0.0.0.0";
					timestamp = ipObj.timestamp || ipObj.createdAt || ipObj.lastActiveAt || "";
					current = ipObj.current || ipObj.isCurrent || index === 0;
				}
				if (ip && ip !== "N/A" && !list.some(item => item.ip === ip)) {
					list.push({ ip, timestamp, current });
				}
			});
		} else if (profile?.ipAddress && profile.ipAddress !== "N/A") {
			list.push({
				ip: profile.ipAddress,
				timestamp: "",
				current: true
			});
		}
		return list;
	}, [profile]);

	const buttonItems = [
		{
			label: user.suspended ? "Suspended" : "Suspend",
			icon: <PauseCircle className={`w-4 h-4 ${user.suspended ? 'text-[#B00020]' : 'text-[#B00020]'}`} />,
			onClick: () => onSuspend?.(user),
			className: `${user.suspended ? 'border-[#B00020] text-[#B00020] bg-[#FEECEB]' : 'border-[#B00020] text-[#B00020] bg-[#FEECEB] hover:bg-[#fddcd9]'}`
		},
		{
			label: "Contact User Info",
			icon: <LuMessageSquareDot className={`w-4 h-4 ${activeView === 'personal' ? 'text-white' : 'text-gray-500'}`} />,
			onClick: () => setActiveView("personal"),
			className: activeView === "personal" ? "bg-[#10C300] text-white border border-transparent shadow-[0_4px_14px_0_rgba(16,195,0,0.39)]" : "bg-[#EDF1F9] text-gray-500"
		},
		{
			label: "Wallet Info",
			icon: <Wallet className={`w-4 h-4 ${activeView === 'wallet' ? 'text-white' : 'text-gray-500'}`} />,
			onClick: () => setActiveView("wallet"),
			className: activeView === "wallet" ? "bg-[#10C300] text-white border border-transparent shadow-[0_4px_14px_0_rgba(16,195,0,0.39)]" : "bg-[#EDF1F9] text-gray-500"
		},
		{
			label: "Send a notice",
			icon: <MessageCircle className="w-4 h-4 text-gray-500" />,
			onClick: () => onSendNotice(user),
			className: "bg-[#EDF1F9] text-gray-500"
		}
	];
	const loading = isLoading && !profile;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
			onClick={onClose}
		>
			<div
				className="w-full max-w-[760px] rounded-[20px] bg-[#F2F4F7] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex bg-white items-center justify-between p-6 border-b border-gray-100">
					<div className="flex items-center gap-2">
						<div className="p-2 bg-[#E8F8E5] rounded-full text-[#10C300]">
							<CgProfile className="w-5 h-5" />
						</div>
						<h3 className="font-bold text-xl text-gray-900">User's Profile</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="bg-[#03002B] p-2 rounded-full transition-colors cursor-pointer"
					>
						<X className="h-4 w-4 text-white" />
					</button>
				</div>
				<div className="flex-none p-8 pb-6 bg-[#F2F4F7]">
					{isUserSuspended && (
						<div className="w-max mx-auto flex -mt-4 items-center gap-2 px-3 py-2 text-[#B00020] bg-[#FEECEB] rounded-full text-sm mb-4">
							<AlertTriangle className="w-4 h-4" />
							<p>This account has been suspended due to violation of the system rules and regulations.</p>
						</div>
					)}

					{/* Avatar + name + tabs */}
					<div className="flex flex-col items-center justify-center pt-2">
						{loading ? (
							<Skeleton className="h-24 w-24 rounded-full mb-3" />
						) : displayData.image || displayData.photo ? (
							<img 
								src={displayData.image || displayData.photo || undefined} 
								alt="avatar" 
								className="h-24 w-24 rounded-full bg-gray-200 object-cover shadow-sm mb-3" 
							/>
						) : (
							<div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center shadow-sm mb-3">
								<CgProfile className="h-12 w-12 text-gray-400" />
							</div>
						)}

						{loading ? (
							<Skeleton className="h-4 w-32 mb-2" />
						) : (
							<h2 className="text-base font-bold text-gray-900">{displayData.name}</h2>
						)}

						<p className="text-[#10C300] font-medium text-xs flex items-center gap-1.5 mt-1">
							<span className="w-2 h-2 rounded-full bg-[#10C300]" />
							Online
						</p>
						{loading ? (
							<Skeleton className="h-3 w-24 mt-1" />
						) : (
							<p className="text-gray-500 text-xs mt-0.5">
								Joined on{" "}
								{registeredDate
									? new Date(registeredDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
									: "—"}
							</p>
						)}

						{/* Tab buttons row */}
						<div className="flex items-center gap-2 mt-6 flex-wrap justify-center">
							{buttonItems.map((btn, idx) => (
								<button
									key={idx}
									type="button"
									onClick={btn.onClick}
									className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${btn.className}`}
								>
									{btn.icon}
									{btn.label}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
					{activeView === "personal" ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
							<div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full">
								<h4 className="font-bold text-xl text-gray-900 mb-6">Personal Details</h4>
								<div className="space-y-5 text-sm flex-1">
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Full Name:</span>
										{loading ? <Skeleton className="h-4 w-24" /> : <span className="font-medium text-gray-900 text-sm text-left">{capitalizeName(displayData.name)}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Email Address:</span>
										{loading ? <Skeleton className="h-4 w-32" /> : <span className="font-medium text-gray-900 text-sm text-left underline underline-offset-2">{displayData.email || "N/A"}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">user Id:</span>
										{loading ? <Skeleton className="h-4 w-20" /> : (
											<div className="flex items-center gap-1.5">
												<span className="font-medium text-gray-900 text-xs text-left truncate max-w-[80px]" title={user?.id}>
													{user?.id ? (user.id.length > 20 ? `${user.id.substring(0, 20)}...` : user.id) : ""}
												</span>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														if (user?.id) {
															navigator.clipboard.writeText(user.id);
															toast.success("User ID copied to clipboard");
														}
													}}
													className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
													title="Copy User ID"
												>
													<Copy className="w-3.5 h-3.5" />
												</button>
											</div>
										)}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Mobile number:</span>
										{loading ? <Skeleton className="h-4 w-20" /> : <span className="font-medium text-gray-900 text-sm text-left">{mobileNumber || "N/A"}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Status:</span>
										{loading ? (
											<Skeleton className="h-8 w-16" />
										) : (
											<div className="flex flex-col items-end gap-1">
												<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
													status === "verified" ? "bg-[#E8F8E5] text-[#10C300] border border-[#10C300]" :
													status === "pending_verification" ? "bg-[#FFF8E5] text-[#FFB000]" :
													"bg-[#FEECEB] text-[#EE201C]"
												}`}>
													{status === "verified" ? "Verified" :
													status === "pending_verification" ? "Pending" :
													"Not Verified"}
												</span>
												
											</div>
										)}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Date of Birth:</span>
										{loading ? <Skeleton className="h-4 w-24" /> : <span className="font-medium text-gray-900 text-sm text-left">{profile?.dob || "N/A"}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Country:</span>
										{loading ? <Skeleton className="h-4 w-16" /> : <span className="font-medium text-gray-900 text-sm text-left">{country || "N/A"}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs mt-1">Device info:</span>
										{loading ? (
											<Skeleton className="h-8 w-32" />
										) : (
											<div className="relative">
												{deviceHistory.length > 1 ? (
													<>
														<button
															type="button"
															onClick={() => {
																setShowDevices(!showDevices);
																setShowLoginIps(false);
															}}
															className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors"
														>
															{deviceHistory[0]?.name || formatDeviceInfo(profile?.deviceType) || "N/A"}
															<ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showDevices ? 'rotate-180' : ''}`} />
														</button>
														
														{showDevices && (
															<div className="absolute right-0 bottom-full mb-2 w-56 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl z-20 py-2 overflow-hidden">
																<div className="px-3 py-1.5 border-b border-gray-50 bg-gray-50/50 mb-1">
																	<span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Device History</span>
																</div>
																{deviceHistory.map((device, i) => (
																	<div key={i} className="px-4 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-left group cursor-default">
																		<div className="flex items-center justify-between gap-2">
																			<span className="text-xs font-medium text-gray-900 group-hover:text-[#10C300] transition-colors">{device.name}</span>
																			{device.current && <span className="text-[10px] text-[#10C300] bg-[#E8F8E5] px-1.5 py-0.5 rounded-full font-medium">Current</span>}
																		</div>
																		{device.browser && <span className="text-[10px] text-gray-500 block mt-0.5">{device.browser}</span>}
																	</div>
																))}
															</div>
														)}
													</>
												) : (
													<span className="font-medium text-gray-900 text-sm text-left block mt-1" title={profile?.deviceType || undefined}>
														{deviceHistory[0]?.name || formatDeviceInfo(profile?.deviceType) || "N/A"}
													</span>
												)}
											</div>
										)}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs mt-1">Login IP:</span>
										{loading ? (
											<Skeleton className="h-8 w-32" />
										) : (
											<div className="relative">
												{ipHistory.length > 1 ? (
													<>
														<button
															type="button"
															onClick={() => {
																setShowLoginIps(!showLoginIps);
																setShowDevices(false);
															}}
															className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors"
														>
															{profile?.ipAddress || ipHistory[0]?.ip || ""}
															<ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showLoginIps ? 'rotate-180' : ''}`} />
														</button>
														
														{showLoginIps && (
															<div className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl z-20 py-2 overflow-hidden">
																<div className="px-3 py-1.5 border-b border-gray-50 bg-gray-50/50 mb-1">
																	<span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">IP History</span>
																</div>
																{ipHistory.map((login, i) => (
																	<div key={i} className="px-4 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-left group cursor-default">
																		<div className="flex items-center justify-between gap-2">
																			<span className="text-xs font-medium text-gray-900 group-hover:text-[#10C300] transition-colors">{login.ip}</span>
																			{login.current && <span className="text-[10px] text-[#10C300] bg-[#E8F8E5] px-1.5 py-0.5 rounded-full font-medium">Current</span>}
																		</div>
																		{login.timestamp && <span className="text-[10px] text-gray-500 block mt-0.5">{login.timestamp}</span>}
																	</div>
																))}
															</div>
														)}
													</>
												) : (
													<span className="font-medium text-gray-900 text-sm text-left block mt-1">
														{ipHistory[0]?.ip || ""}
													</span>
												)}
											</div>
										)}
									</div>
								</div>
							</div>

							<UserProfileLogNotes userId={user.id} />
						</div>
					) : (
						<UserProfileWalletInfo userId={user.id} balance={walletBalance} />
					)}
				</div>
			</div>
		</div>
	);
}