import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter, redirect } from "@tanstack/react-router";
import { Eye, PauseCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import NotificationIcon from "#/assets/NotificationIcon";
import { type Column, DataTable } from "#/components/DataTable";
import { ActionDropdown } from "../../components/ActionDropdown";
import { SendNoticeModal } from "../../components/SendNoticeModal";
import { UserProfileModal } from "../../components/UserProfileModal";
import { TimePeriodDropdown, type TimePeriodOption } from "../../components/TimePeriodDropdown";
import { type NewUser, type User, type UserProfile, userService } from "../../lib/users";
import { notificationService } from "../../lib/notifications";
import { getDateRangeForPeriod } from "../../lib/time-period";

import { useHasPermission } from "../../hooks/useCurrentUser";

export const Route = createFileRoute("/app/users")({
	beforeLoad: ({ context }) => {
		const admin = (context as any).admin;
		if (admin && admin.role !== "super_admin" && !admin.permissions?.includes("user_management")) {
			throw redirect({ to: "/app", replace: true });
		}
	},
	component: UsersPage,
});

type Tab = "all" | "recent" | "pending";

function UsersPage() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const hasSendNoticePerm = useHasPermission("send_notifications");
	const hasViewPlayerPerm = useHasPermission("view_player_details");
	const hasDeactivatePerm = useHasPermission("deactivate_account");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [sort, setSort] = useState<"asc" | "desc">("asc");
	const [activeTab, setActiveTab] = useState<Tab>("all");
	const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriodOption>("All");
	const [customRange, setCustomRange] = useState<{ start: string; end: string } | undefined>(undefined);
	const [showAddModal, setShowAddModal] = useState(false);
	const [newUser, setNewUser] = useState<NewUser>({
		name: "",
		email: "",
		country: "",
		mobileNumber: "",
	});

	const [actionDropdown, setActionDropdown] = useState<{
		user: User;
		top: number;
		right: number;
	} | null>(null);
const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(
	null,
);
	const [selectedProfileData, setSelectedProfileData] = useState<UserProfile | null>(null);
	const [isProfileLoading, setIsProfileLoading] = useState(false);
	const [noticeModalUser, setNoticeModalUser] = useState<User | null>(null);
	const [showGlobalNoticeModal, setShowGlobalNoticeModal] = useState(false);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = () => setActionDropdown(null);
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
}, []);

	const { fromDate, toDate } = useMemo(
		() => getDateRangeForPeriod(selectedTimePeriod, customRange, { output: "iso" }),
		[selectedTimePeriod, customRange],
	);

	useEffect(() => {
		// console.log("UsersPage: computed date range", { selectedTimePeriod, customRange, fromDate, toDate });
	}, [selectedTimePeriod, customRange, fromDate, toDate]);

	const {
		data: usersData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["users", page, limit, sort, activeTab, search, fromDate, toDate],
		queryFn: async () => {
			// console.log("UsersPage: calling listUsers with", { page, limit, sort, tab: activeTab, fromDate, toDate });
			const result = await userService.listUsers({
				page,
				limit,
				sort,
				tab: activeTab,
				search: search || undefined,
				fromDate,
				toDate,
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

	useEffect(() => {
		if (selectedProfileUser) {
			setIsProfileLoading(true);
			userService.getUserProfile(selectedProfileUser.id).then((result) => {
				setIsProfileLoading(false);
				if (result.success && result.data) {
					setSelectedProfileData(result.data);
				}
			});
		} else {
			setSelectedProfileData(null);
			setIsProfileLoading(false);
		}
	}, [selectedProfileUser]);

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
			router.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create user");
		},
	});

	const toggleSuspendMutation = useMutation({
		mutationFn: async (userId: string) => {
			const result = await userService.toggleUserSuspend(userId);
			if (!result.success) {
				throw new Error(result.error || "Failed to update user status");
			}
			return result;
		},
		onSuccess: (_, userId) => {
			const user = usersData?.users.find((u) => u.id === userId);
			const isReactivate = user?.suspended;
			toast.success(
				isReactivate ? "User reactivated successfully" : "User suspended successfully",
			);
			queryClient.invalidateQueries({ queryKey: ["users"] });
			router.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update user status");
		},
	});

	const columns: Column<User>[] = [
		{
			header: "User Id",
			accessor: "id",
		},
		{
			header: "Player Name",
			accessor: (user) => (
				<div
					className="flex items-center gap-3 min-w-0 cursor-pointer"
					onClick={() => setSelectedProfileUser(user)}
				>
					{/* <img
						src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
						alt="avatar"
						className="h-8 w-8 rounded-full bg-gray-100 object-cover shrink-0"
					/> */}
					<span
						className="font-medium text-sm text-gray-900 hover:text-primary transition-colors truncate"
						title={user.name}
					>
						{user.name}
					</span>
				</div>
			),
		},
		{
			header: "Email address",
			accessor: "email",
			cellClassName: "text-gray-500",
		},
		{
			header: "Registration Date",
			accessor: (user) =>
				user.registeredDate
					? new Date(user.registeredDate).toLocaleDateString()
					: "-",
			cellClassName: "text-gray-500",
		},
		{
			header: "Wallet Balance",
			accessor: (user) => `₦${user.wallet.toLocaleString()}`,
			cellClassName: "font-medium text-gray-900",
		},
		{
			header: "Status",
			accessor: (user) => (
				<span
					className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
						user.status === "verified"
							? "bg-[#E8F8E5] text-[#10C300]"
							: user.status === "pending_verification"
								? "bg-[#FFF8E5] text-[#FFB000]"
								: "bg-[#FEECEB] text-[#EE201C]"
					}`}
				>
					{user.status === "verified"
						? "Verified"
						: user.status === "pending_verification"
							? "Pending"
							: "Not Verified"}
				</span>
			),
		},
	];

	const users = usersData?.users ?? [];

	return (
		<div className="flex h-[calc(100vh-120px)] flex-1 flex-col overflow-hidden">
			<div className="flex shrink-0 flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h2 className="font-bold text-[46px] leading-none text-[#11142D]">
						All Users
					</h2>
					<p className="mt-3 text-base text-[#222]">
						Manage all your users and activities.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					{hasSendNoticePerm && <button
						onClick={() => setShowGlobalNoticeModal(true)}
						className="cursor-pointer flex h-12 items-center justify-center gap-x-3 rounded-full bg-[#F5F6F7] px-6 text-[#1A1A1A]"
					>
						<NotificationIcon height={"15"} width={"15"} color={"#053209"} />
						<span className="text-base">Send a Notice</span>
					</button>}

					<button
						type="button"
						onClick={() => setShowAddModal(true)}
						className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-accent px-6 py-2 font-medium text-white text-base hover:bg-accent/90"
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

			<div className="mt-8 mb-5 flex shrink-0 flex-col justify-between gap-4 lg:flex-row lg:items-center">
				<div className="overflow-x-auto custom-scrollbar lg:overflow-visible">
					<div className="flex min-w-max gap-8 border-gray-300 border-b">
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
								className={`cursor-pointer pb-3 font-medium text-base transition-colors ${
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

				<div className="flex items-center gap-3">
					<div className="relative">
						<input
							type="text"
							placeholder="Search"
							value={search}
							onChange={(e) => { setSearch(e.target.value); setPage(1); }}
							className="w-[352px] rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-9 text-sm focus:border-[#1BAA04] focus:outline-none focus:ring-1 focus:ring-[#1BAA04]"
						/>
						<Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
					</div>
						<TimePeriodDropdown
							value={selectedTimePeriod}
							onChange={(period, range) => {
								setSelectedTimePeriod(period);
								setCustomRange(range);
								setPage(1);
							}}
						/>
				</div>
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
					totalPages: usersData?.totalPages ?? 0,
					onPageChange: setPage,
					totalItems: usersData?.total ?? 0,
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
						...(hasViewPlayerPerm ? [{
							icon: <Eye className="w-4 h-4" />,
							label: "View profile",
							onClick: () => setSelectedProfileUser(actionDropdown.user),
						}] : []),
						...(hasSendNoticePerm ? [{
							icon: <NotificationIcon height={"14"} width={"14"} />,
							label: "Send a notification",
							onClick: () => setNoticeModalUser(actionDropdown.user),
						}] : []),
						...(hasDeactivatePerm ? [{
							icon: <PauseCircle className="w-4 h-4" />,
							label: actionDropdown.user.suspended ? "Reactivate" : "Suspend",
							onClick: () => {
								// console.log("Current user status:", actionDropdown.user.status);
								toggleSuspendMutation.mutate(actionDropdown.user.id);
								setActionDropdown(null);
							},
						}] : []),
					]}
				/>
			)}

			{/* Profile Modal */}
			{selectedProfileUser && (
				<UserProfileModal
					user={selectedProfileUser}
					profile={selectedProfileData || undefined}
					isLoading={isProfileLoading}
					onClose={() => setSelectedProfileUser(null)}
					onSendNotice={(user) => {
						setNoticeModalUser(user);
						setSelectedProfileUser(null);
					}}
					onSuspend={() => {
						if (selectedProfileUser) {
							toggleSuspendMutation.mutate(selectedProfileUser.id);
						}
						setSelectedProfileUser(null);
					}}
				/>
			)}

			{/* Send Notice Modal */}
			{(noticeModalUser || showGlobalNoticeModal) && (
				<SendNoticeModal
					user={noticeModalUser}
					availableUsers={usersData?.users ? usersData?.users : []}
					onClose={() => {
						setNoticeModalUser(null);
						setShowGlobalNoticeModal(false);
					}}
					onSubmit={async (data) => {
						if (noticeModalUser) {
							const result = await notificationService.sendNotification({
								title: data.title,
								message: data.message,
								userId: noticeModalUser.id,
							});
							if (result.success) {
								toast.success(`Notice sent to ${noticeModalUser.name}`);
							} else {
								toast.error(result.error || "Failed to send notice");
							}
						} else if (showGlobalNoticeModal && usersData?.users) {
							const userIds = usersData.users.map((u) => u.id);
							const result = await notificationService.sendNotificationToMultiple(
								data.title,
								data.message,
								userIds
							);
							if (result.success) {
								toast.success("Notice sent to all users");
							} else {
								toast.error(`Notice sent with ${result.errors.length} errors`);
							}
						}
					}}
				/>
			)}
		</div>
	);
}
