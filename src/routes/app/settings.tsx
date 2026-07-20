import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AccountDetails } from "@/components/settings/AccountDetails";
import { ChangePassword } from "@/components/settings/ChangePassword";
import { Sessions } from "@/components/settings/Sessions";
import { type Admin, adminAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/settings")({
	validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
		tab: (search.tab as string) || undefined,
	}),
	component: SettingsPage,
});

const tabs = ["My Account details", "Change password", "Sessions"];
type Tabs = "my_account" | "change_password" | "sessions";

function SettingsPage() {
	const search = Route.useSearch();
	const [admin, setAdmin] = useState<Admin | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<Tabs>(() => {
		if (search?.tab === "change_password" || search?.tab === "Change password") {
			return "change_password";
		}
		return "my_account";
	});

	useEffect(() => {
		if (search?.tab === "change_password" || search?.tab === "Change password") {
			setActiveTab("change_password");
		}
	}, [search?.tab]);

	useEffect(() => {
		const fetchAdminData = async () => {
			const adminData = await adminAuth.getSession();
			if (adminData) {
				setAdmin(adminData);
			}
			setIsLoading(false);
		};
		fetchAdminData();
	}, []);

	if (isLoading) {
		return (
			<section className="mx-auto flex w-full min-w-[280px] max-w-6xl flex-col gap-6 pb-8">
				<header className="space-y-4">
					<h1 className="font-bold text-3xl text-[#101828] sm:text-4xl">
						Settings
					</h1>
				</header>
				<div className="flex items-center justify-center py-12">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
				</div>
			</section>
		);
	}

	return (
		<section className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
			<header className="space-y-4">
				<h1 className="font-bold text-3xl text-[#101828] sm:text-4xl">
					Settings
				</h1>
				<div className="no-scrollbar overflow-x-auto">
					<div className="flex min-w-max gap-8 border-gray-300 border-b">
						{tabs.map((tab) => (
							<button
								type="button"
								key={tab}
								onClick={() =>
									setActiveTab(
										tab === "My Account details"
											? "my_account"
											: tab === "Change password"
												? "change_password"
												: "sessions",
									)
								}
								className={`cursor-pointer border-b-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors ${
									activeTab === tab
										? "border-accent text-accent"
										: "border-transparent text-gray-600 hover:text-gray-900"
								}`}
							>
								{tab}
							</button>
						))}
					</div>
				</div>
			</header>

			<div className="overflow-x-auto rounded-2xl bg-[#f6f6f6] p-4 sm:p-6 lg:p-8">
				{activeTab === "my_account" && <AccountDetails admin={admin} />}
				{activeTab === "change_password" && <ChangePassword />}
				{activeTab === "sessions" && <Sessions />}
			</div>
		</section>
	);
}
