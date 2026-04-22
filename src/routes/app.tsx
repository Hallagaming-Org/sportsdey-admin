import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import Layout from "../components/Layout";
import { adminAuth } from "../lib/auth";

export const Route = createFileRoute("/app")({
	beforeLoad: async () => {
		const session = await adminAuth.getSession();
		if (!session) {
			throw redirect({ to: "/sign-in", replace: true });
		}
		return { admin: session };
	},
	component: AppLayoutComponent,
});

function AppLayoutComponent() {
	const { admin } = Route.useRouteContext();
	const navigate = useNavigate();

	async function handleLogout() {
		await adminAuth.signOut();
		navigate({
			to: "/sign-in",
			replace: true,
		});
	}

	return (
		<Layout admin={admin} onLogout={handleLogout}>
			<Outlet />
		</Layout>
	);
}
