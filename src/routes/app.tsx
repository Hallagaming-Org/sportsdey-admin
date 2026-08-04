import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { type Admin, adminAuth } from "../lib/auth";
import { X, Check } from "lucide-react";

export const Route = createFileRoute("/app")({
	component: AppLayoutComponent,
});

function AppLayoutComponent() {
	const [admin, setAdmin] = useState<Admin | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showWelcomeModal, setShowWelcomeModal] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		adminAuth.getSession().then((session) => {
			if (!session) {
				navigate({ to: "/sign-in", replace: true });
				return;
			}
			setAdmin(session);
			setIsLoading(false);

			const checkReset = localStorage.getItem("admin_must_change_password") || (session.id ? localStorage.getItem(`must_change_password_${session.id}`) : null);
			if (checkReset === "true" || (session as any).mustChangePassword) {
				setShowWelcomeModal(true);
			}
		});
	}, [navigate]);

	async function handleLogout() {
		await adminAuth.signOut();
		navigate({
			to: "/sign-in",
			replace: true,
		});
	}

	const handleCloseWelcomeModal = () => {
		if (admin?.id) {
			localStorage.removeItem(`must_change_password_${admin.id}`);
		}
		localStorage.removeItem("admin_must_change_password");
		setShowWelcomeModal(false);
	};

	const handleChangePasswordClick = () => {
		handleCloseWelcomeModal();
		navigate({
			to: "/app/settings",
			search: { tab: "change_password" },
		});
	};

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
			</div>
		);
	}

	return (
		<Layout admin={admin} onLogout={handleLogout}>
			<Outlet />

			{/* Welcome Password Change Prompt Modal */}
			{showWelcomeModal && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
					onClick={handleCloseWelcomeModal}
				>
					<div
						className="w-[380px] max-w-[90vw] rounded-[24px] bg-white p-7 shadow-2xl relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Close Button */}
						<button
							type="button"
							onClick={handleCloseWelcomeModal}
							className="absolute right-5 top-5 w-7 h-7 flex items-center justify-center rounded-full border border-[#03002B] text-[#03002B] hover:bg-gray-100 transition-colors cursor-pointer"
						>
							<X className="w-4 h-4" />
						</button>

						{/* Success Check Icon */}
						<div className="w-14 h-14 rounded-full bg-[#10C300] flex items-center justify-center text-white mt-1 mb-4 shadow-sm">
							<Check className="w-8 h-8 stroke-[3]" />
						</div>

						{/* Title */}
						<h3 className="text-xl font-bold text-[#03002B] mb-2">
							Welcome
						</h3>

						{/* Subtitle / Message */}
						<p className="text-xs md:text-sm text-[#03002B] font-medium leading-relaxed max-w-[260px] mb-6">
							Before you proceed, please update your password. Click the button below to continue.
						</p>

						{/* Action Button */}
						<button
							type="button"
							onClick={handleChangePasswordClick}
							className="w-full h-12 rounded-full bg-[#1BAA04] hover:bg-[#158903] text-white font-bold text-sm transition-colors cursor-pointer shadow-sm"
						>
							Change password
						</button>
					</div>
				</div>
			)}
		</Layout>
	);
}
