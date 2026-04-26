import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Eye, PauseCircle, X, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FilterIcon from "@/logo/filter.svg?react";
import SortIcon from "@/logo/sort.svg?react";
import { type NewUser, type User, userService } from "../../lib/users";
import { DataTable, type Column } from "#/components/DataTable";
import { IoFilter } from "react-icons/io5";
import { LuMessageSquareDot } from "react-icons/lu";
import { ActionDropdown } from "../../components/ActionDropdown";
import { UserProfileModal } from "../../components/UserProfileModal";
import { SendNoticeModal } from "../../components/SendNoticeModal";

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
						className="h-8 w-8 rounded-full bg-gray-100 object-cover shrink-0" 
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
				<ActionDropdown
					top={actionDropdown.top}
					right={actionDropdown.right}
					onClose={() => setActionDropdown(null)}
					items={[
						{
							icon: <Eye className="w-4 h-4" />,
							label: "View profile",
							onClick: () => setSelectedProfileUser(actionDropdown.user),
						},
						{
							icon: <LuMessageSquareDot className="w-4 h-4" />,
							label: "Send a notification",
							onClick: () => setNoticeModalUser(actionDropdown.user),
						},
						{
							icon: <PauseCircle className="w-4 h-4" />,
							label: "Suspend/Reactivate",
							onClick: () => {
								// Handle suspend logic
							},
						},
					]}
				/>
			)}

			{/* Profile Modal */}
			{selectedProfileUser && (
				<UserProfileModal
					user={selectedProfileUser}
					onClose={() => setSelectedProfileUser(null)}
					onSendNotice={(user) => {
						setNoticeModalUser(user);
						setSelectedProfileUser(null);
					}}
					onSuspend={() => {
						// Handle suspend logic
					}}
				/>
			)}

			{/* Send Notice Modal */}
			{noticeModalUser && (
				<SendNoticeModal
					user={noticeModalUser}
					onClose={() => setNoticeModalUser(null)}
					onSubmit={(data) => {
						console.log("Sending notice:", data);
						toast.success(`Notice sent to ${noticeModalUser.name}`);
					}}
				/>
			)}
		</div>
	);
}
