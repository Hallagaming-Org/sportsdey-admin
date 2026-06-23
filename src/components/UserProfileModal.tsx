import { X, AlertTriangle, MessageCircle, Wallet } from "lucide-react";
import { CgProfile } from "react-icons/cg";
import { PauseCircle } from "lucide-react";
import type { User, UserProfile } from "../lib/users";
import { LuMessageSquareDot } from "react-icons/lu";
import { useState } from "react";
import { UserProfileWalletInfo } from "./UserProfileWalletInfo";
import { UserProfileLogNotes } from "./UserProfileLogNotes";

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

export function UserProfileModal({ user, profile, isLoading, onClose, onSendNotice, onSuspend }: UserProfileModalProps) {
	const displayData = profile || user;
	const status = profile?.verificationStatus || user.status;
	const registeredDate = profile?.createdAt ? new Date(profile.createdAt).getTime() : user.registeredDate;
	const walletBalance = profile?.wallet?.balance ?? user.wallet;
	const lastTopUp = profile?.lastTopUp ? new Date(profile.lastTopUp) : null;
	const country = profile?.country || "Nigeria";
	const mobileNumber = profile?.mobileNumber || "1234567890";
	const isUserSuspended = user?.suspended
	console.log({user})
	const [activeView, setActiveView] = useState<"personal" | "wallet">("personal");
	const buttonItems = [
		{ 
			label: user.suspended ? "Suspended" : "Suspend", 
			icon: <PauseCircle className={`w-4 h-4 ${user.suspended ? 'text-[#B00020]' : 'text-[#B00020]'}`} />, 
			onClick: () => onSuspend?.(user),
			className: `border ${user.suspended ? 'border-[#B00020] text-[#B00020] bg-[#FEECEB]' : 'border-[#B00020] text-[#B00020] bg-[#FEECEB] hover:bg-[#fddcd9]'}`
		},
		{ 
			label: "Contact User Info", 
			icon: <LuMessageSquareDot className={`w-4 h-4 ${activeView === 'personal' ? 'text-white' : 'text-gray-500'}`} />, 
			onClick: () => setActiveView("personal"),
			className: activeView === "personal" ? "bg-[#10C300] text-white border border-transparent shadow-[0_4px_14px_0_rgba(16,195,0,0.39)]" : "bg-white border border-gray-300 text-gray-500 hover:bg-gray-50"
		},
		{ 
			label: "Wallet Info", 
			icon: <Wallet className={`w-4 h-4 ${activeView === 'wallet' ? 'text-white' : 'text-gray-500'}`} />, 
			onClick: () => setActiveView("wallet"),
			className: activeView === "wallet" ? "bg-[#10C300] text-white border border-transparent shadow-[0_4px_14px_0_rgba(16,195,0,0.39)]" : "bg-white border border-gray-300 text-gray-500 hover:bg-gray-50"
		},
		{ 
			label: "Send a notice", 
			icon: <MessageCircle className="w-4 h-4 text-gray-500" />, 
			onClick: () => onSendNotice(user),
			className: "bg-white border border-gray-300 text-gray-500 hover:bg-gray-50"
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
				
				<div className="overflow-y-auto custom-scrollbar p-8 space-y-6 flex-1">
					{isUserSuspended && (
						<div className="w-max mx-auto flex -mt-4 items-center gap-2 px-3 py-2 text-[#B00020] bg-[#FEECEB] rounded-full text-sm">
							<AlertTriangle className="w-4 h-4" />
							<p>This account has been suspended due to violation of the system rules and regulations.</p>
						</div>
					)}

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
							<span className="w-2 h-2 rounded-full bg-[#10C300]"></span>
							Online
						</p>
						{loading ? (
							<Skeleton className="h-3 w-24 mt-1" />
						) : (
							<p className="text-gray-500 text-xs mt-.5">
								Joined on {registeredDate ? new Date(registeredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
							</p>
						)}

						<div className="flex items-center gap-3 mt-6">
							{buttonItems.map((btn, idx) => (
								<button 
									key={idx}
									onClick={btn.onClick}
									className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${btn.className}`}
								>
									{btn.icon}
									{btn.label}
								</button>
							))}
						</div>
					</div>

					{activeView === "personal" ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full min-h-[360px]">
								<h4 className="font-bold text-xl text-gray-900 mb-6">Personal Details</h4>
								<div className="space-y-5 text-sm flex-1">
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-sm">Full Name:</span>
										{loading ? <Skeleton className="h-4 w-24" /> : <span className="font-medium text-gray-900 text-sm text-left">{displayData.name}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-sm">Email Address:</span>
										{loading ? <Skeleton className="h-4 w-32" /> : <span className="font-medium text-gray-900 text-sm text-left underline underline-offset-2">{displayData.email}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-sm">Mobile number:</span>
										{loading ? <Skeleton className="h-4 w-20" /> : <span className="font-medium text-gray-900 text-sm text-left">{mobileNumber}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-sm">Status:</span>
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
												<span className="text-xs font-medium text-gray-900">{user.id.replace('USR-', '') || "801030 30108"}</span>
											</div>
										)}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-sm">Date of Birth:</span>
										{loading ? <Skeleton className="h-4 w-24" /> : <span className="font-medium text-gray-900 text-sm text-left">{profile?.dob || "15th of February, 2009"}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-sm">Country:</span>
										{loading ? <Skeleton className="h-4 w-16" /> : <span className="font-medium text-gray-900 text-sm text-left">{country}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-sm">Device info:</span>
										{loading ? (
											<Skeleton className="h-8 w-32" />
										) : (
											<div className="flex flex-col items-end gap-1 text-xs font-medium">
												<span className="inline-flex items-center rounded-full px-2.5 py-1 bg-white border border-gray-200 text-gray-700 shadow-sm">
													{profile?.deviceType || "IPhone 11"}
												</span>
												<span className="text-gray-700">{profile?.browser || "Safari"} &nbsp; {profile?.ipAddress || "105.112.23.191"}</span>
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
