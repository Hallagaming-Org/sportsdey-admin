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
	const buttonItems = [
		{ 
			label: "Send a notice", 
			icon: <MessageCircle className="w-4 h-4" />, 
			onClick: () => onSendNotice(user),
			className: "bg-[#E0E8F980] text-gray-700"
		},
		{ 
			label: "Contact User", 
			icon: <FaWhatsapp className="w-4 h-4" />, 
			onClick: () => {},
			className: "bg-[#10C300] text-white hover:bg-[#0ea800] shadow-[0_4px_14px_0_rgba(16,195,0,0.39)]"
		},
		{ 
			label: "Suspended", 
			icon: <PauseCircle className="w-4 h-4" />, 
			onClick: () => onSuspend?.(user),
			className: "bg-[#FEECEB] border-[#FEECEB] text-[#EE201C] hover:bg-red-100"
		}
	]
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
				
				<div className="overflow-y-auto custom-scrollbar p-6 space-y-6 flex-1">
					{/* Mock Suspend Warning */}
					{user.status === 'not_verified' && (
						<div className="flex items-center gap-2 text-[#EE201C] bg-[#FEECEB] px-4 py-3 rounded-lg text-sm">
							<AlertTriangle className="w-4 h-4" />
							<p>This account has been suspended due to violation of the system rules and regulations.</p>
						</div>
					)}

					<div className="flex flex-col items-center justify-center pt-2">
						{user.image || user.photo ? (
							<img 
								src={user.image || user.photo} 
								alt="avatar" 
								className="h-24 w-24 rounded-full bg-gray-200 object-cover shadow-sm mb-3" 
							/>
						) : (
							<div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center shadow-sm mb-3">
								<CgProfile className="h-12 w-12 text-gray-400" />
							</div>
						)}
						<h2 className="text-base font-bold text-gray-900">{user.name}</h2>
						<p className="text-[#10C300] font-medium text-xs flex items-center gap-1.5 mt-1">
							<span className="w-2 h-2 rounded-full bg-[#10C300]"></span>
							Online
						</p>
						<p className="text-gray-500 text-xs mt-.5">
							Joined on {user.registeredDate ? new Date(user.registeredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
						</p>

						<div className="flex items-center gap-3 mt-6">
							{buttonItems.map((btn, idx) => (
								<button 
									key={idx}
									onClick={btn.onClick}
									className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${btn.className}`}
								>
									{btn.icon}
									{btn.label}
								</button>
							))}
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="bg-white h-[320px] rounded-2xl p-5">
							<h4 className="font-bold text-gray-900 mb-4">Personal Details</h4>
							<div className="space-y-4 text-sm">
								<div className="flex justify-between items-start">
									<span className="text-gray-500">Full Name:</span>
									<span className="font-normal text-gray-900 text-right">{user.name}</span>
								</div>
								<div className="flex justify-between items-start">
									<span className="text-gray-500">Email Address:</span>
									<span className="font-normal text-gray-900 text-right underline underline-offset-2">{user.email}</span>
								</div>
								<div className="flex justify-between items-start">
									<span className="text-gray-500">Mobile number:</span>
									<span className="font-normal text-gray-900 text-right">1234567890</span>
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
									<span className="font-normal text-gray-900 text-right">15th of February, 2009</span>
								</div>
								<div className="flex justify-between items-start">
									<span className="text-gray-500">Country:</span>
									<span className="font-normal text-gray-900 text-right">Nigeria</span>
								</div>
								<div className="flex justify-between items-start">
									<span className="text-gray-500">Registration date:</span>
									<span className="font-normal text-gray-900 text-right">
										{user.registeredDate ? new Date(user.registeredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
									</span>
								</div>
							</div>
						</div>

						<div className="h-[320px] bg-white rounded-2xl p-5">
							<h4 className="font-bold text-gray-900 mb-4">User's Wallet</h4>
							<div className="space-y-4 text-sm">
								<div>
									<span className="block text-gray-500 mb-1">Current Balance</span>
									<span className="text-2xl font-bold text-gray-900">₦ {user.wallet.toLocaleString()}</span>
								</div>
								<div className="flex justify-between items-start pt-2">
									<span className="text-gray-500">Last Top-up:</span>
									<span className="font-normal text-gray-900 text-right">2nd of August, 2025</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
