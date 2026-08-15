import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	ChevronDown,
	Copy,
	History,
	MessageCircle,
	PauseCircle,
	Wallet,
	X,
	Check,
	Loader2,
	SquarePen,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CgProfile } from "react-icons/cg";
import { LuMessageSquareDot } from "react-icons/lu";
import { toast } from "sonner";
import { capitalizeName, formatDeviceInfo, sanitizeMobileNumber } from "#/lib/utils";
import { type User, type UserProfile, userService } from "../lib/users";
import { UserProfileHistory } from "./UserProfileHistory";
import { UserProfileLogNotes } from "./UserProfileLogNotes";
import { UserProfileWalletInfo } from "./UserProfileWalletInfo";

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

// function formatCurrency(amount: number | undefined | null) {
// 	if (amount == null) return "₦0.00";
// 	return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// }

// function StatusBadge({ status }: { status: string }) {
// 	const s = status?.toLowerCase();
// 	const isSuccess = s === "success" || s === "completed" || s === "won";
// 	const isPending = s === "pending" || s === "processing";
// 	const isFailed = s === "failed";

// 	const cls = isSuccess
// 		? "bg-[#E8F8E5] text-[#10C300] border border-[#10C300]/20"
// 		: isPending
// 			? "bg-[#FFF8E5] text-[#FFB000] border border-[#FFB000]/20"
// 			: isFailed
// 				? "bg-[#FEECEB] text-[#EE201C] border border-[#EE201C]/20"
// 				: "bg-gray-100 text-gray-600 border border-gray-200";

// 	const label = isSuccess ? "Success" : isPending ? "Pending" : isFailed ? "Failed" : status;

// 	return (
// 		<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
// 			{label}
// 		</span>
// 	);
// }

