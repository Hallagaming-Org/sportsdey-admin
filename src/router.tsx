import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import "./index.css";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		defaultPendingMinMs: 0,
		defaultNotFoundComponent: () => <div>Not Found</div>,
		defaultPendingComponent: () => null,
		// defaultLoadComponent: () => null,
	});
	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
