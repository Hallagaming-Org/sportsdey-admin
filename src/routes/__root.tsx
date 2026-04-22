import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { useState } from "react";
import appCss from "../index.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "SportsDey Admin",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 1000 * 60 * 5,
						retry: 1,
					},
				},
			}),
	);

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>

			<body>
				<QueryClientProvider client={queryClient}>
					<Outlet />
					<Scripts />
				</QueryClientProvider>
			</body>
		</html>
	);
}
