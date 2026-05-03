import { X, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { User } from "../lib/users";

interface SendNoticeModalProps {
	user?: User | null;
	availableUsers?: User[];
	onClose: () => void;
	onSubmit?: (data: { sendTo: string | string[]; authorName?: string; message: string }) => void;
}

export function SendNoticeModal({ user, availableUsers = [], onClose, onSubmit }: SendNoticeModalProps) {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const allSelected = availableUsers.length > 0 && selectedUsers.length === availableUsers.length;

	const toggleUser = (userId: string) => {
		if (selectedUsers.includes(userId)) {
			setSelectedUsers(selectedUsers.filter(id => id !== userId));
		} else {
			setSelectedUsers([...selectedUsers, userId]);
		}
	};

	const toggleSelectAll = () => {
		if (allSelected) {
			setSelectedUsers([]);
		} else {
			setSelectedUsers(availableUsers.map(u => u.id));
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
			onClick={onClose}
		>
			<div
				className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-6 flex items-center justify-between">
					<h3 className="font-bold text-2xl text-gray-900 tracking-tight">Send a Notice</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-full transition-colors cursor-pointer border border-[#03002B]"
					>
						<X className="h-4 w-4 text-[#03002B]" />
					</button>
				</div>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						const formData = new FormData(e.currentTarget);
						const sendTo = user ? user.id : (allSelected ? "all" : selectedUsers);
						
						if (!user && selectedUsers.length === 0) {
							// Form validation: they need to select at least one user
							return;
						}

						onSubmit?.({
							sendTo,
							authorName: formData.get("authorName") as string,
							message: formData.get("message") as string,
						});
						onClose();
					}}
					className="space-y-5"
				>
					<div>
						<label className="block font-medium text-gray-900 mb-1.5 text-sm">
							Send to
						</label>
						{user ? (
							<div className="w-full rounded-xl bg-[#F9F9F9] px-4 py-3 text-gray-900 border border-gray-200">
								{user.name} <span className="text-gray-500 text-sm">({user.email})</span>
							</div>
						) : (
							<div className="relative" ref={dropdownRef}>
								<div 
									className="w-full cursor-pointer flex items-center justify-between rounded-xl bg-[#F9F9F9] px-4 py-3 text-[#687083] focus:outline-none transition-colors border border-transparent"
									onClick={() => setIsDropdownOpen(!isDropdownOpen)}
								>
									<span className="truncate">
										{selectedUsers.length === 0 
											? "Select users" 
											: allSelected 
												? "All Users" 
												: `${selectedUsers.length} user(s) selected`}
									</span>
									<ChevronDown className={`h-4 w-4 text-[#687083] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
								</div>

								{isDropdownOpen && (
									<div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto custom-scrollbar">
										<div 
											className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
											onClick={toggleSelectAll}
										>
											<div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${allSelected ? 'bg-[#10C300] border-[#10C300]' : 'border-gray-300'}`}>
												{allSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
											</div>
											<span className="font-medium text-gray-900 text-sm">Select All Users</span>
										</div>
										{availableUsers.map((u) => {
											const isSelected = selectedUsers.includes(u.id);
											return (
												<div 
													key={u.id}
													className="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
													onClick={() => toggleUser(u.id)}
												>
													<div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${isSelected ? 'bg-[#10C300] border-[#10C300]' : 'border-gray-300'}`}>
														{isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
													</div>
													<div className="flex items-center gap-2">
														<img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt="" className="w-6 h-6 rounded-full bg-gray-100" />
														<span className="text-gray-700 text-sm">{u.name}</span>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						)}
					</div>
					<div>
						<label className="block font-medium text-gray-900 mb-1.5 text-sm">
							Message
						</label>
						<textarea
							name="message"
							placeholder="Type your message here..."
							rows={4}
							className="w-full rounded-xl bg-[#F9F9F9] px-4 py-3 text-gray-900 focus:outline-none transition-colors resize-none placeholder:text-gray-400 placeholder:text-xs"
							required
						/>
					</div>
					<div className="flex justify-center pt-2">
						<button
							type="submit"
							className="w-[240px] rounded-full bg-[#10C300] h-12 font-medium text-white hover:bg-[#0ea800] transition-colors shadow-[0_4px_14px_0_rgba(16,195,0,0.39)] cursor-pointer"
						>
							Upload
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
