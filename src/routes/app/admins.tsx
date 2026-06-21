import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, EyeOff, LogOut, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable, type Column } from "#/components/DataTable";
import { ActionDropdown } from "#/components/ActionDropdown";
import NotificationIcon from "#/assets/NotificationIcon";
import SuccessIndicator from "#/assets/SuccessIndicator.png";
import { AdminProfileModal } from "#/components/AdminProfileModal";
import { SendNoticeModal } from "#/components/SendNoticeModal";
import { Input } from "#/components/Input";
import type { User } from "#/lib/users";
import { notificationService } from "#/lib/notifications";
import { adminAuth } from "#/lib/auth";
import { TimePeriodFilter, type TimePeriod } from "#/components/TimePeriodFilter";
import { useCurrentUser } from "#/hooks/useCurrentUser";
export const Route = createFileRoute("/app/admins")({
	beforeLoad: ({ context }) => {
		const admin = (context as any).admin;
		if (admin && admin.role !== "super_admin" && !admin.permissions?.includes("view_other_admins")) {
			throw redirect({ to: "/app", replace: true });
		}
	},
	component: AdminsPage,
});

type Tab = "all" | "support" | "csr";

export interface AdminUser {
	id: string;
	name: string;
	email: string;
	dateAdded: number;
	role: string;
	avatar?: string;
	mobileNumber?: string | null;
	permissions?: string[];
}

