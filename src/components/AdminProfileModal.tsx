import { X, AlertTriangle, MessageCircle } from "lucide-react";
import { CgProfile } from "react-icons/cg";
import { useState } from "react";
import type { AdminUser } from "../routes/app/admins";

interface AdminProfileModalProps {
	admin: AdminUser;
	onClose: () => void;
	onSendMessage: (admin: AdminUser) => void;
	onForceLogout?: (adminId: string) => void;
	onDeleteAdmin?: (adminId: string) => void;
}

export function AdminProfileModal({ admin, onClose, onSendMessage, onForceLogout, onDeleteAdmin }: AdminProfileModalProps) {
	const [activeTab, setActiveTab] = useState<"details" | "permissions">("details");

	const permissionsList = [
		{ id: "user_management_1", label: "User management", defaultChecked: true },
		{ id: "transactions", label: "Transactions", defaultChecked: true },
		{ id: "general", label: "General", defaultChecked: true },
		{ id: "view_player_details", label: "View player details", defaultChecked: false },
		{ id: "view_payouts", label: "View payouts", defaultChecked: false },
		{ id: "send_notifications", label: "Send notifications", defaultChecked: false },
		{ id: "deactivate_acct", label: "Deactivate acct", defaultChecked: true },
		{ id: "user_management_2", label: "User management", defaultChecked: true },
		{ id: "post_upload_content", label: "Post/Upload Content", defaultChecked: true },
		{ id: "view_other_admins", label: "View Other admns", defaultChecked: false },
		{ id: "view_ticket_history", label: "View Ticket history", defaultChecked: false },
		{ id: "reports_issues", label: "Reports & issues", defaultChecked: false },
		{ id: "user_management_3", label: "User management", defaultChecked: true },
		{ id: "payments", label: "Payments", defaultChecked: true },
		{ id: "view_kyc", label: "View KYC document", defaultChecked: true },
		{ id: "user_management_4", label: "User management", defaultChecked: false },
		{ id: "user_management_5", label: "User management", defaultChecked: false },
		{ id: "user_management_6", label: "User management", defaultChecked: false },
	];

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
			onClick={onClose}
		>
			<div
				className="w-full max-w-[600px] rounded-[20px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex bg-white items-center justify-between p-6 pb-2">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-[#E8F8E5] rounded-full text-[#10C300]">
							<CgProfile className="w-5 h-5" />
						</div>
						<h3 className="font-bold text-xl text-gray-900">Admin's Profile</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="bg-[#03002B] p-1.5 rounded-full transition-colors cursor-pointer"
					>
						<X className="h-4 w-4 text-white" />
					</button>
				</div>
				
				<div className="overflow-y-auto custom-scrollbar px-8 pb-8 space-y-6 flex-1">
					{/* Warning */}
					<div className="w-full mt-2 flex justify-center text-[#B00020] text-sm font-medium">
						<div className="flex items-center gap-2">
							<AlertTriangle className="w-4 h-4" />
							<p>This user has limited access or is requesting access to some features.</p>
						</div>
					</div>

					{/* Profile Info */}
					<div className="flex flex-col items-center justify-center pt-2">
						<img 
							src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.name}`} 
							alt="avatar" 
							className="h-20 w-20 rounded-full bg-[#E5E7EB] object-cover shadow-sm mb-3" 
						/>
						<h2 className="text-lg font-bold text-[#03002B]">{admin.name}</h2>
						<p className="text-gray-500 text-xs font-medium mt-1 mb-1">
							Online
						</p>
						<p className="text-[#03002B] text-sm font-medium">
							{admin.role}
						</p>

						{/* Action Buttons */}
						<div className="flex items-center gap-3 mt-6">
							<button 
								onClick={() => onSendMessage(admin)}
								className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#F4F5F7] px-4 py-2 font-medium text-gray-600 text-sm hover:bg-gray-200"
							>
								<MessageCircle className="h-4 w-4 text-gray-400" />
								Send a message
							</button>
							
							<button 
								onClick={() => setActiveTab("details")}
								className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2 font-medium text-sm transition-colors ${
									activeTab === "details" 
										? "bg-[#1BAA04] text-white" 
										: "bg-[#E8F8E5] text-[#1BAA04] hover:bg-[#d7f0d3]"
								}`}
							>
								View admin details
							</button>

							<button 
								onClick={() => setActiveTab("permissions")}
								className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2 font-medium text-sm transition-colors ${
									activeTab === "permissions" 
										? "bg-[#10C300] text-white" 
										: "bg-[#E8F8E5] text-[#10C300] hover:bg-[#d7f0d3]"
								}`}
							>
								Permissions
							</button>
						</div>
					</div>

					{/* Tab Content */}
					{activeTab === "details" ? (
						<div className="shadow-[0_2px_12px_0_#0000000F] rounded-2xl p-6 bg-white mt-4">
							<h4 className="font-bold text-[#03002B] text-lg mb-6">Admin Information</h4>
							<div className="space-y-4 text-sm">
								<div className="grid grid-cols-[140px_1fr] items-center">
									<span className="text-gray-500 font-medium">Full Name:</span>
									<span className="font-medium text-gray-900">{admin.name}</span>
								</div>
								<div className="grid grid-cols-[140px_1fr] items-center">
									<span className="text-gray-500 font-medium">Email Address:</span>
									<span className="font-medium text-gray-900 underline underline-offset-2">{admin.email}</span>
								</div>
								<div className="grid grid-cols-[140px_1fr] items-center">
									<span className="text-gray-500 font-medium">Role</span>
									<span className="inline-flex w-max items-center rounded-full px-2.5 py-1 text-xs font-medium bg-[#E8F8E5] text-[#10C300]">
										{admin.role}
									</span>
								</div>
								<div className="grid grid-cols-[140px_1fr] items-center">
									<span className="text-gray-500 font-medium">Mobile number:</span>
									<span className="font-medium text-gray-900">{admin.mobileNumber || "N/A"}</span>
								</div>
								<div className="grid grid-cols-[140px_1fr] items-center">
									<span className="text-gray-500 font-medium">Date added</span>
									<span className="font-medium text-gray-900">
										{admin.dateAdded ? new Date(admin.dateAdded).toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : "15th of February, 2009"}
									</span>
								</div>
							</div>
						</div>
					) : (
						<div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-6 mt-4">
							<h4 className="font-bold text-gray-900 text-lg mb-6">Permissions</h4>
							<div className="grid grid-cols-3 gap-y-5 gap-x-2">
								{permissionsList.map((perm) => (
									<label key={perm.id} className="flex items-center gap-2 cursor-pointer">
										<div className="relative flex items-center justify-center">
											<input 
												type="checkbox" 
												defaultChecked={perm.defaultChecked}
												className="peer appearance-none w-4 h-4 rounded-sm border border-gray-300 checked:bg-[#10C300] checked:border-[#10C300] transition-colors cursor-pointer"
											/>
											<svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
												<path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
										</div>
										<span className="text-xs font-medium text-gray-900 select-none">{perm.label}</span>
									</label>
								))}
							</div>
						</div>
					)}

					<div className="mt-8 space-y-3">
						<button className="w-full bg-[#E8F8E5] hover:bg-[#d7f0d3] text-[#10C300] font-medium py-3 rounded-full transition-colors cursor-pointer">
							Save changes
						</button>
						<div className="flex gap-3">
							<button 
								onClick={() => onForceLogout?.(admin.id)}
								className="flex-1 bg-[#FFEEEE] hover:bg-[#ffdddd] text-[#FF0000] font-medium py-3 rounded-full transition-colors border-none cursor-pointer"
							>
								Force Log out
							</button>
							<button 
								onClick={() => onDeleteAdmin?.(admin.id)}
								className="flex-1 bg-[#F4F5F7] hover:bg-[#e2e4e9] text-[#03002B] font-medium py-3 rounded-full transition-colors border-none cursor-pointer"
							>
								Delete admin
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
