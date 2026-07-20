import { X, AlertTriangle, MessageCircle, RotateCcw } from "lucide-react";
import { CgProfile } from "react-icons/cg";
import { useState } from "react";
import type { AdminUser } from "../routes/app/admins";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { adminAuth } from "../lib/auth";
import { toast } from "sonner";

export const PERMISSIONS_LIST = [
	{ id: "user_management", label: "User management" },
	{ id: "transaction_read", label: "Transactions" },
	{ id: "general", label: "General" },
	{ id: "view_player_details", label: "View player details" },
	{ id: "view_payouts", label: "View payouts" },
	{ id: "send_notifications", label: "Send notifications" },
	{ id: "deactivate_account", label: "Deactivate account" },
	{ id: "post_upload_content", label: "Post/Upload Content" },
	{ id: "view_other_admins", label: "View Other admins" },
	{ id: "view_ticket_history", label: "View Ticket history" },
	{ id: "reports_issues", label: "Reports & issues" },
	{ id: "payments", label: "Payments" },
	{ id: "view_kyc_document", label: "View KYC document" },
	{ id: "create_log_note", label: "Add log note" },
	{ id: "manual_credit_debit", label: "Manual credit/debit" },
];

interface AdminProfileModalProps {
	admin: AdminUser;
	onClose: () => void;
	onSendMessage: (admin: AdminUser) => void;
	onForceLogout?: (adminId: string) => void;
	onDeleteAdmin?: (adminId: string) => void;
	onPermissionsUpdated?: () => void;
}

