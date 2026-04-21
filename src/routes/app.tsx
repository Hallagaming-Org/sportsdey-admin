import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { type Admin, adminAuth } from "../lib/auth";

export const Route = createFileRoute("/app")({
	component: AppLayoutComponent,
});

function AppLayoutComponent() {
	const [admin, setAdmin] = useState<Admin | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const checkSession = async () => {
			console.log("Checking session...");
			const session = await adminAuth.getSession();
			console.log("Session result:", session);
			if (!session) {
				setError("No session found");
				window.location.replace("/sign-in");
				return;
			}
			setAdmin(session);
			setLoading(false);
		};

		checkSession();
	}, []);

	async function handleLogout() {
		await adminAuth.signOut();
		window.location.replace("/sign-in");
	}

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
			</div>
		);
	}

	return (
		<Layout admin={admin} onLogout={handleLogout}>
			<Outlet />
		</Layout>
	);
}
