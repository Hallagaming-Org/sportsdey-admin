import { X, AlertTriangle, MessageCircle } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { PauseCircle } from "lucide-react";
import type { User } from "../lib/users";

interface UserProfileModalProps {
	user: User;
	onClose: () => void;
	onSendNotice: (user: User) => void;
	onSuspend?: (user: User) => void;
}

export function UserProfileModal({ user, onClose, onSendNotice, onSuspend }: UserProfileModalProps) {
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
						className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				
				<div className="overflow-y-auto custom-scrollbar p-6 space-y-6 flex-1">
					{/* Mock Suspend Warning */}
					{user.status === 'not_verified' && (
						<div className="flex items-center gap-2 text-[#EE201C] bg-[#FEECEB] px-4 py-3 rounded-lg text-sm">
							<AlertTriangle className="w-4 h-4" />
							<p>This account has been suspended due to violation of the system rules and regulations.</p>
						</div>
					)}

					<div className="flex flex-col items-center justify-center pt-2">
						{/* <img 
							src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
							alt="avatar" 
							className="h-24 w-24 rounded-full bg-gray-100 object-cover shadow-sm mb-3" 
						/> */}
						<h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
						<p className="text-[#10C300] font-medium text-sm flex items-center gap-1.5 mt-1">
							<span className="w-2 h-2 rounded-full bg-[#10C300]"></span>
							Online
						</p>
						<p className="text-gray-500 text-sm mt-1">
							Joined on {user.registeredDate ? new Date(user.registeredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
						</p>

						<div className="flex items-center gap-3 mt-6">
							<button 
								onClick={() => onSendNotice(user)}
								className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
							>
								<MessageCircle className="w-4 h-4" />
								Send a notice
							</button>
							<button className="inline-flex items-center gap-2 px-4 py-2 bg-[#10C300] rounded-full text-sm font-medium text-white hover:bg-[#0ea800] transition-colors cursor-pointer shadow-[0_4px_14px_0_rgba(16,195,0,0.39)]">
								<FaWhatsapp className="w-4 h-4" />
								Contact User
							</button>
							<button 
								onClick={() => onSuspend?.(user)}
								className="inline-flex items-center gap-2 px-4 py-2 border border-[#FEECEB] bg-[#FEECEB] rounded-full text-sm font-medium text-[#EE201C] hover:bg-red-100 transition-colors cursor-pointer"
							>
								<PauseCircle className="w-4 h-4" />
								Suspended
							</button>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="bg-white border h-[320px] border-gray-100 rounded-2xl p-5">
							<h4 className="font-bold text-gray-900 mb-4">Personal Details</h4>
							<div className="space-y-4 text-sm">
								<div className="flex justify-between items-start">
									<span className="text-gray-500">Full Name:</span>
									<span className="font-medium text-gray-900 text-right">{user.name}</span>
								</div>
								<div className="flex justify-between items-start">
									<span className="text-gray-500">Email Address:</span>
									<span className="font-medium text-gray-900 text-right underline underline-offset-2">{user.email}</span>
								</div>
								<div className="flex justify-between items-start">
									<span className="text-gray-500">Mobile number:</span>
									<span className="font-medium text-gray-900 text-right">1234567890</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-500">Status:</span>
									<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
										user.status === "verified" ? "bg-[#E8F8E5] text-[#10C300]" :
										user.status === "pending_verification" ? "bg-[#FFF8E5] text-[#FFB000]" :
										"bg-[#FEECEB] text-[#EE201C]"
									}`}>
										{user.status === "verified" ? "Verified" : 
										 user.status === "pending_verification" ? "Pending" : 
										 "Not Verified"}
									</span>
								</div>
								<div className="flex justify-between items-start">
									<span className="text-gray-500">Date of Birth:</span>
									<span className="font-medium text-gray-900 text-right">15th of February, 2009</span>
								</div>
								<div className="flex justify-between items-start">
									<span className="text-gray-500">Country:</span>
									<span className="font-medium text-gray-900 text-right">Nigeria</span>
								</div>
								<div className="flex justify-between items-start">
									<span className="text-gray-500">Registration date:</span>
									<span className="font-medium text-gray-900 text-right">
										{user.registeredDate ? new Date(user.registeredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
									</span>
								</div>
							</div>
						</div>

						<div className="h-[320px] bg-white border border-[#E5E7EB] rounded-2xl p-5">
							<h4 className="font-bold text-gray-900 mb-4">User's Wallet</h4>
							<div className="space-y-4 text-sm">
								<div>
									<span className="block text-gray-500 mb-1">Current Balance</span>
									<span className="text-2xl font-bold text-gray-900">₦ {user.wallet.toLocaleString()}</span>
								</div>
								<div className="flex justify-between items-start pt-2 border-t border-gray-200">
									<span className="text-gray-500">Last Top-up:</span>
									<span className="font-medium text-gray-900 text-right">2nd of August, 2025</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
