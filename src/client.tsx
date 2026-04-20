import { RouterProvider } from "@tanstack/react-router";
import { createRoot, hydrateRoot } from "react-dom/client";
import { getRouter } from "./router";

const router = getRouter();

let rootElement = document.getElementById("root");

if (!rootElement) {
	rootElement = document.createElement("div");
	rootElement.id = "root";
	document.body.appendChild(rootElement);
}

if (rootElement.hasChildNodes()) {
	hydrateRoot(rootElement, <RouterProvider router={router} />);
} else {
	createRoot(rootElement).render(<RouterProvider router={router} />);
}
