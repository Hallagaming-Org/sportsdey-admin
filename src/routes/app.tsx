import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { type Admin, adminAuth } from "../lib/auth";

export const Route = createFileRoute("/app")({
	component: AppLayoutComponent,
});

function AppLayoutComponent() {
	const [admin, setAdmin] = useState<Admin | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		adminAuth.getSession().then((session) => {
			if (!session) {
				navigate({ to: "/sign-in", replace: true });
				return;
			}
			setAdmin(session);
			setIsLoading(false);
		});
	}, [navigate]);

	async function handleLogout() {
		await adminAuth.signOut();
		navigate({
			to: "/sign-in",
			replace: true,
		});
	}

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
		</Layout>
	);
}
