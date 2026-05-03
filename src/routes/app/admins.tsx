import { createFileRoute } from "@tanstack/react-router";
import { Search, Eye, LogOut, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable, type Column } from "#/components/DataTable";
import { IoFilter } from "react-icons/io5";
import { ActionDropdown } from "#/components/ActionDropdown";
import NotificationIcon from "#/assets/NotificationIcon";

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
	const [showAddModal, setShowAddModal] = useState(false);
	const [newAdmin, setNewAdmin] = useState({
		name: "",
		email: "",
		role: "Support Admin",
	});

	const [actionDropdown, setActionDropdown] = useState<{ user: AdminUser; top: number; right: number } | null>(null);
	
	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = () => setActionDropdown(null);
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	const dummyAdmins: AdminUser[] = [
		{ id: "012345", name: "George jones", email: "Georgejones@gmail.com", dateAdded: 1754611200000, role: "Support Admin" },
		{ id: "012345", name: "Robert Fox", email: "Robertfox@gmail.com", dateAdded: 1754611200000, role: "CSR Admin" },
		{ id: "012345", name: "Savannah Nguyen", email: "Savannahnguyen@gmail.com", dateAdded: 1754611200000, role: "Support Admin" },
		{ id: "012345", name: "Leslie Alexander", email: "Lesliealexander@gmail.com", dateAdded: 1754611200000, role: "CSR Admin" },
		{ id: "012345", name: "Annette Black", email: "Georgejones@gmail.com", dateAdded: 1754611200000, role: "Support Admin" },
		{ id: "012345", name: "Floyd Miles", email: "Floydmiles@gmail.com", dateAdded: 1754611200000, role: "CSR Admin" },
		{ id: "012345", name: "Devon Lane", email: "Devonlane@gmail.com", dateAdded: 1754611200000, role: "Support Admin" },
		{ id: "012345", name: "Leslie Alexander", email: "Lesliealexander@gmail.com", dateAdded: 1754611200000, role: "CSR Admin" },
		{ id: "012345", name: "Savannah Nguyen", email: "Savannahnguyen@gmail.com", dateAdded: 1754611200000, role: "Support Admin" },
	];

	const filteredAdmins = dummyAdmins.filter(admin => {
		if (activeTab === "support") return admin.role === "Support Admin";
		if (activeTab === "csr") return admin.role === "CSR Admin";
		return true;
	}).filter(admin => 
		search ? admin.name.toLowerCase().includes(search.toLowerCase()) || admin.email.toLowerCase().includes(search.toLowerCase()) : true
	);

	const admins = filteredAdmins.slice((page - 1) * limit, page * limit);
	const total = filteredAdmins.length;
	const totalPages = Math.ceil(total / limit);

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
						onClick={() => toast.info("Send Notice triggered")}
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
						<input
							type="text"
							placeholder="Search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full rounded-full border border-[#D0D5DD] bg-gray-50 py-2 pr-4 pl-10 shadow-md focus:border-primary focus:outline-none focus:ring-primary"
						/>
						<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
					</div>
					
					<button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
						<span className="hidden lg:block">Time periods</span>
						<IoFilter className="h-3.5 w-3.5" />
					</button>
				</form>
			</div>

			<DataTable
				data={admins}
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
				emptyMessage="No admin found"
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
								<input
									type="text"
									value={newAdmin.name}
									onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
									required
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">Email</label>
								<input
									type="email"
									value={newAdmin.email}
									onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
									required
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">Role</label>
								<select
									value={newAdmin.role}
									onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								>
									<option value="Support Admin">Support Admin</option>
									<option value="CSR Admin">CSR Admin</option>
								</select>
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
									className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent/90"
								>
									Add user
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
								toast.info("View admin feature coming soon");
								setActionDropdown(null);
							},
						},
						{
							icon: <NotificationIcon className="w-4 h-4" />,
							label: "Send a message",
							onClick: () => {
								toast.info("Send message feature coming soon");
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
		</div>
	);
}
