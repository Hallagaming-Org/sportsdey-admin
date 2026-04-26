import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Eye, PauseCircle, X, AlertTriangle, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FilterIcon from "@/logo/filter.svg?react";
import SortIcon from "@/logo/sort.svg?react";
import { type NewUser, type User, userService } from "../../lib/users";
import { DataTable, type Column } from "#/components/DataTable";
import { IoFilter } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import { LuMessageSquareDot } from "react-icons/lu";

export const Route = createFileRoute("/app/users")({
	component: UsersPage,
});

type Tab = "all" | "recent" | "pending";

function UsersPage() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [sort, setSort] = useState<"asc" | "desc">("asc");
	const [activeTab, setActiveTab] = useState<Tab>("all");
	const [showAddModal, setShowAddModal] = useState(false);
	const [newUser, setNewUser] = useState<NewUser>({
		name: "",
		email: "",
		country: "",
		mobileNumber: "",
	});

	const [actionDropdown, setActionDropdown] = useState<{ user: User; top: number; right: number } | null>(null);
	const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);
	const [noticeModalUser, setNoticeModalUser] = useState<User | null>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = () => setActionDropdown(null);
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	const {
		data: usersData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["users", page, limit, sort, activeTab, search],
		queryFn: async () => {
			const result = await userService.listUsers({
				page,
				limit,
				sort,
				tab: activeTab,
				search: search || undefined,
			});
			if (!result.success) {
				throw new Error(result.error || "Failed to fetch users");
			}
			return result.data;
		},
	});

	useEffect(() => {
		if (error) {
			toast.error(error.message || "Failed to fetch users");
		}
	}, [error]);

	const createUserMutation = useMutation({
		mutationFn: async (data: NewUser) => {
			const result = await userService.createUser(data);
			if (!result.success) {
				throw new Error(result.error || "Failed to create user");
			}
			return result.data;
		},
		onSuccess: () => {
			toast.success("User created successfully");
			setShowAddModal(false);
			setNewUser({ name: "", email: "", country: "", mobileNumber: "" });
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create user");
		},
	});

	const dummyUsers: User[] = [
		{ id: "USR001", name: "George Jones", email: "george@example.com", wallet: 3000000, status: "verified", registeredDate: Date.now() },
		{ id: "USR002", name: "Robert Fox", email: "robert@example.com", wallet: 1200000, status: "pending_verification", registeredDate: Date.now() },
		{ id: "USR003", name: "Savannah Nguyen", email: "savannah@example.com", wallet: 500000, status: "not_verified", registeredDate: Date.now() },
		{ id: "USR004", name: "Leslie Alexander", email: "leslie@example.com", wallet: 4100000, status: "verified", registeredDate: Date.now() },
		{ id: "USR005", name: "Jenny Wilson", email: "jenny@example.com", wallet: 1500000, status: "verified", registeredDate: Date.now() },
		{ id: "USR006", name: "Courtney Henry", email: "courtney@example.com", wallet: 2200000, status: "pending_verification", registeredDate: Date.now() },
		{ id: "USR007", name: "Eleanor Pena", email: "eleanor@example.com", wallet: 900000, status: "verified", registeredDate: Date.now() },
		{ id: "USR008", name: "Arlene McCoy", email: "arlene@example.com", wallet: 800000, status: "not_verified", registeredDate: Date.now() },
		{ id: "USR009", name: "Cody Fisher", email: "cody@example.com", wallet: 4500000, status: "verified", registeredDate: Date.now() },
		{ id: "USR010", name: "Coady Gakpo", email: "coady@example.com", wallet: 4500000, status: "verified", registeredDate: Date.now() },
		{ id: "USR011", name: "Bessie Cooper", email: "bessie@example.com", wallet: 1100000, status: "pending_verification", registeredDate: Date.now() },
	];

	const isUsingDummyData = !usersData?.users || usersData.users.length === 0;
	
	const users = isUsingDummyData 
		? dummyUsers.slice((page - 1) * limit, page * limit) 
		: usersData.users;
		
	const total = isUsingDummyData ? dummyUsers.length : usersData.total;
	const totalPages = Math.ceil(total / limit);

	const columns: Column<User>[] = [
		{ 
			header: "User Id", 
			accessor: "id" 
		},
		{ 
			header: "Player Name", 
			accessor: (user) => (
				<div 
					className="flex items-center gap-3 min-w-0 cursor-pointer"
					onClick={() => setSelectedProfileUser(user)}
				>
					<img 
						src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
						alt="avatar" 
						className="h-8 w-8 rounded-full bg-gray-100 object-cover flex-shrink-0" 
					/>
					<span className="font-medium text-sm text-gray-900 hover:text-primary transition-colors truncate" title={user.name}>{user.name}</span>
				</div>
			)
		},
		{ 
			header: "Email address", 
			accessor: "email",
			cellClassName: "text-gray-500"
		},
		{ 
			header: "Registration Date", 
			accessor: (user) => user.registeredDate ? new Date(user.registeredDate).toLocaleDateString() : "-",
			cellClassName: "text-gray-500"
		},
		{ 
			header: "Wallet Balance", 
			accessor: (user) => `₦${user.wallet.toLocaleString()}`,
			cellClassName: "font-medium text-gray-900"
		},
		{ 
			header: "Status", 
			accessor: (user) => (
				<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
					user.status === "verified" ? "bg-[#E8F8E5] text-[#10C300]" :
					user.status === "pending_verification" ? "bg-[#FFF8E5] text-[#FFB000]" :
					"bg-[#FEECEB] text-[#EE201C]"
				}`}>
					{user.status === "verified" ? "Verified" : 
					 user.status === "pending_verification" ? "Pending" : 
					 "Not Verified"}
				</span>
			)
		}
	];

	return (
		<div className="flex h-[calc(100vh-120px)]  flex-1 flex-col space-y-6 overflow-hidden">
			<div className="flex shrink-0 flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h2 className="font-bold text-2xl text-gray-900">All users</h2>
					<p className="text-gray-600">Manage all your users and activities</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<button
						onClick={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}
						className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50"
					>
						<SortIcon className="h-3 w-3" />
						Sort
					</button>
					<button className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50">
						<FilterIcon className="h-3 w-3" />
						Filter
					</button>
					<button
						type="button"
						onClick={() => setShowAddModal(true)}
						className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent px-4 py-2 font-medium text-white text-sm hover:bg-accent/90"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Add new user
					</button>
				</div>
			</div>

			<div className="flex shrink-0 flex-col justify-between gap-4 lg:flex-row lg:items-center">
				<div className="overflow-x-auto custom-scrollbar lg:overflow-visible">
					<div className="flex gap-8 border-b border-gray-300 min-w-max px-4 lg:px-0">
						{[
							{ key: "all", label: "All Users" },
							{ key: "recent", label: "Recently registered" },
							{ key: "pending", label: "Pending verification" },
						].map((tab) => (
							<button
								type="button"
								key={tab.key}
								onClick={() => {
									setActiveTab(tab.key as Tab);
									setPage(1);
								}}
								className={`cursor-pointer pb-3 font-medium text-sm transition-colors ${
									activeTab === tab.key
										? "border-b-2 border-accent text-accent"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>
				</div>

				{!error && (
					<form
						className="relative flex items-center gap-3 flex-wrap lg:flex-nowrap"
						onSubmit={(e) => {
							e.preventDefault();
							setPage(1);
							queryClient.invalidateQueries({ queryKey: ["users"] });
						}}
					>
						<div className="relative w-72 lg:w-80">
							<input
								type="text"
								placeholder="Search"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full rounded-full border border-[#D0D5DD] bg-gray-50 py-2 pr-4 pl-10 shadow-md focus:border-primary focus:outline-none focus:ring-primary"
							/>
							<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
						</div>
						<button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer border border-[#D0D5DD] whitespace-nowrap">
							<span className="hidden lg:block">Time periods</span>
							<IoFilter className="h-3.5 w-3.5" />
						</button>
					</form>
				)}
			</div>

			<DataTable
				data={users}
				isLoading={isLoading}
				columns={columns}
				maxHeight="100%"
				onActionClick={(user, e) => {
					e.stopPropagation();
					e.nativeEvent.stopImmediatePropagation();
					const rect = e.currentTarget.getBoundingClientRect();
					setActionDropdown({
						user,
						top: rect.bottom + window.scrollY,
						right: window.innerWidth - rect.right,
					});
				}}
				emptyMessage="No user found"
				pagination={{
					currentPage: page,
					totalPages,
					onPageChange: setPage,
					totalItems: total,
					itemsPerPage: limit,
				}}
			/>

			{showAddModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onClick={() => setShowAddModal(false)}
				>
					<div
						className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mb-4 flex items-center justify-between">
							<h3 className="font-bold text-xl text-gray-900">Add new user</h3>
							<button
								type="button"
								onClick={() => setShowAddModal(false)}
								className="text-gray-500 hover:text-gray-900"
							>
								<svg
									className="h-5 w-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								createUserMutation.mutate(newUser);
							}}
							className="space-y-4"
						>
							<div>
								<label className="block font-medium text-gray-900 text-sm">
									Name
								</label>
								<input
									type="text"
									value={newUser.name}
									onChange={(e) =>
										setNewUser({ ...newUser, name: e.target.value })
									}
									required
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">
									Email
								</label>
								<input
									type="email"
									value={newUser.email}
									onChange={(e) =>
										setNewUser({ ...newUser, email: e.target.value })
									}
									required
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">
									Country (optional)
								</label>
								<input
									type="text"
									value={newUser.country || ""}
									onChange={(e) =>
										setNewUser({ ...newUser, country: e.target.value })
									}
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">
									Mobile number (optional)
								</label>
								<input
									type="tel"
									value={newUser.mobileNumber || ""}
									onChange={(e) =>
										setNewUser({ ...newUser, mobileNumber: e.target.value })
									}
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div className="flex justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-900 hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={createUserMutation.isPending}
									className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent/90 disabled:opacity-50"
								>
									{createUserMutation.isPending ? "Adding..." : "Add user"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{actionDropdown && (
				<div
					className="fixed z-100 w-52 rounded-lg bg-white shadow-lg border border-gray-100 py-1"
					style={{ top: actionDropdown.top + 4, right: actionDropdown.right }}
					onClick={(e) => {
						e.stopPropagation();
						e.nativeEvent.stopImmediatePropagation();
					}}
				>
					<button
						className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
						onClick={() => {
							setSelectedProfileUser(actionDropdown.user);
							setActionDropdown(null);
						}}
					>
						<Eye className="w-4 h-4" />
						View profile
					</button>
					<button
						className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
						onClick={() => {
							setNoticeModalUser(actionDropdown.user);
							setActionDropdown(null);
						}}
					>
						<LuMessageSquareDot className="w-4 h-4"/>
						Send a notification
					</button>
					<button
						className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
						onClick={() => {
							// Handle suspend logic
							setActionDropdown(null);
						}}
					>
						<PauseCircle className="w-4 h-4" />
						Suspend/Reactivate
					</button>
				</div>
			)}

			{/* Profile Modal */}
			{selectedProfileUser && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
					onClick={() => setSelectedProfileUser(null)}
				>
					<div
						className="w-full max-w-[600px] rounded-[20px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between p-6 border-b border-gray-100">
							<div className="flex items-center gap-2">
								<div className="p-2 bg-[#E8F8E5] rounded-full text-[#10C300]">
									<Eye className="w-5 h-5" />
								</div>
								<h3 className="font-bold text-xl text-gray-900">User's Profile</h3>
							</div>
							<button
								type="button"
								onClick={() => setSelectedProfileUser(null)}
								className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						
						<div className="overflow-y-auto custom-scrollbar p-6 space-y-6 flex-1">
							{/* Mock Suspend Warning */}
							{selectedProfileUser.status === 'not_verified' && (
								<div className="flex items-center gap-2 text-[#EE201C] bg-[#FEECEB] px-4 py-3 rounded-lg text-sm">
									<AlertTriangle className="w-4 h-4" />
									<p>This account has been suspended due to violation of the system rules and regulations.</p>
								</div>
							)}

							<div className="flex flex-col items-center justify-center pt-2">
								<img 
									src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProfileUser.name}`} 
									alt="avatar" 
									className="h-24 w-24 rounded-full bg-gray-100 object-cover shadow-sm mb-3" 
								/>
								<h2 className="text-xl font-bold text-gray-900">{selectedProfileUser.name}</h2>
								<p className="text-[#10C300] font-medium text-sm flex items-center gap-1.5 mt-1">
									<span className="w-2 h-2 rounded-full bg-[#10C300]"></span>
									Online
								</p>
								<p className="text-gray-500 text-sm mt-1">
									Joined on {selectedProfileUser.registeredDate ? new Date(selectedProfileUser.registeredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
								</p>

								<div className="flex items-center gap-3 mt-6">
									<button 
										onClick={() => {
											setNoticeModalUser(selectedProfileUser);
											setSelectedProfileUser(null);
										}}
										className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
									>
										<MessageCircle className="w-4 h-4" />
										Send a notice
									</button>
									<button className="inline-flex items-center gap-2 px-4 py-2 bg-[#10C300] rounded-full text-sm font-medium text-white hover:bg-[#0ea800] transition-colors cursor-pointer shadow-[0_4px_14px_0_rgba(16,195,0,0.39)]">
										<FaWhatsapp className="w-4 h-4" />
										Contact User
									</button>
									<button className="inline-flex items-center gap-2 px-4 py-2 border border-[#FEECEB] bg-[#FEECEB] rounded-full text-sm font-medium text-[#EE201C] hover:bg-red-100 transition-colors cursor-pointer">
										<PauseCircle className="w-4 h-4" />
										Suspended
									</button>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
								<div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5">
									<h4 className="font-bold text-gray-900 mb-4">Personal Details</h4>
									<div className="space-y-4 text-sm">
										<div className="flex justify-between items-start">
											<span className="text-gray-500">Full Name:</span>
											<span className="font-medium text-gray-900 text-right">{selectedProfileUser.name}</span>
										</div>
										<div className="flex justify-between items-start">
											<span className="text-gray-500">Email Address:</span>
											<span className="font-medium text-gray-900 text-right underline underline-offset-2">{selectedProfileUser.email}</span>
										</div>
										<div className="flex justify-between items-start">
											<span className="text-gray-500">Mobile number:</span>
											<span className="font-medium text-gray-900 text-right">1234567890</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-gray-500">Status:</span>
											<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
												selectedProfileUser.status === "verified" ? "bg-[#E8F8E5] text-[#10C300]" :
												selectedProfileUser.status === "pending_verification" ? "bg-[#FFF8E5] text-[#FFB000]" :
												"bg-[#FEECEB] text-[#EE201C]"
											}`}>
												{selectedProfileUser.status === "verified" ? "Verified" : 
												 selectedProfileUser.status === "pending_verification" ? "Pending" : 
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
												{selectedProfileUser.registeredDate ? new Date(selectedProfileUser.registeredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
											</span>
										</div>
									</div>
								</div>

								<div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 h-fit">
									<h4 className="font-bold text-gray-900 mb-4">User's Wallet</h4>
									<div className="space-y-4 text-sm">
										<div>
											<span className="block text-gray-500 mb-1">Current Balance</span>
											<span className="text-2xl font-bold text-gray-900">₦ {selectedProfileUser.wallet.toLocaleString()}</span>
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
			)}

			{/* Send Notice Modal */}
			{noticeModalUser && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
					onClick={() => setNoticeModalUser(null)}
				>
					<div
						className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mb-6 flex items-center justify-between">
							<h3 className="font-bold text-2xl text-gray-900 tracking-tight">Send a Notice</h3>
							<button
								type="button"
								onClick={() => setNoticeModalUser(null)}
								className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer border border-gray-200"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								// Submit logic
								setNoticeModalUser(null);
							}}
							className="space-y-5"
						>
							<div>
								<label className="block font-medium text-gray-900 mb-1.5 text-sm">
									Send to
								</label>
								<select
									className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none transition-colors"
									defaultValue="user"
								>
									<option value="user">Specific User ({noticeModalUser.name})</option>
									<option value="all">All Users</option>
								</select>
							</div>
							<div>
								<label className="block font-medium text-gray-900 mb-1.5 text-sm">
									Author name
								</label>
								<input
									type="text"
									placeholder="FullName"
									className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-400"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 mb-1.5 text-sm">
									Message
								</label>
								<textarea
									placeholder="Type your message here..."
									rows={4}
									className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none placeholder:text-gray-400"
								/>
							</div>
							<div className="pt-2">
								<button
									type="submit"
									className="w-full rounded-full bg-[#10C300] px-4 py-3.5 font-bold text-white hover:bg-[#0ea800] transition-colors shadow-[0_4px_14px_0_rgba(16,195,0,0.39)] cursor-pointer"
								>
									Upload
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
