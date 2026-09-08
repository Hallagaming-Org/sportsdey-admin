// src/client.tsx
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { StartClient } from "@tanstack/react-start/client";
import { getRouter } from "./router";
import "./index.css";

const isDev = import.meta.env.DEV;

if (isDev) {
	// SPA mode for development
	const router = getRouter();
	hydrateRoot(
		document,
		<StrictMode>
			<RouterProvider router={router} />
		</StrictMode>,
	);
} else {
	startTransition(() => {
		hydrateRoot(
			document,
			<StrictMode>
				<StartClient />
			</StrictMode>,
		);
	});
}