export function UserProfileModal({
	user,
	profile: externalProfile,
	isLoading: externalLoading,
	onClose,
	onSendNotice,
	onSuspend,
}: UserProfileModalProps) {
	const [activeView, setActiveView] = useState<
		"personal" | "wallet" | "history"
	>("personal");
	const [showDevices, setShowDevices] = useState(false);
	const [showLoginIps, setShowLoginIps] = useState(false);

	const queryClient = useQueryClient();
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState({ dob: "", mobileNumber: "", status: "" });
	const [isUpdating, setIsUpdating] = useState(false);

	const { data: fetchedProfile, isLoading: isProfileQueryLoading } = useQuery({
		queryKey: ["user-profile-auto", user.id],
		queryFn: async () => {
			if (!user.id) return null;
			const res = await userService.getUserProfile(user.id);
			if (!res.success) return null;
			return res.data;
		},
		enabled: !externalProfile && !!user.id,
	});

	const profile = externalProfile || fetchedProfile;
	const isLoading = externalLoading || isProfileQueryLoading;
	const displayData = profile || user;
	const status = profile?.verificationStatus || user.status;
	const registeredDate = profile?.createdAt
		? new Date(profile.createdAt).getTime()
		: user.registeredDate;
	const walletBalance = profile?.wallet?.balance ?? user.wallet;
	// const lastTopUp = profile?.lastTopUp ? new Date(profile.lastTopUp) : null;
	const country = profile?.country || "Nigeria";
	const mobileNumber = profile?.mobileNumber;
	const isUserSuspended = user?.suspended;

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
				if (
					name &&
					name !== "N/A" &&
					!list.some((item) => item.name === name)
				) {
					list.push({ name, browser, current });
				}
			});
		} else if (profile?.deviceType && profile.deviceType !== "N/A") {
			list.push({
				name: formatDeviceInfo(profile.deviceType),
				browser: profile.browser || "",
				current: true,
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
					timestamp =
						ipObj.timestamp || ipObj.createdAt || ipObj.lastActiveAt || "";
					current = ipObj.current || ipObj.isCurrent || index === 0;
				}
				if (ip && ip !== "N/A" && !list.some((item) => item.ip === ip)) {
					list.push({ ip, timestamp, current });
				}
			});
		} else if (profile?.ipAddress && profile.ipAddress !== "N/A") {
			list.push({
				ip: profile.ipAddress,
				timestamp: "",
				current: true,
			});
		}
		return list;
	}, [profile]);

	const handleUpdate = async () => {
		setIsUpdating(true);
		try {
			const res = await userService.updateUser(user.id, editData);
			if (res.success) {
				toast.success("User details updated successfully");
				setIsEditing(false);
				queryClient.invalidateQueries({ queryKey: ["user-profile-auto", user.id] });
				queryClient.invalidateQueries({ queryKey: ["users"] });
			} else {
				toast.error(res.error || "Failed to update user details");
			}
		} catch (e) {
			toast.error("An error occurred while updating");
		} finally {
			setIsUpdating(false);
		}
	};

	const buttonItems = [
		{
			label: user.suspended ? "Suspended" : "Suspend",
			icon: (
				<PauseCircle
					className={`w-4 h-4 ${user.suspended ? "text-[#B00020]" : "text-[#B00020]"}`}
				/>
			),
			onClick: () => onSuspend?.(user),
			className: `${user.suspended ? "border-[#B00020] text-[#B00020] bg-[#FEECEB]" : "border-[#B00020] text-[#B00020] bg-[#FEECEB] hover:bg-[#fddcd9]"}`,
		},
		{
			label: "Contact User Info",
			icon: (
				<LuMessageSquareDot
					className={`w-4 h-4 ${activeView === "personal" ? "text-white" : "text-gray-500"}`}
				/>
			),
			onClick: () => setActiveView("personal"),
			className:
				activeView === "personal"
					? "bg-[#10C300] text-white border border-transparent shadow-[0_4px_14px_0_rgba(16,195,0,0.39)]"
					: "bg-[#EDF1F9] text-gray-500",
		},
		{
			label: "Wallet Info",
			icon: (
				<Wallet
					className={`w-4 h-4 ${activeView === "wallet" ? "text-white" : "text-gray-500"}`}
				/>
			),
			onClick: () => setActiveView("wallet"),
			className:
				activeView === "wallet"
					? "bg-[#10C300] text-white border border-transparent shadow-[0_4px_14px_0_rgba(16,195,0,0.39)]"
					: "bg-[#EDF1F9] text-gray-500",
		},
		{
			label: "Bet history",
			icon: (
				<History
					className={`w-4 h-4 ${activeView === "history" ? "text-white" : "text-gray-500"}`}
				/>
			),
			onClick: () => setActiveView("history"),
			className:
				activeView === "history"
					? "bg-[#10C300] text-white border border-transparent shadow-[0_4px_14px_0_rgba(16,195,0,0.39)]"
					: "bg-[#EDF1F9] text-gray-500",
		},
		{
			label: "Send a notice",
			icon: <MessageCircle className="w-4 h-4 text-gray-500" />,
			onClick: () => onSendNotice(user),
			className: "bg-[#EDF1F9] text-gray-500",
		},
	];
	const loading = isLoading && !profile;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
			onClick={onClose}
		>
			<div
				className="w-full max-w-[850px] rounded-[20px] bg-[#F2F4F7] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
							<p>
								This account has been suspended due to violation of the system
								rules and regulations.
							</p>
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
							<h2 className="text-base font-bold text-gray-900">
								{displayData.name}
							</h2>
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
									? new Date(registeredDate).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										})
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

				<div className={`flex-1 px-8 pb-8 flex flex-col ${activeView === "personal" ? "overflow-hidden" : "overflow-y-auto custom-scrollbar"}`}>
					{activeView === "personal" ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch flex-1 min-h-0">
							<div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full min-h-0">
								<div className="flex items-center justify-between mb-6 shrink-0">
									<h4 className="font-bold text-xl text-gray-900">
										Personal Details
									</h4>
									{isEditing ? (
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => setIsEditing(false)}
												disabled={isUpdating}
												className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
											>
												<X className="w-4 h-4" />
											</button>
											<button
												type="button"
												onClick={handleUpdate}
												disabled={isUpdating}
												className="p-1.5 text-white bg-[#10C300] hover:bg-[#0eac00] rounded-full transition-colors flex items-center justify-center cursor-pointer"
											>
												{isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
											</button>
										</div>
									) : (
										<button
											type="button"
											onClick={() => {
												setEditData({
													dob: profile?.dob || "",
													mobileNumber: mobileNumber || "",
													status: status || "approved",
												});
												setIsEditing(true);
											}}
											className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
										>
											<SquarePen className="w-4 h-4" />
										</button>
									)}
								</div>
								<div className="space-y-5 text-sm flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Full Name:</span>
										{loading ? (
											<Skeleton className="h-4 w-24" />
										) : (
											<span className="font-medium text-gray-900 text-sm text-left">
												{capitalizeName(displayData.name)}
											</span>
										)}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">
											Email Address:
										</span>
										{loading ? (
											<Skeleton className="h-4 w-32" />
										) : (
											<span className="font-medium text-gray-900 text-sm text-left underline underline-offset-2">
												{displayData.email || "N/A"}
											</span>
										)}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">user Id:</span>
										{loading ? (
											<Skeleton className="h-4 w-20" />
										) : (
											<div className="flex items-center gap-1.5">
												<span
													className="font-medium text-gray-900 text-xs text-left truncate max-w-[80px]"
													title={user?.id}
												>
													{user?.id
														? user.id.length > 20
															? `${user.id.substring(0, 20)}...`
															: user.id
														: ""}
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
									<div className="flex justify-between items-center">
										<span className="text-gray-500 text-xs">
											Mobile number:
										</span>
										{loading ? (
											<Skeleton className="h-4 w-20" />
										) : isEditing ? (
											<input 
												type="tel" 
												value={editData.mobileNumber} 
												onChange={(e) => {
													const val = sanitizeMobileNumber(e.target.value);
													setEditData(prev => ({ ...prev, mobileNumber: val }));
												}}
												className="border border-gray-200 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:border-[#10C300]"
											/>
										) : (
											<span className="font-medium text-gray-900 text-sm text-left">
												{mobileNumber || "N/A"}
											</span>
										)}
									</div>
									<div className="flex justify-between items-center">
										<span className="text-gray-500 text-xs">Status:</span>
										{loading ? (
											<Skeleton className="h-8 w-16" />
										) : isEditing ? (
											<select
												value={editData.status}
												onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
												className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#10C300]"
											>
												<option value="approved">Verified</option>
												<option value="pending_verification">Pending</option>
												<option value="unverified">Not Verified</option>
											</select>
										) : (
											<div className="flex flex-col items-end gap-1">
												<span
													className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
														status === "approved"
															? "bg-[#E8F8E5] text-[#10C300] border border-[#10C300]"
															: status === "pending_verification"
																? "bg-[#FFF8E5] text-[#FFB000]"
																: "bg-[#FEECEB] text-[#EE201C]"
													}`}
												>
													{status === "approved"
														? "Verified"
														: status === "pending_verification"
															? "Pending"
															: "Not Verified"}
												</span>
											</div>
										)}
									</div>
									<div className="flex justify-between items-center">
										<span className="text-gray-500 text-xs">
											Date of Birth:
										</span>
										{loading ? (
											<Skeleton className="h-4 w-24" />
										) : isEditing ? (
											<input 
												type="date" 
												value={editData.dob} 
												onChange={(e) => setEditData(prev => ({ ...prev, dob: e.target.value }))}
												className="border border-gray-200 rounded px-2 py-1 text-sm w-36 focus:outline-none focus:border-[#10C300]"
											/>
										) : (
											<span className="font-medium text-gray-900 text-sm text-left">
												{profile?.dob || "N/A"}
											</span>
										)}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Country:</span>
										{loading ? (
											<Skeleton className="h-4 w-16" />
										) : (
											<span className="font-medium text-gray-900 text-sm text-left">
												{country || "N/A"}
											</span>
										)}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs mt-1">
											Device info:
										</span>
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
															{deviceHistory[0]?.name ||
																formatDeviceInfo(profile?.deviceType) ||
																"N/A"}
															<ChevronDown
																className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showDevices ? "rotate-180" : ""}`}
															/>
														</button>

														{showDevices && (
															<div className="absolute right-0 bottom-full mb-2 w-56 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl z-20 py-2 overflow-hidden">
																<div className="px-3 py-1.5 border-b border-gray-50 bg-gray-50/50 mb-1">
																	<span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
																		Device History
																	</span>
																</div>
																{deviceHistory.map((device, i) => (
																	<div
																		key={i}
																		className="px-4 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-left group cursor-default"
																	>
																		<div className="flex items-center justify-between gap-2">
																			<span className="text-xs font-medium text-gray-900 group-hover:text-[#10C300] transition-colors">
																				{device.name}
																			</span>
																			{device.current && (
																				<span className="text-[10px] text-[#10C300] bg-[#E8F8E5] px-1.5 py-0.5 rounded-full font-medium">
																					Current
																				</span>
																			)}
																		</div>
																		{device.browser && (
																			<span className="text-[10px] text-gray-500 block mt-0.5">
																				{device.browser}
																			</span>
																		)}
																	</div>
																))}
															</div>
														)}
													</>
												) : (
													<span
														className="font-medium text-gray-900 text-sm text-left block mt-1"
														title={profile?.deviceType || undefined}
													>
														{deviceHistory[0]?.name ||
															formatDeviceInfo(profile?.deviceType) ||
															"N/A"}
													</span>
												)}
											</div>
										)}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs mt-1">
											Login IP:
										</span>
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
															<ChevronDown
																className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showLoginIps ? "rotate-180" : ""}`}
															/>
														</button>

														{showLoginIps && (
															<div className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl z-20 py-2 overflow-hidden">
																<div className="px-3 py-1.5 border-b border-gray-50 bg-gray-50/50 mb-1">
																	<span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
																		IP History
																	</span>
																</div>
																{ipHistory.map((login, i) => (
																	<div
																		key={i}
																		className="px-4 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-left group cursor-default"
																	>
																		<div className="flex items-center justify-between gap-2">
																			<span className="text-xs font-medium text-gray-900 group-hover:text-[#10C300] transition-colors">
																				{login.ip}
																			</span>
																			{login.current && (
																				<span className="text-[10px] text-[#10C300] bg-[#E8F8E5] px-1.5 py-0.5 rounded-full font-medium">
																					Current
																				</span>
																			)}
																		</div>
																		{login.timestamp && (
																			<span className="text-[10px] text-gray-500 block mt-0.5">
																				{login.timestamp}
																			</span>
																		)}
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
					) : activeView === "wallet" ? (
						<UserProfileWalletInfo userId={user.id} balance={walletBalance} />
					) : (
						<UserProfileHistory userId={user.id} onCloseModal={onClose} />
					)}
				</div>
			</div>
		</div>
	);
}