function AdminsPage() {
	const queryClient = useQueryClient();
	const currentUser = useCurrentUser();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [activeTab, setActiveTab] = useState<Tab>("all");
	const [selectedTimePeriod, setSelectedTimePeriod] =
		useState<TimePeriod>("All");
	const [customRange, setCustomRange] = useState<any>();
	const [showAddModal, setShowAddModal] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [newAdmin, setNewAdmin] = useState({
		name: "",
		email: "",
		role: "",
		password: "",
	});
	const [showPassword, setShowPassword] = useState(false);

	const [actionDropdown, setActionDropdown] = useState<{ user: AdminUser; top: number; right: number } | null>(null);
	const [selectedProfileAdmin, setSelectedProfileAdmin] = useState<AdminUser | null>(null);
	const [noticeModalAdmin, setNoticeModalAdmin] = useState<AdminUser | null>(null);
	const [showGlobalNoticeModal, setShowGlobalNoticeModal] = useState(false);
	
	const handleCreateAdmin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newAdmin.role) {
			toast.error("Please select a role");
			return;
		}
		try {
			await adminAuth.createAdmin({
				email: newAdmin.email,
				password: newAdmin.password,
				name: newAdmin.name,
				role: newAdmin.role === "CSR Admin" ? "csr-admin" : "super_admin",
			});
			
			toast.success("Admin created successfully");
			setShowAddModal(false);
			setShowSuccessModal(true);
			setNewAdmin({ name: "", email: "", role: "", password: "" });
			queryClient.invalidateQueries({ queryKey: ["admins-list"] });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to create admin. Please try again.");
		}
	};
	
	useEffect(() => {
		const handleClickOutside = () => setActionDropdown(null);
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	const { data: rawAdmins = [], isLoading, error } = useQuery({
		queryKey: ["admins-list"],
		queryFn: () => adminAuth.listAdmins(),
	});

	const allAdmins: AdminUser[] = rawAdmins.map((admin) => ({
		id: admin.id,
		name: admin.name,
		email: admin.email,
		dateAdded: admin.createdAt ? new Date(admin.createdAt).getTime() : 0,
		role: admin.role === "super_admin" ? "Super Admin" : admin.role === "csr-admin" ? "CSR Admin" : "Support Admin",
		avatar: admin.image || undefined,
		mobileNumber: admin.mobileNumber,
		permissions: admin.permissions,
	}));

	const filteredAdmins = allAdmins.filter(admin => {
		if (activeTab === "support") return admin.role === "Support Admin";
		if (activeTab === "csr") return admin.role === "CSR Admin";
		return true;
	}).filter(admin => 
		search ? admin.name.toLowerCase().includes(search.toLowerCase()) || admin.email.toLowerCase().includes(search.toLowerCase()) : true
	).filter(admin => {
		if (selectedTimePeriod === "All") return true;
		
		const adminDate = new Date(admin.dateAdded);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (selectedTimePeriod === "Today") {
			return adminDate >= today;
		}
		if (selectedTimePeriod === "Yesterday") {
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);
			return adminDate >= yesterday && adminDate < today;
		}
		if (selectedTimePeriod === "Last week") {
			const lastWeek = new Date(today);
			lastWeek.setDate(lastWeek.getDate() - 7);
			return adminDate >= lastWeek;
		}
		if (selectedTimePeriod === "Last month") {
			const lastMonth = new Date(today);
			lastMonth.setMonth(lastMonth.getMonth() - 1);
			return adminDate >= lastMonth;
		}
		if (selectedTimePeriod === "Custom" && customRange?.start && customRange?.end) {
			const start = new Date(customRange.start);
			start.setHours(0, 0, 0, 0);
			const end = new Date(customRange.end);
			end.setHours(23, 59, 59, 999);
			return adminDate >= start && adminDate <= end;
		}

		return true;
	});

	const admins = filteredAdmins.slice((page - 1) * limit, page * limit);
	const total = filteredAdmins.length;
	const totalPages = Math.ceil(total / limit);

	const mapAdminToUser = (admin: AdminUser): User => ({
		id: admin.id,
		name: admin.name,
		email: admin.email,
		status: "verified",
		wallet: 0,
		registeredDate: admin.dateAdded,
	});

	const columns: Column<AdminUser>[] = [
		{ 
			header: "User ID", 
			accessor: "id" 
		},
		{ 
			header: "Admin Name", 
			accessor: (admin) => (
				<div 
					className="flex items-center gap-3 min-w-0 cursor-pointer"
				>
					<img 
						src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.name}`} 
						alt="avatar" 
						className="h-8 w-8 rounded-full bg-gray-100 object-cover shrink-0" 
					/>
					<span className="font-medium text-sm text-gray-900 hover:text-primary transition-colors truncate" title={admin.name}>{admin.name}</span>
				</div>
			)
		},
		{ 
			header: "Email address", 
			accessor: "email",
			cellClassName: "text-gray-500"
		},
		{ 
			header: "Date added", 
			accessor: (admin) => admin.dateAdded ? new Date(admin.dateAdded).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-",
			cellClassName: "text-gray-500"
		},
		{ 
			header: "Role", 
			accessor: "role",
			cellClassName: "text-gray-500"
		}
	];

	return (
		<div className="flex h-[calc(100vh-120px)]  flex-1 flex-col space-y-6 overflow-hidden">
			<div className="flex shrink-0 flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h2 className="font-bold text-2xl text-gray-900">Admin Panel/Other Admins</h2>
					<p className="text-gray-600">Manage all admin access and activities</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
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
							{ key: "all", label: "All admins" },
							{ key: "support", label: "Support Admins" },
							{ key: "csr", label: "CSR Admin" },
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

				<form
					className="relative flex items-center gap-3 flex-wrap lg:flex-nowrap"
					onSubmit={(e) => {
						e.preventDefault();
						setPage(1);
					}}
				>
					<div className="flex items-center relative w-[354px] h-11">
						<Input
							type="text"
							placeholder="Search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="rounded-full border border-[#D0D5DD] bg-gray-50 py-2 pr-4 pl-10 placeholder:text-[#667085] text-gray-700"
						/>
						<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
					</div>
					
					<TimePeriodFilter
								onFilterChange={(period, range) => {
									setSelectedTimePeriod(period);
									setCustomRange(range);
									setPage(1);
								}}
								buttonClassName="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
							/>
				</form>
			</div>

			<DataTable
				data={admins}
				columns={columns}
				maxHeight="100%"
				isLoading={isLoading}
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
				emptyMessage={error ? "Failed to load admins" : "No admin found"}
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
								className="text-gray-500 w-[39px] h-[39px] flex items-center justify-center hover:text-gray-900 rounded-full border border-[#03002B] cursor-pointer"
							>
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<form
							onSubmit={handleCreateAdmin}
							className="space-y-4"
						>
							<div>
								<label className="block font-medium text-gray-900 text-sm">Name</label>
								<Input
									type="text"
									value={newAdmin.name}
									onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
									required
									className="mt-1"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">Email</label>
								<Input
									type="email"
									value={newAdmin.email}
									onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
									required
									className="mt-1"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">Role</label>
								<select
									value={newAdmin.role}
									onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
									className="mt-1 w-full h-13 text-sm rounded-md bg-[#F9F9F9] px-3 pr-10 py-2 text-gray-900 focus:outline-none placeholder:text-gray-500 bg-[position:right_1rem_center]"
								>	
									<option value="" className="text-gray-900">choose a role</option>
									<option value="Support Admin" className="text-gray-900">Support Admin</option>
									<option value="CSR Admin" className="text-gray-900">CSR Admin</option>
								</select>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">Password</label>
								<div className="relative mt-1">
									<Input
										type={showPassword ? "text" : "password"}
										value={newAdmin.password}
										onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
										required
										className="pr-10"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none flex items-center justify-center cursor-pointer"
									>
										{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>
							</div>
							<div className="flex justify-center gap-3 pt-2">
								
								<button
									type="submit"
									className="w-[240px] h-12 rounded-full text-sm bg-accent px-4 py-2 font-medium text-white hover:bg-accent/90"
								>
									Send invite
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
							label: "View admin",
							onClick: async () => {
								try {
									const adminDetails = await adminAuth.getAdmin(actionDropdown.user.id);
									setSelectedProfileAdmin({
										id: adminDetails.id,
										name: adminDetails.name,
										email: adminDetails.email,
										dateAdded: adminDetails.createdAt ? new Date(adminDetails.createdAt).getTime() : 0,
										role: adminDetails.role === "super_admin" ? "Super Admin" : adminDetails.role === "csr-admin" ? "CSR Admin" : "Support Admin",
										avatar: adminDetails.image || undefined,
										mobileNumber: adminDetails.mobileNumber,
										permissions: adminDetails.permissions || [],
									});
								} catch (error) {
									toast.error(error instanceof Error ? error.message : "Failed to fetch admin details");
								} finally {
									setActionDropdown(null);
								}
							},
						},
						...(actionDropdown.user.id !== currentUser?.id
							? [
									{
										icon: <NotificationIcon className="w-4 h-4" />,
										label: "Send a message",
										onClick: () => {
											setNoticeModalAdmin(actionDropdown.user);
											setActionDropdown(null);
										},
									},
									{
										icon: <LogOut className="w-4 h-4" />,
										label: "Force Log out",
										onClick: async () => {
											try {
												await adminAuth.forceLogoutAdmin(actionDropdown.user.id);
												toast.success(`Forced logout for ${actionDropdown.user.name}`);
											} catch (error) {
												toast.error(error instanceof Error ? error.message : "Failed to force logout admin");
											} finally {
												setActionDropdown(null);
											}
										},
									},
									{
										icon: <Trash2 className="w-4 h-4 text-red-500" />,
										label: "Delete admin",
										className: "text-red-500 hover:bg-red-50",
										onClick: async () => {
											try {
												await adminAuth.deleteAdmin(actionDropdown.user.id);
												toast.success(`Admin ${actionDropdown.user.name} deleted successfully`);
												queryClient.invalidateQueries({ queryKey: ["admins-list"] });
											} catch (error) {
												toast.error(error instanceof Error ? error.message : "Failed to delete admin");
											} finally {
												setActionDropdown(null);
											}
										},
									},
							  ]
							: []),
					]}
				/>
			)}

			{selectedProfileAdmin && (
				<AdminProfileModal
					admin={selectedProfileAdmin}
					onClose={() => setSelectedProfileAdmin(null)}
					onSendMessage={(admin) => {
						setNoticeModalAdmin(admin);
						setSelectedProfileAdmin(null);
					}}
					onForceLogout={async (id) => {
						try {
							await adminAuth.forceLogoutAdmin(id);
							toast.success(`Forced logout for ${selectedProfileAdmin.name}`);
						} catch (error) {
							toast.error(error instanceof Error ? error.message : "Failed to force logout");
						} finally {
							setSelectedProfileAdmin(null);
						}
					}}
					onDeleteAdmin={async (id) => {
						try {
							await adminAuth.deleteAdmin(id);
							toast.success(`Admin ${selectedProfileAdmin.name} deleted successfully`);
							queryClient.invalidateQueries({ queryKey: ["admins-list"] });
						} catch (error) {
							toast.error(error instanceof Error ? error.message : "Failed to delete admin");
						} finally {
							setSelectedProfileAdmin(null);
						}
					}}
					onPermissionsUpdated={() => {
						queryClient.invalidateQueries({ queryKey: ["admins-list"] });
					}}
				/>
			)}
			{(noticeModalAdmin || showGlobalNoticeModal) && (
				<SendNoticeModal
					user={noticeModalAdmin ? mapAdminToUser(noticeModalAdmin) : null}
					availableUsers={allAdmins.map(mapAdminToUser)}
					onClose={() => {
						setNoticeModalAdmin(null);
						setShowGlobalNoticeModal(false);
					}}
					onSubmit={async (data) => {
						if (noticeModalAdmin) {
							const result = await notificationService.sendNotification({
								title: data.title,
								message: data.message,
								userId: noticeModalAdmin.id,
							});
							if (result.success) {
								toast.success(`Notice sent to ${noticeModalAdmin.name}`);
							} else {
								toast.error(result.error || "Failed to send notice");
							}
						} else if (showGlobalNoticeModal) {
							const adminIds = allAdmins.map((a) => a.id);
							const result = await notificationService.sendNotificationToMultiple(
								data.title,
								data.message,
								adminIds
							);
							if (result.success) {
								toast.success("Notice sent to all admins");
							} else {
								toast.error(`Notice sent with ${result.errors.length} errors`);
							}
						}
					}}
				/>
			)}
			{showSuccessModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onClick={() => setShowSuccessModal(false)}
				>
					<div
						className="w-[344px] max-w-[90vw] rounded-[16px] bg-white p-6 shadow-xl relative flex flex-col items-center"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							type="button"
							onClick={() => setShowSuccessModal(false)}
							className="absolute right-4 top-4 text-gray-500 w-[30px] h-[30px] flex items-center justify-center hover:text-gray-900 rounded-full border border-[#03002B] cursor-pointer"
						>
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>

						<img src={SuccessIndicator} alt="Success" className="w-[74px] h-[70px] object-contain mb-4 mt-6" />
						
						<h3 className="font-bold text-[28px] text-[#03002B] mb-2">Success!</h3>
						
						<p className="text-[#4F4F4F] text-center text-[15px] mb-8 px-4 leading-[22px]">
							The admin user {newAdmin.name} has been<br/>successfully added to the system.
						</p>

						<button
							type="button"
							onClick={() => setShowSuccessModal(false)}
							className="w-full h-[48px] rounded-full text-[15px] bg-[#1BAA04] text-white font-medium hover:bg-[#158f03] transition-colors"
						>
							Done
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