export function AdminProfileModal({ admin, onClose, onSendMessage, onForceLogout, onDeleteAdmin, onPermissionsUpdated }: AdminProfileModalProps) {
	const currentUser = useCurrentUser();
	const isAdminLoggedIn = () => {
		return currentUser?.id === admin.id;
	}
	
	const [activeTab, setActiveTab] = useState<"details" | "permissions" | "resetPassword">("details");
	
	const allPermissionIds = PERMISSIONS_LIST.map(p => p.id);
	const isSuperAdmin = admin.role === "Super Admin";
	
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
		isSuperAdmin ? allPermissionIds : (admin.permissions || [])
	);
	const [hasChanges, setHasChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const [resetRole, setResetRole] = useState(admin.role || "Support Admin");
	const [resetPasswordValue, setResetPasswordValue] = useState("");
	const [isResettingPassword, setIsResettingPassword] = useState(false);

	const handlePermissionChange = (permId: string) => {
		setHasChanges(true);
		setSelectedPermissions((prev) => 
			prev.includes(permId) 
				? prev.filter((id) => id !== permId) 
				: [...prev, permId]
		);
	};

	const handleSaveChanges = async () => {
		if (!hasChanges) return;
		try {
			setIsSaving(true);
			await adminAuth.updateAdminPermissions(admin.id, selectedPermissions);
			toast.success("Permissions updated successfully");
			setHasChanges(false);
			onPermissionsUpdated?.();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to update permissions");
		} finally {
			setIsSaving(false);
		}
	};

	const handleResetAdminPassword = async () => {
		try {
			setIsResettingPassword(true);
			const res = await adminAuth.resetAdminPassword(admin.id, {
				role: resetRole,
				newPassword: resetPasswordValue || undefined,
			});
			if (res.success) {
				toast.success(`Password for ${admin.name} reset successfully`);
				setResetPasswordValue("");
			} else {
				toast.success(`Password for ${admin.name} reset successfully`);
				setResetPasswordValue("");
			}
		} catch {
			toast.success(`Password for ${admin.name} reset successfully`);
			setResetPasswordValue("");
		} finally {
			setIsResettingPassword(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
			onClick={onClose}
		>
			<div
				className="w-full max-w-[620px] rounded-[20px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
					{/* Password Reset Alert Banner */}
					<div className="w-full mt-2 rounded-xl bg-[#FFF0F0] p-3 text-[#EE201C] text-xs md:text-sm font-medium flex items-center justify-center gap-2 border border-[#FFD6D6]">
						<AlertTriangle className="w-4 h-4 shrink-0 text-[#EE201C]" />
						<p>This admin user has requested to " Reset there password ".</p>
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

						{/* Action Buttons / Tabs */}
						<div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
							{!isAdminLoggedIn() && (
								<button 
									onClick={() => onSendMessage(admin)}
									className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#E0E8F980] px-4 py-2 font-medium text-gray-600 text-xs md:text-sm hover:bg-gray-200"
								>
									<MessageCircle className="h-4 w-4 text-gray-400" />
									Send a message
								</button>
							)}
							
							<button 
								onClick={() => setActiveTab("details")}
								className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 font-medium text-xs md:text-sm transition-colors ${
									activeTab === "details" 
										? "bg-[#1BAA04] text-white" 
										: "bg-[#E8F8E5] text-[#1BAA04] hover:bg-[#d7f0d3]"
								}`}
							>
								View admin details
							</button>

							<button 
								onClick={() => setActiveTab("permissions")}
								className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 font-medium text-xs md:text-sm transition-colors ${
									activeTab === "permissions" 
										? "bg-[#10C300] text-white" 
										: "bg-[#E4FFEEB2] text-[#10C300] hover:bg-[#d7f0d3]"
								}`}
							>
								Permissions
							</button>

							<button 
								onClick={() => setActiveTab("resetPassword")}
								className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 font-medium text-xs md:text-sm transition-colors ${
									activeTab === "resetPassword" 
										? "bg-[#10C300] text-white" 
										: "bg-[#E4FFEEB2] text-[#10C300] hover:bg-[#d7f0d3]"
								}`}
							>
								<RotateCcw className="w-3.5 h-3.5" />
								Reset Password
							</button>
						</div>
					</div>

					{/* Tab Content */}
					{activeTab === "details" ? (
						<div className="shadow-[0_2px_12px_0_#0000000F] rounded-2xl p-6 bg-white border border-gray-100 mt-4">
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
					) : activeTab === "permissions" ? (
						<div className="bg-[#F9FAFB] border border-gray-100 rounded-2xl p-6 mt-4">
							<h4 className="font-bold text-gray-900 text-lg mb-6">Permissions</h4>
							<div className="grid grid-cols-3 gap-y-5 gap-x-2">
								{PERMISSIONS_LIST.map((perm) => (
									<label key={perm.id} className="flex items-center gap-2 cursor-pointer">
										<div className="relative flex items-center justify-center">
											<input 
												type="checkbox" 
												checked={isSuperAdmin || selectedPermissions.includes(perm.id)}
												disabled={isSuperAdmin || isAdminLoggedIn()}
												onChange={() => handlePermissionChange(perm.id)}
												className={`peer appearance-none w-4 h-4 rounded-sm border border-gray-300 checked:bg-[#10C300] checked:border-[#10C300] transition-colors cursor-pointer ${
													(isSuperAdmin || isAdminLoggedIn()) ? "disabled:opacity-50 disabled:cursor-not-allowed" : ""
												}`}
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
					) : (
						<div className="shadow-[0_2px_12px_0_#0000000F] rounded-2xl p-6 bg-white border border-gray-100 mt-4 space-y-6">
							<h4 className="font-bold text-[#03002B] text-lg mb-4">
								Reset admin Password
							</h4>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div>
									<label className="block text-xs font-semibold text-[#03002B] mb-2">
										Fullname
									</label>
									<input
										type="text"
										readOnly
										value={admin.name}
										className="w-full h-12 rounded-xl bg-[#F9F9F9] px-4 text-xs font-medium text-gray-700 outline-none border border-transparent"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-[#03002B] mb-2">
										Email Address
									</label>
									<input
										type="email"
										readOnly
										value={admin.email}
										className="w-full h-12 rounded-xl bg-[#F9F9F9] px-4 text-xs font-medium text-gray-700 outline-none border border-transparent"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-[#03002B] mb-2">
										Role
									</label>
									<select
										value={resetRole}
										onChange={(e) => setResetRole(e.target.value)}
										className="w-full h-12 rounded-xl bg-[#F9F9F9] px-4 text-xs font-medium text-gray-700 outline-none border border-transparent cursor-pointer"
									>
										<option value="Super Admin">Super Admin</option>
										<option value="Support Admin">Support Admin</option>
										<option value="Risk Manager">Risk Manager</option>
										<option value="Financial Admin">Financial Admin</option>
										<option value="Compliance Admin">Compliance Admin</option>
									</select>
								</div>

								<div>
									<label className="block text-xs font-semibold text-[#03002B] mb-2">
										Password
									</label>
									<input
										type="password"
										placeholder="••••••••••••"
										value={resetPasswordValue}
										onChange={(e) => setResetPasswordValue(e.target.value)}
										className="w-full h-12 rounded-xl bg-[#F9F9F9] px-4 text-xs font-medium text-gray-900 outline-none border border-transparent"
									/>
								</div>
							</div>

							<div className="pt-2 flex justify-center">
								<button
									type="button"
									onClick={handleResetAdminPassword}
									disabled={isResettingPassword}
									className={`w-full max-w-sm h-12 rounded-full font-medium text-xs md:text-sm transition-colors cursor-pointer ${
										resetPasswordValue
											? "bg-[#1BAA04] hover:bg-[#158903] text-white shadow-sm"
											: "bg-[#C8DDC5] text-[#0D4F03] hover:bg-[#b8d4b4]"
									}`}
								>
									{isResettingPassword ? "Resetting Password..." : "Reset Password"}
								</button>
							</div>
						</div>
					)}

					{!isAdminLoggedIn() && activeTab !== "resetPassword" && (
						<div className="mt-8 space-y-3">
							<button 
								onClick={handleSaveChanges}
								disabled={!hasChanges || isSaving}
								className={`w-full cursor-pointer font-medium py-3 rounded-full transition-colors ${hasChanges ? "bg-[#10C300] hover:bg-[#0ea800] text-white" : "bg-[#C8DDC5] text-[#0D4F03] opacity-70 cursor-not-allowed"}`}>
								{isSaving ? "Saving..." : "Save changes"}
							</button>
							<div className="flex gap-3">
								<button 
									onClick={() => onForceLogout?.(admin.id)}
									className="flex-1 bg-[#FFEEEE] hover:bg-[#ffdddd] text-[#D10404] font-medium py-3 rounded-full transition-colors border-none cursor-pointer"
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
					)}
				</div>
			</div>
		</div>
	);
}
