import { Copy, X, Wallet } from "lucide-react";
import {
	formatActivityAmount,
	isWalletActivity,
	type AdminActivity,
} from "@/lib/admin-activity";

interface ActivityLogDetailsModalProps {
	activity: AdminActivity | null;
	isOpen: boolean;
	onClose: () => void;
}

export function ActivityLogDetailsModal({ activity, isOpen, onClose }: ActivityLogDetailsModalProps) {
	if (!isOpen || !activity) return null;

	const walletActivity = isWalletActivity(activity);
	const copy = async (value?: string | null) => {
		if (value) await navigator.clipboard?.writeText(value);
	};
	const date = new Date(activity.createdAt);
	const timestamp = Number.isNaN(date.getTime()) ? activity.createdAt : date.toLocaleString("en-NG");

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="flex w-full max-w-[600px] flex-col rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-gray-100 p-5">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
							<Wallet className="h-5 w-5" />
						</div>
						<h2 className="text-lg font-bold text-gray-900">Activity Log Details</h2>
					</div>
					<button
						onClick={onClose}
						className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white hover:bg-gray-800"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-gray-50/30">
					<div className="space-y-4">
						{/* Activity Overview */}
						<div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
							<h3 className="font-bold text-gray-900 text-sm">Activity Overview</h3>
							
							<div className="space-y-3">
								<Row label="Log ID:" value={
									<div className="flex items-center gap-2">
										<span className="font-medium">{activity.id}</span>
										<button type="button" onClick={() => copy(activity.id)} className="text-green-600 hover:text-green-700" aria-label="Copy log ID">
											<Copy className="h-3.5 w-3.5" />
										</button>
									</div>
								} />
								<Row label="Performed by:" value={
									<div className="flex items-center gap-2">
										<img 
											src={activity.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.userId}`}
											alt="avatar" 
											className="h-5 w-5 rounded-full bg-[#FEECEB]" 
										/>
										<span className="font-medium text-gray-900">{activity.fullName} <span className="text-gray-500 font-normal">(ID {activity.userId})</span></span>
									</div>
								} />
								<Row label="Role:" value={activity.role} />
								<Row label="Username:" value={activity.username || "—"} />
								<Row label="Action:" value={activity.action} />
								<Row label="Date & time:" value={timestamp} />
								
								<div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 -mx-5 px-5">
									<span className="text-sm font-medium text-green-600">Status</span>
									<span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600 border border-green-200">
										{activity.status === "online" ? "Online" : "Offline"}
									</span>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
								<h3 className="font-bold text-gray-900 text-sm">Action Details</h3>
								<div className="space-y-3">
									<Row label="Description" value={activity.action} vertical />
									<Row label="Affected user" value={activity.targetUser?.name || activity.targetUser?.email || "—"} vertical />
									<Row label="User ID" value={activity.targetUser?.id || "—"} vertical />
									<Row label="User contact" value={activity.targetUser?.username || activity.targetUser?.email || "—"} vertical />
								</div>
							</div>

							<div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
								<h3 className="font-bold text-gray-900 text-sm">{walletActivity ? "Wallet Details" : "Additional Information"}</h3>
								<div className="space-y-3">
									{walletActivity ? <>
										<Row label="Adjustment" value={activity.details?.transactionType === "credit" ? "Credit" : "Debit"} vertical />
										<Row label="Amount" value={formatActivityAmount(activity)} vertical />
										<Row label="Reason" value={activity.details?.reason || "—"} vertical />
										<Row label="Transaction ID" value={activity.details?.transactionId || "—"} vertical />
										<Row label="Balance after" value={formatBalance(activity.details?.balanceAfter, activity.details?.currency)} vertical />
									</> : <Row label="Admin email" value={activity.emailAddress || "—"} vertical />}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function formatBalance(value: number | string | null | undefined, currency = "NGN") {
	if (value === null || value === undefined || value === "") return "—";
	const amount = Number(value);
	return Number.isFinite(amount)
		? new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount)
		: String(value);
}

function Row({ label, value, vertical = false }: { label: string; value: React.ReactNode; vertical?: boolean }) {
	if (vertical) {
		return (
			<div className="flex items-center justify-between gap-4">
				<span className="text-xs text-gray-500">{label}</span>
				<span className="text-xs font-medium text-gray-900 text-right truncate">{value}</span>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-sm text-gray-500">{label}</span>
			<span className="text-sm font-medium text-gray-900 text-right truncate">{value}</span>
		</div>
	);
}
