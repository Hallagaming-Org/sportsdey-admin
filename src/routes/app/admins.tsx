import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Eye, LogOut, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable, type Column } from "#/components/DataTable";
import { ActionDropdown } from "#/components/ActionDropdown";
import NotificationIcon from "#/assets/NotificationIcon";
import { AdminProfileModal } from "#/components/AdminProfileModal";
import { SendNoticeModal } from "#/components/SendNoticeModal";
import { Input } from "#/components/Input";
import {
	TimePeriodDropdown,
	type TimePeriodOption,
} from "#/components/TimePeriodDropdown";
import type { User } from "#/lib/users";
import { notificationService } from "#/lib/notifications";
import { adminAuth } from "#/lib/auth";
export const Route = createFileRoute("/app/admins")({
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
}

function AdminsPage() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [activeTab, setActiveTab] = useState<Tab>("all");
	const [selectedTimePeriod, setSelectedTimePeriod] =
		useState<TimePeriodOption>("All");
	const [showAddModal, setShowAddModal] = useState(false);
	const [newAdmin, setNewAdmin] = useState({
		name: "",
		email: "",
		role: "Support Admin",
		password: "",
	});

	const [actionDropdown, setActionDropdown] = useState<{ user: AdminUser; top: number; right: number } | null>(null);
	const [selectedProfileAdmin, setSelectedProfileAdmin] = useState<AdminUser | null>(null);
	const [noticeModalAdmin, setNoticeModalAdmin] = useState<AdminUser | null>(null);
	const [showGlobalNoticeModal, setShowGlobalNoticeModal] = useState(false);
	
	// Close dropdown when clicking outside
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
		role: admin.role === "csr-admin" ? "CSR Admin" : "Support Admin",
		avatar: admin.image || undefined,
	}));

	const filteredAdmins = allAdmins.filter(admin => {
		if (activeTab === "support") return admin.role === "Support Admin";
		if (activeTab === "csr") return admin.role === "CSR Admin";
		return true;
	}).filter(admin => 
		search ? admin.name.toLowerCase().includes(search.toLowerCase()) || admin.email.toLowerCase().includes(search.toLowerCase()) : true
	);

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
						onClick={() => setShowGlobalNoticeModal(true)}
						className="cursor-pointer flex items-center justify-center rounded-full text-[#053209] bg-[#F1F1F1] gap-x-3 w-[159px] h-11"
					>
						<NotificationIcon height={"15"} width={"15"} color={"#053209"} />
						<span className="text-base">Send a Notice</span>
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
					<div className="relative w-72 lg:w-80">
						<Input
							type="text"
							placeholder="Search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="rounded-full border-[#D0D5DD] bg-gray-50 py-2 pr-4 pl-10"
						/>
						<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
					</div>
					
					<TimePeriodDropdown
						value={selectedTimePeriod}
						onChange={(period) => {
							setSelectedTimePeriod(period);
							setPage(1);
						}}
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
								className="text-gray-500 hover:text-gray-900"
							>
								<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								toast.success("Admin created successfully");
								setShowAddModal(false);
							}}
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
									className="mt-1 w-full rounded-md bg-[#F9F9F9] px-3 py-2 text-gray-900 focus:outline-none placeholder:text-gray-500"
								>
									<option value="Support Admin">Support Admin</option>
									<option value="CSR Admin">CSR Admin</option>
								</select>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">Password</label>
								<Input
									type="password"
									value={newAdmin.password}
									onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
									required
									className="mt-1"
								/>
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
							onClick: () => {
								setSelectedProfileAdmin(actionDropdown.user);
								setActionDropdown(null);
							},
						},
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
							onClick: () => {
								toast.success(`Forced logout for ${actionDropdown.user.name}`);
								setActionDropdown(null);
							},
						},
						{
							icon: <Trash2 className="w-4 h-4 text-red-500" />,
							label: "Delete admin",
							className: "text-red-500 hover:bg-red-50",
							onClick: () => {
								toast.success(`Admin ${actionDropdown.user.name} deleted`);
								setActionDropdown(null);
							},
						},
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
		</div>
	);
}
