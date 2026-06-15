import { Copy, X, Wallet } from "lucide-react";

export interface ActivityRecord {
	id: string;
	name: string;
	email: string;
	role: string;
	action: string;
	date: string;
	status: string;
}

interface ActivityLogDetailsModalProps {
	activity: ActivityRecord | null;
	isOpen: boolean;
	onClose: () => void;
}

export function ActivityLogDetailsModal({ activity, isOpen, onClose }: ActivityLogDetailsModalProps) {
	if (!isOpen || !activity) return null;

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
										<span className="font-medium">LOG-2025-00012345</span>
										<button className="text-green-600 hover:text-green-700">
											<Copy className="h-3.5 w-3.5" />
										</button>
									</div>
								} />
								<Row label="User:" value={
									<div className="flex items-center gap-2">
										<img 
											src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.name}`} 
											alt="avatar" 
											className="h-5 w-5 rounded-full bg-[#FEECEB]" 
										/>
										<span className="font-medium text-gray-900">{activity.name} <span className="text-gray-500 font-normal">(ID {activity.id})</span></span>
									</div>
								} />
								<Row label="Role:" value={activity.role} />
								<Row label="Action:" value={activity.action} />
								<Row label="Module:" value="KYC & Documents" />
								<Row label="IP Address:" value="102.88.12.34" />
								<Row label="Device:" value="Chrome on Windows" />
								<Row label="Location:" value="Lagos, Nigeria" />
								
								<div className="flex items-center justify-between pt-1">
									<span className="text-sm font-medium text-green-600">Status</span>
									<span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600 border border-green-200">
										Completed
									</span>
								</div>
							</div>
						</div>

						{/* Two Column Section */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Action Details */}
							<div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
								<h3 className="font-bold text-gray-900 text-sm">Action Details</h3>
								<div className="space-y-3">
									<Row label="Description" value="User approved KYC Docum..." vertical />
									<Row label="Target" value="KYC Document - ID Card" vertical />
									<Row label="Document ID" value={
										<div className="flex items-center justify-end gap-2">
											<span>KYC-2025-0006789</span>
											<button className="text-green-600 hover:text-green-700">
												<Copy className="h-3 w-3" />
											</button>
										</div>
									} vertical />
									<Row label="Prevision Status" value={
										<span className="rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-600 border border-yellow-200">
											Pending
										</span>
									} vertical />
									<Row label="New Status" value={
										<span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600 border border-green-200">
											Approved
										</span>
									} vertical />
									<Row label="Remarks" value="All document details verified &..." vertical />
								</div>
							</div>

							{/* Additional Information */}
							<div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
								<h3 className="font-bold text-gray-900 text-sm">Additional Information</h3>
								<div className="space-y-3">
									<Row label="Session ID" value="SID-2025-00098765" vertical />
									<Row label="Browser" value="Google Chrome 126.0.0.0" vertical />
									<Row label="Operation System" value="Windows 11" vertical />
									<Row label="Screen Resolution" value="1920 x 1080" vertical />
									<Row label="Time Zone" value="(GMT+1) West Afric..." vertical />
									<Row label="Reference" value="--" vertical />
								</div>
							</div>
						</div>

						{/* Buttons */}
						<div className="space-y-3 pt-2">
							<button className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-200">
								Download activity Log
							</button>
							<div className="grid grid-cols-2 gap-3">
								<button className="w-full rounded-xl bg-red-50 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-100">
									Delete activity Log
								</button>
								<button className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-200">
									View User Details
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
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
