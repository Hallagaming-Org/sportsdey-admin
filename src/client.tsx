import { RouterProvider } from "@tanstack/react-router";
import { createRoot, hydrateRoot } from "react-dom/client";
import { getRouter } from "./router";

const router = getRouter();

const rootElement = document.getElementById("root");

if (rootElement?.hasChildNodes()) {
	hydrateRoot(rootElement, <RouterProvider router={router} />);
} else if (rootElement) {
	createRoot(rootElement).render(<RouterProvider router={router} />);
}
