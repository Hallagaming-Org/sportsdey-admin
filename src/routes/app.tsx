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
		// Only redirect to sign-in on the client. 
		// On the server, we might not have the session due to cross-port cookie issues on localhost,
		// so we let the client hydrate and check localStorage first.
		if (!session && typeof window !== "undefined") {
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
