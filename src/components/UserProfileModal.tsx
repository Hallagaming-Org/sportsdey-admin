import { X, AlertTriangle, MessageCircle, Wallet } from "lucide-react";
import { CgProfile } from "react-icons/cg";
import { PauseCircle } from "lucide-react";
import type { User, UserProfile } from "../lib/users";
import { LuMessageSquareDot } from "react-icons/lu";
import { useState } from "react";
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
			icon: <PauseCircle className={`w-4 h-4 ${user.suspended ? 'text-[#B00020]' : 'text-gray-500'}`} />, 
			onClick: () => onSuspend?.(user),
			className: `border border-dashed ${user.suspended ? 'border-[#B00020] text-[#B00020] bg-[#FEECEB]' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`
		},
		{ 
			label: "Contact User Info", 
			icon: <LuMessageSquareDot className="w-4 h-4 text-gray-500" />, 
			onClick: () => {},
			className: "bg-white border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50"
		},
		{ 
			label: "Wallet Info", 
			icon: <Wallet className={`w-4 h-4 ${activeView === 'wallet' ? 'text-white' : 'text-[#10C300]'}`} />, 
			onClick: () => setActiveView(activeView === "wallet" ? "personal" : "wallet"),
			className: activeView === "wallet" ? "bg-[#10C300] text-white border border-transparent shadow-[0_4px_14px_0_rgba(16,195,0,0.39)]" : "bg-white border border-dashed border-[#10C300] text-[#10C300] hover:bg-[#E8F8E5]"
		},
		{ 
			label: "Send a notice", 
			icon: <MessageCircle className="w-4 h-4 text-gray-500" />, 
			onClick: () => onSendNotice(user),
			className: "bg-white border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50"
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
							<div className="bg-white h-[280px] rounded-2xl p-5">
								<h4 className="font-bold text-gray-900 mb-4">Personal Details</h4>
								<div className="space-y-4 text-sm">
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Full Name:</span>
										{loading ? <Skeleton className="h-3 w-24" /> : <span className="font-normal text-gray-900 text-xs text-left">{displayData.name}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Email Address:</span>
										{loading ? <Skeleton className="h-3 w-32" /> : <span className="font-normal text-gray-900 text-xs text-left underline underline-offset-2">{displayData.email}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Mobile number:</span>
										{loading ? <Skeleton className="h-3 w-20" /> : <span className="font-normal text-gray-900 text-xs text-left">{mobileNumber}</span>}
									</div>
									<div className="flex justify-between items-center">
										<span className="text-gray-500 text-xs">Status:</span>
										{loading ? (
											<Skeleton className="h-6 w-16 rounded-full" />
										) : (
											<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
												status === "verified" ? "bg-[#E8F8E5] text-[#10C300]" :
												status === "pending_verification" ? "bg-[#FFF8E5] text-[#FFB000]" :
												"bg-[#FEECEB] text-[#EE201C]"
											}`}>
												{status === "verified" ? "Verified" : 
												status === "pending_verification" ? "Pending" : 
												"Not Verified"}
											</span>
										)}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Country:</span>
										{loading ? <Skeleton className="h-3 w-16" /> : <span className="font-normal text-gray-900 text-xs text-left">{country}</span>}
									</div>
									<div className="flex justify-between items-start">
										<span className="text-gray-500 text-xs">Registration date:</span>
										{loading ? (
											<Skeleton className="h-3 w-24" />
										) : (
											<span className="font-normal text-gray-900 text-xs text-left">
												{registeredDate ? new Date(registeredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
											</span>
										)}
									</div>
								</div>
							</div>

							<div className="h-[280px] bg-white rounded-2xl p-5">
								<h4 className="font-bold text-gray-900 mb-4">User's Wallet</h4>
								<div className="space-y-4 text-sm">
									<div>
										<span className="block text-gray-500 mb-1">Current Balance</span>
										{loading ? (
											<Skeleton className="h-8 w-28" />
										) : (
											<div className="inline-flex items-center gap-1 text-gray-900"><span className="text-xs font-medium">₦</span> <span className="text-2xl font-bold">{walletBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
										)}
									</div>
									<div className="flex justify-between items-start pt-2">
										<span className="text-gray-500">Last Top-up:</span>
										{loading ? <Skeleton className="h-3 w-24" /> : <span className="font-normal text-gray-900 text-left">{lastTopUp ? lastTopUp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}</span>}
									</div>
								</div>
							</div>
						</div>
					) : (
						<UserProfileWalletInfo userId={user.id} balance={walletBalance} />
					)}
				</div>
			</div>
		</div>
	);
}
